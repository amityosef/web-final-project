import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Box,
  Typography,
  Chip,
  CardMedia,
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  Favorite as FavoriteIcon,
  ChatBubbleOutline as CommentIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Post } from '../../types';
import { uploadService } from '../../services/uploadService';
import * as utils from './utils';
import * as styles from './styles';

interface SearchResultCardProps {
  post: Post & { relevanceScore?: number };
  onClick: (postId: string) => void;
}

const SearchResultCard: React.FC<SearchResultCardProps> = ({ post, onClick }) => {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.7) return 'warning';
    return 'default';
  };

  return (
    <Card variant="outlined" sx={styles.resultCard}>
      <CardActionArea onClick={() => onClick(post._id)}>
        <CardContent>
          <Box sx={styles.cardHeader}>
            {post.owner?.profileImage ? (
              <Avatar
                src={uploadService.getImageUrl(post.owner.profileImage)}
                sx={styles.cardAvatar}
              />
            ) : (
              <Avatar sx={{ ...styles.cardAvatar, bgcolor: 'primary.main' }}>
                <PersonIcon fontSize="small" />
              </Avatar>
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2">
                {utils.getDisplayName(post.owner?.name, post.owner?.email)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {utils.formatDate(post.createdAt)}
              </Typography>
            </Box>
            {post.relevanceScore !== undefined && (
              <Chip
                label={utils.formatRelevanceScore(post.relevanceScore)}
                size="small"
                color={getScoreColor(post.relevanceScore)}
              />
            )}
          </Box>

          <Typography variant="body1" sx={styles.cardContent}>
            {post.content}
          </Typography>

          {post.image && (
            <CardMedia
              component="img"
              image={uploadService.getImageUrl(post.image)}
              alt="Post image"
              sx={styles.cardImage}
            />
          )}

          <Box sx={styles.cardFooter}>
            <Box sx={styles.statsItem}>
              <FavoriteIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {post.likesCount || 0}
              </Typography>
            </Box>
            <Box sx={styles.statsItem}>
              <CommentIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {post.commentsCount || 0}
              </Typography>
            </Box>
            <OpenInNewIcon fontSize="small" color="action" sx={{ ml: 'auto' }} />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default SearchResultCard;
