# backend/app/create_students_with_emails.py
from app import app, db, User, Student
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt(app)

def create_students():
    students_data = [
        {"name": "Anurag Tiwari", "email": "anurag@example.com", "roll": "1"},
        {"name": "Debaprio Bhowmchick", "email": "debaprio@example.com", "roll": "2"},
        {"name": "Debendar Choudhary", "email": "debendar@example.com", "roll": "3"},
        {"name": "Kunal Sharma", "email": "kunal@example.com", "roll": "4"},
        {"name": "Md Adil Farhan", "email": "adil@example.com", "roll": "5"},
        {"name": "Md Sarfaraz Afzal", "email": "sarfaraz@example.com", "roll": "6"},
        {"name": "Nahid Azad", "email": "nahid@example.com", "roll": "7"},
        {"name": "Nishant Kumar Bhadani", "email": "nishant@example.com", "roll": "8"},
        {"name": "Prasun Kumar", "email": "prasun@example.com", "roll": "9"},
        {"name": "Shubranil Bhunia", "email": "shubranil@example.com", "roll": "10"},
        {"name": "Sohan Chatterjee", "email": "sohan@example.com", "roll": "11"},
        {"name": "Tanmay Kumar", "email": "tanmay@example.com", "roll": "12"},
        {"name": "Tarpan", "email": "tarpan@example.com", "roll": "13"},
    ]

    with app.app_context():
        for data in students_data:
            # Check if user already exists
            if User.query.filter_by(email=data["email"]).first():
                print(f"User {data['name']} already exists")
                continue
            
            # Create user
            hashed_password = bcrypt.generate_password_hash(data["roll"]).decode('utf-8')
            user = User(
                email=data["email"],
                password=hashed_password,
                role='student',
                name=data["name"]
            )
            db.session.add(user)
            db.session.flush()
            
            # Create student
            student = Student(
                user_id=user.id,
                roll_number=data["roll"],
                department='Computer Science',
                semester=7,
                academic_year='2022-2026'
            )
            db.session.add(student)
            print(f"Created student: {data['name']} (Email: {data['email']}, Roll: {data['roll']})")
        
        db.session.commit()
        print("All students created successfully!")

if __name__ == "__main__":
    create_students()