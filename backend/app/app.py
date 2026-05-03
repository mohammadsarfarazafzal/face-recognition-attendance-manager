# backend/app/app.py - Enhanced with strict face recognition & quality validation

from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS, cross_origin
import face_recognition
import pickle
import numpy as np
import json
import os
import re
from datetime import datetime
import pandas as pd
from io import BytesIO
from pathlib import Path

# Import centralized configuration
from app.config import (
    SQLALCHEMY_DATABASE_URI,
    FRONTEND_ORIGIN,
    FLASK_DEBUG,
    FLASK_PORT,
    RECOGNITION_LOGGING_ENABLED,
)

app = Flask(__name__)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = SQLALCHEMY_DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

CORS(app,
     supports_credentials=True,
     resources={r"/*": {
         "origins": "*"
     }},
     allow_headers=["Content-Type", "Authorization", "x-user-id"]
)



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

class RecognitionLog(db.Model):
    """Stores recognition attempt logs for auditing and diagnostics."""
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    image_filename = db.Column(db.String(200))
    total_faces_detected = db.Column(db.Integer, default=0)
    total_recognized = db.Column(db.Integer, default=0)
    total_unknown = db.Column(db.Integer, default=0)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teacher.id'), nullable=True)
    details = db.Column(db.Text)  # JSON string with per-face details
    threshold_used = db.Column(db.Float)

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
    uid = request.headers.get("x-user-id")

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

@app.route('/student/<email>/photo', methods=['GET'])
def get_student_photo(email):
    """Serve student's training photo if it exists."""
    import glob
    sanitized_at = email.replace("@", "_at_")
    
    # Try exact match with new convention first
    sanitized_full = sanitized_at.replace(".", "_")
    img_path = TRAINING_IMAGES_DIR / f"{sanitized_full}.jpg"
    if img_path.exists():
        from flask import send_file
        return send_file(img_path, mimetype='image/jpeg')
        
    # Fallback for old conventions (e.g., nishant_at_example.com_1.jpg, nishant_at_example.com.jpg, etc)
    pattern = str(TRAINING_IMAGES_DIR / f"{sanitized_at}*.*")
    matches = glob.glob(pattern)
    
    if matches:
        from flask import send_file
        # Sort to get _1 or similar first, then return the first match
        matches.sort()
        # determine mimetype from extension
        ext = matches[0].split('.')[-1].lower()
        mime = 'image/png' if ext == 'png' else 'image/jpeg'
        return send_file(matches[0], mimetype=mime)

    return jsonify({"error": "Photo not found"}), 404

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
    if err: return err, code

    if user.role == "teacher":
        teacher = Teacher.query.filter_by(user_id=user.id).first()

        from sqlalchemy import func

        from sqlalchemy import func

        total_classes = db.session.query(
            func.count(
                func.distinct(
                    func.concat(
                        AttendanceSession.date,
                        "-",
                        AttendanceSession.subject_id
                    )
                )
            )
        ).filter(
            AttendanceSession.teacher_id == teacher.id
        ).scalar()


        total_students = Student.query.count()

        recent = Attendance.query.join(Subject) \
            .filter(Subject.teacher_id == teacher.id) \
            .order_by(Attendance.created_at.desc()) \
            .limit(10).all()

        data = [{
            "date": r.date,
            "subject": r.subject.name,
            "student": r.student.user.name,
            "email": r.student.user.email,
            "marks": r.marks
        } for r in recent]

        return jsonify({
            "total_classes": total_classes,
            "total_students": total_students,
            "recent_attendance": data
        })

    # Student Dashboard
    from sqlalchemy import func

    student = Student.query.filter_by(user_id=user.id).first()

    subjects = Subject.query.filter_by(
        department=student.department,
        semester=student.semester
    ).all()

    response_subjects = []

    for s in subjects:
        # UNIQUE class sessions
        total_classes = db.session.query(
            func.count(func.distinct(AttendanceSession.date))
        ).filter(
            AttendanceSession.subject_id == s.id
        ).scalar()

        # UNIQUE attended classes
        present_classes = db.session.query(
            func.count(func.distinct(Attendance.date))
        ).filter(
            Attendance.subject_id == s.id,
            Attendance.student_id == student.id,
            Attendance.status == "present"
        ).scalar()

        percentage = (
            round((present_classes / total_classes) * 100, 2)
            if total_classes > 0 else 0
        )

        response_subjects.append({
            "subject": s.name,
            "code": s.code,
            "total_classes": total_classes,
            "present_classes": present_classes,
            "percentage": percentage
        })

    overall_total = sum(s["total_classes"] for s in response_subjects)
    overall_present = sum(s["present_classes"] for s in response_subjects)

    return jsonify({
        "overall_percentage": (
            round(sum(sub["percentage"] for sub in response_subjects) / len(response_subjects), 2)
            if response_subjects else 0
        ),
        "total_classes": overall_total,
        "total_present": overall_present,
        "subjects": response_subjects
    })




