// src/supabase.js - FOR VITE
import { createClient } from '@supabase/supabase-js'

// Vite uses import.meta.env, not process.env
const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_APP_SUPABASE_ANON_KEY;
const supabaseAPI = import.meta.env.VITE_APP_SUPABASE_API;

console.log('Supabase URL:', supabaseUrl); // For debugging

export const supabase = createClient(supabaseUrl, supabaseKey);
export const supabaseAPI1 = createClient(supabaseUrl, supabaseAPI);
