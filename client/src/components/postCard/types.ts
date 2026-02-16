import { Post } from '../../types';

export interface PostCardProps {
  post: Post;
  onUpdate?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}
