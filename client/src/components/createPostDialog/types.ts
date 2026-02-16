import { Post } from '../../types';

export interface CreatePostDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate?: (post: Post) => void;
}

export interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}
