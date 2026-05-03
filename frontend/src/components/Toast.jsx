// frontend/src/components/Toast.jsx — Lightweight notification system (zero dependencies)
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { Check, X, Info, AlertTriangle } from "lucide-react";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onRemove, 300);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, []);

  const icons = {
    success: <Check className="w-3 h-3" />,
    error: <X className="w-3 h-3" />,
    info: <Info className="w-3 h-3" />,
    warning: <AlertTriangle className="w-3 h-3" />,
  };

  const colors = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
  };

  const iconColors = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-amber-500",
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg max-w-sm transition-all duration-300 ${
        colors[toast.type] || colors.info
      } ${exiting ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"}`}
      style={{ animation: "fadeInUp 0.3s ease-out" }}
    >
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 ${
          iconColors[toast.type] || iconColors.info
        }`}
      >
        {icons[toast.type] || icons.info}
      </span>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-sm font-semibold mb-0.5">{toast.title}</p>
        )}
        <p className="text-sm opacity-90">{toast.message}</p>
      </div>
      <button
        onClick={() => {
          setExiting(true);
          setTimeout(onRemove, 300);
        }}
        className="text-current opacity-40 hover:opacity-70 text-lg leading-none flex-shrink-0"
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, title, duration) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message, title, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    {
      success: (msg, title) => addToast("success", msg, title),
      error: (msg, title) => addToast("error", msg, title),
      info: (msg, title) => addToast("info", msg, title),
      warning: (msg, title) => addToast("warning", msg, title),
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container — fixed top-right */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-auto">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
