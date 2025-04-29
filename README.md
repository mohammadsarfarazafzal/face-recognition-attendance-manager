# Attendance Management System using Face Recognition

## Project Overview
An advanced attendance management system that uses facial recognition technology to automate student attendance tracking. The system can detect and recognize multiple faces in a single image, making it efficient for classroom environments.

## Key Features
- Face detection and recognition using modern computer vision techniques
- Real-time processing of uploaded images
- Multi-face detection in a single image
- Confidence score for each recognition
- Modern web interface with real-time updates
- Student presence/absence tracking
- Automated roll number mapping

## Technology Stack
### Frontend
- React 19.1
- Vite 6.1
- TailwindCSS 4.0
- Modern ES6+ JavaScript

### Backend
- Python 3.x
- Flask 3.0.2
- face-recognition 1.3.0
- OpenCV 4.9.0
- NumPy 1.26.4

## System Architecture
The system follows a client-server architecture:

1. **Frontend (Client)**
   - Modern React-based SPA
   - Responsive UI using TailwindCSS
   - Real-time state management
   - Image upload handling
   - Results display

2. **Backend (Server)**
   - RESTful API using Flask
   - Face recognition processing
   - Student data management
   - Image processing using OpenCV
   - Face encoding storage and retrieval

## Installation & Setup
### Prerequisites
- Python 3.x
- Node.js 16+
- npm/yarn

### Backend Setup
1. Navigate to backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the Flask server:
```bash
python -m app.app
```

### Frontend Setup
1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

## Usage
1. Start both backend and frontend servers
2. Access the web interface at http://localhost:5173
3. Upload an image containing student faces
4. View recognition results and attendance status

## System Features
### Face Recognition
- Uses face_recognition library for accurate detection
- Supports multiple face detection
- Provides confidence scores for matches
- Handles various image formats (JPEG, PNG)

### Attendance Tracking
- Real-time attendance updates
- Student presence visualization
- Roll number mapping
- Status tracking (Detected/Not Detected)

### User Interface
- Clean, modern design
- Responsive layout
- Real-time feedback
- Error handling
- Loading states

## Performance & Scalability
- Efficient face encoding storage
- Optimized image processing
- Supports multiple simultaneous users
- Scalable architecture

## Security Features
- Secure file upload handling
- Input validation
- Error handling
- Cross-Origin Resource Sharing (CORS) configuration

## Future Enhancements
- Add authentication system
- Implement attendance history
- Export attendance reports
- Add mobile responsiveness
- Attendance statistics and analytics

## License
This project is licensed under the MIT License - see the LICENSE file for details.
