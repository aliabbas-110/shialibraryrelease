// src/contexts/AuthContext.jsx - SIMPLIFIED VERSION
import { createContext, useContext, useEffect, useState } from 'react';
import { supabaseAPI1 } from '../config/supabaseClient.js';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabaseAPI1.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabaseAPI1.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  // Sign up with email and password (SIMPLIFIED)
  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabaseAPI1.auth.signUp({
        email,
        password
      });
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabaseAPI1.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error.message };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabaseAPI1.auth.signOut();
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  };

  // Save a hadith
  const saveHadith = async (hadithId) => {
    if (!user) {
      return { error: 'You must be logged in to save hadiths' };
    }
    
    try {
      const { data, error } = await supabaseAPI1
        .from('saved_hadiths')
        .insert({
          user_id: user.id,
          hadith_id: hadithId
        })
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          return { error: 'This hadith is already saved' };
        }
        return { error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      return { error: error.message };
    }
  };

  // Remove saved hadith
  const removeSavedHadith = async (hadithId) => {
    if (!user) {
      return { error: 'You must be logged in to manage saved hadiths' };
    }
    
    try {
      const { error } = await supabaseAPI1
        .from('saved_hadiths')
        .delete()
        .eq('user_id', user.id)
        .eq('hadith_id', hadithId);
      
      if (error) {
        return { error: error.message };
      }
      
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  };

  // Check if hadith is saved
  const isHadithSaved = async (hadithId) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabaseAPI1
        .from('saved_hadiths')
        .select('id')
        .eq('user_id', user.id)
        .eq('hadith_id', hadithId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking saved status:', error);
        return false;
      }
      
      return !!data;
    } catch (error) {
      console.error('Error checking saved hadith:', error);
      return false;
    }
  };

  // Get saved hadiths
  const getSavedHadiths = async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabaseAPI1
        .from('saved_hadiths')
        .select(`
          id,
          created_at,
          hadith:hadith_id (
            id,
            hadith_number,
            arabic,
            english,
            chapters!inner (
              id,
              chapter_number,
              title_en,
              volumes!inner (
                id,
                volume_number,
                books!inner (
                  id,
                  title
                )
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching saved hadiths:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getSavedHadiths:', error);
      return [];
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    saveHadith,
    removeSavedHadith,
    isHadithSaved,
    getSavedHadiths
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};