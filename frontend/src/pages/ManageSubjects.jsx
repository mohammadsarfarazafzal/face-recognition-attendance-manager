// frontend/src/pages/ManageSubjects.jsx — Subject CRUD
import { useState, useEffect } from "react";
import { Plus, X, BookOpen } from "lucide-react";

export default function ManageSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "", code: "", credits: 3, department: "Computer Science", semester: 1,
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubjects();
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
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch(`http://${window.location.hostname}:5000/subjects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("user_id"),
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setFormData({ name: "", code: "", credits: 3, department: "Computer Science", semester: 1 });
        setShowForm(false);
        fetchSubjects();
      } else {
        setMessage("Error: " + (data.error || "Failed to create subject"));
      }
    } catch {
      setMessage("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete subject "${name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`http://${window.location.hostname}:5000/subjects/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": localStorage.getItem("user_id") },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        fetchSubjects();
      } else {
        setMessage("Error: " + (data.error || "Failed to delete"));
      }
    } catch {
      setMessage("Network error");
    }
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-sm bg-white transition-all";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manage Subjects</h1>
          <p className="text-gray-500 mt-1">Create and manage your course subjects</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            showForm
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "btn-primary"
          }`}
        >
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Subject</>}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-fade-in-up">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Subject</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} placeholder="Data Structures" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject Code *</label>
                <input type="text" name="code" value={formData.code} onChange={handleChange} required className={inputClass} placeholder="CS301" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Credits</label>
                <input type="number" name="credits" value={formData.credits} onChange={handleChange} min="1" max="6" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Semester</label>
                <select name="semester" value={formData.semester} onChange={handleChange} className={inputClass}>
                  {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
              <select name="department" value={formData.department} onChange={handleChange} className={inputClass}>
                {["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Electronics"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary py-2.5 px-6 text-sm rounded-xl disabled:opacity-50">
              {submitting ? "Creating..." : "Create Subject"}
            </button>
          </form>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-xl text-sm ${
          message.startsWith("Error")
            ? "bg-red-50 text-red-700 border border-red-200"
            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
        }`}>
          {message}
        </div>
      )}

      {/* Subjects List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map((i) => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
          </div>
        ) : subjects.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {subject.code?.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{subject.name}</h4>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-500">
                      <span className="font-medium text-indigo-600">{subject.code}</span>
                      <span>{subject.credits} credits</span>
                      <span>{subject.department}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(subject.id, subject.name)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                  title="Delete subject"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <div className="flex justify-center"><BookOpen className="w-12 h-12 mb-3 opacity-50" /></div>
            <p className="font-medium">No subjects yet</p>
            <p className="text-sm mt-1">Create your first subject to start marking attendance</p>
          </div>
        )}
      </div>
    </div>
  );
}
