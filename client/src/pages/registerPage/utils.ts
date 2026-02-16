import { getErrorMessage as getErrorMsg } from '../../utils';
import * as consts from './consts';

export const validateName = (name: string): boolean => {
  return name.trim().length > 0;
};

export const validateEmail = (email: string): boolean => {
  return email.trim().length > 0 && email.includes('@');
};

export const validatePassword = (password: string): boolean => {
  return password.length >= consts.MIN_PASSWORD_LENGTH;
};

export const validatePasswordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

export const validateRegisterForm = (
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): { isValid: boolean; error?: string } => {
  if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
    return { isValid: false, error: 'Please fill in all fields' };
  }

  if (!validatePasswordsMatch(password, confirmPassword)) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  if (!validatePassword(password)) {
    return {
      isValid: false,
      error: `Password must be at least ${consts.MIN_PASSWORD_LENGTH} characters`,
    };
  }

  return { isValid: true };
};

export const getErrorMessage = (error: unknown): string =>
  getErrorMsg(error, 'Registration failed');
