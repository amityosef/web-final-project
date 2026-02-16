import {
  getInitials as getInitialsShared,
  getDisplayName as getDisplayNameShared,
  updatePostInList,
  removePostFromList,
  getErrorMessage as getErrorMsg,
} from '../../utils';

export { updatePostInList, removePostFromList };

export const getInitials = (name?: string, email?: string): string => {
  return getInitialsShared(name, email);
};

export const getDisplayName = (name?: string): string => {
  return getDisplayNameShared(name, undefined) || 'Unnamed User';
};

export const getErrorMessage = (error: unknown): string =>
  getErrorMsg(error, 'Failed to load profile');
