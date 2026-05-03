# 🎓 AutoAttend — Face Recognition Attendance Manager

> **B.Tech Final Year Project**  
> AI-powered attendance system using facial recognition with human-in-the-loop verification.

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Setup & Installation](#-setup--installation)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [API Reference](#-api-reference)

---

## 🔍 Overview

AutoAttend replaces manual roll-calls with a **face recognition pipeline** that:

1. **Detects** faces in uploaded/captured group photos
2. **Recognizes** each face against a trained database of student encodings
3. **Verifies** detections via a human-in-the-loop review screen (teacher approves/rejects)
4. **Records** confirmed attendance to the database

This eliminates proxy attendance and reduces class disruption. The system enforces a **strict distance threshold (0.42)** and explicitly rejects unknown faces to minimize false positives.

---

## ✨ Features

### Core
| Feature | Description |
|---------|-------------|
| **Face Recognition** | Uses `face_recognition` library with 0.42 distance threshold |
| **Unknown Rejection** | Faces above threshold are explicitly marked "Unknown" — no false positives |
| **Quality Gating** | Registration validates blur, brightness, face size, and anti-spoofing |
| **CLAHE Preprocessing** | Adaptive histogram equalization normalizes lighting conditions |
| **Verification Mode** | Human-in-the-loop: teacher reviews annotated images before saving |
| **Camera Capture** | Browser-native webcam access for real-time photo capture |

### Dashboard & Analytics
| Feature | Description |
|---------|-------------|
| **Teacher Dashboard** | Stats grid, quick actions, retrain model, recent activity |
| **Student Dashboard** | Subject-wise attendance %, progress bars, profile card |
| **Attendance History** | Filterable table with subject/date filters |
| **Excel Export** | Download attendance records as `.xlsx` with full formatting |
| **Subject Management** | CRUD operations for course subjects |

### UI/UX
| Feature | Description |
|---------|-------------|
| **Premium Dark Theme** | Inter font, glassmorphism, gradient accents |
| **Responsive Layout** | Sidebar (desktop) + hamburger menu (mobile) |
| **Skeleton Loaders** | Loading states for all data-driven pages |
| **Toast Notifications** | Non-blocking feedback system |
| **Custom 404 Page** | Branded not-found page |
| **Error Boundary** | Graceful crash recovery |

---

## 🛠 Tech Stack

### Frontend
- **React 18** + Vite 6
- **TailwindCSS** — utility-first styling
- **React Router v6** — client-side routing
- **Native browser APIs** — webcam (MediaDevices), file handling

### Backend
- **Flask 3.0** — REST API
- **SQLAlchemy** — ORM
- **MySQL 8** — relational database
- **face_recognition** (dlib) — 128D face encodings
- **OpenCV** — image preprocessing (CLAHE, resizing)
- **Pandas + openpyxl** — Excel export

---

## 🏗 Architecture

```
┌─────────────────┐      HTTP/JSON       ┌──────────────────────┐
│   React (Vite)  │ ◄──────────────────► │   Flask REST API     │
│   Port 5173     │                      │   Port 5000          │
└────────┬────────┘                      └──────────┬───────────┘
         │                                          │
    ┌────▼────┐                              ┌──────▼──────┐
    │ Browser │                              │   MySQL 8   │
    │ Webcam  │                              │ attendance  │
    └─────────┘                              └──────┬──────┘
                                                    │
                                             ┌──────▼──────┐
                                             │  .pkl files  │
                                             │  (encodings) │
                                             └─────────────┘
```

### Recognition Pipeline

```
Photo Upload/Capture
        ↓
  Image Preprocessing (CLAHE + resize)
        ↓
  face_recognition.face_locations()
        ↓
  face_recognition.face_encodings()
        ↓
  Compare vs stored encodings (distance ≤ 0.42)
        ↓
  Generate annotated image (bounding boxes)
        ↓
  Teacher Verification Screen
        ↓
  Confirm → Save to Database
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **MySQL 8.0**
- **CMake + Visual C++ Build Tools** (for dlib compilation on Windows)

### 1. Clone & Database

```bash
git clone https://github.com/mohammadsarfarazafzal/face-recognition-attendance-manager.git
cd face-recognition-attendance-manager
```

Create MySQL database:
```sql
CREATE DATABASE attendance_db;
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file (optional — defaults work for local dev):
```env
DATABASE_URI=mysql+pymysql://root:root@localhost/attendance_db
FLASK_DEBUG=True
FLASK_PORT=5000
```

Start the backend:
```bash
python -m app.app
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**

### 4. First-Time Usage

1. Register a **Teacher** account
2. Register **Students** with face photos (teacher flow)
3. Click **Retrain Model** on the teacher dashboard
4. Now you can mark attendance via photo upload or camera

---

## 📖 Usage

### For Teachers
1. **Register Students** — Upload face photo during registration
2. **Retrain Model** — Click after adding new students
3. **Mark Attendance** — Upload group photo or use camera
4. **Verify** — Review bounding boxes, approve/reject detections
5. **Confirm** — Save verified attendance to database
6. **Export** — Download attendance as Excel

### For Students
1. **Dashboard** — View overall attendance % and subject breakdown
2. **My Attendance** — Detailed history with date/subject filters

---

## ⚙️ Configuration

All thresholds are in `backend/app/config.py`:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `RECOGNITION_DISTANCE_THRESHOLD` | 0.42 | Max face distance for a match (lower = stricter) |
| `RECOGNITION_HIGH_CONFIDENCE_THRESHOLD` | 0.35 | High-confidence match classification |
| `MIN_FACE_SIZE` | 80px | Minimum face bounding box dimension |
| `MIN_FACE_SHARPNESS` | 50.0 | Laplacian variance blur threshold |
| `MIN_BRIGHTNESS` / `MAX_BRIGHTNESS` | 40 / 220 | Acceptable brightness range |
| `ANTI_SPOOF_ENABLED` | true | LBP-based anti-spoofing check |
| `ENABLE_CLAHE` | true | Adaptive histogram equalization |

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register user (student/teacher) |
| POST | `/login` | Login, returns user data |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Dashboard statistics (role-based) |
| GET | `/profile` | Student profile with attendance summary |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/attendance/mark` | Upload photo → auto-recognize + save |
| POST | `/attendance/recognize` | Upload photo → return annotated image for verification |
| POST | `/attendance/confirm` | Confirm verified attendance records |
| GET | `/attendance/history` | Teacher: filtered attendance history |
| GET | `/attendance/export` | Download attendance as Excel (.xlsx) |
| GET | `/student/attendance` | Student: own attendance history |

### Subjects & Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subjects` | List subjects |
| POST | `/subjects` | Create subject |
| DELETE | `/subjects/<id>` | Delete subject |
| POST | `/teacher/register-student` | Register student with face photo |
| GET | `/teacher/students` | List all students |
| GET | `/students/search?q=` | Search students by name |
| POST | `/teacher/retrain` | Retrain face recognition model |

---

## 📁 Project Structure

```
face-recognition-attendance-manager/
├── backend/
│   ├── app/
│   │   ├── app.py              # Flask app + all routes
│   │   ├── config.py           # Centralized configuration
│   │   ├── Training_images/    # Registered student photos
│   │   ├── reference_encodings/# Face encoding .pkl files
│   │   ├── student_map.json    # Encoding → student mapping
│   │   └── utils/
│   │       ├── face_recognizer.py  # Recognition engine
│   │       └── face_quality.py     # Image quality validation
│   ├── train_model.py          # Batch training script
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css           # Design system
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx      # Responsive sidebar
│   │   │   ├── CameraCapture.jsx
│   │   │   ├── VerificationScreen.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── Toast.jsx
│   │   └── pages/
│   │       ├── LandingPage.jsx
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── TeacherDashboard.jsx
│   │       ├── StudentDashboard.jsx
│   │       ├── StudentAttendanceHistory.jsx
│   │       ├── MarkAttendance.jsx
│   │       ├── AttendanceHistory.jsx
│   │       ├── ManageSubjects.jsx
│   │       ├── TeacherRegisterStudent.jsx
│   │       └── NotFound.jsx
│   └── index.html
└── README.md
```

---

## 👨‍💻 Author

**Mohammad Sarfaraz Afzal**  
B.Tech Computer Science — Final Year Project

---

## 📄 License

This project is for academic purposes (B.Tech Final Year Project).
