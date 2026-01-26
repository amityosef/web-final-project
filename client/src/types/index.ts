export interface User {
  _id: string;
  email: string;
  name: string;
  profileImage: string;
  postsCount?: number;
  createdAt?: string;
}

export interface Post {
  _id: string;
  content: string;
  image: string;
  owner: User;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  postId: string;
  owner: User;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

export interface PostsResponse {
  posts: Post[];
  pagination: Pagination;
}

export interface CommentsResponse {
  comments: Comment[];
  pagination: Pagination;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface AISearchResponse {
  posts: Post[];
  aiAnalysis: {
    searchTerms: string[];
    topics: string[];
    sentiment: string;
    explanation: string;
  } | null;
  totalResults: number;
  fallback?: boolean;
}

export interface AIAnalysisResponse {
  postId: string;
  analysis: {
    topic: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    tags: string[];
    summary: string;
  };
}

export interface AISuggestionsResponse {
  suggestions: {
    title: string;
    content: string;
  }[];
}
