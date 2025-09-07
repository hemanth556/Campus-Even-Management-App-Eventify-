// routes/reports.js
import express from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { requireAdmin } from '../middlewares/adminMiddleware.js';
import {
  eventPopularityReport,
  studentParticipationReport,
  flexibleReport,
  registrationsPerEvent,
  attendancePercentage,
  averageFeedbackScore
} from '../controllers/reportsController.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/event-popularity', eventPopularityReport);
router.get('/top-active-students', studentParticipationReport);
router.get('/flexible', flexibleReport);

router.get('/registrations-per-event', registrationsPerEvent);
router.get('/attendance-percentage', attendancePercentage);
router.get('/average-feedback', averageFeedbackScore);

export default router;
