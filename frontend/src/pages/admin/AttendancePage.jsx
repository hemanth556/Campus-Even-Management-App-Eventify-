import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/api";

export default function AttendancePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState([]); // rows: { student_id, student_name, status, event_title, ... }
  const [loading, setLoading] = useState(true);
  const [savingIds, setSavingIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchAttendance() {
      setLoading(true);
      try {
        const res = await API.get(`/attendance/event/${eventId}`);
        const rows = (res.data.attendance || []).map(r => {
          // Normalize status to 'present'|'absent'
          let normalized;
          if (r.status === true || String(r.status).toLowerCase() === "t" || String(r.status).toLowerCase() === "true") normalized = "present";
          else if (typeof r.status === "string") normalized = r.status.toLowerCase();
          else normalized = "absent";
          return {
            id: r.id,
            student_id: r.student_id,
            student_name: r.student_name || r.student_id,
            status: normalized === "present" ? "present" : "absent",
            event_id: r.event_id,
            event_title: r.event_title || r.event_id,
            submitted: !!r.submitted,
            raw: r
          };
        });
        if (mounted) setAttendance(rows);
      } catch (err) {
        console.error("Failed to load attendance", err);
        alert("Failed to load attendance: " + (err.response?.data?.error || err.message));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchAttendance();
    return () => { mounted = false; };
  }, [eventId]);

  const markLocal = (student_id, status) => {
    setAttendance(prev => prev.map(r => (r.student_id === student_id ? { ...r, status } : r)));
  };

  const saveRow = async (student_id) => {
    const row = attendance.find(r => r.student_id === student_id);
    if (!row) return;
    setSavingIds(prev => new Set(prev).add(student_id));
    try {
      // send status as 'present' or 'absent'
      await API.patch(`/attendance/event/${eventId}/mark`, { student_id, status: row.status });
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save: " + (err.response?.data?.error || err.message));
      // optionally revert optimistic update (not doing it here)
    } finally {
      setSavingIds(prev => {
        const copy = new Set(prev);
        copy.delete(student_id);
        return copy;
      });
    }
  };

  const onMarkAndSave = async (student_id, status) => {
    // optimistic UI update
    markLocal(student_id, status);
    await saveRow(student_id);
  };

  const submitAll = async () => {
    if (!window.confirm("Submit attendance? After submission edits may be restricted.")) return;
    setSubmitting(true);
    try {
      await API.post(`/attendance/event/${eventId}/submit`);
      alert("Attendance submitted.");
      navigate("/admin");
    } catch (err) {
      console.error("Submit failed", err);
      alert("Failed to submit: " + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading attendance…</div>;
  if (!attendance || attendance.length === 0) return <div className="p-6">No students found for this event.</div>;

  const eventTitle = attendance[0]?.event_title || eventId;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Take Attendance — {eventTitle}</h2>

      <div className="space-y-3">
        {attendance.map(row => {
          const saving = savingIds.has(row.student_id);
          const isPresent = row.status === "present";
          return (
            <div key={row.student_id} className="flex items-center justify-between border rounded p-3 bg-white">
              <div>
                <div className="font-medium">{row.student_name}</div>
                <div className="text-sm text-gray-500">Status: {row.status ?? "absent"}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onMarkAndSave(row.student_id, "present")}
                  disabled={saving}
                  className={`px-3 py-1 rounded ${isPresent ? "bg-green-600 text-white" : "border hover:bg-green-50"}`}
                >
                  {saving && isPresent ? "Saving..." : "Present"}
                </button>

                <button
                  onClick={() => onMarkAndSave(row.student_id, "absent")}
                  disabled={saving}
                  className={`px-3 py-1 rounded ${!isPresent ? "bg-red-600 text-white" : "border hover:bg-red-50"}`}
                >
                  {saving && !isPresent ? "Saving..." : "Absent"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={submitAll} disabled={submitting} className="bg-black text-white px-4 py-2 rounded">
          {submitting ? "Submitting…" : "Submit Attendance"}
        </button>

        <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded">
          Back
        </button>
      </div>
    </div>
  );
}
