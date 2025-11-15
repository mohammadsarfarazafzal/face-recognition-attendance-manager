// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import MarkAttendance from './pages/MarkAttendance'
import AttendanceHistory from './pages/AttendanceHistory'
import TeacherRegisterStudent from './pages/TeacherRegisterStudent' // ADD THIS IMPORT
import Layout from './components/Layout'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  // Still loading user from localStorage → don't redirect yet
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is missing (not logged in)
  if (!user || !localStorage.getItem("user_id")) {
    return <Navigate to="/login" />
  }

  // Role mismatch → redirect to their own dashboard
  if (role && user.role !== role) {
    return <Navigate to={`/${user.role}/dashboard`} />
  }

  return <Layout>{children}</Layout>
}


function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Teacher Routes */}
        <Route path="/teacher/dashboard" element={
          <ProtectedRoute role="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        <Route path="/teacher/attendance/mark" element={
          <ProtectedRoute role="teacher">
            <MarkAttendance />
          </ProtectedRoute>
        } />
        <Route path="/teacher/attendance/history" element={
          <ProtectedRoute role="teacher">
            <AttendanceHistory />
          </ProtectedRoute>
        } />
        {/* ADD THIS NEW ROUTE */}
        <Route path="/teacher/register-student" element={
          <ProtectedRoute role="teacher">
            <TeacherRegisterStudent />
          </ProtectedRoute>
        } />
        
        {/* Student Routes */}
        <Route path="/student/dashboard" element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AuthProvider>
  )
}

export default App