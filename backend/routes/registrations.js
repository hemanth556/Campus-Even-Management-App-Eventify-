import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/adminMiddleware.js';
import { registerStudent, markAttendance, submitFeedback } from '../controllers/registrationsController.js';

const router = express.Router();

router.post('/register', authenticateToken, registerStudent);
router.post('/attendance', authenticateToken, requireAdmin, markAttendance);
router.post('/feedback', authenticateToken, submitFeedback);

export default router;
