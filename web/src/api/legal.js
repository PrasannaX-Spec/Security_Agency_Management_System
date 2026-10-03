import api from './client';

export async function getTerms() {
  const response = await api.get('/legal/terms/');
  return response.data?.data ?? response.data;
}

export async function getPrivacy() {
  const response = await api.get('/legal/privacy/');
  return response.data?.data ?? response.data;
}
