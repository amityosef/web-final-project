import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import * as styles from './styles';
import * as strings from './strings';
import * as types from './types';
import * as consts from './consts';

const Loading: React.FC<types.LoadingProps> = ({
  message = strings.defaultMessage,
  fullScreen = consts.defaultFullScreen,
}) => {
  return (
    <Box
      sx={{
        ...styles.container,
        ...(fullScreen ? styles.fullScreen : styles.normal),
      }}
    >
      <CircularProgress />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default Loading;
