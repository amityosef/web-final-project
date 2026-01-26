import React, { useState, useEffect } from 'react';
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

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`profile-tabpanel-${index}`}
            {...other}
        >
            {value === index && <Box sx={styles.tabPanel}>{children}</Box>}
        </div>
    );
}

const ProfilePage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user: currentUser } = useAuth();

    const [profile, setProfile] = useState<User | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [tabValue, setTabValue] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [postsLoading, setPostsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const isOwnProfile = !userId || userId === currentUser?._id;

    useEffect(() => {
        fetchProfile();
    }, [userId, currentUser]);

    useEffect(() => {
        if (profile) {
            fetchUserPosts();
        }
    }, [profile]);

    const fetchProfile = async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (isOwnProfile) {
                // Use current user data
                setProfile(currentUser);
            } else {
                // Fetch other user's profile
                const userData = await userService.getProfile(userId!);
                setProfile(userData);
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to load profile');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUserPosts = async () => {
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
    };

    const handlePostUpdate = (updatedPost: Post) => {
        setPosts((prev) =>
            prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
        );
    };

    const handlePostDelete = (postId: string) => {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
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
                    <Alert severity="error">{error || 'Profile not found'}</Alert>
                </Container>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <Container maxWidth="md" sx={styles.container}>
                {/* Profile Header */}
                <Paper sx={styles.profilePaper}>
                    <Box sx={styles.profileHeader}>
                        <Avatar
                            src={uploadService.getImageUrl(profile.profileImage)}
                            sx={styles.avatar}
                        >
                            {profile.name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U'}
                        </Avatar>

                        <Box sx={styles.profileContent}>
                            <Box sx={styles.nameContainer}>
                                <Typography variant="h4" sx={styles.name}>
                                    {profile.name || 'Unnamed User'}
                                </Typography>
                                {isOwnProfile && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<EditIcon />}
                                        onClick={() => setEditDialogOpen(true)}
                                    >
                                        Edit Profile
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
                                        Posts
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="h6" sx={styles.statValue}>
                                        {posts.reduce((sum, p) => sum + p.likesCount, 0)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Likes
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Paper>

                {/* Tabs */}
                <Box sx={styles.tabsContainer}>
                    <Tabs value={tabValue} onChange={handleTabChange}>
                        <Tab label="Posts" />
                    </Tabs>
                </Box>

                {/* Tab Content */}
                <TabPanel value={tabValue} index={0}>
                    {postsLoading ? (
                        <Box sx={styles.loadingContainer}>
                            <CircularProgress />
                        </Box>
                    ) : posts.length === 0 ? (
                        <Box sx={styles.emptyPosts}>
                            <Typography color="text.secondary">
                                {isOwnProfile ? "You haven't posted anything yet" : 'No posts yet'}
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

            {/* Edit Profile Dialog */}
            {isOwnProfile && (
                <EditProfileDialog
                    open={editDialogOpen}
                    onClose={() => setEditDialogOpen(false)}
                />
            )}
        </>
    );
};

export default ProfilePage;
