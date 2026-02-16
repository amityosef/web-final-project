import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Typography,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { Close as CloseIcon, CameraAlt as CameraIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { uploadService } from '../../services/uploadService';
import * as styles from './styles';
import * as strings from './strings';
import * as types from './types';
import * as utils from './utils';

const EditProfileDialog: React.FC<types.EditProfileDialogProps> = ({ open, onClose }) => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    user?.profileImage ? uploadService.getImageUrl(user.profileImage) : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && user) {
      setName(user.name || '');
      setProfileImage(null);
      setImagePreview(user.profileImage ? uploadService.getImageUrl(user.profileImage) : null);
      setError(null);
    }
  }, [open, user]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validationError = utils.validateImage(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setProfileImage(file);
      setImagePreview(utils.createImagePreview(file));
      setError(null);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      if (imagePreview && profileImage) {
        utils.revokeImagePreview(imagePreview);
      }
      onClose();
    }
  };

  const handleSubmit = async () => {
    const validationError = utils.validateName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let newProfileImage: string | undefined;

      if (profileImage) {
        const uploadResponse = await uploadService.uploadImage(profileImage);
        newProfileImage = uploadResponse.url;
      }

      const updatedUser = await userService.updateProfile(user!._id, {
        name: name.trim(),
        ...(newProfileImage && { profileImage: newProfileImage }),
      });

      updateUser(updatedUser);
      handleClose();
    } catch (error) {
      setError(utils.getErrorMessage(error, strings.errorUpdateProfile));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box sx={styles.dialogHeader}>
          <Typography variant="h6">{strings.dialogTitle}</Typography>
          <IconButton onClick={handleClose} disabled={isLoading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={styles.contentContainer}>
          <Box sx={styles.avatarContainer}>
            <Avatar src={imagePreview || undefined} sx={styles.avatar}>
              {utils.getInitials(name, user?.email)}
            </Avatar>
            <IconButton
              onClick={fileInputRef.current?.click}
              disabled={isLoading}
              sx={styles.cameraButton}
            >
              <CameraIcon fontSize="small" />
            </IconButton>
          </Box>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />

          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>

        <TextField
          fullWidth
          label={strings.displayNameLabel}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          sx={styles.nameField}
        />

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          {strings.cancelButtonText}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isLoading || !name.trim()}>
          {isLoading ? <CircularProgress size={24} /> : strings.saveButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileDialog;
