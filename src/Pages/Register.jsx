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
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import Navbar from '../components/Navbar/Navbar';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [emailVerified, setEmailVerified] = useState(false);
  
  const { signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    } else if (formData.email.length > 255) {
      errors.email = 'Email must be less than 255 characters';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (formData.password.length > 72) {
      errors.password = 'Password must be less than 72 characters';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Trim email input
    if (name === 'email') {
      setFormData(prev => ({
        ...prev,
        [name]: value.trim()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear field-specific error when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEmailVerified(false);
    setFormErrors({});
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      
      // Focus on first error field
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(`register-${firstErrorField}`);
      if (element) {
        element.focus();
      }
      
      return;
    }
    
    setLoading(true);

    try {
      const { error: signUpError, user: newUser } = await signUp(
        formData.email.toLowerCase(), // Normalize email to lowercase
        formData.password
      );
      
      if (signUpError) {
        // Check if it's a duplicate email error
        if (signUpError.toLowerCase().includes('already') || 
            signUpError.toLowerCase().includes('email')) {
          setFormErrors({
            email: 'This email is already registered'
          });
          document.getElementById('register-email')?.focus();
        }
        setError(signUpError);
        return;
      }
      
      // Check if email confirmation is required
      if (newUser && !newUser.email_confirmed_at) {
        setEmailVerified(false);
        setSuccess('Account created! Please check your email to confirm your account before signing in.');
      } else {
        setEmailVerified(true);
        setSuccess('Account created successfully! You can now sign in.');
      }
      
      // Clear form
      setFormData({
        email: '',
        password: '',
        confirmPassword: ''
      });
      
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
              Create Account
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Join Shia Library to save your favorite hadiths
            </Typography>
          </Box>

          {error && !Object.keys(formErrors).length && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }} 
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert 
              severity={emailVerified ? "success" : "info"} 
              sx={{ mb: 3 }}
              onClose={() => setSuccess('')}
            >
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
                disabled={loading}
                id="register-email"
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
                name="password"
                value={formData.password}
                onChange={handleChange}
                error={!!formErrors.password}
                helperText={formErrors.password || "At least 6 characters"}
                required
                disabled={loading}
                id="register-password"
                autoComplete="new-password"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                inputProps={{
                  maxLength: 72
                }}
              />

              <TextField
                fullWidth
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                required
                disabled={loading}
                id="register-confirmPassword"
                autoComplete="new-password"
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
                startIcon={loading ? <CircularProgress size={20} /> : <AppRegistrationIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  textTransform: 'none',
                }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="text" size="small" sx={{ textTransform: 'none' }}>
                  Sign In
                </Button>
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default Register;