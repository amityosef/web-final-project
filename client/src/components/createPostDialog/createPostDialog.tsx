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
import {
    Close as CloseIcon,
    AddPhotoAlternate as AddPhotoIcon,
} from '@mui/icons-material';
import { postService } from '../../services/postService';
import { uploadService } from '../../services/uploadService';
import { Post } from '../../types';
import * as styles from './styles';
import * as consts from './consts';

interface CreatePostDialogProps {
    open: boolean;
    onClose: () => void;
    onCreate?: (post: Post) => void;
}

const CreatePostDialog: React.FC<CreatePostDialogProps> = ({ open, onClose, onCreate }) => {
    const [content, setContent] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }
            if (file.size > consts.MAX_FILE_SIZE) {
                setError('Image must be less than 5MB');
                return;
            }
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleRemoveImage = () => {
        setImage(null);
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
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
        if (!content.trim() && !image) {
            setError('Please add some content or an image');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let imageUrl: string | undefined;

            // Upload image if selected
            if (image) {
                const uploadResponse = await uploadService.uploadImage(image);
                imageUrl = uploadResponse.url;
            }

            // Create post
            const newPost = await postService.createPost({
                content: content.trim(),
                image: imageUrl,
            });

            onCreate?.(newPost);
            handleClose();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to create post');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={styles.dialogHeader}>
                    <Typography variant="h6">Create Post</Typography>
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
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isLoading}
                    sx={styles.textField}
                />

                {/* Image Preview */}
                {imagePreview && (
                    <Box sx={styles.imagePreviewContainer}>
                        <img
                            src={imagePreview}
                            alt="Preview"
                            style={{
                                width: '100%',
                                maxHeight: 300,
                                objectFit: 'contain',
                                borderRadius: 8,
                            }}
                        />
                        <IconButton
                            onClick={handleRemoveImage}
                            disabled={isLoading}
                            sx={styles.removeImageButton}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                )}

                {/* Add Image Button */}
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
                    Add Photo
                </Button>

                {/* Error Message */}
                {error && (
                    <Typography color="error" variant="body2" sx={styles.errorText}>
                        {error}
                    </Typography>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={isLoading}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isLoading || (!content.trim() && !image)}
                >
                    {isLoading ? <CircularProgress size={24} /> : 'Post'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreatePostDialog;
