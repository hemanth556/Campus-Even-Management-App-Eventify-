import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import eventsRoutes from './routes/events.js';
import registrationsRoutes from './routes/registrations.js';
import reportsRoutes from './routes/reports.js';
import collegeRoutes from './routes/college.js';
import adminRoutes from "./routes/admin.js";
import attendanceRoutes from "./routes/attendance.js";




dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;


console.log( process.env.FRONTEND_URL)

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

app.use('/api/colleges', collegeRoutes);


app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);






app.get('/', (req, res) => res.json({ ok: true, message: 'Event Management Backend' }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
