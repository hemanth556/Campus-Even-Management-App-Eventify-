// src/pages/admin/Reports.jsx
import React, { useEffect, useState } from "react";
import API from "../../api/api";

export default function Reports() {
  const [popularity, setPopularity] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [feedbackReport, setFeedbackReport] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);

    async function loadAll() {
      try {
        const [popRes, topRes, attRes, fbRes] = await Promise.all([
          API.get("/reports/event-popularity"),
          API.get("/reports/top-active-students"),
          API.get("/reports/attendance-percentage"),
          API.get("/reports/average-feedback"),
        ]);

        if (!mounted) return;

        setPopularity(popRes.data?.events || popRes.data?.report || []);
        setTopStudents(topRes.data?.top3 || topRes.data?.all || []);
        setAttendanceReport(attRes.data?.report || attRes.data?.attendance || []);
        setFeedbackReport(fbRes.data?.report || fbRes.data?.feedbacks || []);
      } catch (e) {
        console.error("Reports load error:", e);
        if (mounted) setErr(e.response?.data?.error || e.message || "Failed to load reports");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="p-6">Loading reports...</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-sky-700">Admin Reports</h2>
        <p className="text-sm text-slate-500">Overview of events, attendance and feedback</p>
      </div>

      {/* Event Popularity */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-slate-800">Event Popularity (registrations)</h3>
        </div>
        {popularity.length === 0 ? (
          <div className="text-sm text-slate-500">No events found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {popularity.map((p) => (
              <div key={p.id} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-slate-800">{p.title || p.id}</div>
                    <div className="text-xs text-slate-500 mt-1">{p.event_type}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-sky-700">{p.registrations ?? p.registrations_count ?? 0}</div>
                    <div className="text-xs text-slate-400">regs</div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xs text-slate-400">Fill rate</div>
                  <div className="mt-1 w-full bg-slate-100 h-2 rounded overflow-hidden">
                    <div style={{ width: `${Math.max(0, Math.min(100, p.fill_percent || 0))}%` }} className="h-2 bg-sky-400"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Attendance Percentage */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-slate-800">Attendance Percentage</h3>
        </div>
        {attendanceReport.length === 0 ? (
          <div className="text-sm text-slate-500">No attendance data.</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
            <table className="min-w-full divide-y">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm">Event</th>
                  <th className="px-4 py-3 text-right text-sm">Present</th>
                  <th className="px-4 py-3 text-right text-sm">Total</th>
                  <th className="px-4 py-3 text-right text-sm">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {attendanceReport.map((r) => (
                  <tr key={r.event_id} className="border-t hover:bg-slate-50 transition">
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-800">{r.title || r.event_id}</div>
                      <div className="text-xs text-slate-500">{r.event_id}</div>
                    </td>
                    <td className="px-4 py-4 text-right text-slate-700">{r.present_count ?? 0}</td>
                    <td className="px-4 py-4 text-right text-slate-700">{r.attendance_rows ?? 0}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="text-sm font-semibold text-sky-700">{(r.attendance_percentage ?? 0).toFixed(2)}%</div>
                      <div className="mt-2 w-40 bg-slate-100 h-2 rounded overflow-hidden mx-auto md:mx-0">
                        <div style={{ width: `${Math.max(0, Math.min(100, r.attendance_percentage || 0))}%` }} className="h-2 bg-sky-400"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Average Feedback */}
      <section className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-slate-800">Average Feedback Score</h3>
        </div>
        {feedbackReport.length === 0 ? (
          <div className="text-sm text-slate-500">No feedback yet.</div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
            <table className="min-w-full divide-y">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm">Event</th>
                  <th className="px-4 py-3 text-right text-sm">Feedback Count</th>
                  <th className="px-4 py-3 text-right text-sm">Average Rating</th>
                </tr>
              </thead>
              <tbody>
                {feedbackReport.map((r) => (
                  <tr key={r.event_id} className="border-t hover:bg-slate-50 transition">
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-800">{r.title || r.event_id}</div>
                      <div className="text-xs text-slate-500">{r.event_id}</div>
                    </td>
                    <td className="px-4 py-4 text-right text-slate-700">{r.feedback_count ?? 0}</td>
                    <td className="px-4 py-4 text-right font-semibold text-sky-700">{(r.average_rating ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Top Active Students */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-slate-800">Top Active Students</h3>
        </div>
        {topStudents.length === 0 ? (
          <div className="text-sm text-slate-500">No student data.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topStudents.map((s) => (
              <div key={s.id} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-slate-800">{s.full_name || s.email}</div>
                    <div className="text-xs text-slate-500">{s.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-sky-700">{s.attended ?? 0}</div>
                    <div className="text-xs text-slate-400">events</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
