// frontend/src/contexts/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // load stored session
    const storedUser = localStorage.getItem("user");
    const storedUserId = localStorage.getItem("user_id");

    if (storedUser && storedUserId) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("user_id");
      }
    }

    setLoading(false);
  }, []);

  const login = (userId, userData) => {
    console.log("🔐 Login called");
    console.log("Received user_id:", userId);
    console.log("User data:", userData);

    // store in localStorage
    localStorage.setItem("user_id", userId);
    localStorage.setItem("user", JSON.stringify(userData));

    setUser(userData);
  };

  const logout = () => {
    console.log("🚪 Logging out...");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
