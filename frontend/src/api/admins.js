import api from './axios';

export const adminsAPI = {
  getAll: () => api.get('/admins').then(res => res.data),
  create: (data) => api.post('/admins', data).then(res => res.data),
  update: (id, data) => api.put(`/admins/${id}`, data).then(res => res.data), // 👈 Added Update
  delete: (id) => api.delete(`/admins/${id}`).then(res => res.data),
};