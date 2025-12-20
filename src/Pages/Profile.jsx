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
  Divider,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Navbar from '../components/Navbar/Navbar';
import { supabase } from '../config/supabaseClient';

const Profile = () => {
  const { user, signOut, getSavedHadiths, removeSavedHadith } = useAuth();
  const navigate = useNavigate();
  
  const [savedHadiths, setSavedHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hadithsPerPage] = useState(10);
  const [selectedHadith, setSelectedHadith] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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
      console.log('Saved hadiths:', saved); // Debug log
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
        setSnackbar({
          open: true,
          message: 'Failed to remove hadith from saved',
          severity: 'error'
        });
        return;
      }
      
      // Update local state
      setSavedHadiths(prev => prev.filter(item => item.hadith.id !== hadithId));
      setSnackbar({
        open: true,
        message: 'Hadith removed from saved',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error removing saved hadith:', error);
      setSnackbar({
        open: true,
        message: 'An error occurred',
        severity: 'error'
      });
    }
  };

  const handleViewFullHadith = (hadithData) => {
    setSelectedHadith(hadithData);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedHadith(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const copyHadithToClipboard = (hadith) => {
    const hadithUrl = `${window.location.origin}/book/${hadith.hadith.chapters.volumes.books.id}/reader?hadith=${hadith.hadith.id}`;
    const bookName = hadith.hadith.chapters.volumes.books.title || "Unknown Book";
    
    let referenceLine = "";
    if (hadith.hadith.hadith_reference?.reference) {
      referenceLine = hadith.hadith.hadith_reference.reference;
    } else {
      referenceLine = `${bookName}`;
    }
    
    const formattedText = `${hadith.hadith.arabic}\n\n${hadith.hadith.english}\n\n${referenceLine}, Hadith ${hadith.hadith.hadith_number}\n${hadithUrl}`;
    
    navigator.clipboard.writeText(formattedText)
      .then(() => {
        setSnackbar({
          open: true,
          message: "Hadith copied to clipboard",
          severity: "success"
        });
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        setSnackbar({
          open: true,
          message: "Failed to copy hadith",
          severity: "error"
        });
      });
  };

  // Filter hadiths based on search term
  const filteredHadiths = savedHadiths.filter(item => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      item.hadith.arabic?.toLowerCase().includes(searchLower) ||
      item.hadith.english?.toLowerCase().includes(searchLower) ||
      item.hadith.chapters.volumes.books.title?.toLowerCase().includes(searchLower) ||
      item.hadith.hadith_number?.toString().includes(searchTerm)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredHadiths.length / hadithsPerPage);
  const indexOfLastHadith = currentPage * hadithsPerPage;
  const indexOfFirstHadith = indexOfLastHadith - hadithsPerPage;
  const currentHadiths = filteredHadiths.slice(indexOfFirstHadith, indexOfLastHadith);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
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
            <>
              {/* Search Box */}
              <TextField
                fullWidth
                placeholder="Search saved hadiths by text, book, or hadith number..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                sx={{ mb: 3 }}
                variant="outlined"
                size="small"
              />

              <List>
                {currentHadiths.map((item, index) => (
                  <Paper
                    key={item.id}
                    variant="outlined"
                    sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}
                  >
                    <ListItem>
                      <Box sx={{ flex: 1 }}>
                        {/* Header with hadith number and book */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip 
                              label={`#${(currentPage - 1) * hadithsPerPage + index + 1}`}
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                            <Chip 
                              label={`Hadith ${item.hadith.hadith_number}`} 
                              size="small" 
                              variant="outlined" 
                            />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            Saved on {formatDate(item.created_at)}
                          </Typography>
                        </Box>

                        {/* Book info */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="primary">
                            {item.hadith.chapters.volumes.books.title}
                          </Typography>
                          {item.hadith.chapters.title_en && (
                            <Typography variant="caption" color="text.secondary">
                              {item.hadith.chapters.title_en}
                            </Typography>
                          )}
                        </Box>

                        {/* Arabic text preview */}
                        <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              direction: 'rtl', 
                              textAlign: 'right',
                              fontFamily: 'inherit',
                              lineHeight: 1.6,
                            }}
                          >
                            {item.hadith.arabic?.substring(0, 200)}
                            {item.hadith.arabic && item.hadith.arabic.length > 200 && '...'}
                          </Typography>
                        </Box>

                        {/* English text preview */}
                        {item.hadith.english && (
                          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                            <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
                              {item.hadith.english.substring(0, 150)}
                              {item.hadith.english.length > 150 && '...'}
                            </Typography>
                          </Box>
                        )}

                        {/* Action buttons */}
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleViewFullHadith(item)}
                            >
                              View Full Hadith
                            </Button>

                          </Stack>
                          <IconButton 
                            size="small"
                            onClick={() => handleRemoveSavedHadith(item.hadith.id)}
                            color="error"
                            title="Remove from saved"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </ListItem>
                  </Paper>
                ))}
              </List>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination 
                    count={totalPages} 
                    page={currentPage} 
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                    sx={{
                      '& .MuiPaginationItem-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Box>
              )}

              {/* Page info */}
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                Showing {indexOfFirstHadith + 1}-{Math.min(indexOfLastHadith, filteredHadiths.length)} of {filteredHadiths.length} saved hadiths
                {searchTerm && ` (filtered from ${savedHadiths.length} total)`}
              </Typography>
            </>
          )}
        </Paper>

        {/* Stats Summary */}
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>Your Activity Summary</Typography>
          <Stack direction="row" spacing={4} justifyContent="center">
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{savedHadiths.length}</Typography>
              <Typography variant="caption">Total Saved Hadiths</Typography>
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

      {/* Full Hadith Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        {selectedHadith && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">
                    Hadith {selectedHadith.hadith.hadith_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedHadith.hadith.chapters.volumes.books.title}
                  </Typography>
                </Box>
                <IconButton onClick={handleCloseDialog} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3}>
                {/* Book and Chapter Info */}
                <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="primary.contrastText">
                    {selectedHadith.hadith.chapters.volumes.books.title}
                  </Typography>
                  {selectedHadith.hadith.chapters.title_en && (
                    <Typography variant="body2" color="primary.contrastText" sx={{ opacity: 0.9 }}>
                      {selectedHadith.hadith.chapters.title_en}
                    </Typography>
                  )}
                </Box>

                {/* Arabic Text */}
                <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      direction: 'rtl',
                      textAlign: 'right',
                      fontFamily: 'inherit',
                      lineHeight: 1.8,
                      fontSize: '1.1rem',
                    }}
                  >
                    {selectedHadith.hadith.arabic}
                  </Typography>
                </Paper>

                {/* English Translation */}
                <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Typography
                    variant="body1"
                    color="text.primary"
                    sx={{
                      lineHeight: 1.7,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {selectedHadith.hadith.english}
                  </Typography>
                </Paper>

                {/* Reference */}
                {selectedHadith.hadith.hadith_reference?.reference && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Reference: {selectedHadith.hadith.hadith_reference.reference}
                  </Typography>
                )}

                {/* Metadata */}
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Stack direction="row" spacing={2} justifyContent="space-between">
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Hadith Number
                      </Typography>
                      <Typography variant="body2">
                        {selectedHadith.hadith.hadith_number}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Saved On
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(selectedHadith.created_at)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Volume
                      </Typography>
                      <Typography variant="body2">
                        {selectedHadith.hadith.chapters.volumes.volume_number}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={() => copyHadithToClipboard(selectedHadith)}
              >
                Copy Hadith
              </Button>
              <Stack direction="row" spacing={1}>

                <Button
                  variant="contained"
                  onClick={handleCloseDialog}
                >
                  Close
                </Button>
              </Stack>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Profile;