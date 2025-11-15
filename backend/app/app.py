# backend/app/app.py - JWT REMOVED COMPLETELY, SIMPLE USER_ID AUTH

from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS, cross_origin
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
from flask_cors import CORS

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
@cross_origin(origins=["http://localhost:5173"])
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

    # Save user
    new_user = User(
        email=email,
        password=bcrypt.generate_password_hash("123456").decode(),
        role="student",
        name=name
    )
    db.session.add(new_user)
    db.session.flush()

    # Save student
    new_student = Student(
        user_id=new_user.id,
        roll_number=roll,
        department=department,
        semester=int(semester),
    )
    db.session.add(new_student)
    db.session.commit()

    # Process face
    uploads = BASE_DIR / "uploads"
    uploads.mkdir(exist_ok=True)
    temp_path = uploads / f"reg_{new_user.id}.jpg"
    photo.save(temp_path)

    # Load & encode
    img = face_recognition.load_image_file(temp_path)
    encodings = face_recognition.face_encodings(img)

    if len(encodings) == 0:
        temp_path.unlink()
        return jsonify({"error": "No face detected"}), 400

    encoding = encodings[0]

    # Save encoding
    enc_path = REFERENCE_ENCODINGS_DIR / f"{new_user.id}.pkl"
    with open(enc_path, "wb") as f:
        pickle.dump(encoding, f)

    # Update map
    student_map = load_student_map()
    student_map[str(new_user.id)] = {
        "name": name,
        "email": email,
        "roll": roll,
        "department": department,
        "semester": semester
    }
    save_student_map(student_map)

    temp_path.unlink()

    return jsonify({
        "message": "✅ Student registered successfully",
        "student_id": new_student.id,
        "user_id": new_user.id
    }), 200


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
@cross_origin(origins=["http://localhost:5173"])
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

    from utils.face_recognizer import FaceRecognizer
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
#   ATTENDANCE EXPORT (CSV)
# ===============================
import csv
from io import StringIO
from flask import Response

@app.route("/attendance/export", methods=["GET"])
@cross_origin(origins=["http://localhost:5173"])
def attendance_export():
    user_id = request.headers.get("x-user-id")

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    # Same filters as history
    date = request.args.get("date")
    month = request.args.get("month")
    year = request.args.get("year")
    student_id = request.args.get("student_id")
    department = request.args.get("department")

    query = Attendance.query.join(User, Attendance.student_id == User.id)

    if date:
        query = query.filter(Attendance.date == date)

    if month and year:
        query = query.filter(
            extract("month", Attendance.date) == int(month),
            extract("year", Attendance.date) == int(year)
        )

    if student_id:
        query = query.filter(Attendance.student_id == student_id)

    if department:
        query = query.filter(User.department == department)

    records = query.all()

    # Build CSV
    si = StringIO()
    writer = csv.writer(si)
    writer.writerow(["Student", "Roll", "Department", "Date", "Time", "Status"])

    for r in records:
        student = User.query.get(r.student_id)
        writer.writerow([
            student.name,
            student.roll,
            student.department,
            r.date.strftime("%Y-%m-%d"),
            r.timestamp.strftime("%I:%M %p"),
            "Present"
        ])

    output = si.getvalue()
    si.close()

    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance_export.csv"}
    )


# -------------------- MAIN --------------------

if __name__ == '__main__':
    print("\nAPI running\n")
    app.run(debug=True, port=5000)
