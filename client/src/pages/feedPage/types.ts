import { Post } from '../../types';

export interface FeedPageState {
  posts: Post[];
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  createDialogOpen: boolean;
  showScrollTop: boolean;
}
