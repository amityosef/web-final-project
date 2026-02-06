import { SystemStyleObject } from '@mui/system';

export const loadingContainer: SystemStyleObject = {
  display: 'flex',
  justifyContent: 'center',
  paddingTop: 3,
  paddingBottom: 3,
};

export const sectionTitle: SystemStyleObject = {
  marginBottom: 2,
};

export const errorText: SystemStyleObject = {
  marginBottom: 2,
};

export const commentInputContainer: SystemStyleObject = {
  display: 'flex',
  gap: 1,
  marginBottom: 3,
};

export const commentAvatar: SystemStyleObject = {
  width: 40,
  height: 40,
};

export const divider: SystemStyleObject = {
  marginBottom: 2,
};

export const noCommentsText: SystemStyleObject = {
  paddingTop: 3,
  paddingBottom: 3,
};

export const listItem: SystemStyleObject = {
  paddingLeft: 0,
  paddingRight: 0,
  '&:hover': {
    backgroundColor: 'action.hover',
  },
  borderRadius: 1,
};

export const ownerAvatar: SystemStyleObject = {
  cursor: 'pointer',
  width: 40,
  height: 40,
};

export const commentHeader: SystemStyleObject = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
};

export const ownerName: SystemStyleObject = {
  cursor: 'pointer',
};

export const editContainer: SystemStyleObject = {
  marginTop: 1,
};

export const editActionsContainer: SystemStyleObject = {
  marginTop: 1,
  display: 'flex',
  gap: 1,
};

export const commentContent: SystemStyleObject = {
  whiteSpace: 'pre-wrap',
  marginTop: 0.5,
};

export const menuIcon: SystemStyleObject = {
  marginRight: 1,
};

export const deleteMenuItem: SystemStyleObject = {
  color: 'error.main',
};
