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
  ToggleButton,
  ToggleButtonGroup,
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
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import HomeIcon from "@mui/icons-material/Home";
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";
import KeyboardDoubleArrowDownIcon from "@mui/icons-material/KeyboardDoubleArrowDown";
import ArticleIcon from "@mui/icons-material/Article";
import ViewListIcon from "@mui/icons-material/ViewList";
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
import { useRef } from "react";


export default function BookPage() {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [volumes, setVolumes] = useState([]);
  const [selectedVolume, setSelectedVolume] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedVolumeNumber, setSelectedVolumeNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [readerMode, setReaderMode] = useState(false);
  const [chapterHadiths, setChapterHadiths] = useState({}); 
  const [expandedArabic, setExpandedArabic] = useState({});
  const [collapsedChapters, setCollapsedChapters] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [feedbackDialog, setFeedbackDialog] = useState({ open: false, hadith: null });
  const [feedback, setFeedback] = useState({ name: "", email: "", comments: "" });
  const [loadingHadiths, setLoadingHadiths] = useState(false);
  const [hadithsLoadingProgress, setHadithsLoadingProgress] = useState(0);
  const containerRef = useRef(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hadithsPerPage] = useState(20);
  const [allHadiths, setAllHadiths] = useState([]); // Store all hadiths for pagination
  
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

  // Scroll to top when page changes
useEffect(() => {
  if (readerMode) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}, [currentPage, readerMode]);
  // Fetch chapters for selected volume
  useEffect(() => {
    if (!selectedVolume) return;
    const fetchChapters = async () => {
      const { data } = await supabase
        .from("chapters")
        .select("*")
        .eq("volume_id", selectedVolume)
        .order("chapter_number");
      setChapters(data || []);
      
      // Update selected volume number
      const selectedVol = volumes.find(v => v.id === selectedVolume);
      if (selectedVol) {
        setSelectedVolumeNumber(selectedVol.volume_number);
      }
      
      // Fetch hadiths for all chapters if reader mode is on
      if (readerMode) {
        fetchAllChapterHadiths();
      }
    };
    fetchChapters();
  }, [selectedVolume, volumes]);

  // Fetch hadiths when reader mode is enabled
  useEffect(() => {
    if (readerMode && chapters.length > 0) {
      fetchAllChapterHadiths();
    }
  }, [readerMode]);

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [bookId]);

  // Fetch book
  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("books")
        .select("*")
        .eq("id", bookId)
        .single();
      setBook(data);
      setLoading(false);
    };
    fetchBook();
  }, [bookId]);

  // Scroll to just above content when page changes
