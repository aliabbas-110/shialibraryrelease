import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar.jsx";
import {
  Paper,
  Typography,
  Container,
  Box,
  IconButton,
  Chip,
  Stack,
  Divider,
  Breadcrumbs,
  Skeleton,
  Tooltip,
  Fab,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import HomeIcon from "@mui/icons-material/Home";
import BookIcon from "@mui/icons-material/Book";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FeedbackIcon from "@mui/icons-material/Feedback";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import CloseIcon from "@mui/icons-material/Close";
import { ThemeProvider } from "@mui/material";
import theme from "../assets/theme.js";
import { supabase } from "../config/supabaseClient.js";
import { useAuth } from '../contexts/AuthContext';

export default function ChapterPage() {
  const { bookId, chapterId } = useParams();
  const navigate = useNavigate();

  const [hadiths, setHadiths] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [book, setBook] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [feedbackDialog, setFeedbackDialog] = useState({ open: false, hadith: null });
  const [feedback, setFeedback] = useState({ name: "", email: "", comments: "" });
  const [expandedArabic, setExpandedArabic] = useState({});
  
  // Auth context for saving hadiths
  const { user, saveHadith, removeSavedHadith, isHadithSaved } = useAuth();
  const [savedStates, setSavedStates] = useState({});

  // Check scroll position for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch book details
  useEffect(() => {
    const fetchBook = async () => {
      const { data } = await supabase
        .from("books")
        .select("title, english_title")
        .eq("id", bookId)
        .single();
      setBook(data);
    };
    fetchBook();
  }, [bookId]);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [chapterId]);

  // Scroll to specific hadith from search
  useEffect(() => {
    const handleScrollToHadith = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#hadith-')) {
        const hadithId = hash.replace('#hadith-', '');
        
        if (hadiths.length > 0) {
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            const element = document.getElementById(`hadith-${hadithId}`);
            if (element) {
              // Calculate position considering fixed navbar
              const navbarHeight = 64;
              const elementPosition = element.getBoundingClientRect().top;
              const offsetPosition = elementPosition + window.pageYOffset - navbarHeight - 20;
              
              window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
              });
              
              // Add highlight effect
              element.style.transition = 'background-color 0.5s ease';
              element.style.backgroundColor = 'rgba(255, 255, 100, 0.15)';
              element.style.borderRadius = '8px';
              element.style.padding = '4px';
              element.style.margin = '-4px';
              
              setTimeout(() => {
                element.style.backgroundColor = '';
                element.style.padding = '';
                element.style.margin = '';
              }, 2000);
            }
          }, 300);
        }
      }
    };

    handleScrollToHadith();
  }, [hadiths, chapterId]);
  
  // Fetch hadiths for this chapter
  useEffect(() => {
    const fetchHadiths = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("hadith")
        .select("id, hadith_number, arabic, english, hadith_reference(reference)")
        .eq("chapter_id", chapterId)
        .order("hadith_number", { ascending: true, nullsFirst: false });

      if (error) {
        console.error("Error fetching hadith:", error);
        setHadiths([]);
      } else {
        // Custom sorting for hadith numbers with slashes
        const sortedHadiths = (data || []).sort((a, b) => {
          // Function to parse hadith numbers with slashes
          const parseHadithNumber = (num) => {
            if (!num) return [0, 0]; // Default for null/undefined
            
            // Check if it contains a slash
            if (num.includes('/')) {
              const parts = num.split('/');
              return [
                parseInt(parts[0]) || 0,
                parseInt(parts[1]) || 0
              ];
            }
            
            // If no slash, treat as single number
            return [parseInt(num) || 0, 0];
          };

          const [aMain, aSub] = parseHadithNumber(a.hadith_number);
          const [bMain, bSub] = parseHadithNumber(b.hadith_number);
          
          // First compare main numbers
          if (aMain !== bMain) {
            return aMain - bMain;
          }
          
          // If main numbers are equal, compare sub-numbers (after slash)
          return aSub - bSub;
        });
        
        setHadiths(sortedHadiths);
      }
      setLoading(false);
    };
    fetchHadiths();
  }, [chapterId]);

  // Check saved status for all hadiths when user or hadiths change
  useEffect(() => {
    const checkAllSavedStatus = async () => {
      if (!user || hadiths.length === 0) return;
      
      const newSavedStates = {};
      for (const hadith of hadiths) {
        newSavedStates[hadith.id] = await isHadithSaved(hadith.id);
      }
      setSavedStates(newSavedStates);
    };
    
    checkAllSavedStatus();
  }, [hadiths, user, isHadithSaved]);

  // Fetch all chapters of this book for navigation
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        // 1. Fetch all chapters for the specific book 
        // via the volume relationship
        const { data: volumesData } = await supabase
          .from("volumes")
          .select("id")
          .eq("book_id", bookId);

        if (!volumesData) return;
        const volumeIds = volumesData.map(v => v.id);

        // 2. Fetch chapters using ONLY the columns in your schema
        const { data: chapterList, error } = await supabase
          .from("chapters")
          .select("id, chapter_number, title_en, title_ar")
          .in("volume_id", volumeIds)
          .order("chapter_number", { ascending: true });

        if (error) {
          console.error("Fetch error:", error.message);
          return;
        }

        // 3. Sync the state
        setChapters(chapterList);
        
        // Find where we are in the list
        const index = chapterList.findIndex((c) => String(c.id) === String(chapterId));
        setCurrentIndex(index);
        setCurrentChapter(chapterList[index]);

      } catch (err) {
        console.error("System Error:", err);
      }
    };

    if (bookId && chapterId) {
      fetchChapters();
    }
  }, [bookId, chapterId]);

  // Save/Unsave hadith function
  const handleSaveHadith = async (hadithId) => {
    if (!user) {
      setSnackbar({
        open: true,
        message: "Please login to save hadiths",
        severity: "warning"
      });
      return;
    }
    
    try {
      if (savedStates[hadithId]) {
        // Already saved, so unsave it
        const { error } = await removeSavedHadith(hadithId);
        if (error) throw new Error(error);
        
        setSavedStates(prev => ({ ...prev, [hadithId]: false }));
        setSnackbar({
          open: true,
          message: "Hadith removed from saved",
          severity: "info"
        });
      } else {
        // Not saved, so save it
        const { data, error } = await saveHadith(hadithId);
        if (error) throw new Error(error);
        
        setSavedStates(prev => ({ ...prev, [hadithId]: true }));
        setSnackbar({
          open: true,
          message: "Hadith saved successfully!",
          severity: "success"
        });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      setSnackbar({
        open: true,
        message: error.message || 'An error occurred',
        severity: 'error'
      });
    }
  };

  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter =
    currentIndex !== -1 && currentIndex < chapters.length - 1
      ? chapters[currentIndex + 1]
      : null;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getChapterTitle = (chapter) => {
    if (!chapter) return "";
    // Try English title first, then Arabic, then just chapter number
    return chapter.title_en || `Chapter ${chapter.chapter_number}`;
  };
  
  // Copy hadith to clipboard in the specified format
  const copyHadithFormatted = (hadith) => {
    // Get the correct URL with full path
    const hadithUrl = `${window.location.origin}/book/${bookId}/chapter/${chapterId}`;
    
    // Get book name
    const bookName = book?.title || book?.english_title || "Unknown Book";
    
    // Build reference line - check what reference data we have
    let referenceLine = "";
    if (hadith.hadith_reference?.reference) {
      referenceLine = hadith.hadith_reference.reference;
    } else {
      // If no reference in database, use book and chapter number
      referenceLine = `${bookName}, Chapter ${currentChapter?.chapter_number || "?"}`;
    }
    
    // Format exactly like your example
    const formattedText = `${hadith.arabic}\n\n${hadith.english}\n\n${referenceLine}\n${hadithUrl}`;
    
    navigator.clipboard.writeText(formattedText)
      .then(() => {
        setSnackbar({
          open: true,
          message: "Hadith Text Copied To Clipboard",
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

  // Toggle expanded state for Arabic text only
  const toggleArabicExpand = (hadithId) => {
    setExpandedArabic(prev => ({
      ...prev,
      [hadithId]: !prev[hadithId]
    }));
  };

  // Check if Arabic text is long (more than 750 characters)
  const isArabicLong = (text) => {
    return text && text.length > 750;
  };

  // Truncate Arabic text for preview
  const truncateArabic = (text) => {
    if (!text || text.length <= 750) return text;
    return text.substring(0, 750) + '...';
  };

  // Feedback functionality
  const handleFeedbackOpen = (hadith) => {
    setFeedbackDialog({ open: true, hadith });
    setFeedback({ name: "", email: "", comments: "" });
  };

  const handleFeedbackClose = () => {
    setFeedbackDialog({ open: false, hadith: null });
  };

  const handleFeedbackSubmit = async () => {
    if (!feedback.comments.trim()) {
      setSnackbar({
        open: true,
        message: "Please enter comments",
        severity: "warning",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("send-feedback", {
        body: {
          feedback,
          hadith: feedbackDialog.hadith,
          book,
          chapter: currentChapter,
          pageUrl: window.location.href,
        },
      });

      if (error) throw error;

      setSnackbar({
        open: true,
        message: "Feedback sent successfully 🙏",
        severity: "success",
      });

      handleFeedbackClose();

    } catch (err) {
      console.error("Feedback error FULL:", err);
      console.error("Context:", err?.context);

      setSnackbar({
        open: true,
        message:
          err?.context?.body ||
          err?.message ||
          "Failed to send feedback",
        severity: "error",
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      
      <Container sx={{ mt: "100px", mb: 8, maxWidth: "lg" }}>
        {/* Breadcrumb Navigation */}
        <Breadcrumbs sx={{ mb: 4 }}>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Typography variant="body1">Home</Typography>
          </Link>
          <Link to={`/book/${bookId}`} style={{ textDecoration: "none", color: "inherit" }}>
            <Typography variant="body1">{book?.title || "Book"}</Typography>
          </Link>
          <Typography 
            color="primary.main" 
            fontWeight="medium" 
            variant="body1"
            sx={{
              maxWidth: '300px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {/* Format: "Chapter Name (Chapter X)" */}
            {(() => {
              const chapterName = currentChapter?.title_en || currentChapter?.title_ar;
              const chapterNum = currentChapter?.chapter_number;
              
              if (chapterName && chapterNum) {
                return `${chapterName} (Ch. ${chapterNum})`;
              } else if (chapterName) {
                return chapterName;
              } else if (chapterNum) {
                return `Chapter ${chapterNum}`;
              }
              return "Chapter";
            })()}
          </Typography>
        </Breadcrumbs>

        {/* Chapter Header with Integrated Navigation */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 4,
          gap: 2
        }}>
          {/* Left Navigation Button */}
          <Tooltip title={prevChapter ? `Previous Chapter (${prevChapter.chapter_number})` : "First Chapter"}>
            <span>
              <IconButton
                onClick={() => prevChapter && navigate(`/book/${bookId}/chapter/${prevChapter.id}`)}
                disabled={!prevChapter}
                sx={{
                  width: 56,
                  height: 56,
                  backgroundColor: "primary.light",
                  "&:hover": {
                    backgroundColor: "primary.main",
                    color: "white",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "grey.100",
                    color: "grey.400",
                  }
                }}
              >
                <ArrowBackIosNewIcon />
              </IconButton>
            </span>
          </Tooltip>

          {/* Centered Chapter Info */}
          <Box sx={{ 
            flex: 1, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Typography variant="h4" fontWeight="bold" color="primary.dark" gutterBottom>
              {getChapterTitle(currentChapter)}
            </Typography>

            
            {/* Hadith Count */}
{hadiths.length > 0 && !loading && (
  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
    {hadiths.length} {hadiths.length !== 1 ? "Ahadith" : "Hadith"}
  </Typography>
)}
          </Box>

          {/* Right Navigation Button */}
          <Tooltip title={nextChapter ? `Next Chapter (${nextChapter.chapter_number})` : "Last Chapter"}>
            <span>
              <IconButton
                onClick={() => nextChapter && navigate(`/book/${bookId}/chapter/${nextChapter.id}`)}
                disabled={!nextChapter}
                sx={{
                  width: 56,
                  height: 56,
                  backgroundColor: "primary.light",
                  "&:hover": {
                    backgroundColor: "primary.main",
                    color: "white",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "grey.100",
                    color: "grey.400",
                  }
                }}
              >
                <ArrowForwardIosIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        
        {/* Hadiths List */}
        {loading ? (
          // Skeleton loading
          Array.from(new Array(3)).map((_, idx) => (
            <Paper key={idx} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Skeleton variant="text" width="30%" height={32} />
              <Skeleton variant="rectangular" height={100} sx={{ my: 2, borderRadius: 1 }} />
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
            </Paper>
          ))
        ) : hadiths.length > 0 ? (
          hadiths.map((h, idx) => (
            <Paper
              key={h.id || idx}
              id={`hadith-${h.id}`}
              sx={{
                p: { xs: 2, md: 3 },
                mb: 4,
                borderRadius: 3,
                borderLeft: "4px solid",
                borderLeftColor: "primary.main",
                position: "relative",
                "&:hover": {
                  boxShadow: 4,
                  transform: "translateY(-2px)",
                  transition: "all 0.2s ease",
                },
                transition: "all 0.2s ease",
              }}
            >
              {/* Action Icons in Top Right */}
              <Box
                sx={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  display: "flex",
                  gap: 1,
                  backgroundColor: "background.paper",
                  borderRadius: 2,
                  p: 0.5,
                  border: "1px solid",
                  borderColor: "divider",
                  zIndex: 2,
                }}
              >
                {/* Copy Button */}
                <Tooltip title="Copy Hadith">
                  <IconButton
                    size="small"
                    onClick={() => copyHadithFormatted(h)}
                    sx={{
                      "&:hover": {
                        color: "primary.main",
                      },
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {/* Save Button - Using Auth Context */}
                <Tooltip title={savedStates[h.id] ? "Remove from saved" : "Save hadith"}>
                  <IconButton
                    size="small"
                    onClick={() => handleSaveHadith(h.id)}
                    sx={{
                      "&:hover": {
                        color: savedStates[h.id] ? "error.main" : "warning.main",
                      },
                    }}
                  >
                    {savedStates[h.id] ? (
                      <BookmarkIcon fontSize="small" sx={{ color: "warning.main" }} />
                    ) : (
                      <BookmarkBorderIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>

                {/* Feedback Button */}
                <Tooltip title="Report Issue">
                  <IconButton
                    size="small"
                    onClick={() => handleFeedbackOpen(h)}
                    sx={{
                      "&:hover": {
                        color: "info.main",
                      },
                    }}
                  >
                    <FeedbackIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Save Status Indicator */}
              <Box sx={{ mb: 1, ml: -1 }}>
                {savedStates[h.id] && (
                  <Chip
                    label="Saved"
                    size="small"
                    sx={{
                      backgroundColor: "warning.light",
                      color: "warning.contrastText",
                      fontSize: "0.7rem",
                      height: 20,
                    }}
                  />
                )}
              </Box>

              {/* Hadith Header */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, pr: 6 }}>
                <Chip
                  label={`Hadith ${h.hadith_number}`}
                  color="primary.light"
                  variant="outlined"
                />
                <Divider orientation="vertical" flexItem />
                <Typography variant="caption" color="text.secondary">
                  #{idx + 1}
                </Typography>
              </Box>

              {/* Arabic Text with Show More if needed */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: "#f8f9fa",
                  border: "1px solid",
                  borderColor: "divider",
                  position: "relative",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "1.1rem", md: "1.2rem" },
                    lineHeight: 1.8,
                    direction: "rtl",
                    textAlign: "right",
                    fontFamily: "inherit",
                    fontWeight: 500,
                  }}
                >
                  {expandedArabic[h.id] ? h.arabic : truncateArabic(h.arabic)}
                </Typography>
                
                {/* Show More/Less button for long Arabic text only */}
                {isArabicLong(h.arabic) && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => toggleArabicExpand(h.id)}
                      sx={{
                        color: 'primary.main',
                        fontWeight: 500,
                        '&:hover': {
                          backgroundColor: 'primary.light',
                        }
                      }}
                    >
                      {expandedArabic[h.id] ? 'Show Less Arabic' : 'Show More Arabic'}
                      {expandedArabic[h.id] ? (
                        <KeyboardDoubleArrowUpIcon sx={{ ml: 0.5, fontSize: 16 }} />
                      ) : (
                        <KeyboardDoubleArrowUpIcon sx={{ ml: 0.5, fontSize: 16, transform: 'rotate(180deg)' }} />
                      )}
                    </Button>
                  </Box>
                )}
              </Paper>

              {/* English Translation - Always show full */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: "white",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="body1"
                  color="text.primary"
                  sx={{
                    lineHeight: 1.7,
                    whiteSpace: "pre-line",
                    fontSize: { xs: "1rem", md: "1.05rem" },
                  }}
                >
                  {h.english}
                </Typography>
              </Paper>

              {/* Reference */}
              {h.hadith_reference?.reference && (
                <Box
                  sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: "1px dashed",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    <strong>Reference:</strong> {h.hadith_reference.reference}
                  </Typography>
                </Box>
              )}

              {/* Login Prompt for non-logged in users */}
              {!user && (
                <Box sx={{ mt: 3, pt: 2, borderTop: "1px dashed", borderColor: "divider" }}>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Want to save this hadith?{' '}
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => navigate('/login')}
                      sx={{ textTransform: 'none', fontWeight: 'bold' }}
                    >
                      Login or Sign Up
                    </Button>
                  </Typography>
                </Box>
              )}
            </Paper>
          ))
        ) : (
          <Paper
            sx={{
              p: 8,
              textAlign: "center",
              borderRadius: 3,
              backgroundColor: "grey.50",
            }}
          >
            <FormatQuoteIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hadiths found for this chapter
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This chapter doesn't contain any hadiths yet.
            </Typography>
          </Paper>
        )}

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

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialog.open}
        onClose={handleFeedbackClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Report Feedback On Hadith {feedbackDialog.hadith?.hadith_number}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Report any issues with this hadith
              </Typography>
            </Box>
            <IconButton onClick={handleFeedbackClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Name"
              fullWidth
              required
              value={feedback.name}
              onChange={(e) => setFeedback({ ...feedback, name: e.target.value })}
              variant="outlined"
              placeholder="Enter your name"
            />
            
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={feedback.email}
              onChange={(e) => setFeedback({ ...feedback, email: e.target.value })}
              variant="outlined"
              placeholder="Enter your email for follow-up"
            />
            
            <TextField
              label="Comments *"
              multiline
              rows={6}
              fullWidth
              required
              value={feedback.comments}
              onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
              variant="outlined"
              placeholder="Please describe the issue you found with this hadith (translation errors, missing text, reference issues, etc.)"
              helperText="Required field"
            />
            
            <Box sx={{ p: 2, backgroundColor: "grey.50", borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Note:</strong> Please be specific about the issue. Include details about:
                <ul style={{ marginTop: 4, marginBottom: 4, paddingLeft: 20 }}>
                  <li>Translation errors</li>
                  <li>Missing or incorrect Arabic text</li>
                  <li>Reference issues</li>
                  <li>Formatting problems</li>
                  <li>Any other concerns</li>
                </ul>
                Your feedback helps us improve the accuracy of hadith content.
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleFeedbackClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleFeedbackSubmit}
            disabled={!feedback.comments.trim()}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>

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
    </ThemeProvider>
  );
}