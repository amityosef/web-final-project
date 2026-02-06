import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardContent,
  CardMedia,
  CardActions,
  Avatar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ChatBubbleOutline as CommentIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { postService } from '../../services/postService';
import { uploadService } from '../../services/uploadService';
import * as styles from './styles';
import EditPostDialog from '../editPostDialog';
import ConfirmDialog from '../confirmDialog';

interface PostCardProps {
  post: Post;
  onUpdate?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onUpdate, onDelete }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isOwner = user?._id === post.owner._id;

  const handleLike = async () => {
    if (isLoading) return;
    setIsLoading(true);

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
      setIsLoading(false);
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
    setEditOpen(true);
  };

  const handleDelete = () => {
    handleMenuClose();
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await postService.deletePost(post._id);
      onDelete?.(post._id);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
    setDeleteConfirmOpen(false);
  };

  const handlePostUpdate = (updatedPost: Post) => {
    onUpdate?.(updatedPost);
    setEditOpen(false);
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

  return (
    <>
      <Card sx={styles.card}>
        <CardHeader
          avatar={
            <Avatar
              src={uploadService.getImageUrl(post.owner.profileImage)}
              onClick={() => navigate(`/profile/${post.owner._id}`)}
              sx={styles.ownerAvatar}
            >
              {post.owner.name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          }
          action={
            isOwner && (
              <IconButton onClick={handleMenuOpen}>
                <MoreVertIcon />
              </IconButton>
            )
          }
          title={
            <Typography
              variant="subtitle1"
              sx={styles.ownerName}
              onClick={() => navigate(`/profile/${post.owner._id}`)}
            >
              {post.owner.name || post.owner.email}
            </Typography>
          }
          subheader={formatDate(post.createdAt)}
        />

        {post.image && (
          <CardMedia
            component="img"
            image={uploadService.getImageUrl(post.image)}
            alt="Post image"
            sx={styles.cardMedia}
            onClick={() => navigate(`/post/${post._id}`)}
          />
        )}

        <CardContent sx={styles.cardContent} onClick={() => navigate(`/post/${post._id}`)}>
          <Typography variant="body1" sx={styles.contentText}>
            {post.content}
          </Typography>
        </CardContent>

        <CardActions disableSpacing>
          <Box sx={styles.actionsContainer}>
            <IconButton onClick={handleLike} disabled={isLoading}>
              {liked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {likesCount}
            </Typography>
          </Box>

          <Box sx={styles.commentsContainer}>
            <IconButton onClick={() => navigate(`/post/${post._id}`)}>
              <CommentIcon />
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {post.commentsCount}
            </Typography>
          </Box>
        </CardActions>
      </Card>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={styles.menuIcon} /> Edit
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={styles.deleteMenuItem}>
          <DeleteIcon sx={styles.menuIcon} /> Delete
        </MenuItem>
      </Menu>

      <EditPostDialog
        open={editOpen}
        post={post}
        onClose={() => setEditOpen(false)}
        onUpdate={handlePostUpdate}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
};

export default PostCard;
