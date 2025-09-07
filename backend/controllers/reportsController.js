// controllers/reportsController.js
import { supabase } from "../db/client.js";

/**
 * GET /api/reports/event-popularity
 * Response: { events: [ { id, title, event_type, registrations } ] }
 */
export async function eventPopularityReport(req, res) {
  try {
    const { college_id } = req.query;
    const cid = college_id || req.user?.college_id || null;

    const evQuery = supabase.from('events').select('id, title, event_type, start_time').order('start_time', { ascending: true });
    const evResp = cid ? await evQuery.eq('college_id', cid) : await evQuery;
    if (evResp.error) throw evResp.error;
    const events = evResp.data || [];

    const eventIds = events.map(e => e.id).filter(Boolean);
    if (eventIds.length === 0) return res.json({ events: [] });

    const { data: regs, error: regsErr } = await supabase
      .from('registrations')
      .select('event_id')
      .in('event_id', eventIds);

    if (regsErr) throw regsErr;

    const counts = {};
    (regs || []).forEach(r => {
      const eid = String(r.event_id);
      counts[eid] = (counts[eid] || 0) + 1;
    });

    const list = (events || []).map(e => ({
      id: e.id,
      title: e.title,
      event_type: e.event_type,
      registrations: counts[String(e.id)] || 0
    })).sort((a, b) => b.registrations - a.registrations);

    return res.json({ events: list });
  } catch (err) {
    console.error("eventPopularityReport error:", err);
    return res.status(500).json({ error: "Server error", details: err.message || err });
  }
}

/**
 * GET /api/reports/top-active-students
 * Response: { top3: [...], all: [...] }
 */
export async function studentParticipationReport(req, res) {
  try {
    // fetch attendance rows
    const { data: attends, error: attendErr } = await supabase
      .from('attendance')
      .select('student_id, event_id, status');

    if (attendErr) throw attendErr;

    const isPresent = (s) => {
      if (s === true) return true;
      if (!s) return false;
      const sl = String(s).toLowerCase();
      return ['present','p','yes','y','true','t','1','attended'].includes(sl);
    };

    const counts = {};
    (attends || []).forEach(a => {
      if (isPresent(a.status) && a.student_id) {
        const sid = String(a.student_id);
        counts[sid] = (counts[sid] || 0) + 1;
      }
    });

    const userIds = Object.keys(counts);
    if (userIds.length === 0) return res.json({ top3: [], all: [] });

    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds);

    if (usersErr) throw usersErr;

    const list = (users || []).map(u => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      attended: counts[String(u.id)] || 0
    })).sort((a, b) => b.attended - a.attended);

    return res.json({ top3: list.slice(0, 3), all: list });
  } catch (err) {
    console.error("studentParticipationReport error:", err);
    return res.status(500).json({ error: "Server error", details: err.message || err });
  }
}

/**
 * GET /api/reports/flexible
 * Optional query: event_type, date_from, date_to, college_id
 * Response: { events: [...] }
 */
export async function flexibleReport(req, res) {
  try {
    const { event_type, date_from, date_to, college_id } = req.query;
    let q = supabase.from('events').select('*');

    if (college_id) q = q.eq('college_id', college_id);
    if (event_type) q = q.eq('event_type', event_type);

    const { data: events, error } = await q;
    if (error) throw error;
    let list = events || [];

    if (date_from) list = list.filter(e => new Date(e.start_time) >= new Date(date_from));
    if (date_to) list = list.filter(e => new Date(e.end_time) <= new Date(date_to));

    return res.json({ events: list });
  } catch (err) {
    console.error("flexibleReport error:", err);
    return res.status(500).json({ error: "Server error", details: err.message || err });
  }
}

/**
 * registrationsPerEvent
 * GET /api/reports/registrations-per-event
 * Response: { report: [ { event_id, title, registrations_count } ] }
 */
