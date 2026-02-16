import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import * as strings from './strings';
import * as types from './types';
import * as consts from './consts';

const ConfirmDialog: React.FC<types.ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmText = strings.defaultConfirmText,
  cancelText = strings.defaultCancelText,
  onConfirm,
  onCancel,
  confirmColor = consts.defaultConfirmColor,
}) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth={consts.maxWidth} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{cancelText}</Button>
        <Button onClick={onConfirm} color={confirmColor} variant="contained" autoFocus>
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
