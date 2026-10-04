import api from './client';

// Guards API
export async function getGuards(params = {}) {
  const res = await api.get('/guards/', { params });
  return res.data;
}

export async function createGuard(data) {
  const res = await api.post('/guards/', data);
  return res.data;
}

export async function updateGuard(id, data) {
  const res = await api.patch(`/guards/${id}/`, data);
  return res.data;
}

export async function deactivateGuard(id) {
  const res = await api.patch(`/guards/${id}/deactivate/`);
  return res.data;
}

// Clients API
export async function getClients(params = {}) {
  const res = await api.get('/clients/', { params });
  return res.data;
}

export async function createClient(data) {
  const res = await api.post('/clients/', data);
  return res.data;
}

export async function updateClient(id, data) {
  const res = await api.patch(`/clients/${id}/`, data);
  return res.data;
}

export async function updateClientStatus(id, status) {
  const res = await api.patch(`/clients/${id}/status/`, { status });
  return res.data;
}

// Locations (Sites) API
export async function getLocations(params = {}) {
  const res = await api.get('/sites/', { params });
  return res.data;
}

export async function createLocation(data) {
  const res = await api.post('/sites/', data);
  return res.data;
}

export async function updateLocation(id, data) {
  const res = await api.patch(`/sites/${id}/`, data);
  return res.data;
}

// Duty Posts API
export async function getPosts(params = {}) {
  const res = await api.get('/posts/', { params });
  return res.data;
}

export async function createPost(data) {
  const res = await api.post('/posts/', data);
  return res.data;
}

export async function updatePost(id, data) {
  const res = await api.patch(`/posts/${id}/`, data);
  return res.data;
}

// Supervisors API
export async function getSupervisors(params = {}) {
  const res = await api.get('/supervisors/', { params });
  return res.data;
}

export async function createSupervisor(data) {
  const res = await api.post('/supervisors/', data);
  return res.data;
}

export async function updateSupervisor(id, data) {
  const res = await api.patch(`/supervisors/${id}/`, data);
  return res.data;
}

export async function assignSitesToSupervisor(id, locationIds) {
  const res = await api.post(`/supervisors/${id}/assign-sites/`, { location_ids: locationIds });
  return res.data;
}
