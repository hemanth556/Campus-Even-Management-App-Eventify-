import React, { useState, useEffect, useContext } from 'react';
import API from '../../api/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export default function CreateEvent() {
  const { user } = useContext(AuthContext); // logged-in admin
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('Workshop');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [sem, setSem] = useState('');
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function fetchColleges() {
      try {
        const res = await API.get('/colleges');
        if (!mounted) return;
        setColleges(res.data || []);
        if (res.data?.length > 0) setCollegeId(res.data[0].college_code);
      } catch (err) {
        console.error('Failed to fetch colleges:', err);
        if (!mounted) return;
        setErr('Could not load colleges');
      }
    }
    fetchColleges();
    return () => (mounted = false);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr('');

    if (new Date(startTime) >= new Date(endTime)) {
      setErr('Start time must be before end time');
      return;
    }

    setLoading(true);
    try {
      await API.post('/events', {
        title,
        description,
        event_type: eventType,
        location,
        start_time: startTime,
        end_time: endTime,
        college_id: collegeId,
        semester: sem,
        created_by: user?.full_name || 'Admin',
      });
      setLoading(false);
      // success — navigate back to admin dashboard
      nav('/admin');
    } catch (err) {
      setLoading(false);
      console.error(err);
      setErr(err.response?.data?.error || err.message || 'Failed to create event');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <form
        onSubmit={submit}
        className="max-w-3xl w-full bg-white shadow-lg rounded-2xl p-6 md:p-10 border border-blue-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-800">Create Event</h2>
            <p className="text-sm text-slate-500 mt-1">Create a new college event — visible to students of the selected college & semester.</p>
          </div>
         
        </div>

        {err && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 p-3 rounded">{err}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              className="w-full rounded-md border border-blue-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Enter event title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Event Type</label>
            <select
              className="w-full rounded-md border border-blue-100 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={eventType}
              onChange={e => setEventType(e.target.value)}
            >
              <option>Workshop</option>
              <option>Hackathon</option>
              <option>Seminar</option>
              <option>Fest</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              className="w-full rounded-md border border-blue-100 px-3 py-2 h-28 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Brief details about the event"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
            <input
              className="w-full rounded-md border border-blue-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="e.g., Main Auditorium"
              value={location}
              onChange={e => setLocation(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">College</label>
            <select
              className="w-full rounded-md border border-blue-100 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={collegeId}
              onChange={e => setCollegeId(e.target.value)}
              required
            >
              {colleges.length === 0 ? (
                <option>Loading colleges...</option>
              ) : (
                colleges.map(college => (
                  <option key={college.id} value={college.college_code}>
                    {college.college_name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Semester</label>
            <select
              className="w-full rounded-md border border-blue-100 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
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
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">Start</label>
            <input
              type="datetime-local"
              className="w-full rounded-md border border-blue-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">End</label>
            <input
              type="datetime-local"
              className="w-full rounded-md border border-blue-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col md:flex-row items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : (
              'Create Event'
            )}
          </button>

          <button
            type="button"
            onClick={() => nav('/admin')}
            className="inline-flex items-center justify-center gap-2 border border-blue-200 text-blue-700 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 focus:outline-none"
          >
            Cancel
          </button>

          <div className="ml-auto text-sm text-slate-500">
             <span className="font-medium text-slate-700">Eventify</span>
          </div>
        </div>
      </form>
    </div>
  );
}
