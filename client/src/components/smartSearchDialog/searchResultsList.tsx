import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Post } from '../../types';
import SearchResultCard from './searchResultCard';
import * as strings from './strings';
import * as styles from './styles';

interface SearchResultsListProps {
  posts: (Post & { relevanceScore?: number })[];
  processingTime: number;
  onPostClick: (postId: string) => void;
}

const SearchResultsList: React.FC<SearchResultsListProps> = ({
  posts,
  processingTime,
  onPostClick,
}) => {
  return (
    <Box>
      <Box sx={styles.resultsHeader}>
        <Typography variant="subtitle2" color="primary">
          {strings.foundResults(posts.length)}
        </Typography>
        <Chip label={`${processingTime}ms`} size="small" variant="outlined" />
      </Box>

      <Box sx={styles.resultsList}>
        {posts.map((post) => (
          <SearchResultCard key={post._id} post={post} onClick={onPostClick} />
        ))}
      </Box>
    </Box>
  );
};

export default SearchResultsList;
