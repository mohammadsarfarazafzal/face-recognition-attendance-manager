// frontend/src/pages/StudentAttendanceHistory.jsx
import { useState, useEffect } from "react";
import { ClipboardList } from "lucide-react";

export default function StudentAttendanceHistory() {
  const [records, setRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filters, setFilters] = useState({ subject: "", date_from: "", date_to: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
    fetchAttendance();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/subjects`, {
        headers: { "x-user-id": localStorage.getItem("user_id") },
      });
      const data = await res.json();
      if (res.ok) setSubjects(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(
        `http://${window.location.hostname}:5000/student/attendance?${params}`,
        { headers: { "x-user-id": localStorage.getItem("user_id") } }
      );
      const data = await res.json();
      if (res.ok) setRecords(data.records || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-sm bg-white transition-all";

  // Group records by date for a timeline view
  const groupedByDate = records.reduce((acc, r) => {
    if (!acc[r.date]) acc[r.date] = [];
    acc[r.date].push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          My Attendance
        </h1>
        <p className="text-gray-500 mt-1">
          View your detailed attendance records
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Subject
            </label>
            <select
              name="subject"
              value={filters.subject}
              onChange={handleFilterChange}
              className={inputClass}
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              From
            </label>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              To
            </label>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className={inputClass}
            />
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

      {/* Summary Bar */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{records.length}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Total Records
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {records.filter((r) => r.status === "present").length}
            </p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Present</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">
              {new Set(records.map((r) => r.subject_code)).size}
            </p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Subjects
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">
              {records.reduce((sum, r) => sum + r.marks, 0)}
            </p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Total Marks
            </p>
          </div>
        </div>
      )}

      {/* Timeline View */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : Object.keys(groupedByDate).length > 0 ? (
          <div className="divide-y divide-gray-50">
            {Object.entries(groupedByDate).map(([date, items]) => (
              <div key={date} className="p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                    {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-xs text-gray-400">
                    {items.length} class{items.length > 1 ? "es" : ""}
                  </span>
                </div>
                <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-indigo-100">
                  {items.map((record, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            record.status === "present"
                              ? "bg-emerald-500"
                              : "bg-red-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {record.subject}
                          </p>
                          <p className="text-xs text-gray-500">
                            {record.subject_code}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-700">
                          {record.marks} marks
                        </span>
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                            record.status === "present"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="flex justify-center"><ClipboardList className="w-10 h-10 mb-2 opacity-50" /></div>
            <p className="font-medium">No attendance records found</p>
            <p className="text-sm mt-1">
              Your attendance will appear here once marked
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
