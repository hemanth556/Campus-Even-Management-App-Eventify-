import React, { useState, useEffect, useContext } from 'react';
import API from '../../api/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export default function Signup() {
  const [full, setFull] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [adminKey, setAdminKey] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [sem, setSem] = useState('');
  const [colleges, setColleges] = useState([]);
  const { login } = useContext(AuthContext);
  const nav = useNavigate();

  useEffect(() => {
    async function fetchColleges() {
      try {
        const res = await API.get('/colleges');
        setColleges(res.data || []);
        if (res.data?.length > 0) setCollegeId(res.data[0].college_code);
      } catch (err) {
        console.error('Failed to fetch colleges:', err);
      }
    }
    fetchColleges();
  }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      const payload = { full_name: full, email, password, role };

      if (role === 'admin') {
        payload.admin_key = adminKey;
        payload.college_id = collegeId; // admin also gets college_id
      }

      if (role === 'student') {
        payload.college_id = collegeId;
        payload.sem = sem;
      }

      console.log('Signup Payload:', payload);

      const res = await API.post('/auth/signup', payload);
      login(res.data.token);
      nav('/');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  return (
    <form className="max-w-md mx-auto bg-white shadow-md rounded p-6 mt-10" onSubmit={submit}>
      <h2 className="text-3xl font-semibold text-blue-600 mb-6 text-center">Sign Up</h2>

      {/* Full Name */}
      <input
        className="w-full mb-4 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        placeholder="Full Name"
        value={full}
        onChange={e => setFull(e.target.value)}
        required
      />

      {/* Email */}
      <input
        className="w-full mb-4 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />

      {/* Password */}
      <input
        className="w-full mb-4 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />

      {/* Role */}
      <select
        className="w-full mb-4 p-3 border rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-300"
        value={role}
        onChange={e => setRole(e.target.value)}
      >
        <option value="student">Student</option>
        <option value="admin">Admin</option>
      </select>

      {/* Admin Fields */}
      {role === 'admin' && (
        <>
          <input
            className="w-full mb-4 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Admin Signup Key"
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
            required
          />
          <select
            className="w-full mb-4 p-3 border rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={collegeId}
            onChange={e => setCollegeId(e.target.value)}
            required
          >
            {colleges.map(college => (
              <option key={college.id} value={college.college_code}>
                {college.college_name}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Student Fields */}
      {role === 'student' && (
        <>
          <select
            className="w-full mb-4 p-3 border rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={collegeId}
            onChange={e => setCollegeId(e.target.value)}
            required
          >
            {colleges.map(college => (
              <option key={college.id} value={college.college_code}>
                {college.college_name}
              </option>
            ))}
          </select>

          <select
            className="w-full mb-4 p-3 border rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={sem}
            onChange={e => setSem(e.target.value)}
            required
          >
            <option value="">Select Semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <option key={num} value={num}>
                Semester {num}
              </option>
            ))}
          </select>
        </>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white font-semibold py-3 rounded hover:bg-blue-700 transition"
      >
        Sign Up
      </button>
    </form>
  );
}
