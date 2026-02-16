import { CredentialResponse } from '@react-oauth/google';

export interface LoginPageState {
  email: string;
  password: string;
  error: string | null;
  isLoading: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export type GoogleSuccessHandler = (response: CredentialResponse) => Promise<void>;
export type GoogleErrorHandler = () => void;
