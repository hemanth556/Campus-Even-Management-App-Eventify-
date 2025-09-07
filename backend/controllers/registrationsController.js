import { supabase } from '../db/client.js';

export async function registerStudent(req, res) {
  const user = req.user;
  const { event_id } = req.body;
  if (!event_id) return res.status(400).json({ error: 'event_id required' });

  const { data: event, error: eventErr } = await supabase.from('events').select('*').eq('id', event_id).single();
  if (eventErr || !event) return res.status(404).json({ error: 'Event not found' });
  if (event.is_cancelled) return res.status(400).json({ error: 'Event is cancelled' });

//   // Check capacity if >0
  if (event.capacity && event.capacity > 0) {
    const { count } = await supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('event_id', event_id);
    if (count >= event.capacity) return res.status(400).json({ error: 'Event is full' });
  }

  const { data, error } = await supabase.from('registrations').insert([{ event_id, user_id: user.id }]).select().single();
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.json({ registration: data });
}

export async function markAttendance(req, res) {
  const { registration_id, present } = req.body;
  const marker = req.user;
  if (!registration_id || typeof present === 'undefined') return res.status(400).json({ error: 'registration_id and present required' });

  const { data: reg, error: regErr } = await supabase.from('registrations').select('*').eq('id', registration_id).single();
  if (regErr || !reg) return res.status(404).json({ error: 'Registration not found' });

  const { data: existing } = await supabase.from('attendance').select('*').eq('registration_id', registration_id).maybeSingle();
  if (existing) {
    const { data, error } = await supabase.from('attendance').update({
      present: present === true,
      checked_in_at: present ? new Date().toISOString() : null,
      marked_by: marker.id
    }).eq('registration_id', registration_id).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ attendance: data });
  } else {
    const { data, error } = await supabase.from('attendance').insert([{
      registration_id, present: present === true, checked_in_at: present ? new Date().toISOString() : null, marked_by: marker.id
    }]).select().single();
    if (error) return res.status(400).json({ error: error.message });
    return res.json({ attendance: data });
  }
}
export const submitFeedback = async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: "Not authenticated" });

    const { event_id, rating, comments } = req.body;
    if (!event_id) return res.status(400).json({ error: "event_id is required" });
    if (!rating || isNaN(Number(rating))) return res.status(400).json({ error: "rating (1-5) is required" });

    const r = Number(rating);
    if (r < 1 || r > 5) return res.status(400).json({ error: "rating must be between 1 and 5" });

    // 1) confirm attendance row exists and status === 'present'
    const { data: attRow, error: attErr } = await supabase
      .from("attendance")
      .select("id, status, submitted")
      .eq("event_id", event_id)
      .eq("student_id", studentId)
      .single();

    if (attErr) {
      // if no rows found or DB error
      console.error("attendance lookup error:", attErr);
      return res.status(403).json({ error: "Attendance record not found for this student & event" });
    }

    if (!attRow || attRow.status !== "present") {
      return res.status(403).json({ error: "Only students marked present may submit feedback" });
    }

    // 2) Insert or upsert into feedback table (unique constraint will ensure one per student)
    const payload = {
      event_id,
      student_id: studentId,
      rating: r,
      comments: comments || null,
      updated_at: new Date().toISOString()
    };

    const { data: fbData, error: fbErr } = await supabase
      .from("feedback")
      .upsert([payload], { onConflict: ["event_id", "student_id"] })
      .select()
      .single();

    if (fbErr) {
      console.error("feedback upsert error:", fbErr);
      return res.status(500).json({ error: "Failed to save feedback" });
    }

    return res.json({ message: "Feedback saved", feedback: fbData });
  } catch (err) {
    console.error("submitFeedback unexpected:", err);
    return res.status(500).json({ error: "Server error", details: err.message || err });
  }
};

// export const markAttendance = async (req, res) => {
//   // your existing markAttendance function (keep as is)
// };