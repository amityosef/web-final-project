import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Psychology as AIIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../../services/aiService';
import SearchInput from './searchInput';
import LoadingState from './loadingState';
import EmptyState from './emptyState';
import SearchResultsList from './searchResultsList';
import * as strings from './strings';
import * as styles from './styles';
import * as types from './types';

const SmartSearchDialog: React.FC<types.SmartSearchDialogProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<types.SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await aiService.smartSearch(query);
      setResult({
        answer: response.answer,
        posts: response.posts,
        processingTime: response.processingTime,
        noResults: response.noResults ?? false,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e.response?.data?.error || e.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClose = () => {
    setQuery('');
    setResult(null);
    setError(null);
    onClose();
  };

  const handlePostClick = (postId: string) => {
    handleClose();
    navigate(`/post/${postId}`);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={styles.dialogHeader}>
          <Box sx={styles.dialogTitleContent}>
            <AIIcon color="primary" />
            <Typography variant="h6">{strings.dialogTitle}</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <SearchInput
          query={query}
          loading={loading}
          onChange={setQuery}
          onKeyPress={handleKeyPress}
        />

        {loading && <LoadingState />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {result?.noResults && result.answer && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
            {result.answer}
          </Alert>
        )}

        {result?.posts && result.posts.length > 0 && (
          <SearchResultsList
            posts={result.posts}
            processingTime={result.processingTime}
            onPostClick={handlePostClick}
          />
        )}

        {!loading && !result && !error && <EmptyState />}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>{strings.closeButtonText}</Button>
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          startIcon={<SearchIcon />}
        >
          {strings.searchButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SmartSearchDialog;
