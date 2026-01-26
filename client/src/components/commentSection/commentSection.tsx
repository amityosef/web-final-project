import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    IconButton,
    Menu,
    MenuItem,
    Divider,
    CircularProgress,
} from '@mui/material';
import {
    Send as SendIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { Comment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { commentService } from '../../services/commentService';
import { uploadService } from '../../services/uploadService';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../confirmDialog';
import * as styles from './styles';

interface CommentSectionProps {
    postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedComment, setSelectedComment] = useState<Comment | null>(null);

    // Delete confirmation
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const response = await commentService.getCommentsByPost(postId);
            setComments(response.comments);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
            setError('Failed to load comments');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!newComment.trim()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const comment = await commentService.createComment(
                postId,
                newComment.trim()
            );
            setComments((prev) => [...prev, comment]);
            setNewComment('');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to add comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, comment: Comment) => {
        setAnchorEl(event.currentTarget);
        setSelectedComment(comment);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedComment(null);
    };

    const handleEditStart = () => {
        if (selectedComment) {
            setEditingId(selectedComment._id);
            setEditContent(selectedComment.content);
        }
        handleMenuClose();
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditContent('');
    };

    const handleEditSave = async (commentId: string) => {
        if (!editContent.trim()) return;

        try {
            const updated = await commentService.updateComment(
                commentId,
                editContent.trim()
            );
            setComments((prev) =>
                prev.map((c) => (c._id === commentId ? updated : c))
            );
            setEditingId(null);
            setEditContent('');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to update comment');
        }
    };

    const handleDeleteClick = () => {
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedComment) return;

        try {
            await commentService.deleteComment(selectedComment._id);
            setComments((prev) => prev.filter((c) => c._id !== selectedComment._id));
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to delete comment');
        }
        setDeleteConfirmOpen(false);
        handleMenuClose();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <Box sx={styles.loadingContainer}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h6" sx={styles.sectionTitle}>
                Comments ({comments.length})
            </Typography>

            {error && (
                <Typography color="error" variant="body2" sx={styles.errorText}>
                    {error}
                </Typography>
            )}

            {/* Comment Input */}
            <Box sx={styles.commentInputContainer}>
                <Avatar
                    src={uploadService.getImageUrl(user?.profileImage)}
                    sx={styles.commentAvatar}
                >
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                </Avatar>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isSubmitting}
                    multiline
                    maxRows={3}
                />
                <IconButton
                    color="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !newComment.trim()}
                >
                    {isSubmitting ? <CircularProgress size={24} /> : <SendIcon />}
                </IconButton>
            </Box>

            <Divider sx={styles.divider} />

            {/* Comments List */}
            {comments.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={styles.noCommentsText}>
                    No comments yet. Be the first to comment!
                </Typography>
            ) : (
                <List disablePadding>
                    {comments.map((comment) => (
                        <ListItem
                            key={comment._id}
                            alignItems="flex-start"
                            sx={styles.listItem}
                            secondaryAction={
                                user?._id === comment.owner._id && (
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={(e) => handleMenuOpen(e, comment)}
                                    >
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                )
                            }
                        >
                            <ListItemAvatar>
                                <Avatar
                                    src={uploadService.getImageUrl(comment.owner.profileImage)}
                                    onClick={() => navigate(`/profile/${comment.owner._id}`)}
                                    sx={styles.ownerAvatar}
                                >
                                    {comment.owner.name?.[0]?.toUpperCase() || 'U'}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Box sx={styles.commentHeader}>
                                        <Typography
                                            variant="subtitle2"
                                            sx={styles.ownerName}
                                            onClick={() => navigate(`/profile/${comment.owner._id}`)}
                                        >
                                            {comment.owner.name || comment.owner.email}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(comment.createdAt)}
                                        </Typography>
                                    </Box>
                                }
                                secondary={
                                    editingId === comment._id ? (
                                        <Box sx={styles.editContainer}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                multiline
                                                autoFocus
                                            />
                                            <Box sx={styles.editActionsContainer}>
                                                <Button size="small" onClick={handleEditCancel}>
                                                    Cancel
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    onClick={() => handleEditSave(comment._id)}
                                                    disabled={!editContent.trim()}
                                                >
                                                    Save
                                                </Button>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Typography
                                            variant="body2"
                                            color="text.primary"
                                            sx={styles.commentContent}
                                        >
                                            {comment.content}
                                        </Typography>
                                    )
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            )}

            {/* Comment Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleEditStart}>
                    <EditIcon sx={styles.menuIcon} fontSize="small" /> Edit
                </MenuItem>
                <MenuItem onClick={handleDeleteClick} sx={styles.deleteMenuItem}>
                    <DeleteIcon sx={styles.menuIcon} fontSize="small" /> Delete
                </MenuItem>
            </Menu>

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={deleteConfirmOpen}
                title="Delete Comment"
                message="Are you sure you want to delete this comment?"
                confirmText="Delete"
                onConfirm={handleDeleteConfirm}
                onCancel={() => {
                    setDeleteConfirmOpen(false);
                    handleMenuClose();
                }}
            />
        </Box>
    );
};

export default CommentSection;
