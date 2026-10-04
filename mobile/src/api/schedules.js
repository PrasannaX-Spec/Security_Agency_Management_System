import api from './client';

export async function getMyDuties() {
  const response = await api.get('/schedules/my/');
  return response.data?.data ?? response.data;
}
