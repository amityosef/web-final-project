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

import { getErrorMessage as getErrorMsg } from '../../utils';

export const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  return getErrorMsg(error, defaultMessage);
};

export const validateContent = (content: string, hasImage: boolean): string | null => {
  if (!content.trim() && !hasImage) {
    return strings.errorNoContent;
  }
  return null;
};
