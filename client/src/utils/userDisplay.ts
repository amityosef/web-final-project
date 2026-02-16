export const getInitials = (name?: string, email?: string): string => {
  if (name && name.length > 0) {
    return name[0].toUpperCase();
  }
  if (email && email.length > 0) {
    return email[0].toUpperCase();
  }
  return 'U';
};

export const getDisplayName = (name?: string, email?: string): string => {
  return name || email || 'Unknown';
};
