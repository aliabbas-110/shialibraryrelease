// App.jsx
import './App.css'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import { Home } from './Pages/home'
import { Contact } from './Pages/contact'
import { About } from './Pages/about'
import BookPage from './Pages/BookPage.jsx'
import VolumePage from './Pages/VolumePage.jsx'
import ChapterPage from './Pages/ChapterPage.jsx'
import PasswordGate from './components/PasswordGate';


function App() {
  return (
                  <PasswordGate>

      <Router>
        <Routes>

          <Route path="/" element={<Home />} />

          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/book/:bookId" element={<BookPage />} />
          <Route path="/volume/:volumeId" element={<VolumePage />} />
          <Route path="/book/:bookId/chapter/:chapterId" element={<ChapterPage />} />

        </Routes>
      </Router>
                    </PasswordGate>

  );
}

export default App;