import { SystemStyleObject } from '@mui/system';
import { CSSProperties } from 'react';

export const dialogHeader: SystemStyleObject = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const textField: SystemStyleObject = {
  marginBottom: 2,
};

export const imagePreviewContainer: SystemStyleObject = {
  position: 'relative',
  marginBottom: 2,
};

export const removeImageButton: SystemStyleObject = {
  position: 'absolute',
  top: 8,
  right: 8,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: 'white',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
};

export const addPhotoButton: SystemStyleObject = {
  marginBottom: 1,
};

export const errorText: SystemStyleObject = {
  marginTop: 1,
};

export const imagePreviewStyles: CSSProperties = {
  width: '100%',
  maxHeight: 300,
  objectFit: 'contain',
  borderRadius: 8,
};