useEffect(() => {
  if (readerMode && currentPage > 1) {
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      // Get the chapters section
      const chaptersSection = document.querySelector('[data-chapters-section]');
      if (chaptersSection) {
        // Calculate position 50px above the chapters section
        const rect = chaptersSection.getBoundingClientRect();
        const offsetPosition = rect.top + window.pageYOffset - 100; // 100px above
        
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      } else {
        // Fallback to top
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 100);
  } else if (readerMode && currentPage === 1) {
    // For first page, scroll to top of the chapters section
    setTimeout(() => {
      const chaptersSection = document.querySelector('[data-chapters-section]');
      if (chaptersSection) {
        chaptersSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  }
}, [currentPage, readerMode]);
  // Fetch volumes & chapters
  useEffect(() => {
    if (!book) return;

    const fetchVolumes = async () => {
      const { data: vols } = await supabase
        .from("volumes")
        .select("*")
        .eq("book_id", book.id)
        .order("volume_number");

      if (!vols || vols.length === 0) {
        // No volumes → fetch chapters with volume_id IS NULL
        const { data: chaps } = await supabase
          .from("chapters")
          .select("*")
          .is("volume_id", null)
          .order("chapter_number");
        setChapters(chaps || []);
        setVolumes([]);
        setSelectedVolume(null);
        setSelectedVolumeNumber("");
      } else {
        // Check for volumes with number > 0
        const validVolumes = vols.filter((v) => v.volume_number > 0);

        if (validVolumes.length > 0) {
          // Show dropdown
          setVolumes(validVolumes);
          setSelectedVolume(validVolumes[0].id);
          setSelectedVolumeNumber(validVolumes[0].volume_number);
        } else {
          // Only volume_number = 0 → hide dropdown but fetch chapters
          const { data: chaps } = await supabase
            .from("chapters")
            .select("*")
            .eq("volume_id", vols[0].id)
            .order("chapter_number");
          setChapters(chaps || []);
          setVolumes([]);
          setSelectedVolume(vols[0].id);
          setSelectedVolumeNumber(0);
        }
      }
    };

    fetchVolumes();
  }, [book]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Function to fetch hadiths for all chapters in the current volume
  const fetchAllChapterHadiths = async () => {
    if (!chapters.length) return;
    
    setLoadingHadiths(true);
    setHadithsLoadingProgress(50); // Start at 50%
    
    try {
      // Get all chapter IDs
      const chapterIds = chapters.map(ch => ch.id);
      
      // Fetch all hadiths for all chapters in one query
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
        .order("hadith_number", { ascending: true, nullsFirst: false });
      
      if (error) throw error;
      
      // Custom sorting function (same as in ChapterPage)
      const sortHadiths = (hadithsArray) => {
        return hadithsArray.sort((a, b) => {
          const parseHadithNumber = (num) => {
            if (!num) return [0, 0];
            if (num.includes('/')) {
              const parts = num.split('/');
              return [
                parseInt(parts[0]) || 0,
                parseInt(parts[1]) || 0
              ];
            }
            return [parseInt(num) || 0, 0];
          };

          const [aMain, aSub] = parseHadithNumber(a.hadith_number);
          const [bMain, bSub] = parseHadithNumber(b.hadith_number);
          
          if (aMain !== bMain) return aMain - bMain;
          return aSub - bSub;
        });
      };
      
      // Group hadiths by chapter_id and sort each group
      const hadithsMap = {};
      const allHadithsArray = []; // Store all hadiths in a flat array
      
      chapterIds.forEach(id => hadithsMap[id] = []);
      
      data?.forEach(hadith => {
        if (!hadithsMap[hadith.chapter_id]) {
          hadithsMap[hadith.chapter_id] = [];
        }
        hadithsMap[hadith.chapter_id].push(hadith);
        allHadithsArray.push(hadith); // Add to flat array
      });
      
      // Sort hadiths within each chapter
      for (const chapterId in hadithsMap) {
        hadithsMap[chapterId] = sortHadiths(hadithsMap[chapterId]);
      }
      
      // Sort the flat array
      const sortedAllHadiths = sortHadiths(allHadithsArray);
      
      setChapterHadiths(hadithsMap);
      setAllHadiths(sortedAllHadiths); // Store all hadiths
      setCurrentPage(1); // Reset to first page when loading new data
      setHadithsLoadingProgress(100);
      
      // Check saved status for all hadiths
      if (user) {
        checkAllSavedStatus(hadithsMap);
      }
      
    } catch (error) {
      console.error("Error fetching hadiths:", error);
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

  // Toggle expanded state for Arabic text only
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

  // Check if Arabic text is long (more than 750 characters)
  const isArabicLong = (text) => {
    return text && text.length > 750;
  };

  // Truncate Arabic text for preview
  const truncateArabic = (text) => {
    if (!text || text.length <= 750) return text;
    return text.substring(0, 750) + '...';
  };

  // Truncate chapter title for mobile
  const truncateChapterTitle = (text, maxLength = 30) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Function to calculate chapter size based on hadith count
  const getChapterSize = (chapterId) => {
    const hadiths = chapterHadiths[chapterId] || [];
    const totalHadiths = hadiths.length;
    
    // Calculate dynamic height based on hadith count
    const baseHeight = 80; // Minimum height
    const heightPerHadith = 15; // Additional height per hadith
    
    return Math.min(baseHeight + (totalHadiths * heightPerHadith), 300);
  };

  // Pagination calculation functions
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

  // Copy hadith to clipboard
  const copyHadithFormatted = (hadith, chapter) => {
    // Get the correct URL
    const hadithUrl = `${window.location.origin}/book/${bookId}/chapter/${chapter.id}#hadith-${hadith.id}`;
    
    // Get book name from book state
    const bookName = book?.title || "Unknown Book";
    const bookEnglishName = book?.english_title;
    const chapterNum = chapter?.chapter_number || "?";
    
    // Build reference line
    let referenceLine = "";
    if (hadith.hadith_reference?.reference) {
      referenceLine = hadith.hadith_reference.reference;
    } else {
      referenceLine = `${bookName}`;
    }
    
    // Format the text
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

  // Function to get book title
  const getBookTitle = () => {
    return book?.title || "Unknown Book";
  };

// Pagination Component
const PaginationControls = () => {
  const totalPages = getTotalPages();
  
  if (totalPages <= 1) return null;
  
  // Page change handler
// Page change handler with scroll to first chapter
const handlePageChange = (newPage) => {
  setCurrentPage(newPage);
  
  // Small delay to ensure DOM is updated
  setTimeout(() => {
    if (readerMode) {
      // Get the first chapter element on the page
      const firstChapter = document.querySelector('[data-chapter-header]');
      if (firstChapter) {
        firstChapter.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // Fallback to top if no chapter found
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, 50);
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
          // Calculate page numbers to show (centered around current page)
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

  if (loading) {
    return (
      <>
        <Navbar />
        <Container
          ref={containerRef} // Add this

          maxWidth="lg"
          sx={{
            pt: "calc(64px + 32px)",
            pb: 6,
            minHeight: "100vh",
          }}
        >
          {/* Skeleton for Breadcrumbs */}
          <Skeleton variant="rectangular" width={200} height={24} sx={{ mb: 4 }} />
          
          {/* Skeleton for Header */}
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

          {/* Skeleton for Chapters */}
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
            </Box>
          </Stack>
        </Paper>

        {/* Reader Mode Toggle */}
        <Box sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography 
            variant="subtitle1" 
            fontWeight="bold" 
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            View Mode:
          </Typography>
          <ToggleButtonGroup
            value={readerMode}
            exclusive
            onChange={(e, newMode) => setReaderMode(newMode)}
            aria-label="view mode"
            size="small"
          >
            <ToggleButton value={false} aria-label="list view">
              <ViewListIcon sx={{ mr: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }} />
              <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                List View
              </Typography>
            </ToggleButton>
            <ToggleButton value={true} aria-label="reader mode">
              <ArticleIcon sx={{ mr: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }} />
              <Typography sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Reader Mode
              </Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
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
            data-chapters-section // Add this

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
                {readerMode ? 'Reader Mode' : 'Chapters'}
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
                    {readerMode && allHadiths.length > 0 && 
                      ` • ${allHadiths.length} hadiths total`
                    }
                  </Typography>
                </Stack>
              )}
            </Box>
            
            {readerMode && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setReaderMode(false)}
                startIcon={<ViewListIcon />}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Back to List
              </Button>
            )}
          </Box>

          {readerMode ? (
            // READER MODE CONTENT
            <Box>
              {loadingHadiths ? (
                // Loading Animation for Reader Mode
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
                              data-chapter-header // Add this attribute

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
                          
                          {/* Hadiths in this chapter - Only show if not collapsed */}
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

                                    {/* Save Button */}
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

                                    {/* Feedback Button */}
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
                                  <Box sx={{ mb: 1, ml: -1 }}>
                                    {savedStates[hadith.id] && (
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
                                      #{((currentPage - 1) * hadithsPerPage) + idx + 1} of {allHadiths.length}
                                    </Typography>
                                  </Box>

                                  {/* Arabic Text with Show More if needed */}
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
                                    
                                    {/* Show More/Less button for long Arabic text only */}
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

                                  {/* English Translation - Always show full */}
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

                                  {/* Login Prompt for non-logged in users */}
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
            </Box>
          ) : (
            // REGULAR LIST VIEW
            chapters.length === 0 ? (
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
                {chapters.map((ch) => {
                  const chapterName = ch.title_en || ch.title_ar || "";
                  
                  return (
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
                  );
                })}
              </Stack>
            )
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
                  {readerMode ? (
                    loadingHadiths 
                      ? 'Loading hadiths from all chapters...' 
                      : `Showing ${getPaginatedHadiths().length} hadiths on page ${currentPage} of ${getTotalPages()} • Total ${allHadiths.length} hadiths`
                  ) : (
                    `Showing ${chapters.length} chapters • Click any chapter to read`
                  )}
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