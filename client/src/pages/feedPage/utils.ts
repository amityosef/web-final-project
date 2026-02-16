import {
  removeDuplicatePosts,
  updatePostInList,
  removePostFromList,
  getErrorMessage as getErrorMsg,
} from '../../utils';

export { removeDuplicatePosts, updatePostInList, removePostFromList };

export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

export const getErrorMessage = (error: unknown): string =>
  getErrorMsg(error, 'Failed to load posts');