export const registrationsPerEvent = async (req, res) => {
  try {
    const { data: events, error } = await supabase
      .from("events")
      .select("id, title")
      .order("start_time", { ascending: true });

    if (error) throw error;

    const eventIds = (events || []).map(e => e.id).filter(Boolean);
    if (eventIds.length === 0) return res.json({ report: [] });

    const { data: regs, error: regsErr } = await supabase
      .from('registrations')
      .select('event_id')
      .in('event_id', eventIds);

    if (regsErr) throw regsErr;

    const counts = {};
    (regs || []).forEach(r => counts[String(r.event_id)] = (counts[String(r.event_id)] || 0) + 1);

    const result = (events || []).map(ev => ({
      event_id: ev.id,
      title: ev.title,
      registrations_count: counts[String(ev.id)] || 0
    }));

    return res.json({ report: result });
  } catch (err) {
    console.error("registrationsPerEvent error:", err);
    return res.status(500).json({ error: "Server error", details: err.message || err });
  }
};


/**
 * attendancePercentage
 * GET /api/reports/attendance-percentage
 * Response: { report: [ { event_id, title, present_count, attendance_rows, attendance_percentage } ] }
 */
export const attendancePercentage = async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from("attendance")
      .select("event_id, status");

    if (error) throw error;

    const agg = {};
    (rows || []).forEach(r => {
      const eid = String(r.event_id);
      if (!agg[eid]) agg[eid] = { present: 0, total: 0 };
      agg[eid].total += 1;
      const s = String(r.status || "").toLowerCase();
      if (["present","p","true","t","1","yes","attended"].includes(s)) agg[eid].present += 1;
    });

    const eventIds = Object.keys(agg);
    let eventsMap = {};
    if (eventIds.length) {
      const { data: eventRows, error: evErr } = await supabase
        .from("events")
        .select("id, title")
        .in("id", eventIds);
      if (evErr) throw evErr;
      eventsMap = (eventRows || []).reduce((m, e) => { m[String(e.id)] = e.title; return m; }, {});
    }

    const report = Object.entries(agg).map(([event_id, v]) => {
      const pct = v.total === 0 ? 0 : (v.present / v.total) * 100;
      return {
        event_id,
        title: eventsMap[event_id] || null,
        present_count: v.present,
        attendance_rows: v.total,
        attendance_percentage: Number(pct.toFixed(2))
      };
    });

    return res.json({ report });
  } catch (err) {
    console.error("attendancePercentage error:", err);
    return res.status(500).json({ error: "Server error", details: err.message || err });
  }
};


/**
 * averageFeedbackScore
 * GET /api/reports/average-feedback
 * Response: { report: [ { event_id, title, feedback_count, average_rating } ] }
 */
export const averageFeedbackScore = async (req, res) => {
  try {
    const { data: fRows, error } = await supabase
      .from("feedback")
      .select("event_id, rating");

    if (error) throw error;

    const agg = {};
    (fRows || []).forEach(f => {
      const eid = String(f.event_id);
      if (!agg[eid]) agg[eid] = { sum: 0, count: 0 };
      agg[eid].sum += Number(f.rating || 0);
      agg[eid].count += 1;
    });

    const eventIds = Object.keys(agg);
    let eventsMap = {};
    if (eventIds.length) {
      const { data: eventRows, error: evErr } = await supabase
        .from("events")
        .select("id, title")
        .in("id", eventIds);
      if (evErr) throw evErr;
      eventsMap = (eventRows || []).reduce((m, e) => { m[String(e.id)] = e.title; return m; }, {});
    }

    const report = Object.entries(agg).map(([event_id, v]) => ({
      event_id,
      title: eventsMap[event_id] || null,
      feedback_count: v.count,
      average_rating: Number((v.sum / v.count).toFixed(2))
    }));

    return res.json({ report });
  } catch (err) {
    console.error("averageFeedbackScore error:", err);
    return res.status(500).json({ error: "Server error", details: err.message || err });
  }
};
