import React, { useEffect, useState, useContext } from "react";
import API from "../../api/api";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const { user } = useContext(AuthContext);
  const [adminInfo, setAdminInfo] = useState({ name: "", college: "" });
  const [stats, setStats] = useState({
    totalEventsCreated: 0,
    totalEventsCompleted: 0,
    totalEventsCancelled: 0,
    totalRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const profileRes = await API.get("/admin/profile");
        setAdminInfo({
          name: profileRes.data.name || user.name || "Admin",
          college: profileRes.data.college_name || user.college_name || "Unknown College",
        });

        const ev = await API.get("/events/admin/my-events");
        const evList = ev.data.events || [];

        const attendanceChecks = evList.map(async (event) => {
          try {
            const attRes = await API.get(`/attendance/event/${event.id}`);
            const attendanceRows = attRes.data.attendance || [];
            const submitted =
              attendanceRows.length > 0 && attendanceRows.every((r) => !!r.submitted);
            return { ...event, attendanceSubmitted: submitted };
          } catch (err) {
            console.warn("Attendance check failed for event", event.id, err?.response?.data || err.message);
            return { ...event, attendanceSubmitted: false };
          }
        });

        const evWithAttendance = await Promise.all(attendanceChecks);
        setEvents(evWithAttendance);

        const st = await API.get("/admin/my-stats");
        setStats({
          totalEventsCreated: st.data.totalEventsCreated || 0,
          totalEventsCompleted: st.data.totalEventsCompleted || 0,
          totalEventsCancelled: st.data.totalEventsCancelled || 0,
          totalRegistrations: st.data.totalRegistrations || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleMarkCompleted = async (eventId) => {
    try {
      await API.post(`/events/${eventId}/complete`);
      alert("Event marked as completed");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to mark event as completed");
    }
  };

  const handleCancel = async (eventId) => {
    try {
      await API.post(`/events/${eventId}/cancel`);
      alert("Event Cancelled");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to cancel event");
    }
  };

  const handleTakeAttendance = async (eventId) => {
    const event = events.find((e) => e.id === eventId);
    if (event?.attendanceSubmitted) {
      alert("Attendance already submitted for this event. You cannot take attendance again.");
      return;
    }

    try {
      const res = await API.post(`/attendance/${eventId}/take`);
      const students = res.data?.students || [];
      const msg = res.data?.message || "";

      if (!students || students.length === 0) {
        alert(msg || "No registered students for this event.");
        return;
      }

      navigate(`/admin/attendance/${eventId}`);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      alert("Failed to initialize attendance: " + JSON.stringify(msg));
    }
  };

  if (loading) return <div className="p-6">Loading dashboard…</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-sky-700">Admin Dashboard</h2>
          <p className="text-slate-600 mt-1">{adminInfo.name} <span className="hidden md:inline">—</span> <span className="md:ml-2 text-sm text-slate-500">{adminInfo.college}</span></p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            to="/admin/create"
            className="inline-flex items-center justify-center bg-sky-600 text-white px-4 py-2 rounded-2xl shadow-md hover:bg-sky-700 transition"
          >
            + Create Event
          </Link>
          <Link to="/admin/reports" className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 rounded-2xl hover:bg-slate-50 transition text-slate-700">
            Reports
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-medium text-slate-500">Events Created</h3>
          <p className="text-2xl font-semibold text-sky-700 mt-2">{stats.totalEventsCreated}</p>
          <div className="text-xs text-slate-400 mt-1">All-time</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-medium text-slate-500">Events Completed</h3>
          <p className="text-2xl font-semibold text-sky-700 mt-2">{stats.totalEventsCompleted}</p>
          <div className="text-xs text-slate-400 mt-1">Including past month</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-medium text-slate-500">Events Cancelled</h3>
          <p className="text-2xl font-semibold text-sky-700 mt-2">{stats.totalEventsCancelled}</p>
          <div className="text-xs text-slate-400 mt-1">Cancelled</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-medium text-slate-500">Registrations</h3>
          <p className="text-2xl font-semibold text-sky-700 mt-2">{stats.totalRegistrations}</p>
          <div className="text-xs text-slate-400 mt-1">Total signups</div>
        </div>
      </div>

      {/* Events List */}
      <h3 className="text-xl font-semibold text-slate-800 mb-4">My Events</h3>

      <div className="grid gap-4">
        {events.length === 0 ? (
          <p className="text-slate-500">No events created yet.</p>
        ) : (
          events.map((e) => (
            <div key={e.id} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="w-full md:w-3/4">
                <h3 className="font-semibold text-lg text-slate-800">{e.title}</h3>
                <div className="text-sm text-slate-500 mt-1">
                  {e.event_type} • Semester {e.sem || "-"} • {new Date(e.start_time).toLocaleString()}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {e.cancelled && (
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-100">Cancelled</span>
                  )}
                  {e.completed && (
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full border border-emerald-100">Completed</span>
                  )}
                  {!e.cancelled && !e.completed && (
                    <span className="text-xs bg-blue-50 text-sky-700 px-2 py-1 rounded-full border border-sky-100">Active</span>
                  )}
                  {e.attendanceSubmitted && (
                    <span className="text-xs bg-slate-50 text-slate-700 px-2 py-1 rounded-full border border-slate-100">Attendance Submitted</span>
                  )}
                </div>
              </div>

              <div className="flex w-full md:w-auto justify-start md:justify-end items-center gap-2">
                {!e.cancelled && !e.completed && (
                  <>
                    <button
                      className="px-3 py-1 rounded-lg text-sky-600 border border-sky-200 hover:bg-sky-50 transition"
                      onClick={() => handleCancel(e.id)}
                    >
                      Cancel
                    </button>

                    <button
                      className="px-3 py-1 rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition shadow-md"
                      onClick={() => handleMarkCompleted(e.id)}
                    >
                      Mark Completed
                    </button>

                    {!e.attendanceSubmitted ? (
                      <button
                        className="px-3 py-1 rounded-lg text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
                        onClick={() => handleTakeAttendance(e.id)}
                      >
                        Take Attendance
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-3 py-1 rounded-lg text-slate-400 border border-slate-100 bg-slate-50 cursor-not-allowed"
                        title="Attendance already submitted"
                      >
                        Attendance Done
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
