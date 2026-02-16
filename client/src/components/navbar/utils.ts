import { getInitials as getInitialsShared } from '../../utils';

export const getInitials = (name?: string): string => {
  return getInitialsShared(name, undefined);
};

export const getAvatarAlt = (name?: string): string => {
  return name || 'User';
};
