// frontend/src/pages/TeacherRegisterStudent.jsx — Premium redesign
import { useState } from "react";
import { User, AlertTriangle } from "lucide-react";

export default function TeacherRegisterStudent() {
  const [formData, setFormData] = useState({
    name: "", email: "", roll_number: "",
    department: "Computer Science", semester: 1, academic_year: "2024-2025",
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [message, setMessage] = useState("");
  const [qualityIssues, setQualityIssues] = useState([]);
  const [qualityWarnings, setQualityWarnings] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) return setMessage("Please upload a student photo");

    setLoading(true);
    setMessage("");
    setQualityIssues([]);
    setQualityWarnings([]);

    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      fd.append("photo", photo);

      const response = await fetch(
        `http://${window.location.hostname}:5000/teacher/register-student-with-photo`,
        {
          method: "POST",
          headers: { "x-user-id": localStorage.getItem("user_id") },
          body: fd,
        }
      );
      const data = await response.json();

      if (response.ok) {
        setMessage(`Student ${formData.name} registered successfully!`);
        if (data.quality_warnings) setQualityWarnings(data.quality_warnings);
        // Reset form
        setFormData({ name: "", email: "", roll_number: "", department: "Computer Science", semester: 1, academic_year: "2024-2025" });
        setPhoto(null);
        setPhotoPreview("");
      } else {
        setMessage("Error: " + data.error);
        if (data.quality_issues) setQualityIssues(data.quality_issues);
        if (data.quality_warnings) setQualityWarnings(data.quality_warnings);
      }
    } catch {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-sm bg-white transition-all";

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Register Student</h1>
        <p className="text-gray-500 mt-1">Add a new student with their face photo for recognition</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Student Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Roll Number *</label>
              <input type="text" name="roll_number" value={formData.roll_number} onChange={handleChange} required className={inputClass} placeholder="CS2024001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Department *</label>
              <select name="department" value={formData.department} onChange={handleChange} className={inputClass}>
                {["Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Electronics"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Semester *</label>
              <select name="semester" value={formData.semester} onChange={handleChange} className={inputClass}>
                {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Year</label>
              <input type="text" name="academic_year" value={formData.academic_year} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student Photo *</label>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {photoPreview ? (
                  <img className="h-24 w-24 rounded-2xl object-cover border-2 border-indigo-200 shadow-sm" src={photoPreview} alt="Preview" />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  id="student-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  required
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer file:transition-colors"
                />
                <p className="text-xs text-gray-400 mt-2">Clear frontal face photo required. System validates quality automatically.</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className={`p-4 rounded-xl text-sm ${
              message.includes("successfully")
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {message}
            </div>
          )}

          {qualityIssues.length > 0 && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="font-medium text-red-800 text-sm mb-2">Photo Quality Issues:</p>
              <ul className="text-sm text-red-700 space-y-1">
                {qualityIssues.map((issue, i) => <li key={i}>• {issue}</li>)}
              </ul>
            </div>
          )}

          {qualityWarnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="font-medium text-amber-800 text-sm mb-2">Warnings:</p>
              <ul className="text-sm text-amber-700 space-y-1">
                {qualityWarnings.map((w, i) => <li key={i}><AlertTriangle className="w-4 h-4 inline-block mr-1 align-text-bottom" /> {w}</li>)}
              </ul>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Registering...
              </span>
            ) : "Register Student"}
          </button>
        </form>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
        <h3 className="font-semibold text-indigo-800 text-sm mb-2">How it works</h3>
        <ul className="text-sm text-indigo-700 space-y-1.5">
          <li className="flex items-start gap-2"><span className="text-indigo-400">•</span> Photo is validated for quality (blur, brightness, face detection)</li>
          <li className="flex items-start gap-2"><span className="text-indigo-400">•</span> Face encoding is generated and stored for recognition</li>
          <li className="flex items-start gap-2"><span className="text-indigo-400">•</span> Training image is saved — retrain model to include in recognition</li>
          <li className="flex items-start gap-2"><span className="text-indigo-400">•</span> Default password is <code className="bg-indigo-100 px-1.5 py-0.5 rounded text-xs">123456</code></li>
        </ul>
      </div>
    </div>
  );
}
