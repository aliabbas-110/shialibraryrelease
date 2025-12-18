import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabaseClient'; // Add this import
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
  Divider,
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import Navbar from '../components/Navbar/Navbar';

const Profile = () => {
  const { user, logout, getUserProfile } = useAuth(); // Changed signOut to logout
  const navigate = useNavigate();
  
  const [savedHadiths, setSavedHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null); // Add state for profile data

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Load user profile data
    loadUserProfile();
    loadSavedHadiths();
  }, [user, navigate]);

  // Function to load user profile from profiles table
  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await getUserProfile(user.id);
      setProfileData(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Function to get saved hadiths
  const getSavedHadiths = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_hadiths')
        .select(`
          id,
          created_at,
          hadith (
            id,
            hadith_number,
            arabic,
            chapters (
              id,
              title,
              volumes (
                books (
                  id,
                  title
                )
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching saved hadiths:', error);
      return [];
    }
  };

  // Function to remove saved hadith
  const removeSavedHadith = async (hadithId) => {
    try {
      const { error } = await supabase
        .from('saved_hadiths')
        .delete()
        .eq('user_id', user.id)
        .eq('hadith_id', hadithId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error removing saved hadith:', error);
      return { error: error.message };
    }
  };

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
      await logout(); // Changed from signOut to logout
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Use profile data if available, otherwise fall back to user data
  const displayDate = profileData?.created_at || user.created_at;

  return (
    <>
      <Navbar />
      <Container sx={{ mt: 10, mb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                My Profile
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                {user.email}
              </Typography>
              <Chip 
                label={`Member since ${formatDate(displayDate)}`} 
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

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
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
                  sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}
                >
                  <Box sx={{ flex: 1 }}>
                    <ListItemText
                      primary={
                        <Link 
                          to={`/book/${item.hadith.chapters.volumes.books.id}/chapter/${item.hadith.chapters.id}#hadith-${item.hadith.id}`}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          <Typography variant="subtitle1" sx={{ 
                            '&:hover': { color: 'primary.main' },
                            lineHeight: 1.4 
                          }}>
                            {item.hadith.arabic?.substring(0, 100)}...
                          </Typography>
                        </Link>
                      }
                      secondary={
                        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
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
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                            Saved on {formatDate(item.created_at)}
                          </Typography>
                        </Stack>
                      }
                    />
                  </Box>
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      onClick={() => handleRemoveSavedHadith(item.hadith.id)}
                      color="error"
                      title="Remove from saved"
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
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
                {formatDate(displayDate)}
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