@app.route('/teacher/register-student-with-photo', methods=['POST'])
def register_student_with_photo():
    user, err, code = get_user()
    if err:
        return err, code

    if user.role != "teacher":
        return jsonify({"error": "Only teachers can register students"}), 403

    # Form fields
    name = request.form.get("name")
    email = request.form.get("email")
    roll = request.form.get("roll_number")
    department = request.form.get("department")
    semester = request.form.get("semester")
    photo = request.files.get("photo")

    if not all([name, email, roll, department, semester, photo]):
        return jsonify({"error": "Missing fields"}), 400

    # Check email exists
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400

    # ── Face Quality Validation ─────────────────────────────────────
    uploads = BASE_DIR / "uploads"
    uploads.mkdir(exist_ok=True)
    temp_path = uploads / f"reg_temp_{datetime.now().timestamp()}.jpg"
    photo.save(temp_path)

    from app.utils.face_quality import validate_registration_image
    quality_result = validate_registration_image(str(temp_path))

    if not quality_result["valid"]:
        temp_path.unlink()
        return jsonify({
            "error": quality_result["issues"][0] if quality_result["issues"] else "Image quality check failed",
            "quality_issues": quality_result["issues"],
            "quality_warnings": quality_result.get("warnings", []),
        }), 400

    # ── Create User & Student ───────────────────────────────────────
    new_user = User(
        email=email,
        password=bcrypt.generate_password_hash("123456").decode(),
        role="student",
        name=name
    )
    db.session.add(new_user)
    db.session.flush()

    new_student = Student(
        user_id=new_user.id,
        roll_number=roll,
        department=department,
        semester=int(semester),
    )
    db.session.add(new_student)
    db.session.commit()

    # ── Generate & Save Encoding ────────────────────────────────────
    img = face_recognition.load_image_file(temp_path)
    face_locations = face_recognition.face_locations(img)
    encodings = face_recognition.face_encodings(img, face_locations)

    if len(encodings) == 0:
        temp_path.unlink()
        return jsonify({"error": "No face detected during encoding"}), 400

    encoding = encodings[0]

    # Save individual encoding file
    enc_path = REFERENCE_ENCODINGS_DIR / f"{new_user.id}_1.pkl"
    with open(enc_path, "wb") as f:
        pickle.dump(encoding, f)

    # ── Save Training Image ─────────────────────────────────────────
    sanitized_email = email.replace("@", "_at_").replace(".", "_")
    training_img_path = TRAINING_IMAGES_DIR / f"{sanitized_email}.jpg"
    import shutil
    shutil.copy2(str(temp_path), str(training_img_path))

    # ── Update Student Map ──────────────────────────────────────────
    student_map = load_student_map()
    student_map[email] = {
        "student_id": new_student.id,
        "name": name,
        "roll_number": roll,
        "department": department,
        "semester": semester
    }
    save_student_map(student_map)

    temp_path.unlink()

    response_data = {
        "message": "Student registered successfully",
        "student_id": new_student.id,
        "user_id": new_user.id,
    }
    if quality_result.get("warnings"):
        response_data["quality_warnings"] = quality_result["warnings"]

    return jsonify(response_data), 200


@app.route('/student/profile', methods=['GET'])
def student_profile():
    user, err, code = get_user()
    if err:
        return err, code

    if user.role != "student":
        return jsonify({"error": "Only students"}), 403

    student = Student.query.filter_by(user_id=user.id).first()
    if not student:
        return jsonify({"error": "Student record missing"}), 404

    total = Attendance.query.filter_by(student_id=student.id).count()
    present = Attendance.query.filter_by(
        student_id=student.id,
        status="present"
    ).count()

    attendance_percentage = round((present / total * 100), 2) if total > 0 else 0

    return jsonify({
        "name": user.name,
        "email": user.email,
        "roll_number": student.roll_number,
        "department": student.department,
        "semester": student.semester,
        "attendance": {
            "total_classes": total,
            "present": present,
            "percentage": attendance_percentage
        }
    })


@app.route('/student/attendance', methods=['GET'])

