import { api } from './api';

export async function register(email, password) {
  const response = await api.post('/auth/register', { email, password });
  return response.data;
}

export async function login(email, password) {
  const response = await api.post('/auth/login', { email, password });
  return response.data.access_token;
}

export async function getCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data;
}

export async function logout() {
  await api.post('/auth/logout');
}
