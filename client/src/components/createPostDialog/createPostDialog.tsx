import React, { useState, useRef } from 'react';
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
} from '@mui/material';
import { Close as CloseIcon, AddPhotoAlternate as AddPhotoIcon } from '@mui/icons-material';
import { postService } from '../../services/postService';
import { uploadService } from '../../services/uploadService';
import * as styles from './styles';
import * as strings from './strings';
import * as types from './types';
import * as utils from './utils';

const CreatePostDialog: React.FC<types.CreatePostDialogProps> = ({ open, onClose, onCreate }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validationError = utils.validateImage(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setImage(file);
      setImagePreview(utils.createImagePreview(file));
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    utils.revokeImagePreview(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      handleRemoveImage();
      setContent('');
      setError(null);
      onClose();
    }
  };

  const handleSubmit = async () => {
    const validationError = utils.validateContent(content, !!image);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let imageUrl: string | undefined;

      if (image) {
        const uploadResponse = await uploadService.uploadImage(image);
        imageUrl = uploadResponse.url;
      }

      const newPost = await postService.createPost({
        content: content.trim(),
        image: imageUrl,
      });

      onCreate?.(newPost);
      handleClose();
    } catch (error) {
      setError(utils.getErrorMessage(error, strings.errorCreatePost));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={styles.dialogHeader}>
          <Typography variant="h6">{strings.dialogTitle}</Typography>
          <IconButton onClick={handleClose} disabled={isLoading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          rows={4}
          placeholder={strings.contentPlaceholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
          sx={styles.textField}
        />

        {imagePreview && (
          <Box sx={styles.imagePreviewContainer}>
            <img src={imagePreview} style={styles.imagePreviewStyles} />
            <IconButton
              onClick={handleRemoveImage}
              disabled={isLoading}
              sx={styles.removeImageButton}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        )}

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageSelect}
          style={{ display: 'none' }}
        />
        <Button
          variant="outlined"
          startIcon={<AddPhotoIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || !!imagePreview}
          sx={styles.addPhotoButton}
        >
          {strings.addPhotoButtonText}
        </Button>

        {error && (
          <Typography color="error" variant="body2" sx={styles.errorText}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          {strings.cancelButtonText}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading || (!content.trim() && !image)}
        >
          {isLoading ? <CircularProgress size={24} /> : strings.postButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePostDialog;
