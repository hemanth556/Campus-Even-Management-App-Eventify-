// routes/attendance.js
import express from "express";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/adminMiddleware.js";
import { supabase } from "../db/client.js";

const router = express.Router();
console.log("[ROUTES] Loading attendance router...");

/* ---------------- Helpers ---------------- */
function findIdKey(registrationObj) {
  if (!registrationObj) return null;
  const keys = Object.keys(registrationObj);
  const candidates = ["user_id", "student_id", "userId", "studentId", "id"];
  for (const c of candidates) if (keys.includes(c)) return c;
  for (const k of keys) if (/user|student|id/i.test(k)) return k;
  return null;
}

function normalizeToTextStatus(v) {
  if (v === null || typeof v === "undefined") return null;
  if (v === true || v === "true" || String(v).toLowerCase() === "t" || v === 1 || String(v) === "1") return "present";
  if (v === false || v === "false" || String(v).toLowerCase() === "f" || v === 0 || String(v) === "0") return "absent";
  const s = String(v).trim().toLowerCase();
  if (["present","p","yes","y","attended"].includes(s)) return "present";
  if (["absent","a","no","n","missed"].includes(s)) return "absent";
  return null;
}

/* ---------------- Student route: my-attendance ---------------- */
router.get("/my-attendance", authenticateToken, async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: "Not authenticated" });

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", studentId)
      .order("event_id", { ascending: true });

    if (error) return res.status(500).json({ error: "Database error", details: error });

    return res.json({ attendance: data || [] });
  } catch (err) {
    console.error("[ATTENDANCE] my-attendance error:", err);
    return res.status(500).json({ error: "Unexpected server error", details: err.message || err });
  }
});

/* ---------------- Initialize attendance (idempotent) ---------------- */
router.post("/:eventId/take", authenticateToken, requireAdmin, async (req, res) => {
  const { eventId } = req.params;
  console.log(`[ATTENDANCE] Init by admin ${req.user?.id} for event ${eventId}`);

  try {
    const { data: registrations, error: regErr } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", eventId);

    if (regErr) {
      console.error("[ATTENDANCE] registrations fetch error:", regErr);
      return res.status(500).json({ error: "Failed to fetch registrations", details: regErr });
    }
    if (!registrations || registrations.length === 0) {
      return res.status(200).json({ message: "No registered students for this event", students: [] });
    }

    const idKey = findIdKey(registrations[0]);
    if (!idKey) return res.status(500).json({ error: "Registration rows missing student/user id column" });

    const rows = registrations
      .map(r => {
        const val = r[idKey];
        return val ? { student_id: val, event_id: eventId } : null;
      })
      .filter(Boolean);

    if (rows.length === 0) return res.status(200).json({ message: "No valid student ids found in registrations", students: [] });

    const { data: upserted, error: upsertErr } = await supabase
      .from("attendance")
      .upsert(rows, { onConflict: ["student_id", "event_id"] });

    if (upsertErr) {
      console.error("[ATTENDANCE] upsert error:", upsertErr);
      return res.status(500).json({ error: "Failed to initialize attendance", details: upsertErr });
    }

    return res.status(201).json({ message: "Attendance initialized", students: upserted || rows });
  } catch (err) {
    console.error("[ATTENDANCE] take handler error:", err);
    return res.status(500).json({ error: "Unexpected server error", details: err.message || err });
  }
});

