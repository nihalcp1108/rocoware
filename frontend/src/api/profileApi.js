import api from './client';

export const profileApi = {
  updateEmail: async (data) => {
    const response = await api.put('/profile/email', data);
    return response.data;
  },

  updatePassword: async (data) => {
    const response = await api.put('/profile/password', data);
    return response.data;
  },
};
