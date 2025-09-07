import API from '../api/api';
export function getEventPopularity() { return API.get('/reports/event-popularity'); }
export function getTopStudents() { return API.get('/reports/top-active-students'); }
export function getFlexible(params) { return API.get('/reports/flexible', { params }); }
