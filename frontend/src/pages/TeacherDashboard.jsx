// frontend/src/pages/TeacherDashboard.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function TeacherDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  // TeacherDashboard.jsx  (fixed)

useEffect(() => {
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("http://localhost:5000/dashboard/stats", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "user_id": localStorage.getItem("user_id")   // 🔥 REQUIRED
        }
      });

      const data = await response.json();
      console.log("Dashboard stats:", data);

      if (response.ok) {
        setStats(data);
      } else {
        console.error("Dashboard API error:", data.error);
      }
    } catch (err) {
      console.error("Network error:", err);
    }
  };

  fetchDashboardStats();
}, []);



  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-blue-600 text-xl">📚</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.total_classes || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-green-600 text-xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.total_students || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <span className="text-purple-600 text-xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Today</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.recent_attendance?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link 
          to="/teacher/attendance/mark"
          className="bg-white p-6 rounded-lg shadow-md border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors text-center"
        >
          <div className="text-4xl mb-4">📸</div>
          <h3 className="text-lg font-semibold mb-2">Mark Attendance</h3>
          <p className="text-gray-600">Take a class photo and mark attendance automatically</p>
        </Link>

        <Link 
          to="/teacher/attendance/history"
          className="bg-white p-6 rounded-lg shadow-md border-2 border-dashed border-gray-300 hover:border-green-500 transition-colors text-center"
        >
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">View History</h3>
          <p className="text-gray-600">Check attendance records and export reports</p>
        </Link>
      </div>

      {/* Recent Activity */}
      {stats?.recent_attendance && stats.recent_attendance.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Attendance</h3>
          <div className="space-y-3">
            {stats.recent_attendance.map((record, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{record.student}</p>
                  <p className="text-sm text-gray-600">{record.subject} • {record.date}</p>
                </div>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  {record.marks} marks
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}