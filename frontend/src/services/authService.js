import API from '../api/api';
export function login(payload) { return API.post('/auth/login', payload); }
export function signup(payload) { return API.post('/auth/signup', payload); }
