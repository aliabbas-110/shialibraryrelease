// hooks/useBookData.js
import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient.js";

export const useBookData = (bookId) => {
  const [book, setBook] = useState(null);
  const [volumes, setVolumes] = useState([]);
  const [selectedVolume, setSelectedVolume] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedVolumeNumber, setSelectedVolumeNumber] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch book
  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("books")
        .select("*")
        .eq("id", bookId)
        .single();
      setBook(data);
      setLoading(false);
    };
    fetchBook();
  }, [bookId]);

  // Fetch volumes & chapters
  useEffect(() => {
    if (!book) return;

    const fetchVolumes = async () => {
      const { data: vols } = await supabase
        .from("volumes")
        .select("*")
        .eq("book_id", book.id)
        .order("volume_number");

      if (!vols || vols.length === 0) {
        // No volumes → fetch chapters with volume_id IS NULL
        const { data: chaps } = await supabase
          .from("chapters")
          .select("*")
          .is("volume_id", null)
          .order("chapter_number");
        setChapters(chaps || []);
        setVolumes([]);
        setSelectedVolume(null);
        setSelectedVolumeNumber("");
      } else {
        // Check for volumes with number > 0
        const validVolumes = vols.filter((v) => v.volume_number > 0);

        if (validVolumes.length > 0) {
          // Show dropdown
          setVolumes(validVolumes);
          setSelectedVolume(validVolumes[0].id);
          setSelectedVolumeNumber(validVolumes[0].volume_number);
        } else {
          // Only volume_number = 0 → hide dropdown but fetch chapters
          const { data: chaps } = await supabase
            .from("chapters")
            .select("*")
            .eq("volume_id", vols[0].id)
            .order("chapter_number");
          setChapters(chaps || []);
          setVolumes([]);
          setSelectedVolume(vols[0].id);
          setSelectedVolumeNumber(0);
        }
      }
    };

    fetchVolumes();
  }, [book]);

  // Fetch chapters for selected volume
  useEffect(() => {
    if (!selectedVolume) return;
    const fetchChapters = async () => {
      const { data } = await supabase
        .from("chapters")
        .select("*")
        .eq("volume_id", selectedVolume)
        .order("chapter_number");
      setChapters(data || []);
      
      // Update selected volume number
      const selectedVol = volumes.find(v => v.id === selectedVolume);
      if (selectedVol) {
        setSelectedVolumeNumber(selectedVol.volume_number);
      }
    };
    fetchChapters();
  }, [selectedVolume, volumes]);

  return {
    book,
    volumes,
    selectedVolume,
    setSelectedVolume,
    chapters,
    selectedVolumeNumber,
    loading,
    setChapters // For ReaderPage to update chapters if needed
  };
};