import api from './axios';

export const schedulesAPI = {
  getAll: () => api.get('/schedules').then(res => res.data),
  
  // New functions
  getById: (id) => api.get(`/schedules/${id}`).then(res => res.data),
  getLogs: (id, date) => api.get(`/schedules/${id}/logs?date=${date}`).then(res => res.data),

  getByKiosk: (kioskId) => api.get(`/schedules/kiosk/${kioskId}`).then(res => res.data),
  assignToKiosk: (scheduleId, kioskId) => api.post('/schedules/assign', { scheduleId, kioskId }).then(res => res.data),
  
  create: (data) => api.post('/schedules', data).then(res => res.data),
  update: (id, data) => api.put(`/schedules/${id}`, data).then(res => res.data),
  delete: (id) => api.delete(`/schedules/${id}`).then(res => res.data),
};