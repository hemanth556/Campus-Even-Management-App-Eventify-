import React, { useEffect, useState, useContext } from 'react';
import API from '../../api/api';
import EventCard from '../../components/EventCard';
import { AuthContext } from '../../context/AuthContext';

export default function StudentDashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, registeredEvents: 0, completedEvents: 0 });
  const [collegeMap, setCollegeMap] = useState({});
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchData() {
      setLoading(true);
      try {
        // 1) colleges
        const collegesRes = await API.get('/colleges');
        const map = {};
        (collegesRes.data || []).forEach(c => { map[c.college_code] = c.college_name; });
        setCollegeMap(map);

        // 2) eligible events
        const eventsRes = await API.get('/events/eligible', { params: { college_id: user.college_id, sem: user.sem } });
        const eventsData = eventsRes.data?.events || [];

        // 3) attendance
        let attendanceData = [];
        try {
          const attendanceRes = await API.get('/attendance/my-attendance');
          attendanceData = attendanceRes.data?.attendance || [];
        } catch {
          attendanceData = [];
        }

        // helpers
        const extractEventId = (row) => {
          if (!row) return null;
          if (row.event_id) return String(row.event_id);
          if (row.eventId) return String(row.eventId);
          if (row.event && typeof row.event === 'object') return String(row.event.id || row.event.event_id);
          return null;
        };

        const isRowPresent = (row) => {
          if (!row) return false;
          const s = row.status;
          if (s === true) return true;
          const sl = String(s).toLowerCase();
          return sl === 'present' || sl === 't' || sl === 'true' || sl === '1' || sl === 'yes' || sl === 'attended';
        };

        // lookup by event_id
        const attendanceByEvent = {};
        attendanceData.forEach(row => {
          const eid = extractEventId(row);
          if (eid) {
            attendanceByEvent[eid] = { ...row, isPresent: isRowPresent(row) };
          }
        });

        // merge events with attendance
        const merged = eventsData.map(ev => {
          const evId = String(ev.id || ev.event_id);
          const att = attendanceByEvent[evId] || null;
          return {
            ...ev,
            userRegistration: ev.registration ? { status: ev.registration.status } : null,
            attended: !!(att && att.isPresent),
            attendanceRow: att
          };
        });

        setEvents(merged);

        // stats
        const totalEvents = merged.length;
        const registeredEvents = merged.filter(e => e.userRegistration?.status === 'Registered').length;
        const completedEvents = merged.filter(e => e.attended).length;
        setStats({ totalEvents, registeredEvents, completedEvents });

      } catch (err) {
        console.error('StudentDashboard fetchData error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // registration listener (functional updates so we don't need events in deps)
  useEffect(() => {
    function onRegistrationCreated(e) {
      const { eventId, registration } = e.detail || {};
      if (!eventId) return;

      setEvents(prevEvents => {
        const updated = prevEvents.map(ev => {
          if (String(ev.id) === String(eventId) || String(ev.event_id) === String(eventId)) {
            return { ...ev, userRegistration: { status: registration?.status || 'Registered' }, registration };
          }
          return ev;
        });

        // update stats based on updated list
        setStats(prevStats => {
          const registeredEventsCount = updated.filter(ev => ev.userRegistration?.status === 'Registered').length;
          return { ...prevStats, registeredEvents: registeredEventsCount };
        });

        return updated;
      });
    }

    window.addEventListener('registration:created', onRegistrationCreated);
    return () => window.removeEventListener('registration:created', onRegistrationCreated);
  }, []); // empty deps — listener added once

  const handleRegister = async (eventId) => {
    try {
      await API.post('/registrations/register', { event_id: eventId });
      setEvents(prev => {
        const updated = prev.map(ev =>
          (String(ev.id) === String(eventId) || String(ev.event_id) === String(eventId))
            ? { ...ev, userRegistration: { status: 'Registered' } }
            : ev
        );
        // update registered events stat
        setStats(prevStats => ({ ...prevStats, registeredEvents: updated.filter(e => e.userRegistration?.status === 'Registered').length }));
        return updated;
      });
      alert('Registered successfully!');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  if (!user) return <p>Loading...</p>;
  if (loading) return <p>Loading dashboard...</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-sky-700">Student Dashboard</h2>
        <div className="text-sm text-slate-500">Welcome back — explore and register for campus events</div>
      </div>

      {/* Student Info */}
      <div className="bg-white p-4 rounded-2xl mb-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="space-y-1">
          <p className="text-sm"><strong className="text-slate-700">Name:</strong> <span className="text-slate-600">{user.full_name || 'N/A'}</span></p>
          <p className="text-sm"><strong className="text-slate-700">Semester:</strong> <span className="text-slate-600">{user.sem || 'N/A'}</span></p>
          <p className="text-sm"><strong className="text-slate-700">College:</strong> <span className="text-slate-600">{collegeMap[user.college_id] || user.college_id || 'N/A'}</span></p>
        </div>
        <div className="mt-3 md:mt-0 flex gap-3">
          <div className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3 text-center">
            <div className="text-xs text-slate-500">Total Events</div>
            <div className="text-xl font-semibold text-sky-700">{stats.totalEvents}</div>
          </div>
          <div className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3 text-center">
            <div className="text-xs text-slate-500">Registered</div>
            <div className="text-xl font-semibold text-sky-700">{stats.registeredEvents}</div>
          </div>
          <div className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3 text-center">
            <div className="text-xs text-slate-500">Attended</div>
            <div className="text-xl font-semibold text-sky-700">{stats.completedEvents}</div>
          </div>
        </div>
      </div>

      {/* Event Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.length === 0 && <p className="text-slate-500">No eligible events available.</p>}
        {events.map(e => (
          <div key={e.id || e.event_id} className="relative">
            <EventCard
              event={e}
              collegeNameMap={collegeMap}
              userRegistration={e.userRegistration}
              attended={e.attended}
              attendanceRow={e.attendanceRow}
              onRegister={() => handleRegister(e.id || e.event_id)}
              disableRegister={e.completed || e.cancelled}
            />

            {/* Badge only after attendance is submitted */}
            {e.attendanceRow?.submitted && (
              <div className="absolute top-3 right-3">
                {e.attended ? (
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">Attended</span>
                ) : (
                  <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full">Absent</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
