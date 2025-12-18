import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './Pages/home';
import { Contact } from './Pages/contact';
import { About } from './Pages/about';
import BookPage from './Pages/BookPage.jsx';
import VolumePage from './Pages/VolumePage.jsx';
import ChapterPage from './Pages/ChapterPage.jsx';
import PasswordGate from './components/PasswordGate';
import { ThemeProvider } from "@mui/material";
import theme from './assets/theme.js';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './contexts/AuthContext';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Profile from './Pages/Profile';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <PasswordGate>
      <Router>
        <AuthProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/book/:bookId" element={<BookPage />} />
              <Route path="/volume/:volumeId" element={<VolumePage />} />
              <Route path="/book/:bookId/chapter/:chapterId" element={<ChapterPage />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
            <Analytics />
        </AuthProvider>
      </Router>
      </PasswordGate>
    </ThemeProvider>
  );
}

export default App;