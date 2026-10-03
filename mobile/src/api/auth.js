import api from './client';

export async function login(username, password) {
  const response = await api.post('/auth/login/', { username, password });
  return response.data?.data ?? response.data;
}

export async function getMe() {
  const response = await api.get('/auth/me/');
  return response.data?.data ?? response.data;
}

export async function acceptTerms() {
  const response = await api.post('/auth/accept-terms/');
  return response.data?.data ?? response.data;
}
