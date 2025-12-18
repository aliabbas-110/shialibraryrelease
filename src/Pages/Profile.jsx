import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Stack,
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import Navbar from '../components/Navbar/Navbar';

const Profile = () => {
  const { user, signOut, getSavedHadiths, removeSavedHadith } = useAuth();
  const navigate = useNavigate();
  
  const [savedHadiths, setSavedHadiths] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    loadSavedHadiths();
  }, [user, navigate]);

  const loadSavedHadiths = async () => {
    setLoading(true);
    try {
      const saved = await getSavedHadiths();
      setSavedHadiths(saved);
    } catch (error) {
      console.error('Error loading saved hadiths:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleRemoveSavedHadith = async (hadithId) => {
    try {
      const { error } = await removeSavedHadith(hadithId);
      if (error) {
        console.error('Error removing saved hadith:', error);
        return;
      }
      
      // Update local state
      setSavedHadiths(prev => prev.filter(item => item.hadith.id !== hadithId));
    } catch (error) {
      console.error('Error removing saved hadith:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Navbar />
      <Container sx={{ mt: 10, mb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                My Profile
              </Typography>
              <Typography color="text.secondary">
                {user.email}
              </Typography>
              <Chip 
                label={`Member since ${formatDate(user.created_at)}`} 
                size="small" 
                variant="outlined" 
                sx={{ mt: 1 }}
              />
            </Box>
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              color="error"
            >
              Logout
            </Button>
          </Box>

          <Typography variant="h6" gutterBottom>
            <BookmarkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Saved Hadiths ({savedHadiths.length})
          </Typography>

          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Loading your saved hadiths...</Typography>
            </Box>
          ) : savedHadiths.length === 0 ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              You haven't saved any hadiths yet. Start exploring and save your favorite hadiths!
            </Alert>
          ) : (
            <List>
              {savedHadiths.map((item) => (
                <ListItem
                  key={item.id}
                  component={Paper}
                  variant="outlined"
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  <Box sx={{ flex: 1 }}>
                    <ListItemText
                      primary={
                        <Link 
                          to={`/book/${item.hadith.chapters.volumes.books.id}/chapter/${item.hadith.chapters.id}#hadith-${item.hadith.id}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <Typography variant="subtitle1" sx={{ '&:hover': { color: 'primary.main' } }}>
                            {item.hadith.arabic?.substring(0, 100)}...
                          </Typography>
                        </Link>
                      }
secondary={
  <Box sx={{ mt: 1 }}>
    <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
      <Chip 
        label={`Hadith #${item.hadith.hadith_number}`} 
        size="small" 
        variant="outlined" 
      />
      <Chip 
        label={item.hadith.chapters.volumes.books.title} 
        size="small" 
        variant="outlined" 
      />
    </Box>
    <Typography variant="caption" color="text.secondary">
      Saved on {formatDate(item.created_at)}
    </Typography>
  </Box>
}
                      
                    />
                  </Box>
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleRemoveSavedHadith(item.hadith.id)}
                      color="error"
                      title="Remove from saved"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* Stats Summary */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>Your Activity Summary</Typography>
          <Stack direction="row" spacing={4} justifyContent="center">
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{savedHadiths.length}</Typography>
              <Typography variant="caption">Saved Hadiths</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {formatDate(user.created_at)}
              </Typography>
              <Typography variant="caption">Member Since</Typography>
            </Box>
          </Stack>
        </Paper>
      </Container>
    </>
  );
};

export default Profile;