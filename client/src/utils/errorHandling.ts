export const getErrorMessage = (
  error: unknown,
  defaultMessage: string = 'An error occurred'
): string => {
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    return err.response?.data?.message || err.message || defaultMessage;
  }
  return defaultMessage;
};
