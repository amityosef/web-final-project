export interface RegisterPageState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  error: string | null;
  isLoading: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
