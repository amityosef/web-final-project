import { SystemStyleObject } from '@mui/system';

export const logoText: SystemStyleObject = {
  cursor: 'pointer',
};

export const actionsContainer: SystemStyleObject = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

export const avatarButton: SystemStyleObject = {
  padding: 0,
  marginLeft: 1,
};

export const avatar: SystemStyleObject = {
  width: 36,
  height: 36,
};

export const menuIcon: SystemStyleObject = {
  marginRight: 1,
};

export const flexGrow: SystemStyleObject = {
  flexGrow: 1,
};

export const searchContainer: SystemStyleObject = {
  position: 'relative',
  borderRadius: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  marginRight: 2,
  marginLeft: 0,
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  '@media (min-width: 600px)': {
    marginLeft: 3,
    width: 'auto',
  },
};

export const searchIconWrapper: SystemStyleObject = {
  padding: '0 16px',
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const searchInput: SystemStyleObject = {
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: '8px 8px 8px 0',
    paddingLeft: 'calc(1em + 32px)',
    width: '100%',
    '@media (min-width: 960px)': {
      width: '20ch',
    },
  },
};
