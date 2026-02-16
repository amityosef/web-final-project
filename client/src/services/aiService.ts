import api from './api';
import { AISearchResponse } from '../types';

export const aiService = {
  smartSearch: async (query: string): Promise<AISearchResponse> => {
    const { data } = await api.post<AISearchResponse>('/ai/search', { query });
    return data;
  },

  reindexPosts: async (): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/ai/reindex');
    return data;
  },
};
