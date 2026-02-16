import { Post } from '../types';

export const updatePostInList = (posts: Post[], updatedPost: Post): Post[] => {
  return posts.map((p) => (p._id === updatedPost._id ? updatedPost : p));
};

export const removePostFromList = (posts: Post[], postId: string): Post[] => {
  return posts.filter((p) => p._id !== postId);
};

export const removeDuplicatePosts = (existing: Post[], newPosts: Post[]): Post[] => {
  const newPostsFiltered = newPosts.filter(
    (newPost) => !existing.some((p) => p._id === newPost._id)
  );
  return [...existing, ...newPostsFiltered];
};
