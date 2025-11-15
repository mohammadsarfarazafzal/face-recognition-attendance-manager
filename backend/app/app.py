# backend/app/app.py - JWT REMOVED COMPLETELY, SIMPLE USER_ID AUTH

from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import face_recognition
import pickle
import numpy as np
import json
import os
from datetime import datetime
import pandas as pd
from io import BytesIO
from pathlib import Path

app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://root:root@localhost/attendance_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
CORS(app, supports_credentials=True, allow_headers=["Content-Type", "user_id"])

# -------------------- MODELS --------------------

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Student(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    roll_number = db.Column(db.String(20), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    academic_year = db.Column(db.String(20), default="2024-2025")
    user = db.relationship('User', backref=db.backref('students', lazy=True))

class Teacher(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    employee_id = db.Column(db.String(20), unique=True, nullable=False)
    department = db.Column(db.String(100))
    user = db.relationship('User', backref=db.backref('teachers', lazy=True))

class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    credits = db.Column(db.Integer, default=3)
    department = db.Column(db.String(100), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teacher.id'), nullable=False)
    teacher = db.relationship('Teacher', backref='subjects')

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(10), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('student.id'), nullable=False)
    marks = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(10), default='present')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    subject = db.relationship('Subject', backref='attendances')
    student = db.relationship('Student', backref='attendances')

class AttendanceSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(10), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teacher.id'), nullable=False)
    total_marks = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Initialize database
with app.app_context():
    db.create_all()

# -------------------- PATHS --------------------
BASE_DIR = Path(__file__).parent
TRAINING_IMAGES_DIR = BASE_DIR / "Training_images"
REFERENCE_ENCODINGS_DIR = BASE_DIR / "reference_encodings"
STUDENT_MAP_PATH = BASE_DIR / "student_map.json"

TRAINING_IMAGES_DIR.mkdir(exist_ok=True)
REFERENCE_ENCODINGS_DIR.mkdir(exist_ok=True)

# -------------------- HELPERS --------------------

def get_user():
    """Fetch user_id sent from frontend via headers."""
    # uid = request.headers.get("user_id")
    uid = (
    request.headers.get("user_id")
    or request.headers.get("User-Id")
    or request.headers.get("User_Id")
)
    if not uid:
        return None, jsonify({"error": "Missing user_id in headers"}), 400

    user = User.query.get(int(uid))
    if not user:
        return None, jsonify({"error": "Invalid user"}), 400

    return user, None, None

def load_student_map():
    if STUDENT_MAP_PATH.exists():
        with open(STUDENT_MAP_PATH, 'r') as f:
            return json.load(f)
    return {}

def save_student_map(student_map):
    with open(STUDENT_MAP_PATH, 'w') as f:
        json.dump(student_map, f, indent=2)

# -------------------- ROUTES --------------------

@app.route('/')
def home():
    return jsonify({"message": "API running", "auth": "jwt removed"})

# -------------------- AUTH --------------------

@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        if User.query.filter_by(email=data['email']).first():
            return jsonify({"error": "User exists"}), 400

        user = User(
            email=data['email'],
            password=bcrypt.generate_password_hash(data['password']).decode('utf-8'),
            role=data['role'],
            name=data['name']
        )
        db.session.add(user)
        db.session.flush()

        if data['role'] == 'student':
            student = Student(
                user_id=user.id,
                roll_number=data['roll_number'],
                department=data.get('department', 'Computer Science'),
                semester=data.get('semester', 1)
            )
            db.session.add(student)

        elif data['role'] == 'teacher':
            teacher = Teacher(
                user_id=user.id,
                employee_id=data['employee_id'],
                department=data.get('department', 'Computer Science')
            )
            db.session.add(teacher)

        db.session.commit()

        return jsonify({
            "message": "Registered",
            "user_id": user.id
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    user = User.query.filter_by(email=data['email']).first()
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.check_password_hash(user.password, data['password']):
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({
        "message": "Login OK",
        "user_id": user.id,
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "name": user.name
        }
    })

# -------------------- DASHBOARD --------------------

@app.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    user, err, code = get_user()
    print(user)
    if err: return err, code

    if user.role == "teacher":
        teacher = Teacher.query.filter_by(user_id=user.id).first()

        total_classes = AttendanceSession.query.filter_by(teacher_id=teacher.id).count()
        total_students = Student.query.count()

        recent = Attendance.query.join(Subject) \
            .filter(Subject.teacher_id == teacher.id) \
            .order_by(Attendance.created_at.desc()) \
            .limit(10).all()

        data = [{
            "date": r.date,
            "subject": r.subject.name,
            "student": r.student.user.name,
            "marks": r.marks
        } for r in recent]

        return jsonify({
            "total_classes": total_classes,
            "total_students": total_students,
            "recent_attendance": data
        })

    # Student Dashboard
    student = Student.query.filter_by(user_id=user.id).first()
    subjects = Subject.query.filter_by(
        department=student.department,
        semester=student.semester
    ).all()

    total = Attendance.query.filter_by(student_id=student.id).count()
    present = Attendance.query.filter_by(student_id=student.id, status="present").count()

    percentage = round((present / total * 100), 2) if total > 0 else 0

    return jsonify({
        "overall_percentage": percentage,
        "total_classes": total,
        "total_present": present
    })

# -------------------- SUBJECTS --------------------

@app.route('/subjects', methods=['GET'])
def get_subjects():
    user, err, code = get_user()
    if err: return err, code

    if user.role == 'teacher':
        teacher = Teacher.query.filter_by(user_id=user.id).first()
        subjects = Subject.query.filter_by(teacher_id=teacher.id).all()
    else:
        subjects = Subject.query.all()

    return jsonify([
        {
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "credits": s.credits,
            "department": s.department,
            "teacher": s.teacher.user.name
        }
        for s in subjects
    ])

# -------------------- ATTENDANCE + FACE --------------------

@app.route('/attendance/mark', methods=['POST'])
def mark_attendance():
    user, err, code = get_user()
    if err: return err, code

    if user.role != 'teacher':
        return jsonify({"error": "Only teachers"}), 403

    date = request.form.get('date')
    subject_code = request.form.get('subject')
    marks = request.form.get('marks', 1)
    file = request.files.get('photo')

    teacher = Teacher.query.filter_by(user_id=user.id).first()
    subject = Subject.query.filter_by(code=subject_code).first()

    uploads = BASE_DIR / "uploads"
    uploads.mkdir(exist_ok=True)
    temp_path = uploads / f"temp_{datetime.now().timestamp()}.jpg"
    file.save(temp_path)

    from face_recognizer import FaceRecognizer
    recognizer = FaceRecognizer()
    results = recognizer.recognize_students(str(temp_path))

    temp_path.unlink()

    session = AttendanceSession(
        date=date,
        subject_id=subject.id,
        teacher_id=teacher.id,
        total_marks=marks
    )
    db.session.add(session)
    db.session.flush()

    marked = 0
    detected = []

    for r in results:
        email = r["email"]
        stu_user = User.query.filter_by(email=email).first()
        if not stu_user:
            continue

        student = Student.query.filter_by(user_id=stu_user.id).first()
        if not student:
            continue

        exists = Attendance.query.filter_by(
            date=date, subject_id=subject.id, student_id=student.id
        ).first()

        if not exists:
            att = Attendance(
                date=date,
                subject_id=subject.id,
                student_id=student.id,
                marks=marks,
                status='present'
            )
            db.session.add(att)
            marked += 1

        detected.append(r)

    db.session.commit()

    return jsonify({
        "message": f"Marked {marked}",
        "detected": detected
    })

# -------------------- EXPORT --------------------

@app.route('/attendance/export', methods=['GET'])
def export_attendance():
    user, err, code = get_user()
    if err: return err, code

    if user.role != 'teacher':
        return jsonify({"error": "Only teachers"}), 403

    teacher = Teacher.query.filter_by(user_id=user.id).first()

    query = Attendance.query.join(Subject).filter(Subject.teacher_id == teacher.id)
    subject_code = request.args.get("subject")
    if subject_code:
        query = query.filter(Subject.code == subject_code)

    records = query.all()

    data = [{
        "Date": r.date,
        "Subject": r.subject.name,
        "Student": r.student.user.name,
        "Roll": r.student.roll_number,
        "Marks": r.marks,
        "Status": r.status
    } for r in records]

    df = pd.DataFrame(data)

    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Attendance")
    output.seek(0)

    return send_file(output,
                     download_name=f"attendance_{datetime.now().strftime('%Y%m%d')}.xlsx",
                     as_attachment=True)

# -------------------- MAIN --------------------

if __name__ == '__main__':
    print("\nAPI running WITHOUT JWT\n")
    app.run(debug=True, port=5000)
