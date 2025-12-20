// Pages/BookPage.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Container,
  Stack,
  Divider,
  Breadcrumbs,
  Skeleton,
  Fab,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";
import FeedbackIcon from "@mui/icons-material/Feedback";
import CloseIcon from "@mui/icons-material/Close";
import Navbar from "../components/Navbar/Navbar.jsx";
import { supabase } from "../config/supabaseClient.js";
import { useBookData } from "../hooks/useBookData.js";

export default function BookPage() {
  const { bookId } = useParams();
  const {
    book,
    volumes,
    selectedVolume,
    setSelectedVolume,
    chapters,
    selectedVolumeNumber,
    loading,
  } = useBookData(bookId);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [chaptersPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Check scroll position for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [bookId]);

  // Scroll to top when page changes
  useEffect(() => {
    if (currentPage > 1) {
      setTimeout(() => {
        const chaptersSection = document.querySelector('[data-chapters-section]');
        if (chaptersSection) {
          const rect = chaptersSection.getBoundingClientRect();
          const offsetPosition = rect.top + window.pageYOffset - 100;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      }, 100);
    }
  }, [currentPage]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Calculate paginated chapters
  const getPaginatedChapters = () => {
    const startIndex = (currentPage - 1) * chaptersPerPage;
    const endIndex = startIndex + chaptersPerPage;
    return chapters.slice(startIndex, endIndex);
  };

  // Get total number of pages
  const getTotalPages = () => {
    return Math.ceil(chapters.length / chaptersPerPage);
  };

  // Pagination Component
  const PaginationControls = () => {
    const totalPages = getTotalPages();
    
    if (totalPages <= 1) return null;
    
    const handlePageChange = (newPage) => {
      setCurrentPage(newPage);
    };
    
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        my: 4,
        p: 3,
        backgroundColor: 'grey.50',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Button
          variant="outlined"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          startIcon={<ArrowForwardIosIcon sx={{ transform: 'rotate(180deg)' }} />}
        >
          Previous
        </Button>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "contained" : "outlined"}
                onClick={() => handlePageChange(pageNum)}
                sx={{
                  minWidth: 40,
                  height: 40,
                  fontWeight: currentPage === pageNum ? 'bold' : 'normal'
                }}
              >
                {pageNum}
              </Button>
            );
          })}
        </Box>
        
        <Button
          variant="outlined"
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          endIcon={<ArrowForwardIosIcon />}
        >
          Next
        </Button>
        
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Page {currentPage} of {totalPages}
        </Typography>
      </Box>
    );
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Container
          maxWidth="lg"
          sx={{
            pt: "calc(64px + 32px)",
            pb: 6,
            minHeight: "100vh",
          }}
        >
          <Skeleton variant="rectangular" width={200} height={24} sx={{ mb: 4 }} />
          <Paper sx={{ p: { xs: 3, md: 5 }, mb: 5, borderRadius: 3 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={4}>
              <Skeleton variant="rectangular" width={240} height={340} sx={{ borderRadius: 2 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="70%" height={48} sx={{ mb: 2 }} />
                <Skeleton variant="text" width="50%" height={32} sx={{ mb: 3 }} />
                <Skeleton variant="text" width="30%" height={28} />
              </Box>
            </Stack>
          </Paper>
          <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
            <Skeleton variant="text" width="40%" height={40} sx={{ mb: 4 }} />
            {Array.from(new Array(5)).map((_, idx) => (
              <Box key={idx} sx={{ mb: 2 }}>
                <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
              </Box>
            ))}
          </Paper>
        </Container>
      </>
    );
  }

  if (!book) return <Typography>Book not found</Typography>;

  return (
    <>
      <Navbar />
      <Container
        maxWidth="lg"
        sx={{
          pt: "calc(64px + 32px)",
          pb: 6,
          minHeight: "100vh",
        }}
      >
        {/* Breadcrumb Navigation */}
        <Breadcrumbs sx={{ mb: 4 }}>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body1">Home</Typography>
            </Stack>
          </Link>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography color="primary.main" fontWeight="medium">
              {book.title}
            </Typography>
          </Stack>
        </Breadcrumbs>

        {/* Header Section */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            mb: 5,
            borderRadius: 3,
            backgroundColor: "white",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack 
            direction={{ xs: "column", md: "row" }} 
            spacing={{ xs: 3, md: 5 }}
            alignItems={{ xs: "center", md: "flex-start" }}
          >
            {book.image_path && (
              <Box
                component="img"
                src={book.image_path}
                alt={book.title}
                sx={{
                  width: { xs: 180, md: 240 },
                  height: { xs: 260, md: 340 },
                  borderRadius: 2,
                  boxShadow: 3,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            )}
            
            <Box sx={{ flex: 1, width: "100%" }}>
              <Typography 
                variant="h3" 
                fontWeight="bold" 
                color="primary.main"
                gutterBottom
                sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}
              >
                {book.title}
              </Typography>
              
              {book.english_title && (
                <Typography 
                  variant="h5" 
                  color="text.secondary"
                  sx={{ 
                    mb: 4, 
                    fontStyle: 'italic',
                    fontSize: { xs: '1.25rem', md: '1.5rem' }
                  }}
                >
                  {book.english_title}
                </Typography>
              )}

              {book.author && (
                <Typography 
                  variant="h6" 
                  color="text.primary"
                  sx={{ mb: 3 }}
                >
                  <Box component="span">Author:</Box> {book.author}
                </Typography>
              )}

              {/* Volume Selection */}
              {volumes.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography 
                    variant="subtitle1" 
                    fontWeight="bold" 
                    color="text.secondary" 
                    gutterBottom
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  >
                    Select Volume:
                  </Typography>
                  <FormControl sx={{ minWidth: { xs: 150, sm: 200 } }}>
                    <Select
                      value={selectedVolume}
                      onChange={(e) => setSelectedVolume(e.target.value)}
                      sx={{ 
                        backgroundColor: 'white',
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        }
                      }}
                    >
                      {volumes.map((vol) => (
                        <MenuItem 
                          key={vol.id} 
                          value={vol.id}
                          sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                        >
                          Volume {vol.volume_number}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Reader Mode Button */}
              <Box sx={{ mt: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  component={Link}
                  to={`/book/${book.id}/reader`}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                  }}
                >
                  Enter Reader Mode
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Read all hadiths continuously with pagination
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Paper>
        
        {/* Chapters Section */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            backgroundColor: "white",
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
          }}
          data-chapters-section
        >
          {/* Section Header */}
          <Box sx={{ 
            flex: 1,
            mb: { xs: 2, sm: 4 },
            pb: { xs: 2, sm: 3 },
            borderBottom: '2px solid',
            borderColor: 'primary.light',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Box>
              <Typography 
                variant="h4" 
                fontWeight="bold" 
                color="primary.main"
                sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}
              >
                Chapters
              </Typography>
              {selectedVolumeNumber > 0 && (
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={{ xs: 1, sm: 2 }} 
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  sx={{ mt: 1 }}
                >
                  <Chip 
                    label={`Volume ${selectedVolumeNumber}`}
                    color="primary"
                    variant="outlined"
                    size="medium"
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      height: { xs: 28, sm: 32 }
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    {chapters.length} chapters
                  </Typography>
                </Stack>
              )}
            </Box>
          </Box>

          {/* Pagination Controls at the top */}
          <PaginationControls />
          
          {/* Chapters List */}
          {chapters.length === 0 ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <Typography 
                variant="h6" 
                color="text.secondary"
                sx={{ opacity: 0.7 }}
              >
                No chapters found for this volume.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {getPaginatedChapters().map((ch) => (
                <Paper
                  key={ch.id}
                  component={Link}
                  to={`/book/${book.id}/chapter/${ch.id}`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    p: { xs: 1.5, sm: 2, md: 3 },
                    borderRadius: 2,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    backgroundColor: 'transparent',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': { 
                      borderColor: 'primary.main',
                      transform: { xs: 'translateX(2px)', md: 'translateX(4px)' },
                      boxShadow: 2,
                    },
                  }}
                >
                  {/* Top Section: Chapter Number - Only show if chapter_number is not 0 */}
                  {ch.chapter_number !== 0 && (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2,
                      pb: 1,
                      borderBottom: '1px dashed',
                      borderColor: 'divider'
                    }}>
                      {/* Chapter Number Badge */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: { xs: 40, sm: 50 },
                          height: { xs: 40, sm: 50 },
                          borderRadius: 1,
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText',
                          flexShrink: 0,
                        }}
                      >
                        <Typography 
                          variant="body1" 
                          fontWeight="bold"
                          sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            px: 1
                          }}
                        >
                          Chapter {ch.chapter_number}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Main Content: Full Chapter Details */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    {/* English Title - Full */}
                    <Box sx={{ flex: 1, minWidth: 0, pr: { xs: 1, sm: 2 } }}>
                      {ch.title_en && (
                        <Typography 
                          variant="h6" 
                          fontWeight="medium"
                          color="text.primary"
                          sx={{ 
                            fontSize: { 
                              xs: '1rem',    
                              sm: '1.125rem',
                              md: '1.25rem'
                            },
                            lineHeight: { xs: 1.4, sm: 1.5 },
                            mb: 1
                          }}
                        >
                          {ch.title_en}
                        </Typography>
                      )}

                      {/* Arabic Title - Full */}
                      {ch.title_ar && (
                        <Typography 
                          variant="body1"
                          color="text.secondary"
                          sx={{ 
                            direction: 'rtl',
                            textAlign: 'right',
                            fontFamily: 'inherit',
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            lineHeight: 1.6
                          }}
                        >
                          {ch.title_ar}
                        </Typography>
                      )}
                    </Box>

                    {/* Arrow Icon */}
                    <ArrowForwardIosIcon 
                      sx={{ 
                        color: 'primary.main',
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                        opacity: 0.7,
                        transition: 'opacity 0.2s',
                        flexShrink: 0,
                        mt: 0.5,
                        'a:hover &': {
                          opacity: 1
                        }
                      }}
                    />
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
          
          {/* Pagination Controls at the bottom */}
          <PaginationControls />

          {/* Footer */}
          {chapters.length > 0 && (
            <>
              <Divider sx={{ my: 4 }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  Showing {getPaginatedChapters().length} chapters on page {currentPage} of {getTotalPages()} • Total {chapters.length} chapters
                </Typography>
              </Box>
            </>
          )}
        </Paper>

        {/* Back to Top Button */}
        {showScrollTop && (
          <Fab
            color="primary"
            onClick={scrollToTop}
            sx={{
              position: "fixed",
              bottom: 20,
              right: 20,
              zIndex: 1001,
            }}
          >
            <KeyboardDoubleArrowUpIcon />
          </Fab>
        )}
      </Container>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}