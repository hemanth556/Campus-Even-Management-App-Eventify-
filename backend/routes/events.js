import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/adminMiddleware.js';
import {
  createEvent,
  updateEvent,
  getEvents,
  getEventById,
  cancelEvent,
  getEventsForAdmin
} from '../controllers/eventsController.js';
import { getEligibleEvents } from '../controllers/eventsController.js';
import { supabase } from '../db/client.js';

const router = express.Router();

router.post('/', authenticateToken, requireAdmin, createEvent);
router.get('/eligible', authenticateToken, getEligibleEvents);
router.put('/:id', authenticateToken, requireAdmin, updateEvent);
router.post('/:id/cancel', authenticateToken, requireAdmin, cancelEvent);
router.get('/', authenticateToken, getEvents);
router.get('/:id', authenticateToken, getEventById);
router.get('/admin/my-events', authenticateToken, requireAdmin, getEventsForAdmin);
router.post("/:id/complete", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Completing event with ID:", id);

    // Correctly destructure data and error
    const { data, error } = await supabase
      .from("events")
      .update({ completed: true })
      .eq("id", id)
      .select()
      .single(); // optional, to get updated row

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Event marked as completed", event: data });
  } catch (err) {
    console.error("Complete Event Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get('/:eventId/registrations', authenticateToken, requireAdmin, async (req, res) => {
  const { eventId } = req.params;
  try {
    // Fetch registrations for this event
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('*, users(full_name, college_id, sem)')
      .eq('event_id', eventId);

    if (error) throw error;

    res.json({ registrations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});


router.get('/college', authenticateToken, async (req, res) => {
  const { college_id } = req.query;
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('college_id', college_id)
      .order('start_time', { ascending: true });
    if (error) throw error;
    res.json({ events: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch college events' });
  }
});

export default router;
