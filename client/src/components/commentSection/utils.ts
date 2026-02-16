import {
  formatDateLong,
  getInitials as getInitialsShared,
  getDisplayName as getDisplayNameShared,
  getErrorMessage as getErrorMsg,
} from '../../utils';

export const formatDate = (dateString: string): string => {
  return formatDateLong(dateString, 'en-US');
};

export const getInitials = (name?: string): string => {
  return getInitialsShared(name, undefined);
};

export const getDisplayName = (name?: string, email?: string): string => {
  return getDisplayNameShared(name, email);
};

export const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  return getErrorMsg(error, defaultMessage);
};
