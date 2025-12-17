import { useState, useEffect } from 'react';
import {  
  Typography, 
  Box, 
  Tabs, 
  Tab, 
  Grid, 
  Container,
  Paper,
  Chip,
  Stack,
  Breadcrumbs,
  Skeleton,
} from '@mui/material';
import { Link } from 'react-router-dom';
import Navbar from '../Navbar/Navbar.jsx';
import { supabase } from '../../config/supabaseClient.js';
import { ThemeProvider } from '@mui/material';
import theme from '../../assets/theme.js';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CategoryIcon from '@mui/icons-material/Category';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

export default function HomePage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Fazail');

useEffect(() => {
  // Scroll to top when component mounts
  window.scrollTo(0, 0);
}, []); // Empty dependency array
  
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      let { data, error } = await supabase
        .from('books')
        .select('*')
        .order('id', { ascending: true })

      if (error) console.log('Error fetching books:', error)
      else setBooks(data || []);
      setLoading(false);
    }

    fetchBooks();
  }, []);

  const handleChange = (event, newValue) => setCategory(newValue);
  const filteredBooks = books.filter(book => book.category === category);
  const categories = ['Fazail', 'Ahkam'];
  const categoryDescriptions = {
    'Fazail': 'Books about the virtues and merits of deeds and people',
    'Ahkam': 'Books about Islamic rulings and jurisprudence'
  };

  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Container sx={{ mt: "30px", mb: 8, maxWidth: "lg" }}>
        {/* Breadcrumb Navigation */}
        <Breadcrumbs sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <HomeIcon fontSize="small" color="primary" />
            <Typography color="primary.main" fontWeight="medium">
              Home
            </Typography>
          </Stack>
        </Breadcrumbs>

        {/* Welcome Header */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 4,
            borderRadius: 3,
            backgroundColor: '#f5f5f5',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MenuBookIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                Islamic Library
              </Typography>
            </Box>
            <Typography variant="body1" color="text.primary">
              Explore authentic Islamic books categorized by their content. Select a category to browse available books.
            </Typography>
          </Stack>
        </Paper>

        {/* Category Tabs Section */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 4,
            borderRadius: 3,
            backgroundColor: 'white',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {/* Category Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            mb: 3,
            pb: 2,
            borderBottom: '2px solid',
            borderColor: 'divider'
          }}>
            <CategoryIcon color="primary" sx={{ fontSize: 32 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                Categories
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Select a category to filter books
              </Typography>
            </Box>
          </Box>

          {/* Category Tabs */}
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              borderRadius: 2,
              backgroundColor: '#f5f5f5',
              border: '1px solid',
              borderColor: 'divider',
              p: 2,
            }}
          >
            <Tabs
              value={category}
              onChange={handleChange}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  py: 2,
                  borderRadius: 1,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    }
                  },
                  '&:hover': {
                    backgroundColor: '#e0e0e0',
                  }
                }
              }}
            >
              {categories.map((cat) => (
                <Tab 
                  key={cat} 
                  label={cat} 
                  value={cat}
                  icon={<MenuBookIcon sx={{ mr: 1 }} />}
                  iconPosition="start"
                />
              ))}
            </Tabs>

            {/* Category Description */}
            <Box sx={{ mt: 3, p: 2, backgroundColor: 'white', borderRadius: 2 }}>
              <Typography variant="body1" color="text.primary" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <InfoIcon color="primary" sx={{ mt: 0.5 }} />
                {categoryDescriptions[category]}
              </Typography>
            </Box>
          </Paper>

          {/* Books Count */}
          {!loading && filteredBooks.length > 0 && (
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={`${filteredBooks.length} books`}
                color="primary"
                variant="outlined"
                size="medium"
              />
              <Typography variant="body2" color="text.secondary">
                Found in {category} category
              </Typography>
            </Box>
          )}

          {/* Books Grid - FIXED: Added Grid container properties */}
          {loading ? (
            <Grid container spacing={3}>
              {Array.from(new Array(6)).map((_, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Paper sx={{ p: 2, borderRadius: 3, height: '100%' }}>
                    <Stack direction="row" spacing={2} sx={{ height: '100%' }}>
                      <Skeleton variant="rectangular" width={100} height={140} sx={{ borderRadius: 2 }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" height={32} width="80%" />
                        <Skeleton variant="text" height={24} width="60%" sx={{ mt: 1 }} />
                        <Skeleton variant="text" height={20} width="40%" sx={{ mt: 2 }} />
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : filteredBooks.length > 0 ? (
            <Grid container spacing={3} sx={{ display: 'flex', alignItems: 'stretch' }}>
              {filteredBooks.map((book) => (
                <Grid 
                  item 
                  xs={12} 
                  sm={6} 
                  md={4} 
                  key={book.id}
                  sx={{ display: 'flex' }} // FIX: This makes each Grid item a flex container
                >
                  <Paper
                    component={Link}
                    to={`/book/${book.id}`}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%', // FIX: Take full width of Grid item
                      p: 3,
                      borderRadius: 3,
                      cursor: 'pointer',
                      textDecoration: 'none',
                      backgroundColor: 'white',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        boxShadow: 6,
                        transform: 'translateY(-4px)',
                        borderColor: 'primary.main',
                        backgroundColor: '#f9f9f9',
                      },
                    }}
                  >

                    <Stack direction="row" spacing={3} sx={{ flex: 1, mb: 2 }}>
                      {/* Book Cover */}
                      {book.image_path && (
                        <Box
                          component="img"
                          src={book.image_path}
                          alt={book.title}
                          sx={{
                            width: 120,
                            height: 168,
                            borderRadius: 1,
                            boxShadow: 2,
                            objectFit: 'cover',
                            flexShrink: 0,
                          }}
                        />
                      )}

                      {/* Book Info */}
                      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                        {/* Title */}
                        <Typography 
                          variant="h6" 
                          fontWeight="bold" 
                          color="text.primary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mb: 1,
                            lineHeight: 1.3,
                          }}
                        >
                          {book.title}
                        </Typography>

                        {/* English Title */}
                        {book.english_title && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 2,
                              fontStyle: 'italic',
                              lineHeight: 1.4,
                            }}
                          >
                            {book.english_title}
                          </Typography>
                        )}

                        {/* Author - Pushed to bottom */}
                        {book.author && (
                          <Box sx={{ mt: 'auto', pt: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <PersonIcon fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {book.author}
                              </Typography>
                            </Stack>
                          </Box>
                        )}
                      </Box>
                    </Stack>

                    {/* View Button */}
                    <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
                      <Typography 
                        variant="caption" 
                        color="primary"
                        sx={{ 
                          fontWeight: 'medium',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        View Book
                        <ArrowForwardIosIcon fontSize="small" />
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper
              sx={{
                p: 8,
                textAlign: 'center',
                borderRadius: 3,
                backgroundColor: '#f5f5f5',
              }}
            >
              <MenuBookIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No books found in {category} category
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check back later or try another category.
              </Typography>
            </Paper>
          )}
        </Paper>

        {/* Stats Footer */}
        {!loading && books.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              backgroundColor: '#f5f5f5',
              border: '1px solid',
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center">
              <Typography variant="body1" color="text.primary">
                <strong>{books.length}</strong> Total Books
              </Typography>
              <Typography variant="body1" color="text.primary">
                <strong>{books.filter(b => b.category === 'Fazail').length}</strong> Fazail Books
              </Typography>
              <Typography variant="body1" color="text.primary">
                <strong>{books.filter(b => b.category === 'Ahkam').length}</strong> Ahkam Books
              </Typography>
            </Stack>
          </Paper>
        )}
      </Container>
    </ThemeProvider>
  );
}