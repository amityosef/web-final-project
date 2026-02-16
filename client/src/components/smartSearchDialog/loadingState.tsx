import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import * as strings from './strings';
import * as styles from './styles';

const LoadingState: React.FC = () => {
  return (
    <Box sx={styles.loadingContainer}>
      <CircularProgress />
      <Typography variant="body2" color="text.secondary">
        {strings.loadingMessage}
      </Typography>
    </Box>
  );
};

export default LoadingState;
