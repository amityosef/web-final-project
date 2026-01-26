import api, { setTokens, clearTokens, getTokens } from './api';
import { AuthResponse, User } from '../types';

export const authService = {
  register: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      name,
    });
    setTokens(response.data.token, response.data.refreshToken);
    return response.data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
    });
    setTokens(response.data.token, response.data.refreshToken);
    return response.data;
  },

  googleLogin: async (credential: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/google', {
      credential,
    });
    setTokens(response.data.token, response.data.refreshToken);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const { refreshToken } = getTokens();
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
    }
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const { refreshToken } = getTokens();
    const response = await api.post<AuthResponse>('/auth/refresh-token', {
      refreshToken,
    });
    setTokens(response.data.token, response.data.refreshToken);
    return response.data;
  },
};
