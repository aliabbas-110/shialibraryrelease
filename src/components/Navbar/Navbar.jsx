import { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Drawer,
  Divider,
  Stack,
  TextField,
  InputAdornment,
  Paper,
  ListItemIcon,
  Fade,
  CircularProgress,
  Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { useMediaQuery, useTheme } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import myLogo from '/public/images/Ghadir_logo.png';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { supabase } from '../../config/supabaseClient.js';

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [hoveredLink, setHoveredLink] = useState(null);

  // Function to remove Arabic diacritics (tashkeel)
  const removeDiacritics = (text) => {
    if (!text) return '';
    
    // Remove Arabic diacritics (tashkeel)
    const withoutDiacritics = text.replace(/[\u064B-\u065F\u0670]/g, '');
    
    // Also remove additional marks if needed
    const finalText = withoutDiacritics.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
    
    return finalText;
  };

  // Function to check if text contains Arabic characters
  const containsArabic = (text) => {
    return /[\u0600-\u06FF]/.test(text);
  };

  // Function to check if query is in English
  const isEnglishQuery = (query) => {
    return /[a-zA-Z]/.test(query) && !containsArabic(query);
  };

  // Function to check if query is in Arabic
  const isArabicQuery = (query) => {
    return containsArabic(query);
  };

  // Function to normalize Arabic query for search
  const normalizeArabicQuery = (query) => {
    if (!isArabicQuery(query)) return query;
    
    // Remove diacritics from query
    const cleanQuery = removeDiacritics(query);
    
    // Optional: Handle common variations
    // Replace common letter variations (like different forms of hamza)
    const normalized = cleanQuery
      .replace(/[آأإءٱ]/g, 'ا')  // Normalize alif variations
      .replace(/[ؤ]/g, 'و')      // Normalize waw with hamza
      .replace(/[ئ]/g, 'ي')      // Normalize ya with hamza
      .replace(/\s+/g, ' ')      // Normalize spaces
      .trim();
    
    return normalized;
  };

  // 🔍 DEBOUNCED SEARCH FUNCTION (300ms delay)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        await performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Main search function
  const performSearch = async (query) => {
    setIsSearching(true);
    try {
      let data = null;
      let error = null;

      // Check if query contains Arabic
      if (isArabicQuery(query)) {
        // For Arabic queries, use a more comprehensive search
        data = await searchArabicHadith(query);
      } else {
        // For English queries, use the original search
        data = await searchEnglishHadith(query);
      }

      // Format results to match expected structure
      const formattedResults = (data || []).map(item => {
        const chapter = item.chapters || {};
        const volume = chapter.volumes || {};
        const book = volume.books || {};
        
        return {
          hadith_id: item.id,
          hadith_number: item.hadith_number || '',
          arabic: item.arabic || '',
          english: item.english || '',
          chapter_id: chapter.id,
          chapter_number: chapter.chapter_number || 0,
          chapter_title: chapter.title_en || `Chapter ${chapter.chapter_number || 0}`,
          volume_id: volume.id || 0,
          volume_number: volume.volume_number || 0,
          book_id: book.id || 0,
          book_title: book.title || '',
          relevance_score: 1
        };
      });

      setSearchResults(formattedResults);
      
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Search function for English queries
  const searchEnglishHadith = async (query) => {
    try {
      // Try Full Text Search first
      const { data, error } = await supabase
        .from('hadith')
        .select(`
          id,
          hadith_number,
          arabic,
          english,
          chapter_id,
          chapters!inner (
            id,
            chapter_number,
            title_en,
            volumes!inner (
              id,
              volume_number,
              books!inner (
                id,
                title
              )
            )
          )
        `)
        .or(`search_vector.phfts.${query}`) // Full text search
        .order('id', { ascending: true })
        .limit(25);

      if (error) throw error;
      return data || [];

    } catch (ftsError) {
      console.warn('FTS failed, trying fallback:', ftsError.message);
      // Fallback to ILIKE search
      return await searchEnglishFallback(query);
    }
  };

  // Fallback for English search
  const searchEnglishFallback = async (query) => {
    const { data, error } = await supabase
      .from('hadith')
      .select(`
        id,
        hadith_number,
        arabic,
        english,
        chapter_id,
        chapters!inner (
          id,
          chapter_number,
          title_en,
          volumes!inner (
            id,
            volume_number,
            books!inner (
              id,
              title
            )
          )
        )
      `)
      .or(`english.ilike.%${query}%`)
      .limit(25);

    if (error) throw error;
    return data || [];
  };

  // Search function for Arabic queries
  const searchArabicHadith = async (query) => {
    const normalizedQuery = normalizeArabicQuery(query);
    
    try {
      // First, try to use PostgreSQL unaccent extension if available
      const { data: ftsData, error: ftsError } = await supabase
        .from('hadith')
        .select(`
          id,
          hadith_number,
          arabic,
          english,
          chapter_id,
          chapters!inner (
            id,
            chapter_number,
            title_en,
            volumes!inner (
              id,
              volume_number,
              books!inner (
                id,
                title
              )
            )
          )
        `)
        .or(`arabic.ilike.%${query}%`) // Direct match with diacritics
        .limit(25);

      if (ftsError) throw ftsError;

      // If we found results with direct match, return them
      if (ftsData && ftsData.length > 0) {
        return ftsData;
      }

      // If no direct matches, search without diacritics
      return await searchArabicWithoutDiacritics(normalizedQuery);

    } catch (error) {
      console.warn('Arabic search failed:', error);
      // Fallback to diacritic-insensitive search
      return await searchArabicWithoutDiacritics(normalizedQuery);
    }
  };

  // Search Arabic without diacritics
  const searchArabicWithoutDiacritics = async (normalizedQuery) => {
    try {
      // Option 1: Use PostgreSQL function to remove diacritics (if available)
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'search_arabic_without_diacritics',
        { search_query: normalizedQuery }
      );

      if (!rpcError && rpcData && rpcData.length > 0) {
        return rpcData;
      }

      // Option 2: Fallback to client-side filtering with broader database query
      const { data: allData, error: allError } = await supabase
        .from('hadith')
        .select(`
          id,
          hadith_number,
          arabic,
          english,
          chapter_id,
          chapters!inner (
            id,
            chapter_number,
            title_en,
            volumes!inner (
              id,
              volume_number,
              books!inner (
                id,
                title
              )
            )
          )
        `)
        .ilike('arabic', '%ا%') // Get all Arabic hadith (filtering will be done client-side)
        .limit(200); // Increased limit for client-side filtering

      if (allError) throw allError;

      // Client-side filtering: remove diacritics and search
      const filteredResults = (allData || []).filter(item => {
        if (!item.arabic) return false;
        
        const cleanArabic = removeDiacritics(item.arabic);
        return cleanArabic.includes(normalizedQuery);
      }).slice(0, 25); // Limit to 25 results

      return filteredResults;

    } catch (error) {
      console.error('Arabic diacritic-insensitive search failed:', error);
      return [];
    }
  };

  const toggleDrawer = (open) => () => setDrawerOpen(open);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleResultClick = (result) => {
    if (result.book_id && result.chapter_id && result.hadith_id) {
      // Pass hadith_id as hash to scroll to it in the chapter page
      navigate(`/book/${result.book_id}/chapter/${result.chapter_id}#hadith-${result.hadith_id}`);
    } else if (result.book_id && result.chapter_id) {
      navigate(`/book/${result.book_id}/chapter/${result.chapter_id}`);
    }
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  const navLinks = [
    { text: 'Home', path: '/',  },
    { text: 'About', path: '/about',  },
    { text: 'Contact', path: '/contact', },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogoClick = () => navigate('/');

  // Format text preview
  const getTextPreview = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Helper to highlight search terms (simple version)
  const highlightSearchTerm = (text, query) => {
    if (!text || !query) return getTextPreview(text, isMobile ? 80 : 100);
    
    // For mobile, show shorter preview
    const maxLength = isMobile ? 80 : 100;
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) return getTextPreview(text, maxLength);
    
    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + query.length + 60);
    let preview = text.substring(start, end);
    
    if (start > 0) preview = '...' + preview;
    if (end < text.length) preview = preview + '...';
    
    return preview;
  };

  // Highlight Arabic search terms (preserving diacritics in display)
  const highlightArabicTerm = (arabicText, query) => {
    if (!arabicText || !query || !isArabicQuery(query)) {
      return getTextPreview(arabicText, isMobile ? 80 : 100);
    }
    
    const maxLength = isMobile ? 80 : 100;
    const normalizedArabic = removeDiacritics(arabicText);
    const normalizedQuery = normalizeArabicQuery(query);
    
    const index = normalizedArabic.indexOf(normalizedQuery);
    
    if (index === -1) return getTextPreview(arabicText, maxLength);
    
    // Find the corresponding position in the original text (with diacritics)
    // This is approximate but should work for most cases
    let originalIndex = 0;
    let normalizedIndex = 0;
    
    for (let i = 0; i < arabicText.length && normalizedIndex < index; i++) {
      const char = arabicText[i];
      if (!/[\u064B-\u065F\u0670\u0610-\u061A\u06D6-\u06ED]/.test(char)) {
        normalizedIndex++;
      }
      originalIndex++;
    }
    
    const start = Math.max(0, originalIndex - 20);
    const end = Math.min(arabicText.length, originalIndex + normalizedQuery.length + 60);
    let preview = arabicText.substring(start, end);
    
    if (start > 0) preview = '...' + preview;
    if (end < arabicText.length) preview = preview + '...';
    
    return preview;
  };

  return (
    <>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          backgroundColor: '#000000',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          height: 75,
        }}
      >
        <Container maxWidth="lg" sx={{ height: '100%' }}>
          <Toolbar sx={{ 
            justifyContent: 'space-between', 
            alignItems: 'center',
            height: '100%',
            py: 0,
            gap: 2,
            minHeight: '64px !important',
          }}>
            {/* Logo + Text */}
            <Box 
              onClick={handleLogoClick}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                textDecoration: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                '&:hover': {
                  '& .logo-image': { transform: 'scale(1.05)' }
                }
              }}
            >
              <Box
                className="logo-image"
                component="img"
                src={myLogo}
                alt="Ghadir Project Logo"
                sx={{ 
                  height: 40, 
                  width: 40,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                }}
              />

              <Stack direction="column" spacing={0.1}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#ffffff',
                    fontWeight: 700,
                    lineHeight: 1.1,
                    letterSpacing: '0.5px',
                    fontSize: '1rem',
                  }}
                >
                  Shia Library
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 400,
                    fontSize: '0.65rem',
                    letterSpacing: '0.5px',
                  }}
                >
                  Ghadir Project
                </Typography>
              </Stack>
            </Box>

            {/* SEARCH BAR - REDUCED WIDTH */}
            {!isMobile && (
              <Box sx={{ 
                flex: 1, 
                maxWidth: 400,
                mx: 2,
                ml: 15,
                position: 'relative',
                zIndex: theme.zIndex.appBar + 1,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
              }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search hadith by text (Arabic or English)..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          fontSize: 20 
                        }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        {isSearching ? (
                          <CircularProgress 
                            size={20} 
                            sx={{ color: 'rgba(255, 255, 255, 0.7)', mr: 1 }} 
                          />
                        ) : searchQuery ? (
                          <IconButton 
                            size="small" 
                            onClick={clearSearch}
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.5)', 
                              padding: 0.5,
                              marginRight: -0.5,
                            }}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        ) : null}
                      </InputAdornment>
                    ),
                    sx: {
                      color: '#ffffff',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 1,
                      fontSize: '0.875rem',
                      height: 40,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: isSearchFocused ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                        borderWidth: '1px',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        borderWidth: '1px',
                      },
                      '& .MuiInputBase-input': {
                        padding: '8.5px 14px',
                        paddingRight: searchQuery ? '40px' : '14px',
                      }
                    }
                  }}
                />

                {/* SEARCH RESULTS DROPDOWN */}
                {isSearchFocused && (searchResults.length > 0 || (searchQuery.length >= 2 && isSearching)) && (
                  <Fade in={isSearchFocused}>
                    <Paper
                      elevation={8}
                      sx={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        maxHeight: 500,
                        overflow: 'auto',
                        backgroundColor: '#1a1a1a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 1,
                        zIndex: theme.zIndex.modal + 1,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      {isSearching ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                          <CircularProgress size={24} sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                          <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                            Searching hadith...
                          </Typography>
                        </Box>
                      ) : searchResults.length > 0 ? (
                        <>
                          <Box sx={{ 
                            px: 2, 
                            py: 1,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                          }}>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Found {searchResults.length} hadith{searchResults.length !== 1 ? 's' : ''}
                              {isArabicQuery(searchQuery) && ' (diacritic-insensitive search)'}
                            </Typography>
                          </Box>
                          <List sx={{ p: 0 }}>
                            {searchResults.map((result) => (
                              <ListItem 
                                key={`${result.hadith_id}-${result.chapter_id}`}
                                disablePadding
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                <ListItemButton
                                  onClick={() => handleResultClick(result)}
                                  sx={{
                                    borderRadius: 0,
                                    py: 2,
                                    px: 2,
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    },
                                    '&:last-child': {
                                      borderBottom: 'none',
                                    }
                                  }}
                                >
                                  <ListItemIcon sx={{ minWidth: 36, mr: 1 }}>
                                    <FormatQuoteIcon sx={{ 
                                      color: 'rgba(255, 255, 255, 0.7)', 
                                      fontSize: 18 
                                    }} />
                                  </ListItemIcon>
                                  <Box sx={{ flex: 1 }}>
                                    {/* Hadith Header */}
                                    <Box sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      flexWrap: 'wrap',
                                      gap: 1,
                                      mb: 1 
                                    }}>
                                      <Chip
                                        label={`Hadith ${result.hadith_number || 'N/A'}`}
                                        size="small"
                                        sx={{ 
                                          height: 20,
                                          fontSize: '0.7rem',
                                          backgroundColor: 'rgba(255, 255, 255, 1)',
                                          color: 'primary.light',
                                          '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 1)',
                                          }
                                        }}
                                      />
                                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                        •
                                      </Typography>
                                      <Typography 
                                        variant="caption" 
                                        sx={{ 
                                          color: 'rgba(255, 255, 255, 0.7)',
                                          maxWidth: 120,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}
                                        title={result.book_title}
                                      >
                                        {result.book_title}
                                      </Typography>
                                      {result.volume_number > 0 && (
                                        <>
                                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                            •
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                            Vol. {result.volume_number}
                                          </Typography>
                                        </>
                                      )}
                                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                        •
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                        Ch. {result.chapter_number}
                                      </Typography>
                                    </Box>

                                    {/* Arabic Preview - Always show Arabic */}
                                    {result.arabic && (
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontSize: '0.9rem',
                                          lineHeight: 1.6,
                                          direction: 'rtl',
                                          textAlign: 'right',
                                          fontFamily: 'inherit',
                                          fontWeight: 400,
                                          color: 'rgba(255, 255, 255, 0.9)',
                                          mb: 1,
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                        }}
                                      >
                                        {isArabicQuery(searchQuery) 
                                          ? highlightArabicTerm(result.arabic, searchQuery)
                                          : highlightSearchTerm(result.arabic, searchQuery)}
                                      </Typography>
                                    )}

                                    {/* English Preview - Show if query is English */}
                                    {result.english && isEnglishQuery(searchQuery) && (
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontSize: '0.85rem',
                                          lineHeight: 1.5,
                                          color: 'rgba(255, 255, 255, 0.7)',
                                          display: '-webkit-box',
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: 'vertical',
                                          overflow: 'hidden',
                                        }}
                                      >
                                        {highlightSearchTerm(result.english, searchQuery)}
                                      </Typography>
                                    )}
                                  </Box>
                                </ListItemButton>
                              </ListItem>
                            ))}
                          </List>
                        </>
                      ) : searchQuery.length >= 2 && !isSearching ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            No hadith found for "{searchQuery}"
                          </Typography>
                        </Box>
                      ) : null}
                    </Paper>
                  </Fade>
                )}
              </Box>
            )}

            {/* Desktop Menu Links */}
            {!isMobile && (
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5, 
                flexShrink: 0,
                height: '100%',
                alignItems: 'center',
              }}>
                {navLinks.map((link) => (
                  <Button
                    key={link.text}
                    component={Link}
                    to={link.path}
                    startIcon={link.icon}
                    onMouseEnter={() => setHoveredLink(link.path)}
                    onMouseLeave={() => setHoveredLink(null)}
                    sx={{
                      color: isActive(link.path) ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                      fontWeight: isActive(link.path) ? 600 : 400,
                      backgroundColor: isActive(link.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: 1,
                      px: 2,
                      py: 0.75,
                      minWidth: 'auto',
                      minHeight: 36,
                      fontSize: '0.875rem',
                      transition: 'all 0.3s ease',
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: hoveredLink === link.path || isActive(link.path) ? '0%' : '-100%',
                        width: '100%',
                        height: '2px',
                        backgroundColor: '#ffffff',
                        transition: 'left 0.3s ease',
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                      },
                    }}
                  >
                    {link.text}
                  </Button>
                ))}
              </Box>
            )}

            {/* Mobile: Search Icon & Menu */}
            {isMobile && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                height: '100%',
              }}>
                <IconButton
                  onClick={() => setIsSearchFocused(!isSearchFocused)}
                  sx={{ 
                    color: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    width: 36,
                    height: 36,
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                  }}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  onClick={toggleDrawer(true)}
                  sx={{ 
                    color: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    width: 36,
                    height: 36,
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
                  }}
                >
                  <MenuIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Toolbar>

          {/* Mobile Search Bar (Expands when clicked) */}
          {isMobile && isSearchFocused && (
            <Box sx={{ 
              p: 2, 
              pt: 1, 
              position: 'relative',
              backgroundColor: '#000000',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <TextField
                fullWidth
                autoFocus
                variant="outlined"
                placeholder="Search hadith by text (Arabic or English)..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      {isSearching ? (
                        <CircularProgress 
                          size={20} 
                          sx={{ color: 'rgba(255, 255, 255, 0.7)' }} 
                        />
                      ) : (
                        <IconButton 
                          size="small" 
                          onClick={clearSearch}
                          sx={{ color: 'rgba(255, 255, 255, 0.5)', mr: -1 }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                  sx: {
                    color: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                  }
                }}
              />
              
              {searchResults.length > 0 ? (
                <Paper
                  sx={{
                    mt: 1,
                    maxHeight: 400,
                    overflow: 'auto',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 1,
                  }}
                >
                  <List>
                    {searchResults.map((result) => (
                      <ListItem 
                        key={`${result.hadith_id}-${result.chapter_id}`}
                        disablePadding
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <ListItemButton
                          onClick={() => handleResultClick(result)}
                          sx={{
                            borderRadius: 0,
                            py: 2,
                            px: 2,
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <FormatQuoteIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                          </ListItemIcon>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                  label={`Hadith ${result.hadith_number || 'N/A'}`}
                                  size="small"
                                  sx={{ 
                                    height: 18,
                                    fontSize: '0.65rem',
                                    backgroundColor: 'rgba(255, 255, 255, 1)',
                                    color: 'primary.light',
                                    '&:hover': {
                                      backgroundColor: 'rgba(25, 118, 210, 0.25)',
                                    }
                                  }}
                                />
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                  •
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  {result.book_title}
                                </Typography>
                              </Box>
                              
                              {/* Show Arabic text for Arabic searches, English for English searches */}
                              {isArabicQuery(searchQuery) && result.arabic ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: '0.8rem',
                                    direction: 'rtl',
                                    textAlign: 'right',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    mt: 0.5,
                                    lineHeight: 1.4,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {highlightArabicTerm(result.arabic, searchQuery)}
                                </Typography>
                              ) : result.english && isEnglishQuery(searchQuery) ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: '0.8rem',
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    mt: 0.5,
                                    lineHeight: 1.4,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {highlightSearchTerm(result.english, searchQuery)}
                                </Typography>
                              ) : null}
                            </Box>
                          </Box>
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              ) : searchQuery.length >= 2 && !isSearching ? (
                <Paper sx={{ mt: 1, p: 3, backgroundColor: '#1a1a1a', borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
                    No hadith found for "{searchQuery}"
                  </Typography>
                </Paper>
              ) : null}
            </Box>
          )}
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer 
        anchor="right" 
        open={drawerOpen} 
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: '#000000',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
      >
        <Box sx={{ width: 280, p: 2 }}>
          <Box 
            onClick={handleLogoClick}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              mb: 4,
              mt: 2,
              cursor: 'pointer',
            }}
          >
            <Box
              component="img"
              src={myLogo}
              alt="Ghadir Project Logo"
              sx={{ 
                height: 50, 
                width: 50,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255, 255, 255, 0.1)',
              }}
            />
            <Box>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 700 }}>
                Shia Library
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Ghadir Project
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 2 }} />
          
          <List>
            {navLinks.map((link) => (
              <ListItem key={link.text} disablePadding>
                <ListItemButton
                  component={Link}
                  to={link.path}
                  onClick={toggleDrawer(false)}
                  sx={{
                    color: isActive(link.path) ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                    backgroundColor: isActive(link.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: isActive(link.path) ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                    minWidth: 40 
                  }}>
                    {link.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={link.text}
                    primaryTypographyProps={{
                      fontWeight: isActive(link.path) ? 600 : 400,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;