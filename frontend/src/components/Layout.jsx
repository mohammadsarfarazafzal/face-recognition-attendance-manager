// frontend/src/components/Layout.jsx - UPDATED
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">AutoAttend</span>
              </Link>
              
              <div className="hidden md:ml-6 md:flex md:space-x-4">
                {user?.role === 'teacher' && (
                  <>
                    <Link to="/teacher/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600">
                      Dashboard
                    </Link>
                    <Link to="/teacher/attendance/mark" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600">
                      Mark Attendance
                    </Link>
                    <Link to="/teacher/attendance/history" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600">
                      History
                    </Link>
                    {/* ADD THIS LINK */}
                    <Link to="/teacher/register-student" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600">
                      Register Student
                    </Link>
                  </>
                )}
                {user?.role === 'student' && (
                  <Link to="/student/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600">
                    Dashboard
                  </Link>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-md text-sm font-medium text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}