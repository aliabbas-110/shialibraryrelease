import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

export default function PageTransition() {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    
    // Simulate loading time (adjust as needed)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!loading) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: '70px', // Height of your navbar - adjust if different
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(100px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none', // Allow clicks to pass through to navbar
      }}
    >
      <Box 
        sx={{ 
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          pointerEvents: 'auto', // Re-enable pointer events for the spinner
        }}
      >
        <CircularProgress 
          color="primary" 
          size={50} 
          thickness={3}
          sx={{
            animationDuration: '800ms',
          }}
        />
      </Box>
    </Box>
  );
}