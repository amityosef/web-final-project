import { getErrorMessage as getErrorMsg } from '../../utils';

export const validateEmail = (email: string): boolean => {
  return email.trim().length > 0;
};

export const validatePassword = (password: string): boolean => {
  return password.trim().length > 0;
};

export const validateLoginForm = (email: string, password: string): boolean => {
  return validateEmail(email) && validatePassword(password);
};

export const getErrorMessage = (error: unknown): string => getErrorMsg(error, 'Login failed');
