import api from './client';

export const complaintApi = {
  getStats: async () => {
    const response = await api.get('/complaints/stats');
    return response.data;
  },

  getRegistered: async (params = {}) => {
    const response = await api.get('/complaints', { params });
    return response.data;
  },

  getCompleted: async (params = {}) => {
    const response = await api.get('/complaints/completed', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },

  create: async (formData) => {
    const response = await api.post('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  markCompleted: async (id, data = {}) => {
    const response = await api.patch(`/complaints/${id}/complete`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/complaints/${id}`);
    return response.data;
  },

  exportPDF: async () => {
    const response = await api.get('/complaints/export/pdf', {
      responseType: 'blob',
    });
    return response;
  },

  searchShops: async (query) => {
    const response = await api.get('/complaints/shops/search', {
      params: { q: query },
    });
    return response.data;
  },
};
