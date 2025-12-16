import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Box, Typography, Card, CardContent, Grid } from "@mui/material";
import Navbar from "../components/Navbar/Navbar.jsx";
import { createClient } from "@supabase/supabase-js";

// 1️⃣ Initialize Supabase
const supabaseUrl = "https://YOUR_PROJECT_REF.supabase.co";
const supabaseAnonKey = "YOUR_ANON_KEY"; // use your public anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function VolumePage() {
  const { volumeId } = useParams();
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    const fetchChapters = async () => {
      // Fetch chapters for this volume
      const { data, error } = await supabase
        .from("chapters")
        .select("id, chapter_number, title_ar, title_en")
        .eq("volume_id", volumeId)
        .order("chapter_number", { ascending: true });

      if (error) console.error(error);
      else setChapters(data || []);
    };

    fetchChapters();
  }, [volumeId]);

  return (
    <>
      <Navbar />
      <Box sx={{ pt: 'calc(64px + 24px)', display: 'flex', justifyContent: 'center', px: 2 }}>
        <Box sx={{ maxWidth: 1200, width: '100%' }}>
          <Typography variant="h4" gutterBottom>Chapters</Typography>
          <Grid container spacing={2} justifyContent="center">
            {chapters.map(ch => (
              <Grid item xs={12} sm={6} md={4} key={ch.id} display="flex" justifyContent="center">
                <Card
                  component={Link}
                  to={`/chapter/${ch.id}`}
                  sx={{
                    width: '100%',
                    maxWidth: 400,
                    textDecoration: 'none',
                    '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' }
                  }}
                >
                  <CardContent>
                    <Typography variant="h6">{ch.title_en || `Chapter ${ch.chapter_number}`}</Typography>
                    {ch.title_ar && <Typography variant="body2">{ch.title_ar}</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </>
  );
}
