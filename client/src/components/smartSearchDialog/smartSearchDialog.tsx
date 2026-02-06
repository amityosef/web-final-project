import React, { useState, useEffect } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  Psychology as AIIcon,
  TrendingUp as TrendingIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../../services/aiService';
import { uploadService } from '../../services/uploadService';
import { Post } from '../../types';
import * as styles from './styles';
import * as consts from './consts';

interface SmartSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Suggestion {
  title: string;
  content: string;
}

const SmartSearchDialog: React.FC<SmartSearchDialogProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history).slice(0, consts.MAX_HISTORY_DISPLAY));
    }
  }, [open]);

  useEffect(() => {
    if (open && suggestions.length === 0) {
      loadSuggestions();
    }
  }, [open]);

  const loadSuggestions = async () => {
    try {
      const response = await aiService.generateSuggestions({});
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await aiService.smartSearch(query);
      setResults(response.posts);

      const history = localStorage.getItem('searchHistory');
      let searchHistoryList: string[] = history ? JSON.parse(history) : [];
      searchHistoryList = [query, ...searchHistoryList.filter((h) => h !== query)].slice(
        0,
        consts.MAX_HISTORY_STORED
      );
      localStorage.setItem('searchHistory', JSON.stringify(searchHistoryList));
      setSearchHistory(searchHistoryList.slice(0, consts.MAX_HISTORY_DISPLAY));
    } catch (error: any) {
      setError(error.response?.data?.message || 'Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setTimeout(() => {
      setIsLoading(true);
      setError(null);
      setSearched(true);
      aiService
        .smartSearch(suggestion)
        .then((response) => {
          setResults(response.posts);
        })
        .catch((error) => {
          setError(error.response?.data?.message || 'Search failed');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 100);
  };

  const handleResultClick = (postId: string) => {
    onClose();
    navigate(`/post/${postId}`);
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setSearched(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={styles.dialogHeader}>
          <Box sx={styles.dialogTitleContent}>
            <AIIcon color="primary" />
            <Typography variant="h6">AI Smart Search</Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          placeholder="Describe what you're looking for..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: isLoading && (
              <InputAdornment position="end">
                <CircularProgress size={24} />
              </InputAdornment>
            ),
          }}
          sx={styles.searchField}
        />

        <Typography variant="body2" color="text.secondary" sx={styles.aiHint}>
          <AIIcon fontSize="small" sx={styles.aiHintIcon} />
          Try natural language queries like "posts about summer vacation" or "travel photos from
          last month"
        </Typography>

        {!searched && suggestions.length > 0 && (
          <Box sx={styles.suggestionsContainer}>
            <Box sx={styles.sectionHeader}>
              <TrendingIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" color="text.secondary">
                Suggested Searches
              </Typography>
            </Box>
            <Box sx={styles.chipsContainer}>
              {suggestions.map((suggestion, index) => (
                <Chip
                  key={index}
                  label={suggestion.title}
                  onClick={() => handleSuggestionClick(suggestion.title)}
                  clickable
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {!searched && searchHistory.length > 0 && (
          <Box sx={styles.suggestionsContainer}>
            <Box sx={styles.sectionHeader}>
              <HistoryIcon fontSize="small" color="action" />
              <Typography variant="subtitle2" color="text.secondary">
                Recent Searches
              </Typography>
            </Box>
            <Box sx={styles.chipsContainer}>
              {searchHistory.map((item, index) => (
                <Chip
                  key={index}
                  label={item}
                  onClick={() => handleSuggestionClick(item)}
                  clickable
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        {error && (
          <Typography color="error" variant="body2" sx={styles.errorText}>
            {error}
          </Typography>
        )}

        {searched && !isLoading && (
          <>
            <Typography variant="subtitle2" color="text.secondary" sx={styles.resultsTitle}>
              {results.length} {results.length === 1 ? 'result' : 'results'} found
            </Typography>

            {results.length > 0 ? (
              <List sx={styles.resultsList}>
                {results.map((post, index) => (
                  <React.Fragment key={post._id}>
                    <ListItem onClick={() => handleResultClick(post._id)} sx={styles.resultItem}>
                      <ListItemAvatar>
                        <Avatar src={uploadService.getImageUrl(post.owner.profileImage)}>
                          {post.owner.name?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" noWrap>
                            {post.content.slice(0, consts.CONTENT_PREVIEW_LENGTH)}
                            {post.content.length > consts.CONTENT_PREVIEW_LENGTH && '...'}
                          </Typography>
                        }
                        secondary={
                          <Box component="span" sx={styles.resultSecondary}>
                            <Typography component="span" variant="body2" color="text.secondary">
                              {post.owner.name || post.owner.email}
                            </Typography>
                            <Typography component="span" variant="body2" color="text.secondary">
                              • {post.likesCount} likes • {post.commentsCount} comments
                            </Typography>
                          </Box>
                        }
                      />
                      {post.image && (
                        <Box
                          component="img"
                          src={uploadService.getImageUrl(post.image)}
                          alt=""
                          sx={styles.resultImage}
                        />
                      )}
                    </ListItem>
                    {index < results.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={styles.noResultsContainer}>
                <Typography color="text.secondary">No posts found matching your search</Typography>
                <Typography variant="body2" color="text.secondary">
                  Try different keywords or a broader search
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
          startIcon={<SearchIcon />}
        >
          Search
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SmartSearchDialog;
