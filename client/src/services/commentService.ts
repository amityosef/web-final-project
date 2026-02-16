import api from './api';
import { Comment, CommentsResponse } from '../types';

export const commentService = {
  getCommentsByPost: async (
    postId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<CommentsResponse> => {
    const response = await api.get<CommentsResponse>(`/comment/post/${postId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  getCommentById: async (commentId: string): Promise<Comment> => {
    const response = await api.get<Comment>(`/comment/${commentId}`);
    return response.data;
  },

  createComment: async (postId: string, content: string): Promise<Comment> => {
    const response = await api.post<Comment>(`/comment/post/${postId}`, {
      content,
    });
    return response.data;
  },

  updateComment: async (commentId: string, content: string): Promise<Comment> => {
    const response = await api.put<Comment>(`/comment/${commentId}`, {
      content,
    });
    return response.data;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`/comment/${commentId}`);
  },
};
