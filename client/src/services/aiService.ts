import api from './api';
import { AISearchResponse, AIAnalysisResponse, AISuggestionsResponse } from '../types';

interface GenerateSuggestionsOptions {
  topic?: string;
}

export const aiService = {
  smartSearch: async (query: string): Promise<AISearchResponse> => {
    const response = await api.post<AISearchResponse>('/ai/search', { query });
    return response.data;
  },

  analyzePost: async (postId: string): Promise<AIAnalysisResponse> => {
    const response = await api.get<AIAnalysisResponse>(`/ai/analyze/${postId}`);
    return response.data;
  },

  generateSuggestions: async (
    options: GenerateSuggestionsOptions = {}
  ): Promise<AISuggestionsResponse> => {
    const response = await api.post<AISuggestionsResponse>('/ai/suggestions', options);
    return response.data;
  },
};
