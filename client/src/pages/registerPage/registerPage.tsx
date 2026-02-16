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
import * as strings from './strings';
import * as utils from './utils';

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

    const validation = utils.validateRegisterForm(name, email, password, confirmPassword);
    if (!validation.isValid) {
      setError(validation.error || strings.errorFieldsRequired);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register(email.trim(), password, name.trim());
      navigate('/');
    } catch (error: unknown) {
      setError(utils.getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setError(strings.errorGoogleFailed);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await googleLogin(response.credential);
      navigate('/');
    } catch (error: unknown) {
      setError(utils.getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError(strings.errorGoogleFailed);
  };

  return (
    <Container maxWidth="xs">
      <Box sx={styles.container}>
        <Paper elevation={3} sx={styles.paper}>
          <Typography variant="h4" align="center" gutterBottom>
            {strings.pageTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={styles.subtitle}>
            {strings.pageSubtitle}
          </Typography>

          {error && (
            <Alert severity="error" sx={styles.errorAlert}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={strings.nameLabel}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading || authLoading}
              margin="normal"
              autoComplete="name"
              autoFocus
            />
            <TextField
              fullWidth
              label={strings.emailLabel}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || authLoading}
              margin="normal"
              autoComplete="email"
            />
            <TextField
              fullWidth
              label={strings.passwordLabel}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || authLoading}
              margin="normal"
              autoComplete="new-password"
              helperText={strings.passwordHelperText}
            />
            <TextField
              fullWidth
              label={strings.confirmPasswordLabel}
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
              {isLoading ? <CircularProgress size={24} /> : strings.signUpButton}
            </Button>
          </form>

          <Divider sx={styles.divider}>
            <Typography variant="body2" color="text.secondary">
              {strings.dividerText}
            </Typography>
          </Divider>

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
            {strings.alreadyHaveAccountText}{' '}
            <Link component={RouterLink} to="/login" underline="hover">
              {strings.signInLinkText}
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;
