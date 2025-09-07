// src/pages/student/MyEventsFeedback.jsx
import React, { useEffect, useState, useContext } from "react";
import FeedbackForm from "../components/feedbackForm";
import { AuthContext } from "../context/AuthContext";

export default function MyEventsFeedback() {
  const { token } = useContext(AuthContext);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch("/api/attendance/my-attendance", {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          const body = await res.json().catch(()=>({}));
          throw new Error(body.error || "Failed to load attendance");
        }
        const body = await res.json();
        if (!mounted) return;
        setAttendance(body.attendance || []);
      } catch (e) {
        console.error("Load attendance error", e);
        if (mounted) setErr(e.message || "Error");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => (mounted = false);
  }, [token, refreshKey]);

  if (loading) return <div className="p-6">Loading your events...</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!attendance || attendance.length === 0) return <div className="p-6">You have no attendance records.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">My Events & Feedback</h2>
      <p className="text-sm text-gray-600">Submit feedback only for events where you were marked present.</p>

      <div className="grid gap-4">
        {attendance.map((row) => (
          <div key={row.event_id} className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">{row.event_title || row.event_id}</div>
                <div className="text-sm text-gray-500">
                  Status: <span className={row.status === "present" ? "text-green-600" : "text-red-600"}>{row.status || "unknown"}</span>
                </div>
              </div>

              <div className="text-sm text-gray-500">
                {typeof row.submitted !== "undefined" && (
                  <div>Attendance submitted: <strong>{row.submitted ? "Yes" : "No"}</strong></div>
                )}
              </div>
            </div>

            <div className="mt-4">
              {row.status === "present" ? (
                <FeedbackForm eventId={row.event_id} onSubmitted={() => setRefreshKey(k => k + 1)} />
              ) : (
                <div className="text-sm text-gray-600">You can only submit feedback when marked present.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
