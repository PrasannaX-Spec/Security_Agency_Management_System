import api from './client';

export async function getSchedules(params = {}) {
  const res = await api.get('/schedules/', { params });
  return res.data;
}

export async function getSchedule(id) {
  const res = await api.get(`/schedules/${id}/`);
  return res.data;
}

export async function createSchedule(data) {
  const res = await api.post('/schedules/', data);
  return res.data;
}

export async function updateSchedule(id, data) {
  const res = await api.patch(`/schedules/${id}/`, data);
  return res.data;
}

export async function cancelSchedule(id) {
  const res = await api.post(`/schedules/${id}/cancel/`);
  return res.data;
}
