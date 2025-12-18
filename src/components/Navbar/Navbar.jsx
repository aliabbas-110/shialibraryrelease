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
import { useAuth } from '../../contexts/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { user, signOut } = useAuth();

  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Function to remove Arabic diacritics (tashkeel)
  const removeDiacritics = (text) => {
    if (!text) return '';
    
    const withoutDiacritics = text.replace(/[\u064B-\u065F\u0670]/g, '');
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
    
    const cleanQuery = removeDiacritics(query);
    const normalized = cleanQuery
      .replace(/[آأإءٱ]/g, 'ا')
      .replace(/[ؤ]/g, 'و')
      .replace(/[ئ]/g, 'ي')
      .replace(/\s+/g, ' ')
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

  // Click outside handler for search
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector('.search-container');
      const searchInput = document.querySelector('.search-input');
      const searchResultsContainer = document.querySelector('.search-results');
      const searchIconButton = document.querySelector('.search-icon-button');
      
      if (searchIconButton && searchIconButton.contains(event.target)) {
        return;
      }
      
      if (isSearchFocused && 
          searchContainer && 
          !searchContainer.contains(event.target) &&
          searchInput && 
          !searchInput.contains(event.target) &&
          (!searchResultsContainer || !searchResultsContainer.contains(event.target))) {
        setIsSearchFocused(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isSearchFocused]);
  
  // Main search function
  const performSearch = async (query) => {
    setIsSearching(true);
    try {
      let data = null;

      if (isArabicQuery(query)) {
        data = await searchArabicHadith(query);
      } else {
        data = await searchEnglishHadith(query);
      }

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
        .or(`search_vector.phfts.${query}`)
        .order('id', { ascending: true })
        .limit(25);

      if (error) throw error;
      return data || [];

    } catch (ftsError) {
      console.warn('FTS failed, trying fallback:', ftsError.message);
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
        .or(`arabic.ilike.%${query}%`)
        .limit(25);

      if (ftsError) throw ftsError;

      if (ftsData && ftsData.length > 0) {
        return ftsData;
      }

      return await searchArabicWithoutDiacritics(normalizedQuery);

    } catch (error) {
      console.warn('Arabic search failed:', error);
      return await searchArabicWithoutDiacritics(normalizedQuery);
    }
  };

  // Search Arabic without diacritics
  const searchArabicWithoutDiacritics = async (normalizedQuery) => {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'search_arabic_without_diacritics',
        { search_query: normalizedQuery }
      );

      if (!rpcError && rpcData && rpcData.length > 0) {
        return rpcData;
      }

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
        .ilike('arabic', '%ا%')
        .limit(200);

      if (allError) throw allError;

      const filteredResults = (allData || []).filter(item => {
        if (!item.arabic) return false;
        const cleanArabic = removeDiacritics(item.arabic);
        return cleanArabic.includes(normalizedQuery);
      }).slice(0, 25);

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
      navigate(`/book/${result.book_id}/chapter/${result.chapter_id}#hadith-${result.hadith_id}`);
    } else if (result.book_id && result.chapter_id) {
      navigate(`/book/${result.book_id}/chapter/${result.chapter_id}`);
    }
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);
  };

  // Nav links based on user authentication
  const getNavLinks = () => {
    const links = [{ text: 'Home', path: '/', icon: <HomeIcon /> }];
    
    if (user) {
      links.push({ text: 'My Profile', path: '/profile', icon: <PersonIcon /> });
    }
    
    return links;
  };

  // Menu links for drawer (includes all pages)
  const getMenuLinks = () => {
    const links = [
      { text: 'Home', path: '/', icon: <HomeIcon /> },
      { text: 'About', path: '/about', icon: <InfoIcon /> },
      { text: 'Contact', path: '/contact', icon: <ContactMailIcon /> },
    ];
    
    if (user) {
      links.push({ text: 'My Profile', path: '/profile', icon: <PersonIcon /> });
    }
    
    return links;
  };

  const isActive = (path) => location.pathname === path;

  const handleLogoClick = () => navigate('/');

  // Format text preview
  const getTextPreview = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Helper to highlight search terms
  const highlightSearchTerm = (text, query) => {
    if (!text || !query) return getTextPreview(text, isMobile ? 80 : 100);
    
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

  // Highlight Arabic search terms
  const highlightArabicTerm = (arabicText, query) => {
    if (!arabicText || !query || !isArabicQuery(query)) {
      return getTextPreview(arabicText, isMobile ? 80 : 100);
    }
    
    const maxLength = isMobile ? 80 : 100;
    const normalizedArabic = removeDiacritics(arabicText);
    const normalizedQuery = normalizeArabicQuery(query);
    
    const index = normalizedArabic.indexOf(normalizedQuery);
    
    if (index === -1) return getTextPreview(arabicText, maxLength);
    
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

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <AppBar 
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(7px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          height: 70,
          transition: 'all 0.3s ease',
          backgroundImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.5))',
          zIndex: 1300,
        }}
      >
        <Container maxWidth="lg" sx={{ 
          height: '100%',
          px: { xs: 2, sm: 4, md: 4 }
        }}>
          <Toolbar sx={{ 
            justifyContent: 'space-between', 
            alignItems: 'center',
            height: '100%',
            py: 0,
            px: { xs: 0, sm: 0 },
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
                  '& .logo-image': { transform: 'scale(1.1)' }
                }
              }}
            >
              <Box
                className="logo-image"
                component="img"
                src={myLogo}
                alt="Ghadir Project Logo"
                sx={{ 
                  height: 45, 
                  width: 45,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease',
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
                    fontSize: '1.3rem',
                  }}
                >
                  Shia Library
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 400,
                    fontSize: '0.6rem',
                    letterSpacing: '0.5px',
                  }}
                >
                  Ghadir Project
                </Typography>
              </Stack>
            </Box>

            {/* Desktop Search Bar */}
            {!isMobile && (
              <Box 
                className="search-container"
                sx={{ 
                  flex: 1, 
                  maxWidth: 400,
                  mx: 2,
                  ml: 12,
                  position: 'relative',
                  zIndex: theme.zIndex.appBar + 1,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <TextField
                  className="search-input"
                  fullWidth
                  variant="outlined"
                  placeholder="Search hadith by text (Arabic or English)..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setIsSearchFocused(true)}
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

                {/* Desktop Search Results Dropdown */}
                {isSearchFocused && (searchQuery.length >= 2 || searchResults.length > 0) && (
                  <Fade in={isSearchFocused}>
                    <Paper
                      className="search-results"
                      elevation={8}
                      sx={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        maxHeight: 500,
                        overflow: 'auto',
                        backgroundColor: 'rgba(0, 0, 0, 0.98)',
                        backdropFilter: 'blur(25px)',
                        WebkitBackdropFilter: 'blur(25px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 1,
                        zIndex: theme.zIndex.modal + 1,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                        backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
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
                                    borderRadius: 1,
                                    py: 2,
                                    px: 2,
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    },
                                  }}
                                >
                                  <ListItemIcon sx={{ minWidth: 36, mr: 1 }}>
                                    <FormatQuoteIcon sx={{ 
                                      color: 'rgba(255, 255, 255, 0.7)', 
                                      fontSize: 18 
                                    }} />
                                  </ListItemIcon>
                                  <Box sx={{ flex: 1 }}>
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

            {/* Desktop Menu Links - Only Home + Sign In/My Profile */}
            {!isMobile && (
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5, 
                flexShrink: 0,
                height: '100%',
                alignItems: 'center',
              }}>
                {/* Always show Home */}
                <Button
                  component={Link}
                  to="/"
                  sx={{
                    color: isActive('/') ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                    fontWeight: isActive('/') ? 600 : 400,
                    backgroundColor: 'transparent',
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 1,
                    px: 2,
                    py: 0.75,
                    minWidth: 'auto',
                    minHeight: 36,
                    fontSize: '0.875rem',
                    transition: 'all 0.3s ease',
                    '&:after': isActive('/') ? {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      height: '2px',
                      backgroundColor: '#ffffff',
                    } : {},
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                    },
                  }}
                >
                  Home
                </Button>

                {/* Show My Profile when logged in, Sign In when not */}
                {user ? (
                  <Button
                    component={Link}
                    to="/profile"
                    startIcon={<PersonIcon />}
                    sx={{
                      color: isActive('/profile') ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                      backgroundColor: 'transparent',
                      borderRadius: 1,
                      px: 2,
                      py: 0.75,
                      minHeight: 36,
                      fontSize: '0.875rem',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                      },
                    }}
                  >
                    My Profile
                  </Button>
                ) : (
                  <Button
                    component={Link}
                    to="/login"
                    startIcon={<LoginIcon />}
                    sx={{
                      color: isActive('/login') ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                      backgroundColor: 'transparent',
                      borderRadius: 1,
                      px: 2,
                      py: 0.75,
                      minHeight: 36,
                      fontSize: '0.875rem',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                      },
                    }}
                  >
                    Sign In
                  </Button>
                )}

                {/* Menu Icon for drawer */}
                <IconButton 
                  onClick={toggleDrawer(true)}
                  sx={{ 
                    color: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    width: 36,
                    height: 36,
                    ml: 1,
                    '&:hover': { 
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            )}

            {/* Mobile: Search Icon & Menu Icon */}
            {isMobile && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                height: '100%',
              }}>
                <IconButton
                  className="search-icon-button"
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
            <Box 
              className="search-container"
              sx={{ 
                p: 2, 
                pt: 1, 
                position: 'relative',
                backgroundColor: 'rgba(0, 0, 0, 0.98)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                borderBottomLeftRadius: 8,
                borderBottomRightRadius: 8,
              }}
            >
              <TextField
                className="search-input"
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
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(5px)',
                    WebkitBackdropFilter: 'blur(5px)',
                    borderRadius: 2,
                    fontSize: '0.875rem',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      borderWidth: '1px',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      borderWidth: '1px',
                    },
                  }
                }}
              />
              
              {searchResults.length > 0 ? (
                <Paper
                  className="search-results"
                  sx={{
                    mt: 1,
                    maxHeight: 400,
                    overflow: 'auto',
                    backgroundColor: 'rgba(0, 0, 0, 0.98)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                    backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
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
                            borderRadius: 1,
                            py: 2,
                            px: 2,
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            },
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
                <Paper 
                  className="search-results"
                  sx={{ 
                    mt: 1, 
                    p: 3, 
                    backgroundColor: 'rgba(0, 0, 0, 0.98)',
                    backdropFilter: 'blur(25px)',
                    WebkitBackdropFilter: 'blur(25px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    textAlign: 'center' 
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    No hadith found for "{searchQuery}"
                  </Typography>
                </Paper>
              ) : null}
            </Box>
          )}
        </Container>
      </AppBar>

      {/* Mobile Drawer - Fixed zIndex to appear in front */}
      <Drawer 
        anchor="right" 
        open={drawerOpen} 
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: { xs: '75%', sm: 280 },
            maxWidth: 320,
            backgroundColor: 'rgba(0, 0, 0, 0.87)',
            backdropFilter: 'blur(7px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
            boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)',
            zIndex: 1400, // Higher than AppBar (1300)
          }
        }}
        sx={{
          zIndex: 1400, // Ensure drawer is in front
        }}
      >
        <Box sx={{ 
          p: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Box 
            onClick={handleLogoClick}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              mb: 3,
              mt: 1,
              cursor: 'pointer',
              p: 1,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }
            }}
          >
            <Box
              component="img"
              src={myLogo}
              alt="Ghadir Project Logo"
              sx={{ 
                height: 60,
                width: 60,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
            <Box>
              <Typography 
                variant="h6"
                sx={{ 
                  color: '#ffffff', 
                  fontWeight: 700,
                  fontSize: '1.2rem',
                  letterSpacing: '0.3px'
                }}
              >
                Shia Library
              </Typography>
              <Typography 
                variant="body2"
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '0.85rem',
                  fontWeight: 400
                }}
              >
                Ghadir Project
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ 
            borderColor: 'rgba(255, 255, 255, 0.15)', 
            mb: 3,
            borderWidth: 1
          }} />
          
          <List sx={{ flex: 1 }}>
            {getMenuLinks().map((link) => (
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
                    minWidth: 36
                  }}>
                    {link.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={link.text}
                    primaryTypographyProps={{
                      fontWeight: isActive(link.path) ? 600 : 400,
                      fontSize: '0.95rem'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            
            {/* Logout/Sign In in drawer */}
            {user ? (
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    toggleDrawer(false)();
                    handleLogout();
                  }}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    minWidth: 36
                  }}>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Sign Out"
                    primaryTypographyProps={{
                      fontSize: '0.95rem'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ) : (
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to="/login"
                  onClick={toggleDrawer(false)}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 1,
                    mb: 0.5,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    minWidth: 36
                  }}>
                    <LoginIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Sign In"
                    primaryTypographyProps={{
                      fontSize: '0.95rem'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )}
          </List>
          
          <Box sx={{ 
            mt: 'auto', 
            pt: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.75rem',
                display: 'block',
                textAlign: 'center'
              }}
            >
              © {new Date().getFullYear()} Ghadir Project
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;