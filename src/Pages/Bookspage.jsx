import { useEffect, useState } from 'react';
import { Card, CardContent, CardMedia, Typography, Grid, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar.jsx';
import { supabase } from '../config/supabaseClient.js';
import { ThemeProvider } from "@mui/material";


export default function BooksPage() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase.from('books').select('*').order('id');
      if (!error) setBooks(data);
    };
    fetchBooks();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Box sx={{ px: 2, py: 4, maxWidth: { xs: '100%', sm: 700, md: 900 }, mx: 'auto' }}>
        <Grid container spacing={3} justifyContent="center">
          {books.map(book => (
            <Grid item xs={12} sm={6} md={4} key={book.id} display="flex" justifyContent="center">
              <Card
                component={Link}
                to={`/book/${book.id}`}
                sx={{
                  textDecoration: 'none',
                  cursor: 'pointer',
                  transition: '0.3s',
                  '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' }
                }}
              >
                {book.image_path && (
                  <CardMedia
                    component="img"
                    height="180"
                    image={book.image_path}
                    alt={book.title}
                    sx={{ objectFit: 'cover' }}
                  />
                )}
                <CardContent>
                  <Typography variant="h6" fontWeight="bold">{book.title}</Typography>
                  {book.english_title && <Typography variant="body2">{book.english_title}</Typography>}
                  {book.author && <Typography variant="body2" color="text.secondary">{book.author}</Typography>}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </ThemeProvider>
  );
}
