// Pages/BookReaderPage.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
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
  CircularProgress,
  LinearProgress,
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FeedbackIcon from "@mui/icons-material/Feedback";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import Navbar from "../components/Navbar/Navbar.jsx";
import { supabase } from "../config/supabaseClient.js";
import { useAuth } from '../contexts/AuthContext';
import { useBookData } from "../hooks/useBookData.js";
import { useTheme, useMediaQuery } from "@mui/material";


export default function BookReaderPage() {
  const { bookId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const {
    book,
    volumes,
    selectedVolume,
    setSelectedVolume,
    chapters,
    selectedVolumeNumber,
    loading,
    setChapters,
  } = useBookData(bookId);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [chapterHadiths, setChapterHadiths] = useState({}); 
  const [expandedArabic, setExpandedArabic] = useState({});
  const [collapsedChapters, setCollapsedChapters] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [feedbackDialog, setFeedbackDialog] = useState({ open: false, hadith: null });
  const [feedback, setFeedback] = useState({ name: "", email: "", comments: "" });
  const [loadingHadiths, setLoadingHadiths] = useState(false);
  const [hadithsLoadingProgress, setHadithsLoadingProgress] = useState(0);
  const [changingVolume, setChangingVolume] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hadithsPerPage] = useState(20);
  const [allHadiths, setAllHadiths] = useState([]);
  
  // Auth context for saving hadiths
  const { user, saveHadith, removeSavedHadith, isHadithSaved } = useAuth();
  const [savedStates, setSavedStates] = useState({});

  // Refs to track scrolling state
  const hasScrolledToTargetRef = useRef(false);
  const initialLoadRef = useRef(true);
  const scrollTimeoutRef = useRef(null);
  const isProcessingTargetHadithRef = useRef(false);

  // Get target hadith ID from URL only once
  const targetHadithId = useRef(null);
  if (targetHadithId.current === null) {
    const searchParams = new URLSearchParams(location.search);
    targetHadithId.current = searchParams.get("hadith");
  }

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
    // Reset refs when component mounts
    hasScrolledToTargetRef.current = false;
    initialLoadRef.current = true;
    isProcessingTargetHadithRef.current = false;
    
    return () => {
      // Clean up timeout on unmount
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [bookId]);

  // Fetch hadiths when chapters are loaded
  useEffect(() => {
    if (chapters.length > 0 && !changingVolume) {
      fetchAllChapterHadiths();
    }
  }, [chapters, changingVolume]);

  // Reset hadith data when volume changes
  useEffect(() => {
    if (selectedVolume && !changingVolume) {
      // Reset pagination and hadiths when volume changes
      setCurrentPage(1);
      setAllHadiths([]);
      setChapterHadiths({});
      setCollapsedChapters({});
      setExpandedArabic({});
      // Reset scroll tracking
      hasScrolledToTargetRef.current = false;
      isProcessingTargetHadithRef.current = false;
    }
  }, [selectedVolume, changingVolume]);

  // Scroll when page changes
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

  
  // Handle target hadith when component loads
  useEffect(() => {
    if (targetHadithId.current && !isProcessingTargetHadithRef.current && book && !changingVolume) {
      handleTargetHadith();
    }
  }, [targetHadithId.current, book, volumes, changingVolume]);

  const handleTargetHadith = async () => {
    if (!targetHadithId.current || isProcessingTargetHadithRef.current) return;
    
    isProcessingTargetHadithRef.current = true;
    
    try {
      // First, fetch the hadith to get its chapter
      const { data: hadithData, error: hadithError } = await supabase
        .from("hadith")
        .select("chapter_id")
        .eq("id", targetHadithId.current)
        .single();
      
      if (hadithError || !hadithData) {
        console.error("Error fetching hadith:", hadithError);
        return;
      }
      
      // Then fetch the chapter to get its volume
      const { data: chapterData, error: chapterError } = await supabase
        .from("chapters")
        .select("volume_id")
        .eq("id", hadithData.chapter_id)
        .single();
      
      if (chapterError || !chapterData) {
        console.error("Error fetching chapter:", chapterError);
        return;
      }
      
      // Find the volume that contains this chapter
      const targetVolumeId = chapterData.volume_id;
      
      // If target volume is different from current volume, switch to it
      if (targetVolumeId && targetVolumeId !== selectedVolume) {
        // Find the volume in our volumes list
        const targetVolume = volumes.find(v => v.id === targetVolumeId);
        if (targetVolume) {
          console.log("Switching to volume:", targetVolume.volume_number);
          await handleVolumeChange(targetVolumeId);
          
          // Wait for volume to switch and hadiths to load
          scrollTimeoutRef.current = setTimeout(() => {
            scrollToTargetHadithAfterLoad();
          }, 1500);
          return;
        }
      }
      
      // If already in correct volume, just wait for hadiths to load
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToTargetHadithAfterLoad();
      }, 1000);
      
    } catch (error) {
      console.error("Error handling target hadith:", error);
      isProcessingTargetHadithRef.current = false;
    }
  };

  const scrollToTargetHadithAfterLoad = () => {
    if (allHadiths.length === 0 || hasScrolledToTargetRef.current || changingVolume) return;
    
    const index = allHadiths.findIndex(
      h => String(h.id) === String(targetHadithId.current)
    );

    if (index === -1) {
      // Hadith not found in current volume, try again after delay
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToTargetHadithAfterLoad();
      }, 500);
      return;
    }

    const page = Math.floor(index / hadithsPerPage) + 1;

    // Set page if needed
    if (page !== currentPage) {
      setCurrentPage(page);
      // Wait for page to render
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToTargetHadith();
      }, 500);
    } else {
      // Already on correct page
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToTargetHadith();
      }, 300);
    }
  };

  const scrollToTargetHadith = () => {
    const el = document.getElementById(`reader-hadith-${targetHadithId.current}`);
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      
      // Add highlight effect
      el.style.transition = "background-color 0.5s ease";
      el.style.backgroundColor = "rgba(255, 243, 205, 0.8)";
      
      setTimeout(() => {
        el.style.backgroundColor = "";
      }, 2000);
      
      // Mark that we've handled the scroll
      hasScrolledToTargetRef.current = true;
      isProcessingTargetHadithRef.current = false;
      
      // Clean up URL after scroll
      if (location.search.includes("hadith=")) {
        navigate(location.pathname, { replace: true });
      }
    } else {
      // Element not found yet, try again
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToTargetHadith();
      }, 300);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Function to fetch hadiths for all chapters
  const fetchAllChapterHadiths = async () => {
    if (!chapters.length) return;
    
    setLoadingHadiths(true);
    setHadithsLoadingProgress(50);
    
    try {
      const chapterIds = chapters.map(ch => ch.id);
      
      const { data, error } = await supabase
        .from("hadith")
        .select(`
          id, 
          hadith_number, 
          arabic, 
          english,
          hadith_reference(reference),
          chapter_id
        `)
        .in("chapter_id", chapterIds)
        .order("chapter_id", { ascending: true })
        .order("id", { ascending: true }); // Changed from hadith_number to id
      
      if (error) throw error;
      
      const hadithsMap = {};
      const allHadithsArray = [];
      
      chapterIds.forEach(id => hadithsMap[id] = []);
      
      data?.forEach(hadith => {
        if (!hadithsMap[hadith.chapter_id]) {
          hadithsMap[hadith.chapter_id] = [];
        }
        hadithsMap[hadith.chapter_id].push(hadith);
        allHadithsArray.push(hadith);
      });
      
      // Sort each chapter's hadiths by id (ascending)
      for (const chapterId in hadithsMap) {
        hadithsMap[chapterId] = hadithsMap[chapterId].sort((a, b) => a.id - b.id);
      }
      
      // Sort all hadiths by id (ascending)
      const sortedAllHadiths = allHadithsArray.sort((a, b) => a.id - b.id);
      
      setChapterHadiths(hadithsMap);
      setAllHadiths(sortedAllHadiths);
      setCurrentPage(1);
      setHadithsLoadingProgress(100);
      
      if (user) {
        checkAllSavedStatus(hadithsMap);
      }
      
    } catch (error) {
      console.error("Error fetching hadiths:", error);
      setSnackbar({
        open: true,
        message: "Failed to load hadiths for this volume",
        severity: "error"
      });
    } finally {
      setLoadingHadiths(false);
      setHadithsLoadingProgress(100);
      setTimeout(() => setHadithsLoadingProgress(0), 500);
    }
  };

  // Check saved status for all hadiths
  const checkAllSavedStatus = async (hadithsMap) => {
    if (!user) return;
    
    const newSavedStates = {};
    for (const chapterId in hadithsMap) {
      for (const hadith of hadithsMap[chapterId]) {
        newSavedStates[hadith.id] = await isHadithSaved(hadith.id);
      }
    }
    setSavedStates(newSavedStates);
  };

  // Toggle expanded state for Arabic text
  const toggleArabicExpand = (hadithId) => {
    setExpandedArabic(prev => ({
      ...prev,
      [hadithId]: !prev[hadithId]
    }));
  };

  // Toggle chapter collapse state
  const toggleChapterCollapse = (chapterId) => {
    setCollapsedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  // Check if Arabic text is long
  const isArabicLong = (text) => {
    return text && text.length > 750;
  };

  // Truncate Arabic text for preview
  const truncateArabic = (text) => {
    if (!text || text.length <= 750) return text;
    return text.substring(0, 750) + '...';
  };

  // Calculate paginated hadiths
  const getPaginatedHadiths = () => {
    const startIndex = (currentPage - 1) * hadithsPerPage;
    const endIndex = startIndex + hadithsPerPage;
    return allHadiths.slice(startIndex, endIndex);
  };

  // Get total number of pages
  const getTotalPages = () => {
    return Math.ceil(allHadiths.length / hadithsPerPage);
  };

  // Find chapter for a hadith
  const findChapterForHadith = (hadith) => {
    return chapters.find(ch => ch.id === hadith.chapter_id);
  };

  // Group paginated hadiths by chapter for display
  const getPaginatedHadithsByChapter = () => {
    const paginatedHadiths = getPaginatedHadiths();
    const grouped = {};
    
    paginatedHadiths.forEach(hadith => {
      const chapter = findChapterForHadith(hadith);
      if (chapter && !grouped[chapter.id]) {
        grouped[chapter.id] = {
          chapter: chapter,
          hadiths: []
        };
      }
      if (grouped[chapter.id]) {
        grouped[chapter.id].hadiths.push(hadith);
      }
    });
    
    return grouped;
  };

  // Volume change handler - FIXED VERSION
  const handleVolumeChange = async (newVolumeId) => {
    // Don't do anything if selecting the same volume
    if (newVolumeId === selectedVolume) return;
    
    setChangingVolume(true);
    setSelectedVolume(newVolumeId);
    
    // Scroll to top when changing volumes
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Reset all hadith-related states
    setCurrentPage(1);
    setAllHadiths([]);
    setChapterHadiths({});
    setCollapsedChapters({});
    setExpandedArabic({});
    setLoadingHadiths(true);
    
    // Reset scroll tracking
    hasScrolledToTargetRef.current = false;
    isProcessingTargetHadithRef.current = false;
    
    try {
      // Fetch chapters for the new volume
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("volume_id", newVolumeId)
        .order("chapter_number", { ascending: true });
      
      if (error) {
        console.error("Error fetching chapters:", error);
        setSnackbar({
          open: true,
          message: "Failed to load chapters for this volume",
          severity: "error"
        });
        return;
      }
      
      setChapters(data || []);
      
      // If there are no chapters, we should still show the UI
      if (!data || data.length === 0) {
        setLoadingHadiths(false);
      }
      
    } catch (error) {
      console.error("Error changing volume:", error);
      setSnackbar({
        open: true,
        message: "An error occurred while changing volumes",
        severity: "error"
      });
    } finally {
      setChangingVolume(false);
    }
  };

  // Save/Unsave hadith function
  const handleSaveHadith = async (hadithId) => {
    if (!user) {
      setSnackbar({
        open: true,
        message: "Please sign in to save hadith",
        severity: "warning"
      });
      return;
    }
    
    try {
      if (savedStates[hadithId]) {
        const { error } = await removeSavedHadith(hadithId);
        if (error) throw new Error(error);
        
        setSavedStates(prev => ({ ...prev, [hadithId]: false }));
        setSnackbar({
          open: true,
          message: "Hadith removed from saved",
          severity: "info"
        });
      } else {
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

  // Copy hadith to clipboard
  const copyHadithFormatted = (hadith, chapter) => {
    const hadithUrl = `${window.location.origin}/book/${bookId}/chapter/${chapter.id}#hadith-${hadith.id}`;
    const bookName = book?.title || "Unknown Book";
    
    let referenceLine = "";
    if (hadith.hadith_reference?.reference) {
      referenceLine = hadith.hadith_reference.reference;
    } else {
      referenceLine = `${bookName}`;
    }
    
    const formattedText = `${hadith.arabic}\n\n${hadith.english}\n\n${referenceLine}, Hadith ${hadith.hadith_number}\n${hadithUrl}`;
    
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
      console.error("Feedback error:", err);
      setSnackbar({
        open: true,
        message: err?.message || "Failed to send feedback",
        severity: "error",
      });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Pagination Component
  const PaginationControls = () => {
    const totalPages = getTotalPages();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    
    if (totalPages <= 1) return null;
    
    const handlePageChange = (newPage) => {
      setCurrentPage(newPage);
    };
    
    // Function to get the 5 page numbers to display, with current page in the middle when possible
    const getDisplayPages = () => {
      const pages = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        // If total pages is 5 or less, show all pages
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);
        
        // Calculate start and end for the middle pages
        let start = Math.max(2, currentPage - 2);
        let end = Math.min(totalPages - 1, currentPage + 2);
        
        // Adjust if we're near the beginning
        if (currentPage <= 3) {
          start = 2;
          end = Math.min(totalPages - 1, 5);
        }
        
        // Adjust if we're near the end
        if (currentPage >= totalPages - 2) {
          start = Math.max(2, totalPages - 4);
          end = totalPages - 1;
        }
        
        // Add ellipsis before middle pages if needed
        if (start > 2) {
          pages.push('...');
        }
        
        // Add middle pages
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        
        // Add ellipsis after middle pages if needed
        if (end < totalPages - 1) {
          pages.push('...');
        }
        
        // Always show last page
        pages.push(totalPages);
      }
      
      return pages;
    };
    
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: isMobile ? 1 : 2,
        my: isMobile ? 3 : 4,
        p: isMobile ? 2 : 3,
        backgroundColor: 'grey.50',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Button
          variant="outlined"
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          size={isMobile ? "small" : "medium"}
          sx={{
            minWidth: isMobile ? 'auto' : 100,
            px: isMobile ? 1.5 : 2,
          }}
          startIcon={<ArrowForwardIosIcon sx={{ transform: 'rotate(180deg)' }} />}
        >
          {isMobile ? 'Prev' : 'Previous'}
        </Button>
        
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getDisplayPages().map((page, index) => (
              page === '...' ? (
                <Typography 
                  key={`ellipsis-${index}`}
                  sx={{ 
                    px: 1,
                    color: 'text.secondary',
                    fontSize: '0.875rem'
                  }}
                >
                  …
                </Typography>
              ) : (
                <Button
                  key={page}
                  variant={currentPage === page ? "contained" : "outlined"}
                  onClick={() => handlePageChange(page)}
                  size="small"
                  sx={{
                    minWidth: 36,
                    height: 36,
                    fontWeight: currentPage === page ? 'bold' : 'normal',
                    '&.MuiButton-contained': {
                      backgroundColor: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      }
                    }
                  }}
                >
                  {page}
                </Button>
              )
            ))}
          </Box>
        )}
        
        {isMobile && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
            {currentPage} of {totalPages}
          </Typography>
        )}
        
        <Button
          variant="outlined"
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          size={isMobile ? "small" : "medium"}
          sx={{
            minWidth: isMobile ? 'auto' : 100,
            px: isMobile ? 1.5 : 2,
          }}
          endIcon={<ArrowForwardIosIcon />}
        >
          {isMobile ? 'Next' : 'Next'}
        </Button>
        
        {!isMobile && (
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
            Page {currentPage} of {totalPages}
          </Typography>
        )}
      </Box>
    );
  };

  // Combined loading state
  if (loading || changingVolume) {
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
                <Skeleton variant="rectangular" width={200} height={40} sx={{ mt: 4, borderRadius: 1 }} />
              </Box>
            </Stack>
          </Paper>
          <Paper sx={{ p: 4, borderRadius: 3 }}>
            <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
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
            <Typography variant="body1">Home</Typography>
          </Link>
          <Link to={`/book/${book.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <Typography variant="body1">{book.title}</Typography>
          </Link>
          <Typography color="primary.main" fontWeight="medium">
            Reader Mode
          </Typography>
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
                {book.title} - Reader Mode
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
                      value={selectedVolume || ''}
                      onChange={(e) => handleVolumeChange(e.target.value)}
                      disabled={changingVolume}
                      sx={{ 
                        backgroundColor: 'white',
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                        '&.Mui-disabled': {
                          backgroundColor: 'grey.50',
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
                          {changingVolume && selectedVolume === vol.id && " (Loading...)"}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Back to List Button */}
              <Box sx={{ mt: 4 }}>
                <Button
                  variant="outlined"
                  size="large"
                  component={Link}
                  to={`/book/${book.id}`}
                  startIcon={<ArrowForwardIosIcon sx={{ transform: 'rotate(180deg)' }} />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                  }}
                >
                  Back to Chapters List
                </Button>
              </Box>
            </Box>
          </Stack>
        </Paper>
        
        {/* Reader Content Section */}
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
          }}>
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              color="primary.main"
              sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}
            >
              Reader Mode
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
                  {chapters.length} chapters • {allHadiths.length} hadiths total
                </Typography>
              </Stack>
            )}
          </Box>

          {/* Reader Content */}
          {loadingHadiths ? (
            <Box sx={{ py: 10, textAlign: 'center' }}>
              <CircularProgress 
                size={60} 
                thickness={4} 
                sx={{ mb: 3, color: 'primary.main' }}
              />
              <Typography variant="h6" color="primary.main" gutterBottom>
                Loading Hadiths...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Fetching hadiths from all chapters
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={hadithsLoadingProgress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  mb: 2,
                  width: '80%',
                  mx: 'auto',
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'primary.main',
                    borderRadius: 4,
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {hadithsLoadingProgress}% complete
              </Typography>
            </Box>
          ) : chapters.length === 0 ? (
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
            <Stack spacing={4}>
              {/* Pagination Controls at the top */}
              <PaginationControls />
              
              {/* Display paginated hadiths */}
              {(() => {
                const paginatedGroups = getPaginatedHadithsByChapter();
                const chapterIds = Object.keys(paginatedGroups);
                
                return chapterIds.map(chapterId => {
                  const { chapter, hadiths } = paginatedGroups[chapterId];
                  const isChapterCollapsed = collapsedChapters[chapter.id] || false;
                  
                  return (
                    <Box key={chapter.id}>
                      {/* Chapter Header */}
                      <Paper
                        sx={{
                          p: { xs: 2, sm: 2.5, md: 3 },
                          mb: -1,
                          borderRadius: 2,
                          backgroundColor: 'primary.light',
                          color: 'primary.contrastText',
                          position: 'relative',
                          transition: 'all 0.2s ease',
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          '&:hover': {
                            boxShadow: 3,
                            transform: 'translateY(-1px)',
                          }
                        }}
                        data-chapter-header
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: { xs: 1.5, sm: 2 },
                          flex: 1,
                          minWidth: 0
                        }}>
                          {chapter.chapter_number !== 0 && (
                            <Chip
                              label={`Ch. ${chapter.chapter_number}`}
                              sx={{
                                backgroundColor: 'white',
                                color: 'primary.main',
                                fontWeight: 'bold',
                                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                height: { xs: 28, sm: 32 },
                                flexShrink: 0
                              }}
                            />
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="h6" 
                              fontWeight="bold"
                              sx={{ 
                                fontSize: { 
                                  xs: '0.95rem', 
                                  sm: '1.15rem', 
                                  md: '1.3rem' 
                                },
                                lineHeight: 1.3,
                                overflowWrap: 'break-word',
                                wordBreak: 'break-word',
                                display: 'block' 
                              }}
                            >
                              {chapter.title_en || chapter.title_ar || `Chapter ${chapter.chapter_number}`}
                            </Typography>
                            
                            {(chapter.title_en && chapter.title_ar) && (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  mt: 0.5, 
                                  opacity: 0.9,
                                  fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                  fontStyle: 'italic'
                                }}
                              >
                                {chapter.title_ar}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        
                        <IconButton
                          onClick={() => toggleChapterCollapse(chapter.id)}
                          sx={{ 
                            ml: 1,
                            color: 'white',
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            flexShrink: 0,
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            }
                          }}
                        >
                          {isChapterCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                        </IconButton>
                      </Paper>
                      
                      {/* Hadiths in this chapter */}
                      {!isChapterCollapsed && hadiths.length > 0 && (
                        <Stack spacing={2}>
                          {hadiths.map((hadith, idx) => (
                            <Paper
                              key={hadith.id}
                              id={`reader-hadith-${hadith.id}`}
                              sx={{
                                p: { xs: 1.5, sm: 2, md: 3 },
                                borderRadius: 2,
                                borderLeft: '3px solid',
                                borderLeftColor: 'primary.main',
                                position: 'relative',
                                '&:hover': {
                                  boxShadow: 2,
                                }
                              }}
                            >
                              {/* Action Icons */}
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
                                <Tooltip title="Copy Hadith">
                                  <IconButton
                                    size="small"
                                    onClick={() => copyHadithFormatted(hadith, chapter)}
                                    sx={{
                                      "&:hover": {
                                        color: "primary.main",
                                      },
                                    }}
                                  >
                                    <ContentCopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title={savedStates[hadith.id] ? "Remove from saved" : "Save hadith"}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleSaveHadith(hadith.id)}
                                    sx={{
                                      "&:hover": {
                                        color: savedStates[hadith.id] ? "error.main" : "warning.main",
                                      },
                                    }}
                                  >
                                    {savedStates[hadith.id] ? (
                                      <BookmarkIcon fontSize="small" sx={{ color: "warning.main" }} />
                                    ) : (
                                      <BookmarkBorderIcon fontSize="small" />
                                    )}
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Report Issue">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleFeedbackOpen(hadith)}
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
                              {savedStates[hadith.id] && (
                                <Box sx={{ mb: 1, ml: -1 }}>
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
                                </Box>
                              )}

                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 2, 
                                mb: 2, 
                                pr: 6,
                                flexWrap: 'wrap'
                              }}>
                                <Chip
                                  label={`Hadith ${hadith.hadith_number}`}
                                  color="primary"
                                  variant="outlined"
                                  size="small"
                                />
                                <Divider orientation="vertical" flexItem sx={{ height: 20 }} />
                                <Typography variant="caption" color="text.secondary">
                                  #{((currentPage - 1) * hadithsPerPage) + idx + 1}
                                </Typography>
                              </Box>

                              {/* Arabic Text */}
                              <Paper
                                elevation={0}
                                sx={{
                                  p: { xs: 1.5, sm: 2 },
                                  mb: 2,
                                  borderRadius: 2,
                                  backgroundColor: '#f8f9fa',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  position: 'relative',
                                }}
                              >
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontSize: { xs: '0.95rem', sm: '1.1rem' },
                                    lineHeight: 1.8,
                                    direction: 'rtl',
                                    textAlign: 'right',
                                    fontFamily: 'inherit',
                                    fontWeight: 500,
                                  }}
                                >
                                  {expandedArabic[hadith.id] ? hadith.arabic : truncateArabic(hadith.arabic)}
                                </Typography>
                                
                                {isArabicLong(hadith.arabic) && (
                                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                                    <Button
                                      variant="text"
                                      size="small"
                                      onClick={() => toggleArabicExpand(hadith.id)}
                                      sx={{
                                        color: 'primary.main',
                                        fontWeight: 500,
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                        '&:hover': {
                                          backgroundColor: 'primary.light',
                                        }
                                      }}
                                    >
                                      {expandedArabic[hadith.id] ? 'Show Less Arabic' : 'Show More Arabic'}
                                      {expandedArabic[hadith.id] ? (
                                        <KeyboardDoubleArrowUpIcon sx={{ ml: 0.5, fontSize: 14 }} />
                                      ) : (
                                        <KeyboardDoubleArrowUpIcon sx={{ ml: 0.5, fontSize: 14, transform: 'rotate(180deg)' }} />
                                      )}
                                    </Button>
                                  </Box>
                                )}
                              </Paper>

                              {/* English Translation */}
                              <Paper
                                elevation={0}
                                sx={{
                                  p: { xs: 1.5, sm: 2 },
                                  mb: 2,
                                  borderRadius: 2,
                                  backgroundColor: 'white',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                }}
                              >
                                <Typography
                                  variant="body1"
                                  color="text.primary"
                                  sx={{
                                    lineHeight: 1.7,
                                    whiteSpace: 'pre-line',
                                    fontSize: { xs: '0.9rem', sm: '1rem' },
                                  }}
                                >
                                  {hadith.english}
                                </Typography>
                              </Paper>

                              {/* Reference */}
                              {hadith.hadith_reference?.reference && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ 
                                    fontStyle: 'italic', 
                                    mt: 1,
                                    fontSize: { xs: '0.8rem', sm: '0.875rem' }
                                  }}
                                >
                                  Reference: {hadith.hadith_reference.reference}
                                </Typography>
                              )}

                              {/* Login Prompt */}
                              {!user && (
                                <Box sx={{ mt: 3, pt: 2, borderTop: "1px dashed", borderColor: "divider" }}>
                                  <Typography variant="body2" color="text.secondary" align="center">
                                    Want to save this hadith?{' '}
                                    <Button
                                      size="small"
                                      variant="text"
                                      component={Link}
                                      to="/login"
                                      sx={{ 
                                        textTransform: 'none', 
                                        fontWeight: 'bold',
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                      }}
                                    >
                                      Login or Sign Up
                                    </Button>
                                  </Typography>
                                </Box>
                              )}
                            </Paper>
                          ))}
                        </Stack>
                      )}

                      {!isChapterCollapsed && hadiths.length === 0 && (
                        <Paper
                          sx={{
                            p: 4,
                            textAlign: 'center',
                            borderRadius: 2,
                            backgroundColor: 'grey.50',
                          }}
                        >
                          <Typography variant="body1" color="text.secondary">
                            No hadiths found in this chapter.
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  );
                });
              })()}
              
              {/* Pagination Controls at the bottom */}
              <PaginationControls />
            </Stack>
          )}

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
                  {loadingHadiths 
                    ? 'Loading hadiths from all chapters...' 
                    : `Showing ${getPaginatedHadiths().length} hadiths on page ${currentPage} of ${getTotalPages()} • Total ${allHadiths.length} hadiths`
                  }
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
    </>
  );
}