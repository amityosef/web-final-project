import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  Avatar,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { postService } from '../../services/postService';
import { uploadService } from '../../services/uploadService';
import { User, Post } from '../../types';
import { PostCard, EditProfileDialog, Navbar } from '../../components';
import * as styles from './styles';
import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';
import * as types from './types';

function TabPanel(props: types.TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} id={`profile-tabpanel-${index}`} {...other}>
      {value === index && <Box sx={styles.tabPanel}>{children}</Box>}
    </div>
  );
}

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tabValue, setTabValue] = useState(consts.tabIndexPosts);
  const [isLoading, setIsLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const isOwnProfile = !userId || userId === currentUser?._id;

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isOwnProfile) {
        setProfile(currentUser);
      } else {
        const userData = await userService.getProfile(userId!);
        setProfile(userData);
      }
    } catch (error: unknown) {
      setError(utils.getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [isOwnProfile, currentUser, userId]);

  const fetchUserPosts = useCallback(async () => {
    if (!profile) return;

    setPostsLoading(true);
    try {
      const userPosts = await postService.getUserPosts(profile._id);
      setPosts(userPosts);
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
    } finally {
      setPostsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchProfile();
  }, [userId, currentUser, fetchProfile]);

  useEffect(() => {
    if (profile) {
      fetchUserPosts();
    }
  }, [fetchUserPosts, profile]);

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prev) => utils.updatePostInList(prev, updatedPost));
  };

  const handlePostDelete = (postId: string) => {
    setPosts((prev) => utils.removePostFromList(prev, postId));
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  if (error || !profile) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md" sx={styles.container}>
          <Alert severity="error">{error || strings.profileNotFoundMessage}</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={styles.container}>
        <Paper sx={styles.profilePaper}>
          <Box sx={styles.profileHeader}>
            <Avatar src={uploadService.getImageUrl(profile.profileImage)} sx={styles.avatar}>
              {utils.getInitials(profile.name, profile.email)}
            </Avatar>

            <Box sx={styles.profileContent}>
              <Box sx={styles.nameContainer}>
                <Typography variant="h4" sx={styles.name}>
                  {utils.getDisplayName(profile.name)}
                </Typography>
                {isOwnProfile && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => setEditDialogOpen(true)}
                  >
                    {strings.editProfileLabel}
                  </Button>
                )}
              </Box>

              <Typography variant="body1" color="text.secondary" sx={styles.email}>
                {profile.email}
              </Typography>

              <Box sx={styles.statsContainer}>
                <Box>
                  <Typography variant="h6" sx={styles.statValue}>
                    {posts.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {strings.postsTabLabel}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" sx={styles.statValue}>
                    {posts.reduce((sum, p) => sum + p.likesCount, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {strings.postsTotalLikes}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>

        <Box sx={styles.tabsContainer}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={strings.postsTabLabel} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={consts.tabIndexPosts}>
          {postsLoading ? (
            <Box sx={styles.loadingContainer}>
              <CircularProgress />
            </Box>
          ) : posts.length === 0 ? (
            <Box sx={styles.emptyPosts}>
              <Typography color="text.secondary">
                {isOwnProfile ? strings.noPostsMessage : strings.noPostsMessage}
              </Typography>
            </Box>
          ) : (
            <Box sx={styles.postsContainer}>
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onUpdate={handlePostUpdate}
                  onDelete={handlePostDelete}
                />
              ))}
            </Box>
          )}
        </TabPanel>
      </Container>

      {isOwnProfile && (
        <EditProfileDialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} />
      )}
    </>
  );
};

export default ProfilePage;
