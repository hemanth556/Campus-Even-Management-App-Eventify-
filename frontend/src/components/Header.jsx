import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b border-sky-100 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow">
              E
            </div>
            <div className="leading-tight">
              <div className="text-xl font-semibold text-sky-800">Eventify</div>
              <div className="text-xs text-sky-400 -mt-0.5">Campus events & experiences</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/events" className="text-sky-600 hover:text-sky-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-200 px-2 py-1 rounded">
              Events
            </Link>

            {user ? (
              <>
                {user.role === "admin" ? (
                  <Link to="/admin" className="text-sky-600 hover:text-sky-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-200 px-2 py-1 rounded">
                    Admin
                  </Link>
                ) : (
                  <Link to="/student" className="text-sky-600 hover:text-sky-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-200 px-2 py-1 rounded">
                    Dashboard
                  </Link>
                )}

                <button
                  onClick={logout}
                  className="ml-2 inline-flex items-center gap-2 rounded-md bg-white border border-sky-200 px-3 py-1 text-sm font-semibold text-sky-700 shadow-sm hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sky-600 hover:text-sky-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-200 px-2 py-1 rounded">
                  Login
                </Link>

                <Link
                  to="/signup"
                  className="ml-2 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 px-3 py-1 text-sm font-semibold text-white shadow-md hover:from-sky-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  Signup
                </Link>
              </>
            )}
          </nav>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-label="Toggle menu"
              className="inline-flex items-center justify-center p-2 rounded-md text-sky-600 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {open ? (
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden mt-3 pb-4 border-t border-sky-50">
            <nav className="flex flex-col gap-2">
              <Link to="/events" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sky-700 hover:bg-sky-50">
                Events
              </Link>

              {user ? (
                <>
                  {user.role === "admin" ? (
                    <Link to="/admin" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sky-700 hover:bg-sky-50">
                      Admin
                    </Link>
                  ) : (
                    <Link to="/student" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sky-700 hover:bg-sky-50">
                      Dashboard
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-md bg-white border border-sky-100 text-sky-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="px-3 py-2 rounded-md text-sky-700 hover:bg-sky-50">
                    Login
                  </Link>

                  <Link
                    to="/signup"
                    onClick={() => setOpen(false)}
                    className="mt-1 px-3 py-2 rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-center"
                  >
                    Signup
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