def student_attendance():
    """Student views their own detailed attendance records."""
    user, err, code = get_user()
    if err: return err, code

    if user.role != 'student':
        return jsonify({"error": "Only students"}), 403

    student = Student.query.filter_by(user_id=user.id).first()
    if not student:
        return jsonify({"error": "Student record missing"}), 404

    date_from = request.args.get("date_from", "").strip()
    date_to = request.args.get("date_to", "").strip()
    subject_code = request.args.get("subject", "").strip()

    query = Attendance.query \
        .join(Subject, Attendance.subject_id == Subject.id) \
        .filter(Attendance.student_id == student.id)

    if subject_code:
        query = query.filter(Subject.code == subject_code)
    if date_from:
        query = query.filter(Attendance.date >= date_from)
    if date_to:
        query = query.filter(Attendance.date <= date_to)

    records = query.order_by(Attendance.date.desc()).all()

    return jsonify({"records": [{
        "date": r.date,
        "subject": r.subject.name,
        "subject_code": r.subject.code,
        "marks": r.marks,
        "status": r.status,
    } for r in records]})


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


@app.route('/subjects', methods=['POST'])

def create_subject():
    """Create a new subject for the logged-in teacher."""
    user, err, code = get_user()
    if err: return err, code

    if user.role != 'teacher':
        return jsonify({"error": "Only teachers can create subjects"}), 403

    data = request.get_json()
    name = data.get('name', '').strip()
    subject_code = data.get('code', '').strip()
    credits = data.get('credits', 3)
    department = data.get('department', '').strip()
    semester = data.get('semester')

    if not name or not subject_code:
        return jsonify({"error": "Subject name and code are required"}), 400

    # Check for duplicate code
    existing = Subject.query.filter_by(code=subject_code).first()
    if existing:
        return jsonify({"error": f"Subject code '{subject_code}' already exists"}), 400

    teacher = Teacher.query.filter_by(user_id=user.id).first()

    new_subject = Subject(
        name=name,
        code=subject_code,
        credits=int(credits),
        department=department or teacher.department if hasattr(teacher, 'department') else '',
        semester=int(semester) if semester else 1,
        teacher_id=teacher.id,
    )
    db.session.add(new_subject)
    db.session.commit()

    return jsonify({
        "message": f"Subject '{name}' created successfully",
        "subject": {
            "id": new_subject.id,
            "name": new_subject.name,
            "code": new_subject.code,
            "credits": new_subject.credits,
            "department": new_subject.department,
        }
    }), 201


@app.route('/subjects/<int:subject_id>', methods=['DELETE'])

def delete_subject(subject_id):
    """Delete a subject (teacher only, must own it)."""
    user, err, code = get_user()
    if err: return err, code

    if user.role != 'teacher':
        return jsonify({"error": "Only teachers"}), 403

    teacher = Teacher.query.filter_by(user_id=user.id).first()
    subject = Subject.query.filter_by(id=subject_id, teacher_id=teacher.id).first()

    if not subject:
        return jsonify({"error": "Subject not found or not owned by you"}), 404

    db.session.delete(subject)
    db.session.commit()
    return jsonify({"message": f"Subject '{subject.name}' deleted"})


# -------------------- TEACHER STUDENTS LIST --------------------

@app.route('/teacher/students', methods=['GET'])

def teacher_students():
    """List all registered students."""
    user, err, code = get_user()
    if err: return err, code

    if user.role != 'teacher':
        return jsonify({"error": "Only teachers"}), 403

    students = Student.query.join(User, Student.user_id == User.id).all()

    return jsonify({"students": [{
        "id": s.id,
        "name": s.user.name,
        "email": s.user.email,
        "roll_number": s.roll_number,
        "department": s.department,
        "semester": s.semester,
    } for s in students]})

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

    if not subject:
        return jsonify({"error": "Subject not found"}), 404

    uploads = BASE_DIR / "uploads"
    uploads.mkdir(exist_ok=True)
    temp_path = uploads / f"temp_{datetime.now().timestamp()}.jpg"
    file.save(temp_path)

    from app.utils.face_recognizer import FaceRecognizer
    recognizer = FaceRecognizer()
    results = recognizer.recognize_students(str(temp_path))

    temp_path.unlink()

    # ── Filter recognized vs unknown ────────────────────────────────
    recognized = [r for r in results if r["status"] == "recognized"]
    unknown = [r for r in results if r["status"] == "unknown"]

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

    for r in recognized:
        email = r["email"]
        if not email:
            continue

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

    # ── Log recognition to database ─────────────────────────────────
    if RECOGNITION_LOGGING_ENABLED:
        from app.config import RECOGNITION_DISTANCE_THRESHOLD
        log_entry = RecognitionLog(
            total_faces_detected=len(results),
            total_recognized=len(recognized),
            total_unknown=len(unknown),
            subject_id=subject.id,
            teacher_id=teacher.id,
            details=json.dumps({
                "recognized": [r["email"] for r in recognized],
                "unknown_count": len(unknown),
            }),
            threshold_used=RECOGNITION_DISTANCE_THRESHOLD,
        )
        db.session.add(log_entry)

    db.session.commit()

    return jsonify({
        "message": f"Marked {marked} student(s)",
        "detected": detected,
        "unknown_count": len(unknown),
        "total_faces": len(results),
    })


