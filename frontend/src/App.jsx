// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import StudentAttendanceHistory from './pages/StudentAttendanceHistory'
import MarkAttendance from './pages/MarkAttendance'
import AttendanceHistory from './pages/AttendanceHistory'
import TeacherRegisterStudent from './pages/TeacherRegisterStudent'
import ManageSubjects from './pages/ManageSubjects'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-subtle">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-200 border-t-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !localStorage.getItem("user_id")) {
    return <Navigate to="/login" />
  }

  if (role && user.role !== role) {
    return <Navigate to={`/${user.role}/dashboard`} />
  }

  return <Layout>{children}</Layout>
}


function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
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
            <Route path="/teacher/subjects" element={
              <ProtectedRoute role="teacher">
                <ManageSubjects />
              </ProtectedRoute>
            } />
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
            <Route path="/student/attendance" element={
              <ProtectedRoute role="student">
                <StudentAttendanceHistory />
              </ProtectedRoute>
            } />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
