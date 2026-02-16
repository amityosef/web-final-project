import * as consts from './consts';
import * as strings from './strings';

export const validateImage = (file: File): string | null => {
  if (!file.type.startsWith('image/')) {
    return strings.errorInvalidFileType;
  }
  if (file.size > consts.MAX_FILE_SIZE) {
    return strings.errorFileTooLarge;
  }
  return null;
};

export const createImagePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

export const revokeImagePreview = (url: string | null): void => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};

import { getErrorMessage as getErrorMsg, getInitials as getInitialsShared } from '../../utils';

export const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  return getErrorMsg(error, defaultMessage);
};

export const getInitials = (name?: string, email?: string): string => {
  return getInitialsShared(name, email);
};

export const validateName = (name: string): string | null => {
  if (!name.trim()) {
    return strings.errorNameRequired;
  }
  return null;
};
