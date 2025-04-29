import face_recognition
import pickle
import numpy as np
from pathlib import Path
import json

class FaceRecognizer:
    def __init__(self):
        self.BASE_DIR = Path(__file__).parent.parent.parent
        self.load_encodings()
        self.load_student_map()
        self.validate_mapping()

    def load_encodings(self):
        encodings_path = self.BASE_DIR / "app" / "reference_encodings" / "encodings.pkl"
        try:
            with open(encodings_path, "rb") as f:
                data = pickle.load(f)
                self.known_names = data["names"]
                self.known_encodings = data["encodings"]
        except FileNotFoundError:
            raise Exception("No trained model found. Run train_model.py first")

    def load_student_map(self):
        map_path = self.BASE_DIR / "app" / "student_map.json"
        try:
            with open(map_path) as f:
                self.student_map = json.load(f)
        except FileNotFoundError:
            self.student_map = {}

    def validate_mapping(self):
        """Check for missing mappings and print warnings"""
        missing = []
        for student in self.known_names:
            if student not in self.student_map:
                missing.append(student)
        if missing:
            print(f"Warning: Missing student mappings for {len(missing)} students:")
            for name in missing:
                print(f" - {name}")

    def recognize_students(self, image_path):
        unknown_image = face_recognition.load_image_file(image_path)
        face_locations = face_recognition.face_locations(unknown_image)
        face_encodings = face_recognition.face_encodings(unknown_image, face_locations)
       
        results = []
        for encoding, location in zip(face_encodings, face_locations):
            matches = face_recognition.compare_faces(self.known_encodings, encoding)
            face_distances = face_recognition.face_distance(self.known_encodings, encoding)
            best_match_idx = np.argmin(face_distances)
           
            if matches[best_match_idx]:
                student_key = self.known_names[best_match_idx]
                student = self.student_map.get(student_key)
               
                if not student:
                    print(f"Warning: No student mapping found for {student_key}")
                    student = "Unknown student"
               
                results.append({
                    "student": student_key.replace('_', ' ').title(),
                    "roll": student,
                    "confidence": round((1 - face_distances[best_match_idx]) * 100, 2),
                    "location": {
                        "top": location[0],
                        "right": location[1],
                        "bottom": location[2],
                        "left": location[3]
                    }
                })
       
        return sorted(results, key=lambda x: x["confidence"], reverse=True)