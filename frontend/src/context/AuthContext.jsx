import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log(payload)
        setUser({ ...payload, token });
      } catch {
        setUser(null);
      }
    }
  }, []);

  function login(token) {
    localStorage.setItem('token', token);
    const payload = JSON.parse(atob(token.split('.')[1]));
    setUser({ ...payload, token });
    console.log(user)
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
    window.location = '/';
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
