import { useState } from 'react';
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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import { useMediaQuery, useTheme } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import myLogo from '/public/images/Ghadir_logo.png';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [hoveredLink, setHoveredLink] = useState(null);

  const toggleDrawer = (open) => () => setDrawerOpen(open);

  const navLinks = [
    { text: 'Home', path: '/', icon: <HomeIcon fontSize="small" /> },
    { text: 'About', path: '/about', icon: <InfoIcon fontSize="small" /> },
    { text: 'Contact', path: '/contact', icon: <ContactMailIcon fontSize="small" /> },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          backgroundColor: '#000000',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            {/* Logo + Text - Clickable but not a Link component */}
            <Box 
              onClick={handleLogoClick}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                textDecoration: 'none',
                cursor: 'pointer',
                '&:hover': {
                  '& .logo-image': {
                    transform: 'scale(1.05)',
                  }
                }
              }}
            >
              {/* Logo */}
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
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                }}
              />

              {/* Text */}
              <Stack direction="column" spacing={0.2}>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#ffffff',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    letterSpacing: '0.5px',
                  }}
                >
                  Shia Library
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontWeight: 400,
                    fontSize: '0.75rem',
                    letterSpacing: '1px',
                  }}
                >
                  Ghadir Project
                </Typography>
              </Stack>
            </Box>

            {/* Desktop Menu */}
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 0.5 }}>
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
                      px: 2.5,
                      py: 1,
                      minWidth: 'auto',
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

            {/* Mobile Menu Icon */}
            {isMobile && (
              <IconButton 
                onClick={toggleDrawer(true)}
                sx={{ 
                  color: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
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
        <Box sx={{ p: 2 }}>
          {/* Drawer Header - Not clickable, just for display */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2 }}>
            <Box
              component="img"
              src={myLogo}
              alt="Ghadir Project Logo"
              sx={{ 
                height: 40, 
                width: 40,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid rgba(255, 255, 255, 0.1)',
              }}
            />
            <Box>
              <Typography variant="subtitle1" fontWeight={600} color="#ffffff">
                Shia Library
              </Typography>
              <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
                Ghadir Project
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)', mb: 2 }} />

          {/* Drawer Links */}
          <List sx={{ p: 0 }}>
            {navLinks.map((link) => (
              <ListItem key={link.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={Link}
                  to={link.path}
                  onClick={toggleDrawer(false)}
                  selected={isActive(link.path)}
                  sx={{
                    borderRadius: 1,
                    py: 1.5,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: '4px',
                        backgroundColor: '#ffffff',
                      }
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      paddingLeft: '20px',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Box sx={{ 
                      color: isActive(link.path) ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                      transition: 'color 0.3s ease',
                    }}>
                      {link.icon}
                    </Box>
                    <ListItemText 
                      primary={link.text}
                      primaryTypographyProps={{
                        fontWeight: isActive(link.path) ? 600 : 400,
                        color: isActive(link.path) ? '#ffffff' : 'rgba(255, 255, 255, 0.9)',
                      }}
                    />
                  </Box>
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