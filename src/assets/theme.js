// theme.js
import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: '#000000',
      light: '#333333',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#164a25',
      light: '#1f5d31',
      dark: '#0f371a',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f5f5', // Light default background
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
        },
      },
    },
  },
});

export default theme;