# backend/app/utils/face_recognizer.py — Enhanced face recognition with strict thresholding

import face_recognition
import pickle
import numpy as np
import cv2
import logging
from pathlib import Path
from datetime import datetime
import json
import sys
from pathlib import Path

# Config import (works when running from backend/ as python -m app.app)
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from app.config import (
    RECOGNITION_DISTANCE_THRESHOLD,
    RECOGNITION_HIGH_CONFIDENCE_THRESHOLD,
    RECOGNITION_LOGGING_ENABLED,
    MAX_IMAGE_DIMENSION,
    ENABLE_CLAHE,
    CLAHE_CLIP_LIMIT,
    CLAHE_TILE_GRID_SIZE,
)

# Set up file-based logger for recognition events (internal only)
_logger = logging.getLogger("face_recognition_engine")
_logger.setLevel(logging.INFO)

_log_dir = Path(__file__).parent.parent / "logs"
_log_dir.mkdir(exist_ok=True)
_log_handler = logging.FileHandler(_log_dir / "recognition.log", encoding="utf-8")
_log_handler.setFormatter(logging.Formatter(
    "%(asctime)s | %(levelname)s | %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
))
_logger.addHandler(_log_handler)


class FaceRecognizer:
    def __init__(self):
        self.BASE_DIR = Path(__file__).parent.parent
        self.threshold = RECOGNITION_DISTANCE_THRESHOLD
        self.high_confidence_threshold = RECOGNITION_HIGH_CONFIDENCE_THRESHOLD
        self.load_encodings()
        self.load_student_map()
        self.validate_mapping()

    def load_encodings(self):
        """Load trained encodings. Supports both averaged and individual encodings."""
        encodings_path = self.BASE_DIR / "reference_encodings" / "encodings.pkl"
        individual_path = self.BASE_DIR / "reference_encodings" / "encodings_individual.pkl"

        try:
            with open(encodings_path, "rb") as f:
                data = pickle.load(f)
                self.known_emails = data["names"]  # Email identifiers
                self.known_encodings = data["encodings"]  # Averaged encodings
                self.image_counts = data.get("image_counts", {})

            # Load individual encodings if available (better for matching)
            self.individual_encodings = None
            if individual_path.exists():
                with open(individual_path, "rb") as f:
                    self.individual_encodings = pickle.load(f)
                _logger.info(
                    f"Loaded individual encodings for {len(self.individual_encodings)} students"
                )

            _logger.info(
                f"Loaded {len(self.known_emails)} student encodings "
                f"(threshold={self.threshold})"
            )
            print(f"✅ Loaded {len(self.known_emails)} student encodings")

        except FileNotFoundError:
            self.known_emails = []
            self.known_encodings = []
            self.individual_encodings = None
            _logger.warning("No trained model found. Recognition will return all unknowns.")
            print("⚠️  No trained model found. Run train_model.py first.")

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
            _logger.warning(f"Missing student_map entries for: {missing}")
            print(f"⚠️  Warning: Missing mappings for {len(missing)} students")

    def _preprocess_image(self, image_path):
        """
        Preprocess image for recognition:
        1. Resize if too large (speed optimization)
        2. Apply CLAHE histogram equalization (lighting normalization)
        3. Return RGB image for face_recognition library
        """
        img = cv2.imread(str(image_path))
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")

        # Resize if too large
        h, w = img.shape[:2]
        if max(h, w) > MAX_IMAGE_DIMENSION:
            scale = MAX_IMAGE_DIMENSION / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)),
                             interpolation=cv2.INTER_AREA)

        # CLAHE histogram equalization for lighting normalization
        if ENABLE_CLAHE:
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            l_ch, a_ch, b_ch = cv2.split(lab)
            clahe = cv2.createCLAHE(
                clipLimit=CLAHE_CLIP_LIMIT, tileGridSize=CLAHE_TILE_GRID_SIZE
            )
            l_ch = clahe.apply(l_ch)
            lab = cv2.merge([l_ch, a_ch, b_ch])
            img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

        # Convert BGR → RGB
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    def _match_face(self, face_encoding):
        """
        Match a single face encoding against known encodings with strict thresholding.
        
        Strategy:
        1. If individual encodings available, find minimum distance across all 
           per-image encodings for each student (handles expression/angle variance)
        2. Otherwise, use averaged encodings
        3. Only accept if minimum distance < RECOGNITION_DISTANCE_THRESHOLD
        
        Returns:
            tuple: (email, distance, confidence_level) or (None, min_distance, "unknown")
        """
        if len(self.known_encodings) == 0:
            return None, 1.0, "unknown"

        best_email = None
        best_distance = 1.0

        if self.individual_encodings is not None:
            # Match against individual encodings — more accurate
            for email, encodings_list in self.individual_encodings.items():
                distances = face_recognition.face_distance(encodings_list, face_encoding)
                min_dist = float(np.min(distances))
                if min_dist < best_distance:
                    best_distance = min_dist
                    best_email = email
        else:
            # Fall back to averaged encodings
            distances = face_recognition.face_distance(self.known_encodings, face_encoding)
            best_idx = np.argmin(distances)
            best_distance = float(distances[best_idx])
            best_email = self.known_emails[best_idx]

        # ── STRICT THRESHOLD CHECK ──────────────────────────────────
        if best_distance > self.threshold:
            # Distance too high → REJECT as unknown
            return None, best_distance, "unknown"

        # Determine confidence level for logging
        if best_distance <= self.high_confidence_threshold:
            confidence_level = "high"
        else:
            confidence_level = "medium"

        return best_email, best_distance, confidence_level

    def recognize_students(self, image_path):
        """
        Recognize students in an image with strict thresholding.
        
        Returns list of results, each containing:
        - For recognized faces: student info + bounding box + "recognized" status
        - For unknown faces: "Unknown" label + bounding box + "unknown" status
        
        This method NEVER forces a match — unknown faces are explicitly returned.
        """
        try:
            # Preprocess image
            image_rgb = self._preprocess_image(image_path)

            # Detect faces
            face_locations = face_recognition.face_locations(image_rgb)
            face_encodings = face_recognition.face_encodings(image_rgb, face_locations)

            total_faces = len(face_encodings)
            _logger.info(f"Processing image: {image_path} | Detected {total_faces} faces")
            print(f"🔍 Found {total_faces} faces in the image")

            results = []
            recognized_count = 0
            unknown_count = 0

            for idx, (encoding, location) in enumerate(zip(face_encodings, face_locations)):
                email, distance, confidence_level = self._match_face(encoding)

                face_loc = {
                    "top": location[0],
                    "right": location[1],
                    "bottom": location[2],
                    "left": location[3],
                }

                if email is not None and confidence_level != "unknown":
                    # ── ACCEPTED MATCH ───────────────────────────────
                    student_info = self.student_map.get(email)

                    if student_info:
                        recognized_count += 1
                        results.append({
                            "status": "recognized",
                            "student": student_info.get("name", "Unknown"),
                            "email": email,
                            "roll": student_info.get("roll_number", "Unknown"),
                            "department": student_info.get("department", "Unknown"),
                            "location": face_loc,
                        })

                        _logger.info(
                            f"  Face #{idx+1}: ACCEPTED | "
                            f"Student: {student_info.get('name')} | "
                            f"Email: {email} | "
                            f"Distance: {distance:.4f} | "
                            f"Threshold: {self.threshold} | "
                            f"Level: {confidence_level}"
                        )
                        print(f"✅ Recognized: {student_info.get('name')} (distance: {distance:.4f})")
                    else:
                        # Email matched but no student_map entry
                        unknown_count += 1
                        results.append({
                            "status": "unknown",
                            "student": "Unknown",
                            "email": None,
                            "roll": None,
                            "department": None,
                            "location": face_loc,
                        })
                        _logger.warning(
                            f"  Face #{idx+1}: MATCHED email {email} but no student_map entry | "
                            f"Distance: {distance:.4f}"
                        )
                        print(f"⚠️  Matched email {email} but no student_map entry")
                else:
                    # ── REJECTED — UNKNOWN FACE ──────────────────────
                    unknown_count += 1
                    results.append({
                        "status": "unknown",
                        "student": "Unknown",
                        "email": None,
                        "roll": None,
                        "department": None,
                        "location": face_loc,
                    })

                    _logger.info(
                        f"  Face #{idx+1}: REJECTED (Unknown) | "
                        f"Best distance: {distance:.4f} | "
                        f"Threshold: {self.threshold} | "
                        f"Above threshold by: {distance - self.threshold:.4f}"
                    )
                    print(f"❌ Unknown face (distance: {distance:.4f}, threshold: {self.threshold})")

            _logger.info(
                f"Recognition complete | "
                f"Total: {total_faces} | "
                f"Recognized: {recognized_count} | "
                f"Unknown: {unknown_count}"
            )
            print(f"\n📊 Results: {recognized_count} recognized, {unknown_count} unknown")

            # Sort: recognized first, then unknowns
            results.sort(key=lambda x: (x["status"] != "recognized",))

            return results

        except Exception as e:
            _logger.error(f"Face recognition error: {str(e)}", exc_info=True)
            print(f"❌ Face recognition error: {str(e)}")
            raise e

    def get_recognition_stats(self):
        """Return current recognizer statistics for diagnostics."""
        return {
            "total_students_loaded": len(self.known_emails),
            "threshold": self.threshold,
            "high_confidence_threshold": self.high_confidence_threshold,
            "has_individual_encodings": self.individual_encodings is not None,
            "student_map_entries": len(self.student_map),
            "students": self.known_emails,
        }