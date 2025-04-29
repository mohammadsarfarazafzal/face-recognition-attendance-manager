import os
import cv2
import pickle
import face_recognition
from pathlib import Path

def train_system():
    BASE_DIR = Path(__file__).parent
    TRAIN_DIR = BASE_DIR / "app" / "Training_images"
    ENCODINGS_PATH = BASE_DIR / "app" / "reference_encodings" / "encodings.pkl"
    
    images = []
    classNames = []
    
    # Load training images
    print("Loading training images...")
    for img_name in os.listdir(TRAIN_DIR):
        img_path = os.path.join(TRAIN_DIR, img_name)
        img = cv2.imread(img_path)
        if img is not None:
            images.append(img)
            classNames.append(os.path.splitext(img_name)[0])
    
    # Generate encodings
    print("Generating face encodings...")
    encodeList = []
    for img in images:
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        encoding = face_recognition.face_encodings(img_rgb)[0]
        encodeList.append(encoding)
    
    # Save encodings
    ENCODINGS_PATH.parent.mkdir(exist_ok=True)
    with open(ENCODINGS_PATH, "wb") as f:
        pickle.dump({"names": classNames, "encodings": encodeList}, f)
    
    print(f"Training complete. {len(classNames)} students encoded")

if __name__ == "__main__":
    train_system()