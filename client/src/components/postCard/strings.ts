export const editMenuLabel = 'Edit';
export const deleteMenuLabel = 'Delete';
export const deleteDialogTitle = 'Delete Post';
export const deleteDialogMessage =
  'Are you sure you want to delete this post? This action cannot be undone.';
export const deleteConfirmText = 'Delete';
export const likesLabel = (count: number): string => (count === 1 ? '1 like' : `${count} likes`);
export const commentsLabel = (count: number): string =>
  count === 1 ? '1 comment' : `${count} comments`;
