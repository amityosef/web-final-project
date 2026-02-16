import { Post } from '../../types';

export interface PostDetailPageState {
  post: Post | null;
  isLoading: boolean;
  error: string | null;
  liked: boolean;
  likesCount: number;
  likeLoading: boolean;
  anchorEl: HTMLElement | null;
  editDialogOpen: boolean;
  deleteConfirmOpen: boolean;
}
