import { api } from './api';

export async function listTodos(period) {
  const response = await api.get('/todos', { params: period ? { period } : undefined });
  return response.data;
}

export async function createTodo({ title, description, period }) {
  const response = await api.post('/todos', { title, description, period });
  return response.data;
}

export async function updateTodo(id, changes) {
  const response = await api.patch(`/todos/${id}`, changes);
  return response.data;
}

export async function deleteTodo(id) {
  await api.delete(`/todos/${id}`);
}
