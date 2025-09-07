import express from "express";
import { supabase } from '../db/client.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/adminMiddleware.js';
const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

// ✅ Admin profile with college name
router.get("/profile", async (req, res) => {
  try {
    const adminId = req.user.id; 
    console.log("Admin user from token:", req.user);

    // Query the users table instead of admins
    const { data, error } = await supabase
      .from("users")
      .select("full_name, college_id")
      .eq("id", adminId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Admin not found" });

    res.json({
      name: data.full_name,
      college_name: data.colleges?.college_name || "Unknown College",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Get admin-specific stats
router.get("/my-stats", async (req, res) => {
  try {
    const adminId = req.user.id;

    // total events created
    const { count: totalEventsCreated, error: err1 } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("created_by", adminId);
    if (err1) throw err1;

    // total events completed
    const { count: totalEventsCompleted, error: err2 } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("created_by", adminId)
      .eq("completed", true);
    if (err2) throw err2;

    // total events cancelled
    const { count: totalEventsCancelled, error: err3 } = await supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("created_by", adminId)
      .eq("cancelled", true);
    if (err3) throw err3;

    // total registrations across events created by this admin
    const { data: eventData, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .eq("created_by", adminId);
    if (eventErr) throw eventErr;

    const eventIds = eventData.map(e => e.id);

    const { count: totalRegistrations, error: err4 } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .in("event_id", eventIds);
    if (err4) throw err4;

    res.json({
      totalEventsCreated: totalEventsCreated || 0,
      totalEventsCompleted: totalEventsCompleted || 0,
      totalEventsCancelled: totalEventsCancelled || 0,
      totalRegistrations: totalRegistrations || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
