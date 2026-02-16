import React from 'react';
import { Box, Typography } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import * as strings from './strings';
import * as styles from './styles';

const EmptyState: React.FC = () => {
  return (
    <Box sx={styles.emptyStateContainer}>
      <SearchIcon sx={styles.emptyStateIcon} />
      <Typography>{strings.emptyStateMessage}</Typography>
    </Box>
  );
};

export default EmptyState;
