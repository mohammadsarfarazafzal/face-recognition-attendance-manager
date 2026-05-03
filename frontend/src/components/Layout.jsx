// frontend/src/components/Layout.jsx — Premium responsive layout
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { BarChart3, Camera, ClipboardList, BookOpen, UserPlus, Hand } from "lucide-react";
import UserAvatar from "./UserAvatar";

const teacherLinks = [
  { to: "/teacher/dashboard", label: "Dashboard", icon: <BarChart3 className="w-5 h-5" /> },
  { to: "/teacher/attendance/mark", label: "Mark Attendance", icon: <Camera className="w-5 h-5" /> },
  { to: "/teacher/attendance/history", label: "History", icon: <ClipboardList className="w-5 h-5" /> },
  { to: "/teacher/subjects", label: "Subjects", icon: <BookOpen className="w-5 h-5" /> },
  { to: "/teacher/register-student", label: "Register Student", icon: <UserPlus className="w-5 h-5" /> },
];

const studentLinks = [
  { to: "/student/dashboard", label: "Dashboard", icon: <BarChart3 className="w-5 h-5" /> },
  { to: "/student/attendance", label: "My Attendance", icon: <ClipboardList className="w-5 h-5" /> },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const links = user?.role === "teacher" ? teacherLinks : studentLinks;

  const NavLink = ({ to, label, icon }) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          active
            ? "bg-indigo-600/20 text-indigo-300 shadow-lg shadow-indigo-500/10"
            : "text-slate-400 hover:text-white hover:bg-white/5"
        }`}
      >
        <span className="text-lg">{icon}</span>
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex">
      {/* ── Sidebar (Desktop) ──────────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-mesh fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Hand className="text-white w-5 h-5" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Auto<span className="text-indigo-400">Attend</span>
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink key={link.to} {...link} />
          ))}
        </nav>

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <UserAvatar 
              name={user?.name} 
              email={user?.email}
              className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-white/10 shadow-lg"
              fallbackClassName="w-9 h-9 bg-indigo-600/30 rounded-full flex items-center justify-center text-indigo-300 font-semibold text-sm flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {user?.name}
              </p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 text-sm font-medium transition-all"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile Header ──────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 bg-mesh border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <Hand className="text-white w-4 h-4" />
            </div>
            <span className="text-white font-bold text-base">
              Auto<span className="text-indigo-400">Attend</span>
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileOpen && (
          <div className="px-3 pb-4 space-y-1 animate-fade-in border-t border-white/5 pt-2">
            {links.map((link) => (
              <NavLink key={link.to} {...link} />
            ))}
            <div className="pt-3 mt-2 border-t border-white/10">
              <div className="flex items-center gap-3 px-4 py-2">
                <UserAvatar 
                  name={user?.name} 
                  email={user?.email}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/10 shadow-lg"
                  fallbackClassName="w-8 h-8 bg-indigo-600/30 rounded-full flex items-center justify-center text-indigo-300 font-semibold text-xs flex-shrink-0"
                />
                <span className="text-sm text-white">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full mt-1 px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Main Content ───────────────────────────────────────── */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}