/* ---------------- Get attendance rows for an event ---------------- */
router.get("/event/:eventId", authenticateToken, requireAdmin, async (req, res) => {
  const { eventId } = req.params;
  try {
    // 1) fetch attendance rows for the event
    const { data: attendanceRows, error: attErr } = await supabase
      .from("attendance")
      .select("*")
      .eq("event_id", eventId)
      .order("student_id", { ascending: true });

    if (attErr) {
      console.error("[ATTENDANCE] Error fetching attendance rows:", attErr);
      return res.status(500).json({ error: "Failed to fetch attendance", details: attErr });
    }

    // If no rows, still try to fetch event title (so UI shows it) and return empty list
    // 2) fetch event title
    const { data: eventRow, error: eventErr } = await supabase
      .from("events")
      .select("id, title")
      .eq("id", eventId)
      .single();

    if (eventErr && eventErr.code !== "PGRST116") { // PGRST116 = no rows? keep generic
      console.error("[ATTENDANCE] Error fetching event:", eventErr);
      // not fatal — continue and set title to eventId below
    }

    const eventTitle = eventRow?.title || null;

    // 3) collect unique student_ids from attendance rows
    const studentIds = Array.from(new Set((attendanceRows || []).map(r => r.student_id).filter(Boolean)));

    // 4) fetch user names for those student_ids (in batch)
    let usersMap = {};
    if (studentIds.length > 0) {
      const { data: users, error: usersErr } = await supabase
        .from("users")
        .select("id, full_name")
        .in("id", studentIds);

      if (usersErr) {
        console.error("[ATTENDANCE] Error fetching users:", usersErr);
        // proceed with ids only
      } else {
        usersMap = (users || []).reduce((acc, u) => {
          acc[u.id] = u.full_name || null;
          return acc;
        }, {});
      }
    }

    // 5) merge and format rows for frontend
    const rows = (attendanceRows || []).map(r => ({
      id: r.id,
      event_id: r.event_id,
      event_title: eventTitle || r.event_id,
      student_id: r.student_id,
      student_name: usersMap[r.student_id] || r.student_id,
      status: r.status,
      submitted: r.submitted,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));

    return res.json({ attendance: rows, event: { id: eventId, title: eventTitle } });
  } catch (err) {
    console.error("[ATTENDANCE] Unexpected error (GET event):", err);
    return res.status(500).json({ error: "Unexpected server error", details: err.message || err });
  }
});

/* ---------------- Mark single student (upsert) ---------------- */
// PATCH /attendance/event/:eventId/mark
// PATCH /attendance/event/:eventId/mark
router.patch("/event/:eventId/mark", authenticateToken, requireAdmin, async (req, res) => {
  const { eventId } = req.params;
  let { student_id, status } = req.body;

  console.log(`[ATTENDANCE][PATCH] Called for event=${eventId} body=`, req.body, "by user:", req.user?.id);

  if (!student_id || typeof status === "undefined") {
    return res.status(400).json({ error: "student_id and status are required" });
  }

  // Normalize incoming into canonical lowercase text: 'present' or 'absent'
  const sRaw = String(status).trim().toLowerCase();
  const presentValues = new Set(["present","p","yes","y","true","t","1","attended"]);
  const absentValues  = new Set(["absent","a","no","n","false","f","0","missed"]);

  let normalized = null;
  if (presentValues.has(sRaw)) normalized = "present";
  else if (absentValues.has(sRaw)) normalized = "absent";
  else {
    if (status === true || status === 1) normalized = "present";
    else if (status === false || status === 0) normalized = "absent";
    else return res.status(400).json({ error: "Invalid status value. Allowed examples: present, absent, true, false" });
  }

  try {
    const now = new Date().toISOString();

    // Use upsert with onConflict to atomically insert or update by (student_id, event_id)
    const row = {
      student_id,
      event_id: eventId,
      status: normalized,
      updated_at: now,
      created_at: now
    };

    const { data, error } = await supabase
      .from("attendance")
      .upsert([row], { onConflict: ["student_id", "event_id"], ignoreDuplicates: false })
      .select();

    if (error) {
      console.error("[ATTENDANCE][PATCH] upsert error:", error);
      return res.status(500).json({ error: "DB error upserting attendance", details: error });
    }

    // upsert succeeded — return the row(s)
    return res.json({ message: "Attendance upserted", rows: data || [] });
  } catch (err) {
    console.error("[ATTENDANCE][PATCH] unexpected:", err);
    return res.status(500).json({ error: "Unexpected server error", details: err?.message || err });
  }
});


/* ---------------- Submit attendance ---------------- */
router.post("/event/:eventId/submit", authenticateToken, requireAdmin, async (req, res) => {
  const { eventId } = req.params;
  try {
    const { data, error } = await supabase
      .from("attendance")
      .update({ submitted: true, updated_at: new Date().toISOString() })
      .eq("event_id", eventId);

    if (error) return res.status(500).json({ error: "Failed to submit attendance", details: error });
    return res.json({ message: "Attendance submitted", rowsAffected: data?.length ?? 0 });
  } catch (err) {
    console.error("[ATTENDANCE] submit error:", err);
    return res.status(500).json({ error: "Unexpected server error", details: err.message || err });
  }
});


router.get("/event/:eventId", authenticateToken, requireAdmin, async (req, res) => {
  const { eventId } = req.params;
  try {
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        id,
        event_id,
        student_id,
        status,
        submitted,
        created_at,
        updated_at,
        events!inner(title),
        users!inner(full_name)
      `)
      .eq("event_id", eventId)
      .order("student_id", { ascending: true });

    if (error) {
      console.error("[ATTENDANCE] Error fetching attendance rows:", error);
      return res.status(500).json({ error: "Failed to fetch attendance", details: error });
    }

    // Map into a cleaner format for frontend
    const rows = (data || []).map(r => ({
      id: r.id,
      event_id: r.event_id,
      event_title: r.events?.title || "Untitled Event",
      student_id: r.student_id,
      student_name: r.users?.full_name || "Unknown Student",
      status: r.status,
      submitted: r.submitted,
      created_at: r.created_at,
      updated_at: r.updated_at
    }));

    return res.json({ attendance: rows });
  } catch (err) {
    console.error("[ATTENDANCE] Unexpected error (GET event):", err);
    return res.status(500).json({ error: "Unexpected server error", details: err.message || err });
  }
});

export default router;