# ===============================
#   RECOGNIZE ONLY (No save) — with annotated image
# ===============================

@app.route('/attendance/recognize', methods=['POST'])

def recognize_faces():
    """Recognize faces in uploaded image WITHOUT saving attendance.
    Returns detected faces with bounding boxes AND a base64-encoded
    annotated image for the verification UI."""
    user, err, code = get_user()
    if err: return err, code

    if user.role != 'teacher':
        return jsonify({"error": "Only teachers"}), 403

    file = request.files.get('photo')
    if not file:
        return jsonify({"error": "No photo uploaded"}), 400

    uploads = BASE_DIR / "uploads"
    uploads.mkdir(exist_ok=True)
    temp_path = uploads / f"recognize_{datetime.now().timestamp()}.jpg"
    file.save(temp_path)

    from app.utils.face_recognizer import FaceRecognizer
    recognizer = FaceRecognizer()
    results = recognizer.recognize_students(str(temp_path))

    # Build annotated image with bounding boxes
    import cv2, base64
    img = cv2.imread(str(temp_path))
    for r in results:
        loc = r["location"]
        top, right, bottom, left = loc["top"], loc["right"], loc["bottom"], loc["left"]
        if r["status"] == "recognized":
            color = (0, 200, 0)  # green
            label = r["student"]
        else:
            color = (0, 0, 220)  # red
            label = "Unknown"
        cv2.rectangle(img, (left, top), (right, bottom), color, 2)
        cv2.putText(img, label, (left, top - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    _, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    annotated_b64 = base64.b64encode(buf).decode('utf-8')

    temp_path.unlink()

    recognized = [r for r in results if r["status"] == "recognized"]
    unknown = [r for r in results if r["status"] == "unknown"]

    return jsonify({
        "results": results,
        "recognized_count": len(recognized),
        "unknown_count": len(unknown),
        "total_faces": len(results),
        "annotated_image": annotated_b64,
    })


# ===============================
#   CONFIRM VERIFIED ATTENDANCE
# ===============================

@app.route('/attendance/confirm', methods=['POST'])

def confirm_attendance():
    """Save attendance after teacher verification.
    Expects JSON: { date, subject_code, marks, confirmed_emails: [...] }"""
    user, err, code = get_user()
    if err: return err, code

    if user.role != 'teacher':
        return jsonify({"error": "Only teachers"}), 403

    data = request.get_json()
    date = data.get('date')
    subject_code = data.get('subject_code')
    marks = data.get('marks', 1)
    confirmed_emails = data.get('confirmed_emails', [])

    if not date or not subject_code:
        return jsonify({"error": "Missing date or subject"}), 400

    teacher = Teacher.query.filter_by(user_id=user.id).first()
    subject = Subject.query.filter_by(code=subject_code).first()
    if not subject:
        return jsonify({"error": "Subject not found"}), 404

    session = AttendanceSession(
        date=date, subject_id=subject.id,
        teacher_id=teacher.id, total_marks=marks
    )
    db.session.add(session)
    db.session.flush()

    marked = 0
    for email in confirmed_emails:
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
            db.session.add(Attendance(
                date=date, subject_id=subject.id,
                student_id=student.id, marks=marks, status='present'
            ))
        marked += 1

    if RECOGNITION_LOGGING_ENABLED:
        from app.config import RECOGNITION_DISTANCE_THRESHOLD
        db.session.add(RecognitionLog(
            total_faces_detected=len(confirmed_emails),
            total_recognized=marked, total_unknown=0,
            subject_id=subject.id, teacher_id=teacher.id,
            details=json.dumps({"confirmed_emails": confirmed_emails, "mode": "verified"}),
            threshold_used=RECOGNITION_DISTANCE_THRESHOLD,
        ))

    db.session.commit()
    return jsonify({"message": f"Attendance confirmed for {marked} student(s)", "marked": marked})


# ===============================
#   STUDENT SEARCH (for manual add)
# ===============================

@app.route('/students/search', methods=['GET'])

def search_students():
    """Search students by name or roll number for manual attendance addition."""
    user, err, code = get_user()
    if err: return err, code

    if user.role != 'teacher':
        return jsonify({"error": "Only teachers"}), 403

    q = request.args.get('q', '').strip()
    if len(q) < 2:
        return jsonify({"students": []})

    students = Student.query.join(User, Student.user_id == User.id).filter(
        db.or_(
            User.name.ilike(f'%{q}%'),
            Student.roll_number.ilike(f'%{q}%'),
            User.email.ilike(f'%{q}%'),
        )
    ).limit(10).all()

    return jsonify({"students": [{
        "student_id": s.id,
        "name": s.user.name,
        "email": s.user.email,
        "roll_number": s.roll_number,
        "department": s.department,
    } for s in students]})


# ===============================
#   MODEL RETRAIN
# ===============================

@app.route('/teacher/retrain', methods=['POST'])

def retrain_model():
    """Trigger face recognition model retraining."""
    user, err, code = get_user()
    if err: return err, code

    if user.role != 'teacher':
        return jsonify({"error": "Only teachers"}), 403

    try:
        import subprocess
        result = subprocess.run(
            ['python', str(BASE_DIR.parent / 'train_model.py')],
            capture_output=True, text=True, timeout=120
        )
        return jsonify({
            "message": "Model retrained successfully",
            "output": result.stdout[-1000:] if result.stdout else "",
            "errors": result.stderr[-500:] if result.stderr else "",
        })
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Training timed out. Try again."}), 500
    except Exception as e:
        return jsonify({"error": f"Training failed: {str(e)}"}), 500


# ===============================
#   ATTENDANCE HISTORY API
# ===============================


from sqlalchemy import extract

from datetime import datetime

@app.route("/attendance/history", methods=["GET"])
def attendance_history():
    user_id = request.headers.get("x-user-id")
    if not user_id:
        return jsonify({"error": "Missing x-user-id"}), 400

    subject = request.args.get("subject", "").strip()
    date_from = request.args.get("date_from", "").strip()
    date_to = request.args.get("date_to", "").strip()

    # Correct join: Attendance -> Student -> User
    query = Attendance.query \
        .join(Student, Attendance.student_id == Student.id) \
        .join(User, Student.user_id == User.id) \
        .join(Subject, Attendance.subject_id == Subject.id)

    # Filter by subject code
    if subject:
        query = query.filter(Subject.code == subject)

    # Filter date_from (string compare fine due to YYYY-MM-DD)
    if date_from:
        query = query.filter(Attendance.date >= date_from)

    # Filter date_to
    if date_to:
        query = query.filter(Attendance.date <= date_to)

    records = query.order_by(Attendance.date.desc()).all()

    output = []
    for r in records:
        student_user = User.query.get(r.student.user_id)

        output.append({
            "student": student_user.name,
            "email": student_user.email,
            "roll": r.student.roll_number,
            "department": r.student.department,
            "subject": r.subject.name,
            "subject_code": r.subject.code,
            "date": r.date,
            "status": r.status,
            "marks": r.marks,
            "marked_at": r.created_at.strftime("%Y-%m-%d %I:%M %p")
        })

    return jsonify({"records": output}), 200


# ===============================
#   ATTENDANCE EXPORT (Excel)
# ===============================

@app.route("/attendance/export", methods=["GET"])

def attendance_export():
    user_id = request.headers.get("x-user-id")
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    subject = request.args.get("subject", "").strip()
    date_from = request.args.get("date_from", "").strip()
    date_to = request.args.get("date_to", "").strip()

    query = Attendance.query \
        .join(Student, Attendance.student_id == Student.id) \
        .join(User, Student.user_id == User.id) \
        .join(Subject, Attendance.subject_id == Subject.id)

    if subject:
        query = query.filter(Subject.code == subject)
    if date_from:
        query = query.filter(Attendance.date >= date_from)
    if date_to:
        query = query.filter(Attendance.date <= date_to)

    records = query.order_by(Attendance.date.desc()).all()

    rows = []
    for r in records:
        rows.append({
            "Date": r.date,
            "Subject": r.subject.name,
            "Subject Code": r.subject.code,
            "Student": r.student.user.name,
            "Roll Number": r.student.roll_number,
            "Department": r.student.department,
            "Marks": r.marks,
            "Status": r.status,
        })

    df = pd.DataFrame(rows)
    output = BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Attendance")
    output.seek(0)

    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="attendance_export.xlsx",
    )


# -------------------- MAIN --------------------

if __name__ == '__main__':
    print("\nAPI running\n")
    app.run(debug=FLASK_DEBUG, port=FLASK_PORT, host="0.0.0.0")
