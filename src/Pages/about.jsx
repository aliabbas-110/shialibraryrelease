import "@fontsource/roboto";
import Navbar from "../components/Navbar/Navbar.jsx";
import theme from '../assets/theme.js';
import { ThemeProvider } from "@mui/material";
import {
  Container,
  Typography,
  Paper,
  Box,
  Divider,
  Stack,
  Breadcrumbs,
  Link as MuiLink,
} from "@mui/material";
import { Link } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import { TextField, Button, Alert } from "@mui/material";
import { useState } from "react";
import { supabase } from "../config/supabaseClient.js";


export function About() {

    const [form, setForm] = useState({
  name: "",
  email: "",
  message: "",
});

const [loading, setLoading] = useState(false);
const [success, setSuccess] = useState(false);
const [error, setError] = useState("");

const handleSubmit = async () => {
  setLoading(true);
  setError("");
  setSuccess(false);

  const { error } = await supabase.functions.invoke("send-feedback", {
    body: {
      type: "about",
      feedback: {
        name: form.name,
        email: form.email,
        comments: form.message,
      },
      pageUrl: window.location.href,
    },
  });

  if (error) {
    setError("Failed to send message. Please try again.");
  } else {
    setSuccess(true);
    setForm({ name: "", email: "", message: "" });
  }

  setLoading(false);
};


  return (
    <ThemeProvider theme={theme}>
      <Navbar />
      <Container
        sx={{
          pt: "calc(64px + 32px)",
          pb: 8,
          minHeight: "100vh",
        }}
      >
        {/* Breadcrumb Navigation */}
        <Breadcrumbs sx={{ mb: 4 }}>
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body1">Home</Typography>
            </Stack>
          </Link>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography color="primary.main" fontWeight="medium">
              About
            </Typography>
          </Stack>
        </Breadcrumbs>

        {/* Main Content */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 6 },
            borderRadius: 4,
            backgroundColor: "white",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Title */}
          <Typography
            variant="h3"
            fontWeight="bold"
            color="primary.main"
            gutterBottom
            sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, mb: 4 }}
          >
            About Shia Library
          </Typography>

          {/* Introductory Hadith Section */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              mb: 6,
              borderRadius: 3,
              backgroundColor: '#f8f9fa',
              border: '1px solid',
              borderColor: 'divider',
              position: 'relative',
            }}
          >


            {/* Arabic Text */}
            <Typography
              variant="body1"
              sx={{
                direction: 'rtl',
                textAlign: 'right',
                fontFamily: 'inherit',
                fontSize: { xs: '1.1rem', md: '1.2rem' },
                lineHeight: 2,
                mb: 4,
                mt: 2,
                color: '#333',
                fontWeight: 500,
              }}
            >
              قال رسول الله ﷺ:
            </Typography>

            {/* Arabic Hadith Text */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3.5 },
                mb: 4,
                borderRadius: 2,
                backgroundColor: 'white',
                border: '2px solid',
                borderColor: 'primary.light',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  direction: 'rtl',
                  textAlign: 'center',
                  fontFamily: 'inherit',
                  fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' }, /* Reduced mobile size */
                  lineHeight: 2,
                  color: 'primary.dark',
                  fontWeight: 600,
                }}
              >
                لو أن الغياض أقلام والبحر مداد و الجن حساب
                 والانس كتاب ما أحصوا فضائل علي بن أبي طالب عليه السلام 
              </Typography>
            </Paper>

            {/* English Translation */}
            <Typography
              variant="body1"
              sx={{
                fontStyle: 'italic',
                fontSize: { xs: '1rem', md: '1.1rem' },
                lineHeight: 1.8,
                mb: 3,
                color: 'text.secondary',
                textAlign: 'center',
                px: { xs: 1, md: 4 },
              }}
            >
              If all the forests were pens, the sea were ink, the jinn were counters, and all mankind were writers, they still would not be able to count the virtues of Ali ibn Abi Talib عليه السلام
            </Typography>

            {/* Reference */}
            <Box
              sx={{
                mt: 3,
                pt: 3,
                borderTop: '1px dashed',
                borderColor: 'divider',
                textAlign: 'center',
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: 'italic' }}
              >
                Reference: Bihar al-Anwar, Volume 40, Page 74
              </Typography>
            </Box>

            {/* Interpretation/Explanation */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3 },
                mt: 4,
                borderRadius: 2,
                backgroundColor: '#f0f7ff',
                border: '1px solid',
                borderColor: 'primary.light',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '1rem', md: '1.05rem' },
                  lineHeight: 1.7,
                  color: 'text.primary',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}
              >
                "Our aim is not to encompass all of his merits, for that is beyond reach. Rather, our goal is to gather a few leaves from those vast forests and extract a few pearls from those endless seas of virtues, so that hearts may grow in recognition, love, and understanding of our Imams."
              </Typography>
            </Paper>
          </Paper>

          <Divider sx={{ my: 6 }} />

          {/* About Section Card */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 3,
              backgroundColor: '#fafafa',
              border: '2px dashed',
              borderColor: 'primary.main',
              opacity: 0.9,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 4,
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <InfoIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Typography
                variant="h4"
                fontWeight="bold"
                color="primary.main"
                sx={{ fontSize: { xs: '1.75rem', md: '2rem' } }}
              >
                About This Project
              </Typography>
            </Box>

            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1.05rem', md: '1.1rem' },
                lineHeight: 1.8,
                color: 'text.secondary',
                mb: 3,
              }}
              paragraph
            >
              {/* This area is reserved for detailed information about the Shia Library project. 
              Here you can describe the mission, vision, and objectives of this digital library. */}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1.05rem', md: '1.1rem' },
                lineHeight: 1.8,
                color: 'text.secondary',
                mb: 3,
              }}
              paragraph
            >
              {/* You can include information about: */}
            </Typography>

            <Box
              component="ul"
              sx={{
                pl: 3,
                mb: 4,
                '& li': {
                  mb: 1.5,
                  fontSize: { xs: '1rem', md: '1.05rem' },
                  lineHeight: 1.6,
                  color: 'text.secondary',
                }
              }}
            >
              {/* <li>The historical context and importance of collecting these works</li>
              <li>The sources and manuscripts used in this collection</li>
              <li>The methodology followed in translation and compilation</li>
              <li>The team behind this project and their qualifications</li>
              <li>Future plans and expansions for the library</li>
              <li>How users can contribute or support the project</li> */}
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                mt: 4,
                borderRadius: 2,
                backgroundColor: '#f0f7ff',
                border: '1px solid',
                borderColor: 'primary.light',
              }}
            >
              <Typography
                variant="h6"
                color="primary.main"
                gutterBottom
                sx={{ fontWeight: 'bold' }}
              >
                {/* Note for Content Editors: */}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontStyle: 'italic' }}
              >
                {/* This section is editable. You can replace this placeholder text with actual 
                content about the project. Consider including information about the scope, 
                goals, and significance of this digital library in preserving and disseminating 
                important Shia Islamic literature. */}
              </Typography>
            </Paper>
          </Paper>

          {/* Contact Us Form */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              backgroundColor: "#fafafa",
              mt: 6,
            }}
          >
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Contact Us
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={3}>
              For corrections, suggestions, or general enquiries regarding the project.
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Name"
                fullWidth
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <TextField
                label="Email"
                type="email"
                fullWidth
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <TextField
                label="Message"
                multiline
                minRows={4}
                fullWidth
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />

              {success && <Alert severity="success">Message sent successfully.</Alert>}
              {error && <Alert severity="error">{error}</Alert>}

              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </Stack>
          </Paper>

          {/* Call to Action - WITH ADDED SPACE */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              mt: 4, /* Added space before this section */
              borderRadius: 3,
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              gutterBottom
              sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' } }}
            >
              Explore the Collection
            </Typography>
            <Typography
              variant="body1"
              sx={{ mb: 3, opacity: 0.9, maxWidth: '800px', mx: 'auto' }}
            >
              Begin your journey through the vast ocean of knowledge preserved in our library.
              Discover books on the virtues of the Ahl al-Bayt and Islamic rulings.
            </Typography>
            <MuiLink
              component={Link}
              to="/"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                color: 'white',
                textDecoration: 'none',
                fontWeight: 'bold',
                backgroundColor: 'primary.main',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'primary.dark',
                  boxShadow: 3,
                },
                transition: 'all 0.2s ease',
              }}
            >
              Browse Books
            </MuiLink>
          </Paper>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}