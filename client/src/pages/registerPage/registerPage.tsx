import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Link,
    Divider,
    Alert,
    CircularProgress,
} from '@mui/material';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import * as styles from './styles';
import * as consts from './consts';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { register, googleLogin, isLoading: authLoading } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < consts.MIN_PASSWORD_LENGTH) {
            setError(`Password must be at least ${consts.MIN_PASSWORD_LENGTH} characters`);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await register(email.trim(), password, name.trim());
            navigate('/');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (response: CredentialResponse) => {
        if (!response.credential) {
            setError('Google login failed');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await googleLogin(response.credential);
            navigate('/');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Google login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google login failed');
    };

    return (
        <Container maxWidth="xs">
            <Box sx={styles.container}>
                <Paper elevation={3} sx={styles.paper}>
                    <Typography variant="h4" align="center" gutterBottom>
                        Create Account
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={styles.subtitle}>
                        Sign up to get started
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={styles.errorAlert}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Display Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isLoading || authLoading}
                            margin="normal"
                            autoComplete="name"
                            autoFocus
                        />
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading || authLoading}
                            margin="normal"
                            autoComplete="email"
                        />
                        <TextField
                            fullWidth
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading || authLoading}
                            margin="normal"
                            autoComplete="new-password"
                            helperText="At least 6 characters"
                        />
                        <TextField
                            fullWidth
                            label="Confirm Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading || authLoading}
                            margin="normal"
                            autoComplete="new-password"
                        />
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={isLoading || authLoading}
                            sx={styles.submitButton}
                        >
                            {isLoading ? <CircularProgress size={24} /> : 'Sign Up'}
                        </Button>
                    </form>

                    <Divider sx={styles.divider}>
                        <Typography variant="body2" color="text.secondary">
                            OR
                        </Typography>
                    </Divider>

                    {/* Google Login */}
                    <Box sx={styles.googleLoginContainer}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="outline"
                            size="large"
                            width="100%"
                        />
                    </Box>

                    <Typography variant="body2" align="center" color="text.secondary">
                        Already have an account?{' '}
                        <Link component={RouterLink} to="/login" underline="hover">
                            Sign In
                        </Link>
                    </Typography>
                </Paper>
            </Box>
        </Container>
    );
};

export default RegisterPage;
