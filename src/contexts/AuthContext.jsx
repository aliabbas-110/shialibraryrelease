// contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // SIGNUP FUNCTION - Using existing profiles table
  const signUp = async (email, password) => {
    try {
      // First, check if email exists in profiles table
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing profile:', checkError);
      }

      if (existingProfile) {
        return { 
          user: null, 
          error: 'Email already registered. Please use a different email or sign in.' 
        };
      }

      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/profile`,
          data: {
            email: email
          }
        }
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        
        let errorMessage = 'Failed to create account';
        
        if (authError.message.includes('already registered') || 
            authError.message.includes('User already registered') ||
            authError.message === 'User with this email already exists') {
          errorMessage = 'Email already registered. Please use a different email or sign in.';
        } else if (authError.message.includes('6 characters')) {
          errorMessage = 'Password must be at least 6 characters';
        } else if (authError.message.includes('Invalid email')) {
          errorMessage = 'Invalid email address';
        } else {
          errorMessage = authError.message || 'An error occurred during signup';
        }
        
        return { user: null, error: errorMessage };
      }

      // Create user profile in existing profiles table
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: email,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          
          // If profile creation fails but auth succeeded, still allow signup
          // but notify user about profile issue
          return { 
            user: authData.user, 
            error: 'Account created but profile setup failed. Please contact support.',
            session: authData.session 
          };
        }
      }

      return { 
        user: authData.user, 
        error: null,
        session: authData.session 
      };
    } catch (error) {
      console.error('Unexpected signup error:', error);
      return { 
        user: null, 
        error: 'An unexpected error occurred. Please try again.' 
      };
    }
  };

  // LOGIN FUNCTION
  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        let errorMessage = 'Failed to sign in';
        
        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = 'Invalid email or password';
            break;
          case 'Email not confirmed':
            errorMessage = 'Please confirm your email before signing in';
            break;
          case 'User not found':
            errorMessage = 'No account found with this email';
            break;
          default:
            errorMessage = error.message || 'An error occurred';
        }
        
        return { user: null, error: errorMessage };
      }

      return { user: data.user, error: null, session: data.session };
    } catch (error) {
      console.error('Login error:', error);
      return { user: null, error: 'An unexpected error occurred' };
    }
  };

  // LOGOUT FUNCTION
  const logout = async () => {
    try {
      const { error } = await supabase.auth.logout();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Get user profile data
  const getUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  };

  // Check current user on mount and auth changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Create profile if it doesn't exist (for existing users)
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (!existingProfile) {
            await supabase
              .from('profiles')
              .insert([
                {
                  id: session.user.id,
                  email: session.user.email,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ]);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    signUp,
    login,
    logout,
    getUserProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}