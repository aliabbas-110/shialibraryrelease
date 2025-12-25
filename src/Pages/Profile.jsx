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
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import LogoutIcon from '@mui/icons-material/Logout';
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
  const [showFullArabic, setShowFullArabic] = useState(false);

  const ARABIC_PREVIEW_LENGTH = 750;
  const isArabicLong = (text) => text && text.length > ARABIC_PREVIEW_LENGTH;
  const truncateArabic = (text) => text && text.length > ARABIC_PREVIEW_LENGTH ? text.substring(0, ARABIC_PREVIEW_LENGTH) + '…' : text;

  const truncateArabicWithContext = (text, query, radius = 60) => {
    if (!text) return '';
    if (!query || !/[\u0600-\u06FF]/.test(query)) return text.slice(0, 160) + (text.length > 160 ? '…' : '');
    const index = text.indexOf(query);
    if (index === -1) return text.slice(0, 160) + (text.length > 160 ? '…' : '');
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + query.length + radius);
    return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
  };

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

  const highlightText = (text, query, isArabic = false) => {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          style={{
            backgroundColor: '#fff59d',
            padding: '0 2px',
            borderRadius: '3px',
            direction: isArabic ? 'rtl' : 'ltr',
          }}
        >
          {part}
        </mark>
      ) : part
    );
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
        setSnackbar({ open: true, message: 'Failed to remove hadith', severity: 'error' });
        return;
      }
      setSavedHadiths(prev => prev.filter(item => item.hadith.id !== hadithId));
      setSnackbar({ open: true, message: 'Hadith removed from saved', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'An error occurred', severity: 'error' });
    }
  };

  const handleViewFullHadith = (hadithData) => {
    setSelectedHadith(hadithData);
    setShowFullArabic(false);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedHadith(null);
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const copyHadithToClipboard = (hadith) => {
    const hadithUrl = `${window.location.origin}/book/${hadith.hadith.chapters.volumes.books.id}/reader?hadith=${hadith.hadith.id}`;
    const bookName = hadith.hadith.chapters.volumes.books.title || "Unknown Book";
    const referenceLine = hadith.hadith.hadith_reference?.reference || `${bookName}`;
    const formattedText = `${hadith.hadith.arabic}\n\n${hadith.hadith.english}\n\n${referenceLine}, Hadith ${hadith.hadith.hadith_number}\n${hadithUrl}`;
    navigator.clipboard.writeText(formattedText)
      .then(() => setSnackbar({ open: true, message: "Hadith copied to clipboard", severity: "success" }))
      .catch(() => setSnackbar({ open: true, message: "Failed to copy hadith", severity: "error" }));
  };

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

  const totalPages = Math.ceil(filteredHadiths.length / hadithsPerPage);
  const indexOfLastHadith = currentPage * hadithsPerPage;
  const indexOfFirstHadith = indexOfLastHadith - hadithsPerPage;
  const currentHadiths = filteredHadiths.slice(indexOfFirstHadith, indexOfLastHadith);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  if (!user) return null;

  return (
    <>
      <Navbar />
      <Container sx={{ mt: 10, mb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
            <Box>
              <Typography variant="h4" gutterBottom>My Profile</Typography>
              <Typography color="text.secondary">{user.email}</Typography>
              <Chip label={`Member since ${formatDate(user.created_at)}`} size="small" variant="outlined" sx={{ mt: 1 }} />
            </Box>
            <Button variant="outlined" startIcon={<LogoutIcon />} onClick={handleLogout} color="error">Logout</Button>
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
              <TextField
                fullWidth
                placeholder="Search saved hadiths by text, book, or hadith number..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                sx={{ mb: 3 }}
                variant="outlined"
                size="small"
              />

              <List>
                {currentHadiths.map((item, index) => (
                  <Paper key={item.id} variant="outlined" sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
                    <ListItem>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip label={`#${(currentPage - 1) * hadithsPerPage + index + 1}`} size="small" color="primary" variant="outlined" />
                            <Chip label={`Hadith ${item.hadith.hadith_number}`} size="small" variant="outlined" />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            Saved on {formatDate(item.created_at)}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="primary">{item.hadith.chapters.volumes.books.title}</Typography>
                          {item.hadith.chapters.title_en && <Typography variant="caption" color="text.secondary">{item.hadith.chapters.title_en}</Typography>}
                        </Box>

                        <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                          <Typography variant="body2" sx={{ direction: 'rtl', textAlign: 'right', lineHeight: 1.6 }}>
                            {highlightText(truncateArabicWithContext(item.hadith.arabic, searchTerm), searchTerm, true)}
                          </Typography>
                        </Box>

                        {item.hadith.english && (
                          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                            <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
                              {highlightText(item.hadith.english.substring(0, 150), searchTerm)}
                            </Typography>
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                          <Stack direction="row" spacing={1}>
                            <Button variant="outlined" size="small" onClick={() => handleViewFullHadith(item)}>View Full Hadith</Button>
                          </Stack>
                          <IconButton size="small" onClick={() => handleRemoveSavedHadith(item.hadith.id)} color="error" title="Remove from saved">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </ListItem>
                  </Paper>
                ))}
              </List>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} color="primary" showFirstButton showLastButton sx={{ '& .MuiPaginationItem-root': { borderRadius: 2 } }} />
                </Box>
              )}

              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                Showing {indexOfFirstHadith + 1}-{Math.min(indexOfLastHadith, filteredHadiths.length)} of {filteredHadiths.length} saved hadiths
                {searchTerm && ` (filtered from ${savedHadiths.length} total)`}
              </Typography>
            </>
          )}
        </Paper>

        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>Your Activity Summary</Typography>
          <Stack direction="row" spacing={4} justifyContent="center">
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{savedHadiths.length}</Typography>
              <Typography variant="caption">Total Saved Hadiths</Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">{formatDate(user.created_at)}</Typography>
              <Typography variant="caption">Member Since</Typography>
            </Box>
          </Stack>
        </Paper>
      </Container>

      {/* Full Hadith Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth scroll="paper">
        {selectedHadith && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6">Hadith {selectedHadith.hadith.hadith_number}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedHadith.hadith.chapters.volumes.books.title}</Typography>
                </Box>
                <IconButton onClick={handleCloseDialog} size="small"><CloseIcon /></IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={3}>
                <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="primary.contrastText">{selectedHadith.hadith.chapters.volumes.books.title}</Typography>
                  {selectedHadith.hadith.chapters.title_en && <Typography variant="body2" color="primary.contrastText" sx={{ opacity: 0.9 }}>{selectedHadith.hadith.chapters.title_en}</Typography>}
                </Box>

                <Paper elevation={0} sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Typography variant="body1" sx={{ direction: 'rtl', textAlign: 'right', lineHeight: 1.8, fontSize: '1.1rem' }}>
                    {highlightText(showFullArabic ? selectedHadith.hadith.arabic : truncateArabic(selectedHadith.hadith.arabic), searchTerm, true)}
                  </Typography>
                  {isArabicLong(selectedHadith.hadith.arabic) && (
                    <Button size="small" onClick={() => setShowFullArabic(!showFullArabic)} sx={{ mt: 1 }}>
                      {showFullArabic ? 'Show Less' : 'Show More'}
                    </Button>
                  )}
                </Paper>

                <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                  <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                    {highlightText(selectedHadith.hadith.english, searchTerm)}
                  </Typography>
                </Paper>

                {selectedHadith.hadith.hadith_reference?.reference && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Reference: {selectedHadith.hadith.hadith_reference.reference}
                  </Typography>
                )}

                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Stack direction="row" spacing={2} justifyContent="space-between">
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Hadith Number</Typography>
                      <Typography variant="body2">{selectedHadith.hadith.hadith_number}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Saved On</Typography>
                      <Typography variant="body2">{formatDate(selectedHadith.created_at)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Volume</Typography>
                      <Typography variant="body2">{selectedHadith.hadith.chapters.volumes.volume_number}</Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
              <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => copyHadithToClipboard(selectedHadith)}>Copy Hadith</Button>
              <Button variant="contained" onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Profile;
