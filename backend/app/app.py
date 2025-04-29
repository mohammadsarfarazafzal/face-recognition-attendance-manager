from flask import Flask, request, jsonify
from pathlib import Path
import json
from utils.face_recognizer import FaceRecognizer
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
CORS(app, resources={r"/predict": {"origins": "http://localhost:5173"}})
recognizer = FaceRecognizer()

# Configuration
BASE_DIR = Path(__file__).parent
app.config["UPLOAD_FOLDER"] = BASE_DIR / "uploads"
app.config["ALLOWED_EXTENSIONS"] = {"png", "jpg", "jpeg"}
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # 8MB

def allowed_file(filename):
    return "." in filename and \
           filename.rsplit(".", 1)[1].lower() in app.config["ALLOWED_EXTENSIONS"]

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
        
    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    try:
        # Ensure upload directory exists
        app.config["UPLOAD_FOLDER"].mkdir(exist_ok=True)
        temp_path = app.config["UPLOAD_FOLDER"] / file.filename
        file.save(temp_path)
        
        results = recognizer.recognize_students(temp_path)
        return jsonify({"results": results})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    finally:
        if "temp_path" in locals() and temp_path.exists():
            temp_path.unlink()

@app.route("/students", methods=["GET"])
def get_students():
    map_path = BASE_DIR / "student_map.json"
    try:
        with open(map_path) as f:
            students = json.load(f)
        return jsonify(students)
    except FileNotFoundError:
        return jsonify({"error": "student map not found"}), 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)