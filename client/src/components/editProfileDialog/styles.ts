import { SystemStyleObject } from '@mui/system';

export const dialogHeader: SystemStyleObject = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const contentContainer: SystemStyleObject = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: 3,
};

export const avatarContainer: SystemStyleObject = {
  position: 'relative',
  marginBottom: 2,
};

export const avatar: SystemStyleObject = {
  width: 100,
  height: 100,
  fontSize: '2.5rem',
};

export const cameraButton: SystemStyleObject = {
  position: 'absolute',
  bottom: 0,
  right: 0,
  backgroundColor: 'primary.main',
  color: 'white',
  '&:hover': {
    backgroundColor: 'primary.dark',
  },
  width: 32,
  height: 32,
};

export const nameField: SystemStyleObject = {
  marginBottom: 2,
};
