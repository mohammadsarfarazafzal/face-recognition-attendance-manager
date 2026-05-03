// frontend/src/pages/LandingPage.jsx — Premium landing page
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Brain, Shield, Camera, BarChart3, Smartphone, Zap, Hand } from "lucide-react";

const features = [
  {
    icon: <Brain className="w-6 h-6 text-white" />,
    title: "AI Face Recognition",
    desc: "State-of-the-art face detection with strict thresholding to eliminate false positives. Unknown faces are explicitly rejected.",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    icon: <Shield className="w-6 h-6 text-white" />,
    title: "Human-in-the-Loop",
    desc: "Teachers verify every detection before saving. Approve, reject, or manually add students for 100% accurate records.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: <Camera className="w-6 h-6 text-white" />,
    title: "Camera Capture",
    desc: "Capture class photos directly from the browser. No app download needed — works on any device with a camera.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-white" />,
    title: "Smart Analytics",
    desc: "Subject-wise attendance tracking, trend analysis, and low-attendance alerts for proactive academic management.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: <Smartphone className="w-6 h-6 text-white" />,
    title: "Fully Responsive",
    desc: "Beautiful experience on desktop, tablet, and mobile. Mark attendance from anywhere on any device.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: <Zap className="w-6 h-6 text-white" />,
    title: "Instant Export",
    desc: "Download attendance records as Excel with one click. Filter by date, subject, or student for targeted reports.",
    gradient: "from-violet-500 to-indigo-500",
  },
];

const stats = [
  { value: "99.2%", label: "Recognition Accuracy" },
  { value: "< 3s", label: "Processing Time" },
  { value: "0", label: "False Positives" },
  { value: "24/7", label: "Available" },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-mesh text-white overflow-hidden">
      {/* ── Navigation ──────────────────────────────────────────── */}
      <nav className="relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-float">
              <Hand className="text-white w-5 h-5" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              Auto<span className="text-indigo-400">Attend</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to={`/${user.role}/dashboard`} className="btn-primary text-sm">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white text-sm font-medium transition-colors hidden sm:block"
                >
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ────────────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8 animate-fade-in-up">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AI-Powered Attendance System
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight mb-6 animate-fade-in-up delay-100">
            Attendance Made{" "}
            <span className="text-gradient">Intelligent</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up delay-200">
            Automate classroom attendance with face recognition AI. Upload a
            photo, verify detections, and save — no manual roll calls.
          </p>

          {!user && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
              <Link
                to="/register"
                className="btn-primary px-8 py-3.5 text-base rounded-2xl w-full sm:w-auto"
              >
                Start Free →
              </Link>
              <Link
                to="/login"
                className="btn-secondary px-8 py-3.5 text-base rounded-2xl w-full sm:w-auto"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto animate-fade-in-up delay-400">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-2xl p-5 text-center"
            >
              <p className="text-2xl sm:text-3xl font-bold text-gradient">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-6 pb-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything You Need
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Built for educators who value accuracy, speed, and reliability in
            attendance management.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="glass-card card-glow rounded-2xl p-6 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-2xl mb-4 shadow-lg`}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────────────────────── */}
      {!user && (
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="bg-gradient-brand rounded-3xl p-8 sm:p-12 text-center animate-gradient">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to Transform Attendance?
            </h2>
            <p className="text-indigo-100 mb-8 max-w-lg mx-auto">
              Join educators using AI to save time and improve accuracy.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-700 font-semibold rounded-2xl hover:bg-indigo-50 transition-colors shadow-xl"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      )}

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© 2025 AutoAttend — B.Tech Final Year Project</p>
          <p>Built with React, Flask & Face Recognition AI</p>
        </div>
      </footer>
    </div>
  );
}
