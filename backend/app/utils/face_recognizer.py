# backend/app/face_recognizer.py
import face_recognition
import pickle
import numpy as np
from pathlib import Path
import json

class FaceRecognizer:
    def __init__(self):
        self.BASE_DIR = Path(__file__).parent
        self.load_encodings()
        self.load_student_map()
        self.validate_mapping()

    def load_encodings(self):
        encodings_path = self.BASE_DIR / "reference_encodings" / "encodings.pkl"
        try:
            with open(encodings_path, "rb") as f:
                data = pickle.load(f)
                self.known_emails = data["names"]  # These are emails
                self.known_encodings = data["encodings"]
                self.image_counts = data.get("image_counts", {})
                
                print(f"✅ Loaded {len(self.known_emails)} student encodings")
                
        except FileNotFoundError:
            raise Exception("No trained model found. Run train_model.py first")

    def load_student_map(self):
        map_path = self.BASE_DIR / "student_map.json"
        try:
            with open(map_path) as f:
                self.student_map = json.load(f)
        except FileNotFoundError:
            self.student_map = {}

    def validate_mapping(self):
        missing = []
        for email in self.known_emails:
            if email not in self.student_map:
                missing.append(email)
        if missing:
            print(f"⚠️  Warning: Missing mappings for {len(missing)} students")

    def recognize_students(self, image_path):
        try:
            unknown_image = face_recognition.load_image_file(image_path)
            face_locations = face_recognition.face_locations(unknown_image)
            face_encodings = face_recognition.face_encodings(unknown_image, face_locations)
            
            print(f"🔍 Found {len(face_encodings)} faces in the image")
           
            results = []
            for encoding, location in zip(face_encodings, face_locations):
                matches = face_recognition.compare_faces(self.known_encodings, encoding, tolerance=0.6)
                face_distances = face_recognition.face_distance(self.known_encodings, encoding)
                
                if len(face_distances) > 0:
                    best_match_idx = np.argmin(face_distances)
                   
                    if matches[best_match_idx]:
                        student_email = self.known_emails[best_match_idx]
                        student_info = self.student_map.get(student_email)
                       
                        if student_info:
                            confidence = round((1 - face_distances[best_match_idx]) * 100, 2)
                            
                            results.append({
                                "student": student_info.get("name", "Unknown"),
                                "email": student_email,
                                "roll": student_info.get("roll_number", "Unknown"),
                                "department": student_info.get("department", "Unknown"),
                                "confidence": confidence,
                                "location": {
                                    "top": location[0],
                                    "right": location[1],
                                    "bottom": location[2],
                                    "left": location[3]
                                }
                            })
                            print(f"✅ Recognized: {student_info.get('name')} ({confidence}%)")
                        else:
                            print(f"⚠️  No mapping for email: {student_email}")
                    else:
                        print("❌ No match found for a face")
                else:
                    print("❌ No face distances calculated")
       
            return sorted(results, key=lambda x: x["confidence"], reverse=True)
            
        except Exception as e:
            print(f"❌ Face recognition error: {str(e)}")
            raise e