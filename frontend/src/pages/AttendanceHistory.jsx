// frontend/src/pages/AttendanceHistory.jsx — Premium redesign
import { useState, useEffect } from "react";
import { Download, ClipboardList } from "lucide-react";

const StudentAvatar = ({ name, email }) => {
  const [error, setError] = useState(false);
  
  // if (error || !email) {
  //   return (
  //     <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
  //       {name?.charAt(0)?.toUpperCase()}
  //     </div>
  //   );
  // }

  return (
    <img 
      src={`http://${window.location.hostname}:5000/student/${email}/photo`} 
      alt={name} 
      className="w-7 h-7 rounded-full object-cover flex-shrink-0 border border-gray-200"
      onError={() => setError(true)}
    />
  );
};

export default function AttendanceHistory() {
  const [attendance, setAttendance] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({ subject: "", date_from: "", date_to: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
    fetchAttendance();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/subjects`, {
        headers: { "x-user-id": localStorage.getItem("user_id") },
      });
      const data = await response.json();
      if (response.ok) setSubjects(data);
    } catch (e) { console.error(e); }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(
        `http://${window.location.hostname}:5000/attendance/history?${params}`,
        { headers: { "x-user-id": localStorage.getItem("user_id") } }
      );
      const data = await response.json();
      if (response.ok) setAttendance(data.records);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(
        `http://${window.location.hostname}:5000/attendance/export?${params}`,
        { headers: { "x-user-id": localStorage.getItem("user_id") } }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "attendance_export.xlsx";
        a.click();
      }
    } catch (e) { console.error(e); }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-sm bg-white transition-all";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Attendance History</h1>
          <p className="text-gray-500 mt-1">View and export attendance records</p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          <Download className="w-4 h-4 inline-block mr-1" /> Export Excel
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
            <select name="subject" value={filters.subject} onChange={handleFilterChange} className={inputClass}>
              <option value="">All Subjects</option>
              {subjects.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">From</label>
            <input type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">To</label>
            <input type="date" name="date_to" value={filters.date_to} onChange={handleFilterChange} className={inputClass} />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchAttendance}
              disabled={loading}
              className="w-full btn-primary py-2.5 text-sm rounded-xl disabled:opacity-50"
            >
              {loading ? "Loading..." : "Apply Filters"}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Date", "Subject", "Student", "Roll", "Marks", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {attendance.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-gray-900 font-medium whitespace-nowrap">{record.date}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                    {record.subject}
                    <span className="text-gray-400 ml-1">({record.subject_code})</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <StudentAvatar name={record.student} email={record.email} />
                      <span className="text-sm text-gray-900">{record.student}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">{record.roll}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-900 font-medium whitespace-nowrap">{record.marks}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      record.status === "present"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {attendance.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400">
            <div className="flex justify-center"><ClipboardList className="w-10 h-10 mb-2 opacity-50" /></div>
            <p className="font-medium">No attendance records found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}

        {loading && (
          <div className="p-8 space-y-3">
            {[1,2,3,4].map((i) => <div key={i} className="skeleton h-12 w-full rounded-xl" />)}
          </div>
        )}
      </div>
    </div>
  );
}
