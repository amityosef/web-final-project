export const formatProcessingTime = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  return `${(milliseconds / 1000).toFixed(2)}s`;
};

import {
  getInitials as getInitialsShared,
  getDisplayName as getDisplayNameShared,
  formatDate as formatDateShared,
} from '../../utils';

export const getInitials = (name?: string): string => {
  return getInitialsShared(name, undefined);
};

export const getDisplayName = (name?: string, email?: string): string => {
  return getDisplayNameShared(name, email);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const formatRelevanceScore = (score: number): string => {
  return `${(score * 100).toFixed(0)}%`;
};

export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Unknown';
  return formatDateShared(dateString);
};
