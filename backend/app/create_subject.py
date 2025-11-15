# create_subject.py
from app import app, db, Subject, Teacher

with app.app_context():
    # Get the teacher
    teacher = Teacher.query.filter_by(employee_id='T001').first()
    
    if teacher:
        # Create a test subject
        subject = Subject(
            name='Mathematics',
            code='MATH101',
            credits=3,
            department='Computer Science',
            semester=7,
            teacher_id=teacher.id
        )
        db.session.add(subject)
        db.session.commit()
        print("✅ Subject created successfully!")
    else:
        print("❌ Teacher not found. Make sure to create teacher first.")