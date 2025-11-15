// frontend/src/pages/StudentDashboard.jsx - Enhanced
import { useState, useEffect } from "react";

export default function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentInfo();
    fetchDashboardStats();
  }, []);

  const fetchStudentInfo = async () => {
    try {
      const response = await fetch("http://localhost:5000/student/profile", {
        headers: {
          "x-user-id": localStorage.getItem("user_id"),
        },
      });
      const data = await response.json();
      if (response.ok) {
        setStudentInfo(data);
      }
    } catch (error) {
      console.error("Error fetching student info:", error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("http://localhost:5000/dashboard/stats", {
        headers: {
          "x-user-id": localStorage.getItem("user_id"),
        },
      });
      const data = await response.json();
      console.log(data);
      
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600">Your attendance overview and statistics</p>
        {studentInfo && (
          <div className="mt-2 bg-blue-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-semibold">Name:</span> {studentInfo.name}
              </div>
              <div>
                <span className="font-semibold">Roll No:</span>{" "}
                {studentInfo.roll_number}
              </div>
              <div>
                <span className="font-semibold">Department:</span>{" "}
                {studentInfo.department}
              </div>
              <div>
                <span className="font-semibold">Semester:</span>{" "}
                {studentInfo.semester}
              </div>
            </div>
          </div>
        )}
      </div>
      <div>
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Overall Attendance
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.overall_percentage || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Classes Attended
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.total_present || 0} / {stats?.total_classes || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <span className="text-purple-600 text-xl">📚</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Subjects
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.subjects?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subject-wise Attendance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">
            Subject-wise Attendance
          </h3>

          {stats?.subjects && stats.subjects.length > 0 ? (
            <div className="space-y-4">
              {stats.subjects.map((subject, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {subject.subject}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        subject.percentage >= 75
                          ? "bg-green-100 text-green-800"
                          : subject.percentage >= 60
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {subject.percentage}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Classes attended: {subject.present_classes} /{" "}
                      {subject.total_classes}
                    </span>
                    <span>Code: {subject.code}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        subject.percentage >= 75
                          ? "bg-green-500"
                          : subject.percentage >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <p>No attendance records found</p>
              <p className="text-sm">
                Your attendance will appear here once marked by teachers
              </p>
            </div>
          )}
        </div>

        {/* Attendance Status Legend */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Good (75% and above)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Average (60% - 74%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Needs Improvement (Below 60%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
