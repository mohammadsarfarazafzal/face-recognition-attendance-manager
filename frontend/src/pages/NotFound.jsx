// frontend/src/pages/NotFound.jsx — Custom 404 page
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center px-4">
      <div className="text-center animate-fade-in-up max-w-md">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <span className="text-[8rem] sm:text-[10rem] font-black leading-none bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent select-none">
            404
          </span>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-3xl -z-10 animate-float" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Looks like this page doesn't exist or has been moved.
          <br />
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="btn-primary px-6 py-2.5 text-sm rounded-xl w-full sm:w-auto"
          >
            ← Back to Home
          </Link>
          <Link
            to="/login"
            className="px-6 py-2.5 text-sm rounded-xl border border-slate-600 text-slate-300 hover:bg-white/5 transition-all w-full sm:w-auto text-center"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
