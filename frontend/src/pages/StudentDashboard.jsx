// frontend/src/pages/StudentDashboard.jsx — Premium redesign
import { useState, useEffect } from "react";
import { GraduationCap, Building2, Calendar, BarChart3, CheckCircle2, BookOpen } from "lucide-react";
import UserAvatar from "../components/UserAvatar";

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
    <div className="flex items-center gap-4">
      <div className="skeleton w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-6 w-14" />
      </div>
    </div>
  </div>
);

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
      const response = await fetch(`http://${window.location.hostname}:5000/student/profile`, {
        headers: { "x-user-id": localStorage.getItem("user_id") },
      });
      const data = await response.json();
      if (response.ok) setStudentInfo(data);
    } catch (error) {
      console.error("Error fetching student info:", error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/dashboard/stats`, {
        headers: { "x-user-id": localStorage.getItem("user_id") },
      });
      const data = await response.json();
      if (response.ok) setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const overallPct = stats?.overall_percentage || 0;
  const pctColor = overallPct >= 75 ? "text-emerald-600" : overallPct >= 60 ? "text-amber-600" : "text-red-600";
  const pctBg = overallPct >= 75 ? "from-emerald-500 to-teal-500" : overallPct >= 60 ? "from-amber-500 to-orange-500" : "from-red-500 to-rose-500";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-500 mt-1">Your attendance overview</p>
      </div>

      {/* Profile Card */}
      {studentInfo && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <UserAvatar 
              name={studentInfo.name} 
              email={studentInfo.email}
              className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 shadow-lg border border-gray-100"
              fallbackClassName="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900">{studentInfo.name}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4" /> {studentInfo.roll_number}</span>
                <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {studentInfo.department}</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Semester {studentInfo.semester}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pctBg} flex items-center justify-center shadow-lg`}>
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Overall Attendance</p>
              <p className={`text-2xl font-bold ${pctColor}`}>{overallPct}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Attended</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.total_present || 0}
                <span className="text-base text-gray-400 font-normal"> / {stats?.total_classes || 0}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Subjects</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.subjects?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-wise Attendance */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-5">Subject-wise Attendance</h3>
        {stats?.subjects?.length > 0 ? (
          <div className="space-y-4">
            {stats.subjects.map((subject, index) => {
              const pct = subject.percentage;
              const barColor = pct >= 75 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
              const badgeBg = pct >= 75 ? "bg-emerald-100 text-emerald-700" : pct >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";

              return (
                <div key={index} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{subject.subject}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {subject.code} · {subject.present_classes}/{subject.total_classes} classes
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeBg}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${barColor} transition-all duration-700`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400 flex flex-col items-center">
            <BarChart3 className="w-10 h-10 mb-2 opacity-50" />
            <p>No attendance records yet</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-6 text-sm text-gray-500">
        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500 rounded-full" /> Good (75%+)</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-amber-500 rounded-full" /> Average (60-74%)</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500 rounded-full" /> Low (&lt;60%)</span>
      </div>
    </div>
  );
}
