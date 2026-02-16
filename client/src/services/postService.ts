import api from './api';
import { Post, PostsResponse } from '../types';

interface CreatePostData {
  content: string;
  image?: string;
}

interface UpdatePostData {
  content?: string;
  image?: string;
}

export const postService = {
  getPosts: async (page: number = 1, limit: number = 10): Promise<PostsResponse> => {
    const response = await api.get<PostsResponse>('/post', {
      params: { page, limit },
    });
    return response.data;
  },

  getPostById: async (postId: string): Promise<Post> => {
    const response = await api.get<Post>(`/post/${postId}`);
    return response.data;
  },

  getUserPosts: async (userId: string): Promise<Post[]> => {
    const response = await api.get<PostsResponse>(`/post/user/${userId}`);
    return response.data.posts;
  },

  createPost: async (data: CreatePostData): Promise<Post> => {
    const response = await api.post<Post>('/post', data);
    return response.data;
  },

  updatePost: async (postId: string, data: UpdatePostData): Promise<Post> => {
    const response = await api.put<Post>(`/post/${postId}`, data);
    return response.data;
  },

  deletePost: async (postId: string): Promise<void> => {
    await api.delete(`/post/${postId}`);
  },

  toggleLike: async (
    postId: string
  ): Promise<{ postId: string; isLiked: boolean; likesCount: number }> => {
    const response = await api.post<{ postId: string; isLiked: boolean; likesCount: number }>(
      `/post/${postId}/like`
    );
    return response.data;
  },
};
