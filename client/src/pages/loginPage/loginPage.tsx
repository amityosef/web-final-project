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
import * as consts from './consts';
import * as utils from './utils';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, googleLogin, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!utils.validateLoginForm(email, password)) {
      setError(strings.errorFieldsRequired);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login(email.trim(), password);
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
        <Paper elevation={consts.paperElevation} sx={styles.paper}>
          <Typography variant="h4" align="center" gutterBottom>
            {strings.welcomeTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={styles.subtitle}>
            {strings.welcomeSubtitle}
          </Typography>

          {error && (
            <Alert severity="error" sx={styles.errorAlert}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={strings.emailLabel}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || authLoading}
              margin="normal"
              autoComplete={consts.emailAutoComplete}
              autoFocus
            />
            <TextField
              fullWidth
              label={strings.passwordLabel}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || authLoading}
              margin="normal"
              autoComplete={consts.passwordAutoComplete}
            />
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading || authLoading}
              sx={styles.submitButton}
            >
              {isLoading ? <CircularProgress size={consts.spinnerSize} /> : strings.signInButton}
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
              useOneTap
              theme={consts.googleButtonTheme}
              size={consts.googleButtonSize}
              width="100%"
            />
          </Box>

          <Typography variant="body2" align="center" color="text.secondary">
            {strings.noAccountText}{' '}
            <Link component={RouterLink} to="/register" underline="hover">
              {strings.signUpLinkText}
            </Link>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
