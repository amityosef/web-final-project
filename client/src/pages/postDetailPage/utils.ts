import { formatDateLong, getErrorMessage as getErrorMsg } from '../../utils';
import * as consts from './consts';

export const formatDate = (dateString: string): string => {
  return formatDateLong(dateString, consts.dateLocale);
};

export const getErrorMessage = (error: unknown): string =>
  getErrorMsg(error, 'Failed to load post');
