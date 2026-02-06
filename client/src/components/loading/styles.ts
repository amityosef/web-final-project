import { SystemStyleObject } from '@mui/system';

export const container: SystemStyleObject = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 2,
};

export const fullScreen: SystemStyleObject = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'background.default',
  zIndex: 9999,
};

export const normal: SystemStyleObject = {
  paddingTop: 4,
  paddingBottom: 4,
};
