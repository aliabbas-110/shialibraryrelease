import { useState, useEffect } from 'react';
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
  
  const { login, user } = useAuth(); // Changed from 'signIn' to 'login'
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: loginError } = await login(email, password); // Changed from 'signIn' to 'login'
      if (loginError) {
        setError(loginError);
        return;
      }
      
      // Successful login - navigate to profile
      navigate('/profile');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything if user is already logged in
  if (user) {
    return null;
  }

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
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
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
                onChange={(e) => setEmail(e.target.value.trim().toLowerCase())} // Added trim and lowercase
                required
                disabled={loading}
                id="login-email"
                name="email"
                autoComplete="email"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                inputProps={{
                  maxLength: 255
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                id="login-password"
                name="password"
                autoComplete="current-password"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                inputProps={{
                  maxLength: 72
                }}
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
                  textTransform: 'none',
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
                <Button variant="text" size="small" sx={{ textTransform: 'none' }}>
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