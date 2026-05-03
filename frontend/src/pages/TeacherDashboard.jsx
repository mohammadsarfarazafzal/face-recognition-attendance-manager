// frontend/src/pages/TeacherDashboard.jsx — Premium redesign
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, Zap, Camera, BarChart3, UserPlus, Brain, ClipboardList } from "lucide-react";

const StudentAvatar = ({ name, email }) => {
  const [error, setError] = useState(false);
  
  if (error || !email) {
    return (
      <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-sm font-bold flex-shrink-0">
        {name?.charAt(0)?.toUpperCase()}
      </div>
    );
  }

  return (
    <img 
      src={`http://${window.location.hostname}:5000/student/${email}/photo`} 
      alt={name} 
      className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200"
      onError={() => setError(true)}
    />
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center gap-4">
      <div className="skeleton w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-20" />
        <div className="skeleton h-6 w-12" />
      </div>
    </div>
  </div>
);

export default function TeacherDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainMsg, setRetrainMsg] = useState("");

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch(`http://${window.location.hostname}:5000/dashboard/stats`, {
          method: "GET",
          headers: { "x-user-id": localStorage.getItem("user_id") },
        });
        const data = await response.json();
        if (response.ok) setStats(data);
      } catch (err) {
        console.error("Network error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainMsg("");
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/teacher/retrain`, {
        method: "POST",
        headers: { "x-user-id": localStorage.getItem("user_id") },
      });
      const data = await res.json();
      setRetrainMsg(res.ok ? "✅ " + data.message : "❌ " + (data.error || "Failed"));
    } catch {
      setRetrainMsg("❌ Network error");
    } finally {
      setRetraining(false);
    }
  };

  const statCards = [
    {
      label: "Total Classes",
      value: stats?.total_classes || 0,
      icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
      gradient: "from-indigo-500 to-blue-500",
      bg: "bg-indigo-50",
    },
    {
      label: "Total Students",
      value: stats?.total_students || 0,
      icon: <Users className="w-6 h-6 text-emerald-600" />,
      gradient: "from-emerald-500 to-teal-500",
      bg: "bg-emerald-50",
    },
    {
      label: "Recent Activity",
      value: stats?.recent_attendance?.length || 0,
      icon: <Zap className="w-6 h-6 text-amber-600" />,
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Teacher Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's your overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading
          ? [1, 2, 3].map((i) => <SkeletonCard key={i} />)
          : statCards.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-2xl shadow-lg`}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      {card.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/teacher/attendance/mark"
          className="group bg-white rounded-2xl shadow-sm p-6 border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:shadow-md transition-all text-center flex flex-col items-center"
        >
          <div className="mb-3 group-hover:scale-110 transition-transform"><Camera className="w-10 h-10 text-indigo-500" /></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Mark Attendance</h3>
          <p className="text-sm text-gray-500">Upload or capture a class photo</p>
        </Link>

        <Link
          to="/teacher/attendance/history"
          className="group bg-white rounded-2xl shadow-sm p-6 border-2 border-dashed border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all text-center flex flex-col items-center"
        >
          <div className="mb-3 group-hover:scale-110 transition-transform"><BarChart3 className="w-10 h-10 text-emerald-500" /></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">View History</h3>
          <p className="text-sm text-gray-500">Records and export</p>
        </Link>

        <Link
          to="/teacher/subjects"
          className="group bg-white rounded-2xl shadow-sm p-6 border-2 border-dashed border-gray-200 hover:border-cyan-400 hover:shadow-md transition-all text-center flex flex-col items-center"
        >
          <div className="mb-3 group-hover:scale-110 transition-transform"><BookOpen className="w-10 h-10 text-cyan-500" /></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Subjects</h3>
          <p className="text-sm text-gray-500">Create & manage courses</p>
        </Link>

        <Link
          to="/teacher/register-student"
          className="group bg-white rounded-2xl shadow-sm p-6 border-2 border-dashed border-gray-200 hover:border-purple-400 hover:shadow-md transition-all text-center flex flex-col items-center"
        >
          <div className="mb-3 group-hover:scale-110 transition-transform"><UserPlus className="w-10 h-10 text-purple-500" /></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Register Student</h3>
          <p className="text-sm text-gray-500">Add with face photo</p>
        </Link>
      </div>

      {/* Retrain + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Retrain Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Model Training</h3>
          <p className="text-sm text-gray-500 mb-4">
            Retrain the face recognition model after registering new students.
          </p>
          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="w-full btn-primary py-2.5 text-sm rounded-xl disabled:opacity-50"
          >
            {retraining ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Training...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Brain className="w-5 h-5" /> Retrain Model
              </span>
            )}
          </button>
          {retrainMsg && (
            <p className="text-sm mt-3 text-gray-600">{retrainMsg}</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Attendance
          </h3>
          {stats?.recent_attendance?.length > 0 ? (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {stats.recent_attendance.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <StudentAvatar name={record.student} email={record.email} />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {record.student}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record.subject} · {record.date}
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    {record.marks} marks
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 flex flex-col items-center">
              <ClipboardList className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
