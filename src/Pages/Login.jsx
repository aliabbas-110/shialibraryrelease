import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Stack,
  CircularProgress,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import Navbar from '../components/Navbar/Navbar';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    navigate('/profile');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        return;
      }
      navigate('/profile');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="sm" sx={{ mt: 10, mb: 8 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
              Sign In
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to your Shia Library account to save hadiths
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
<TextField
  fullWidth
  label="Email Address"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
  disabled={loading}
  id="login-email" // Add this
  name="email" // Add this
  autoComplete="email" // Add this
  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
/>

<TextField
  fullWidth
  label="Password"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  required
  disabled={loading}
  id="login-password" // Add this
  name="password" // Add this
  autoComplete="current-password" // Add this
  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
/>

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have an account?{' '}
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Button variant="text" size="small">
                  Create Account
                </Button>
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default Login;