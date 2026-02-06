import api from './api';
import { User } from '../types';

export const userService = {
  getProfile: async (userId: string): Promise<User> => {
    const response = await api.get<User>(`/user/${userId}`);
    return response.data;
  },

  getMyProfile: async (): Promise<User> => {
    const response = await api.get<User>('/user/me');
    return response.data;
  },

  updateProfile: async (
    userId: string,
    data: { name?: string; profileImage?: string }
  ): Promise<User> => {
    const response = await api.put<User>(`/user/${userId}`, data);
    return response.data;
  },
};
