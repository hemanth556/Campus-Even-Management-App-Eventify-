import API from '../api/api';
export function registerEvent(event_id) { return API.post('/registrations/register', { event_id }); }
export function submitFeedback(payload) { return API.post('/registrations/feedback', payload); }
export function markAttendance(payload) { return API.post('/registrations/attendance', payload); } // admin only
