import API from '../api/api';
export function fetchEvents(params) { return API.get('/events', { params }); }
export function createEvent(payload) { return API.post('/events', payload); }
export function getEvent(id) { return API.get(`/events/${id}`); }
