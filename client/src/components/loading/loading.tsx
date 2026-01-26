import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import * as styles from './styles';

interface LoadingProps {
    message?: string;
    fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ message = 'Loading...', fullScreen = false }) => {
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
