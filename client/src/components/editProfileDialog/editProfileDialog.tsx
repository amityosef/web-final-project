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
import {
    Close as CloseIcon,
    CameraAlt as CameraIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { uploadService } from '../../services/uploadService';
import * as styles from './styles';
import * as consts from './consts';

interface EditProfileDialogProps {
    open: boolean;
    onClose: () => void;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({ open, onClose }) => {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(
        user?.profileImage ? uploadService.getImageUrl(user.profileImage) : null
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when user changes or dialog opens
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
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file');
                return;
            }
            if (file.size > consts.MAX_FILE_SIZE) {
                setError('Image must be less than 5MB');
                return;
            }
            setProfileImage(file);
            setImagePreview(URL.createObjectURL(file));
            setError(null);
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            // Clean up object URL if created
            if (imagePreview && profileImage) {
                URL.revokeObjectURL(imagePreview);
            }
            onClose();
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let newProfileImage: string | undefined;

            // Upload new profile image if selected
            if (profileImage) {
                const uploadResponse = await uploadService.uploadImage(profileImage);
                newProfileImage = uploadResponse.url;
            }

            // Update profile
            const updatedUser = await userService.updateProfile(user!._id, {
                name: name.trim(),
                ...(newProfileImage && { profileImage: newProfileImage }),
            });

            updateUser(updatedUser);
            handleClose();
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Box sx={styles.dialogHeader}>
                    <Typography variant="h6">Edit Profile</Typography>
                    <IconButton onClick={handleClose} disabled={isLoading}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <DialogContent>
                <Box sx={styles.contentContainer}>
                    {/* Profile Image */}
                    <Box sx={styles.avatarContainer}>
                        <Avatar
                            src={imagePreview || undefined}
                            sx={styles.avatar}
                        >
                            {name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                        <IconButton
                            onClick={() => fileInputRef.current?.click()}
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
                    label="Display Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    sx={styles.nameField}
                />

                {/* Error Message */}
                {error && (
                    <Typography color="error" variant="body2">
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
                    disabled={isLoading || !name.trim()}
                >
                    {isLoading ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditProfileDialog;
