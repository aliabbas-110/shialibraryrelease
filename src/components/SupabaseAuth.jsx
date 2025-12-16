// src/components/PasswordProtection.jsx
import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Container,
  Alert 
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';

const PASSWORD = "yourpassword123"; // Change this
const LOCAL_STORAGE_KEY = "auth_token";

const PasswordProtection = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already authenticated
    const token = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (token === PASSWORD) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === PASSWORD) {
      localStorage.setItem(LOCAL_STORAGE_KEY, password);
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Paper
        elevation={3}
        sx={{
          p: 5,
          textAlign: 'center',
          borderRadius: 3,
        }}
      >
        <LockIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Beta Access Required
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          This site is currently in beta testing. Please enter the password to continue.
        </Typography>

        <Box component="form" onSubmit={handleLogin}>
          <TextField
            fullWidth
            type="password"
            label="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="outlined"
            sx={{ mb: 3 }}
          />
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
          >
            Enter Site
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
          This is a beta version for testing purposes only.
        </Typography>
      </Paper>
    </Container>
  );
};

export default PasswordProtection;