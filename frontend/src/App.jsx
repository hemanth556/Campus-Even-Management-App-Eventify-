import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import EventDetails from './pages/student/EventDetails';
import StudentDashboard from './pages/student/StudentDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateEvent from './pages/admin/CreateEvent';
import Reports from './pages/admin/Reports';
import AttendancePage from './pages/admin/AttendancePage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';


export default function App() {
  return (
    <AuthProvider>
      <Header />
      <main className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Home />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/student" element={
            <ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>
          } />

         
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/create" element={
            <ProtectedRoute roles={['admin']}><CreateEvent /></ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute roles={['admin']}><Reports /></ProtectedRoute>
          } />

          <Route path="/admin/attendance/:eventId" element={
            <ProtectedRoute roles={['admin']}><AttendancePage /></ProtectedRoute>
          } />
        </Routes>
      </main>
    </AuthProvider>
  );
}
