import React from "react";
import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 text-white font-semibold shadow-md hover:from-rose-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 transition"
    >
      Logout
    </button>
  );
}
