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
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import HomeIcon from "@mui/icons-material/Home";
import KeyboardDoubleArrowUpIcon from "@mui/icons-material/KeyboardDoubleArrowUp";
import Navbar from "../components/Navbar/Navbar.jsx";
import { supabase } from "../config/supabaseClient.js";


export default function BookPage() {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [volumes, setVolumes] = useState([]);
  const [selectedVolume, setSelectedVolume] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedVolumeNumber, setSelectedVolumeNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Check scroll position for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
  // Scroll to top when component mounts
  window.scrollTo(0, 0);
}, [bookId]); // Add bookId as dependency

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
    };
    fetchChapters();
  }, [selectedVolume, volumes]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        {/* Breadcrumb Navigation - Same as ChapterPage */}
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
                  <Typography variant="subtitle1" fontWeight="bold" color="text.secondary" gutterBottom>
                    Select Volume:
                  </Typography>
                  <FormControl sx={{ minWidth: 200 }}>
                    <Select
                      value={selectedVolume}
                      onChange={(e) => setSelectedVolume(e.target.value)}
                      sx={{ 
                        backgroundColor: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        }
                      }}
                    >
                      {volumes.map((vol) => (
                        <MenuItem key={vol.id} value={vol.id}>
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
        >
          {/* Section Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            mb: 4,
            pb: 3,
            borderBottom: '2px solid',
            borderColor: 'primary.light'
          }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                Chapters
              </Typography>
              {selectedVolumeNumber > 0 && (
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                  <Chip 
                    label={`Volume ${selectedVolumeNumber}`}
                    color="primary"
                    variant="outlined"
                    size="medium"
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                  >
                    {chapters.length} chapters
                  </Typography>
                </Stack>
              )}
            </Box>
          </Box>

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
              {chapters.map((ch) => (
                <Paper
                  key={ch.id}
                  component={Link}
                  to={`/book/${book.id}/chapter/${ch.id}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: { xs: 2, md: 3 },
                    borderRadius: 2,
                    cursor: 'pointer',
                    textDecoration: 'none',
                    backgroundColor: 'transparent',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s ease',
                    '&:hover': { 
                      borderColor: 'primary.main',
                      transform: 'translateX(4px)',
                      boxShadow: 2,
                    },
                  }}
                >
                  {/* Chapter Number Badge */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 60,
                      height: 60,
                      borderRadius: 2,
                      borderColor: 'black',
                      color: 'black',
                      mr: 3,
                      flexShrink: 0,
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      Chapter {ch.chapter_number}:
                    </Typography>
                  </Box>

                  {/* Chapter Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* English Title */}
                    {ch.title_en && (
                      <Typography 
                        variant="h6" 
                        fontWeight="medium"
                        color="text.primary"
                        sx={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {ch.title_en}
                      </Typography>
                    )}

                    {/* Arabic Title */}
                    {ch.title_ar && (
                      <Typography 
                        variant="body1"
                        color="text.secondary"
                        sx={{ 
                          direction: 'rtl',
                          textAlign: 'right',
                          fontFamily: 'inherit',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
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
                      ml: 2,
                      opacity: 0.7,
                      transition: 'opacity 0.2s',
                      'a:hover &': {
                        opacity: 1
                      }
                    }}
                  />
                </Paper>
              ))}
            </Stack>
          )}

          {/* Footer */}
          {chapters.length > 0 && (
            <>
              <Divider sx={{ my: 4 }} />
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {chapters.length} chapters • Click any chapter to read
                </Typography>
              </Box>
            </>
          )}
        </Paper>

        {/* Back to Top Button - Same as ChapterPage */}
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
    </>
  );
}