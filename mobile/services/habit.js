import { api } from './api';

export async function listHabits() {
  const response = await api.get('/habits');
  return response.data;
}

export async function createHabit({ name, period }) {
  const response = await api.post('/habits', { name, period });
  return response.data;
}

export async function deleteHabit(id) {
  await api.delete(`/habits/${id}`);
}

export async function listCheckIns(habitId) {
  const response = await api.get(`/habits/${habitId}/checkins`);
  return response.data;
}

export async function createCheckIn(habitId, periodKey) {
  const response = await api.post(`/habits/${habitId}/checkins`, { period_key: periodKey });
  return response.data;
}

export async function deleteCheckIn(habitId, periodKey) {
  await api.delete(`/habits/${habitId}/checkins/${periodKey}`);
}
