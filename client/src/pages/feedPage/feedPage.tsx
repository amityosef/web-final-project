import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Container,
    Box,
    Typography,
    CircularProgress,
    Alert,
    Fab,
    Zoom,
} from '@mui/material';
import { Add as AddIcon, KeyboardArrowUp as ScrollTopIcon } from '@mui/icons-material';
import { postService } from '../../services/postService';
import { Post } from '../../types';
import { PostCard, CreatePostDialog, Navbar } from '../../components';
import * as styles from './styles';

const FeedPage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const fetchPosts = useCallback(async (pageNum: number, reset: boolean = false) => {
        if (pageNum === 1) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }
        setError(null);

        try {
            const response = await postService.getPosts(pageNum, 10);

            if (reset) {
                setPosts(response.posts);
            } else {
                setPosts((prev) => {
                    const newPosts = response.posts.filter(
                        (newPost) => !prev.some((p) => p._id === newPost._id)
                    );
                    return [...prev, ...newPosts];
                });
            }

            setHasMore(response.pagination.hasMore);
            setPage(pageNum);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to load posts');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts(1, true);
    }, [fetchPosts]);

    useEffect(() => {
        if (isLoading || isLoadingMore || !hasMore) return;

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    fetchPosts(page + 1);
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [isLoading, isLoadingMore, hasMore, page, fetchPosts]);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handlePostCreate = (newPost: Post) => {
        setPosts((prev) => [newPost, ...prev]);
        setCreateDialogOpen(false);
    };

    const handlePostUpdate = (updatedPost: Post) => {
        setPosts((prev) =>
            prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
        );
    };

    const handlePostDelete = (postId: string) => {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <Navbar />
            <Container maxWidth="sm" sx={styles.container}>
                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={styles.errorAlert}>
                        {error}
                    </Alert>
                )}

                {/* Loading State */}
                {isLoading ? (
                    <Box sx={styles.loadingContainer}>
                        <CircularProgress />
                    </Box>
                ) : posts.length === 0 ? (
                    <Box sx={styles.emptyContainer}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No posts yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Be the first to share something!
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* Posts List */}
                        {posts.map((post) => (
                            <PostCard
                                key={post._id}
                                post={post}
                                onUpdate={handlePostUpdate}
                                onDelete={handlePostDelete}
                            />
                        ))}

                        {/* Load More Trigger */}
                        <div ref={loadMoreRef} style={{ height: 1 }} />

                        {/* Loading More Indicator */}
                        {isLoadingMore && (
                            <Box sx={styles.loadingMoreContainer}>
                                <CircularProgress size={32} />
                            </Box>
                        )}

                        {/* End of Feed */}
                        {!hasMore && posts.length > 0 && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                align="center"
                                sx={styles.endOfFeedText}
                            >
                                You've reached the end of the feed
                            </Typography>
                        )}
                    </>
                )}
            </Container>

            {/* Create Post FAB */}
            <Fab
                color="primary"
                onClick={() => setCreateDialogOpen(true)}
                sx={styles.createPostFab}
            >
                <AddIcon />
            </Fab>

            {/* Scroll to Top FAB */}
            <Zoom in={showScrollTop}>
                <Fab
                    size="small"
                    onClick={scrollToTop}
                    sx={styles.scrollTopFab}
                >
                    <ScrollTopIcon />
                </Fab>
            </Zoom>

            {/* Create Post Dialog */}
            <CreatePostDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onCreate={handlePostCreate}
            />
        </>
    );
};

export default FeedPage;
