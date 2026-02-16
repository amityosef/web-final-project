import { Post } from '../../types';

export interface EditPostDialogProps {
  open: boolean;
  post: Post;
  onClose: () => void;
  onUpdate?: (post: Post) => void;
}
