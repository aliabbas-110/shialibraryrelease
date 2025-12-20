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

  // Helper function to extract and compare last 4 digits
  const sortChaptersByLast4Digits = (chaptersArray) => {
    if (!chaptersArray || chaptersArray.length === 0) return chaptersArray;
    
    return [...chaptersArray].sort((a, b) => {
      // Extract last 4 digits from the chapter ID
      const getLast4Digits = (id) => {
        const idStr = String(id);
        // Get last 4 characters, convert to number
        return parseInt(idStr.slice(-4)) || 0;
      };
      
      const aLast4 = getLast4Digits(a.id);
      const bLast4 = getLast4Digits(b.id);
      
      return aLast4 - bLast4; // Ascending order
    });
  };

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
          .is("volume_id", null);
        
        // Sort chapters by last 4 digits
        const sortedChapters = sortChaptersByLast4Digits(chaps);
        setChapters(sortedChapters || []);
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
            .eq("volume_id", vols[0].id);
          
          // Sort chapters by last 4 digits
          const sortedChapters = sortChaptersByLast4Digits(chaps);
          setChapters(sortedChapters || []);
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
        .eq("volume_id", selectedVolume);
      
      // Sort chapters by last 4 digits
      const sortedChapters = sortChaptersByLast4Digits(data);
      setChapters(sortedChapters || []);
      
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