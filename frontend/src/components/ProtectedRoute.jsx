import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles = [] }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-sky-50">
        <div className="text-center">
          <div className="text-lg font-semibold text-sky-700 mb-2">Redirecting to login…</div>
          <Navigate to="/login" replace />
        </div>
      </div>
    );
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen bg-sky-50">
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600 mb-2">Access Denied</div>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return children;
}
