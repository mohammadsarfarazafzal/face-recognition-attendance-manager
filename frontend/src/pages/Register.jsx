// frontend/src/pages/Register.jsx — Premium dark auth
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { GraduationCap, School, Hand } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", role: "student",
    roll_number: "", employee_id: "", department: "Computer Science", semester: 1,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (data.message === "Registered") {
        navigate("/login");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm";

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center px-4 py-12">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Hand className="text-white w-5 h-5" />
            </div>
            <span className="text-white font-bold text-xl">
              Auto<span className="text-indigo-400">Attend</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 text-sm mt-1">
            Join as a student or teacher
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input id="reg-name" name="name" type="text" required value={formData.name} onChange={handleChange} className={inputClass} placeholder="John Doe" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input id="reg-email" name="email" type="email" required value={formData.email} onChange={handleChange} className={inputClass} placeholder="you@example.com" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input id="reg-password" name="password" type="password" required value={formData.password} onChange={handleChange} className={inputClass} placeholder="••••••••" />
            </div>

            {/* Role Toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">I am a</label>
              <div className="flex rounded-xl overflow-hidden border border-white/10">
                {["student", "teacher"].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, role }))}
                    className={`flex-1 py-2.5 text-sm font-medium capitalize transition-all ${
                      formData.role === role
                        ? "bg-indigo-600 text-white"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {role === "student" ? <GraduationCap className="w-4 h-4 inline-block mr-1 align-text-bottom" /> : <School className="w-4 h-4 inline-block mr-1 align-text-bottom" />}{role}
                  </button>
                ))}
              </div>
            </div>

            {/* Role-specific fields */}
            {formData.role === "student" ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Roll Number</label>
                  <input name="roll_number" type="text" required value={formData.roll_number} onChange={handleChange} className={inputClass} placeholder="CS2024001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Semester</label>
                  <select name="semester" value={formData.semester} onChange={handleChange} className={inputClass}>
                    {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s} className="bg-slate-800">Semester {s}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Employee ID</label>
                <input name="employee_id" type="text" required value={formData.employee_id} onChange={handleChange} className={inputClass} placeholder="EMP001" />
              </div>
            )}

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Department</label>
              <input name="department" type="text" required value={formData.department} onChange={handleChange} className={inputClass} />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Creating account...
                </span>
              ) : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
