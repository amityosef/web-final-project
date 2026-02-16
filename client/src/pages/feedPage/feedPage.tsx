import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Box, Typography, CircularProgress, Alert, Fab, Zoom } from '@mui/material';
import { Add as AddIcon, KeyboardArrowUp as ScrollTopIcon } from '@mui/icons-material';
import { postService } from '../../services/postService';
import { Post } from '../../types';
import { PostCard, CreatePostDialog, Navbar } from '../../components';
import * as styles from './styles';
import * as strings from './strings';
import * as consts from './consts';
import * as utils from './utils';

const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(consts.initialPage);
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
      const response = await postService.getPosts(pageNum, consts.postsPerPage);

      if (reset) {
        setPosts(response.posts);
      } else {
        setPosts((prev) => utils.removeDuplicatePosts(prev, response.posts));
      }

      setHasMore(response.pagination.hasMore);
      setPage(pageNum);
    } catch (error: unknown) {
      setError(utils.getErrorMessage(error));
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
      { threshold: consts.intersectionThreshold }
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
      setShowScrollTop(window.scrollY > consts.scrollTopThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePostCreate = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
    setCreateDialogOpen(false);
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prev) => utils.updatePostInList(prev, updatedPost));
  };

  const handlePostDelete = (postId: string) => {
    setPosts((prev) => utils.removePostFromList(prev, postId));
  };

  const scrollToTop = () => {
    utils.scrollToTop();
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="sm" sx={styles.container}>
        {error && (
          <Alert severity="error" sx={styles.errorAlert}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={styles.loadingContainer}>
            <CircularProgress />
          </Box>
        ) : posts.length === 0 ? (
          <Box sx={styles.emptyContainer}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {strings.noPostsTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {strings.noPostsMessage}
            </Typography>
          </Box>
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onUpdate={handlePostUpdate}
                onDelete={handlePostDelete}
              />
            ))}

            <div ref={loadMoreRef} style={{ height: 1 }} />

            {isLoadingMore && (
              <Box sx={styles.loadingMoreContainer}>
                <CircularProgress size={consts.loadingSpinnerSize} />
              </Box>
            )}

            {!hasMore && posts.length > 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                sx={styles.endOfFeedText}
              >
                {strings.endOfFeedMessage}
              </Typography>
            )}
          </>
        )}
      </Container>

      <Fab color="primary" onClick={() => setCreateDialogOpen(true)} sx={styles.createPostFab}>
        <AddIcon />
      </Fab>

      <Zoom in={showScrollTop}>
        <Fab size="small" onClick={scrollToTop} sx={styles.scrollTopFab}>
          <ScrollTopIcon />
        </Fab>
      </Zoom>

      <CreatePostDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handlePostCreate}
      />
    </>
  );
};

export default FeedPage;
