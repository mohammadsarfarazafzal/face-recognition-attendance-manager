# backend/train_model.py - UPDATED FOR EMAIL FILENAMES
import os
import cv2
import pickle
import face_recognition
import numpy as np
from pathlib import Path
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import json
import re

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:root@localhost/attendance_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(100), nullable=False)

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    roll_number = db.Column(db.String(20), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    academic_year = db.Column(db.String(20), default="2024-2025")
    
    user = db.relationship('User', backref=db.backref('students', uselist=False))

def train_system():
    BASE_DIR = Path(__file__).parent
    TRAIN_DIR = BASE_DIR / "app" / "Training_images"
    ENCODINGS_PATH = BASE_DIR / "app" / "reference_encodings" / "encodings.pkl"
    MAP_PATH = BASE_DIR / "app" / "student_map.json"
    
    # Ensure directories exist
    TRAIN_DIR.mkdir(parents=True, exist_ok=True)
    ENCODINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    student_encodings = {}
    student_map = {}
    
    print("Loading training images...")
    print("=" * 60)
    
    with app.app_context():
        for img_name in os.listdir(TRAIN_DIR):
            if not img_name.lower().endswith(('.png', '.jpg', '.jpeg')):
                continue
                
            img_path = os.path.join(TRAIN_DIR, img_name)
            img = cv2.imread(img_path)
            
            if img is None:
                print(f"⚠️  Warning: Could not read {img_name}")
                continue
            
            # EXTRACT EMAIL FROM FILENAME
            filename_no_ext = os.path.splitext(img_name)[0]
            
            # Remove image counters like _1, _2, _3
            clean_filename = re.sub(r'_\d+$', '', filename_no_ext)
            
            # Convert filename back to email (replace _at_ with @)
            student_email = clean_filename.replace('_at_', '@')
            
            try:
                img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                encodings = face_recognition.face_encodings(img_rgb)
                
                if len(encodings) == 0:
                    print(f"⚠️  No face found in {img_name}")
                    continue
                
                if len(encodings) > 1:
                    print(f"⚠️  Multiple faces found in {img_name}, using the first one")
                
                encoding = encodings[0]
                
                # FIND STUDENT BY EMAIL (DIRECT MATCH - NO GUESSING!)
                student_user = User.query.filter_by(email=student_email).first()
                
                if student_user:
                    student = Student.query.filter_by(user_id=student_user.id).first()
                    
                    if student:
                        unique_key = student_email  # Use email as unique key
                        
                        if unique_key not in student_encodings:
                            student_encodings[unique_key] = []
                        
                        student_encodings[unique_key].append(encoding)
                        student_map[unique_key] = {
                            "student_id": student.id,
                            "roll_number": student.roll_number,
                            "name": student_user.name,
                            "department": student.department
                        }
                        print(f"✓ Processed: {img_name} → {student_user.name} (Email: {student_email})")
                    else:
                        print(f"✗ No student record found for user: {student_email}")
                else:
                    print(f"✗ No user found with email: {student_email}")
                
            except Exception as e:
                print(f"✗ Error processing {img_name}: {str(e)}")
                continue
        
        print("=" * 60)
        print(f"\n📊 Training Summary:")
        print("-" * 60)
        
        if not student_encodings:
            print("❌ No valid training images found!")
            print("\nTips:")
            print("1. Make sure images are named: email_at_domain.com.jpg")
            print("   Example: john_at_example.com.jpg")
            print("2. Ensure students are registered in the database")
            print("3. Check that faces are clearly visible in images")
            return
        
        # Average encodings for each student
        final_encodings = []
        final_names = []
        
        for unique_key, encodings_list in sorted(student_encodings.items()):
            avg_encoding = np.mean(encodings_list, axis=0)
            final_encodings.append(avg_encoding)
            final_names.append(unique_key)  # Store email as identifier
            
            student_info = student_map[unique_key]
            print(f"  • {student_info['name']}: {len(encodings_list)} image(s) → Email: {unique_key}")
        
        print("-" * 60)
        print(f"✅ Total students trained: {len(final_names)}")
        print(f"✅ Total images processed: {sum(len(e) for e in student_encodings.values())}")
        
        # Save encodings and map
        with open(ENCODINGS_PATH, "wb") as f:
            pickle.dump({
                "names": final_names,  # These are emails now
                "encodings": final_encodings,
                "image_counts": {name: len(student_encodings[name]) for name in final_names}
            }, f)
        
        with open(MAP_PATH, "w") as f:
            json.dump(student_map, f, indent=2)
        
        print(f"\n💾 Encodings saved to: {ENCODINGS_PATH}")
        print(f"💾 Student map saved to: {MAP_PATH}")
        print("\n✅ Training completed successfully!")

if __name__ == "__main__":
    try:
        train_system()
    except Exception as e:
        print(f"\n❌ Training failed with error: {str(e)}")
        import traceback
        traceback.print_exc()