import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
  Menu,
  MenuItem,
  CardMedia,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { postService } from '../../services/postService';
import { uploadService } from '../../services/uploadService';
import { Post } from '../../types';
import { CommentSection, EditPostDialog, ConfirmDialog, Navbar } from '../../components';
import * as styles from './styles';
import * as strings from './strings';
import * as utils from './utils';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isOwner = user?._id === post?.owner._id;

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const postData = await postService.getPostById(postId!);
      setPost(postData);
      setLiked(postData.isLiked);
      setLikesCount(postData.likesCount);
    } catch (error: unknown) {
      setError(utils.getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [fetchPost, postId]);

  const handleLike = async () => {
    if (likeLoading || !post) return;
    setLikeLoading(true);

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));

    try {
      const response = await postService.toggleLike(post._id);
      setLiked(response.isLiked);
      setLikesCount(response.likesCount);
    } catch (error) {
      setLiked(wasLiked);
      setLikesCount((prev) => (wasLiked ? prev + 1 : prev - 1));
      console.error('Failed to toggle like:', error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    handleMenuClose();
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!post) return;

    try {
      await postService.deletePost(post._id);
      navigate('/');
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
    setDeleteConfirmOpen(false);
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPost(updatedPost);
    setEditDialogOpen(false);
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md" sx={styles.container}>
          <Box sx={styles.loadingContainer}>
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md" sx={styles.container}>
          <Alert severity="error">{error || strings.postNotFoundMessage}</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={styles.container}>
        <IconButton onClick={() => navigate(-1)} sx={styles.backButton}>
          <BackIcon />
        </IconButton>

        <Paper sx={styles.postPaper}>
          <Box sx={styles.postHeader}>
            <Avatar
              src={uploadService.getImageUrl(post.owner.profileImage)}
              onClick={() => navigate(`/profile/${post.owner._id}`)}
              sx={styles.ownerAvatar}
            >
              {post.owner.name?.[0]?.toUpperCase() || 'U'}
            </Avatar>

            <Box sx={styles.ownerInfo}>
              <Typography
                variant="subtitle1"
                sx={styles.ownerName}
                onClick={() => navigate(`/profile/${post.owner._id}`)}
              >
                {post.owner.name || post.owner.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {utils.formatDate(post.createdAt)}
              </Typography>
            </Box>

            {isOwner && (
              <IconButton onClick={handleMenuOpen}>
                <MoreVertIcon />
              </IconButton>
            )}
          </Box>

          {post.image && (
            <CardMedia
              component="img"
              image={uploadService.getImageUrl(post.image)}
              alt="Post image"
              sx={styles.postImage}
            />
          )}

          <Typography variant="body1" sx={styles.postContent}>
            {post.content}
          </Typography>

          <Box sx={styles.likeContainer}>
            <Box sx={styles.likeButton}>
              <IconButton onClick={handleLike} disabled={likeLoading}>
                {liked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
              </IconButton>
              <Typography variant="body2" color="text.secondary">
                {likesCount} {likesCount === 1 ? 'like' : 'likes'}
              </Typography>
            </Box>
          </Box>

          <Divider sx={styles.divider} />

          <CommentSection postId={post._id} />
        </Paper>
      </Container>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={styles.menuIcon} /> {strings.editPostLabel}
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={styles.deleteMenuItem}>
          <DeleteIcon sx={styles.menuIcon} /> {strings.deletePostLabel}
        </MenuItem>
      </Menu>

      {post && (
        <EditPostDialog
          open={editDialogOpen}
          post={post}
          onClose={() => setEditDialogOpen(false)}
          onUpdate={handlePostUpdate}
        />
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        title={strings.deleteConfirmTitle}
        message={strings.deleteConfirmMessage}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
};

export default PostDetailPage;
