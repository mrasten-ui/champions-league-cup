
import { createClient } from '@supabase/supabase-js';

/**
 * PROJECT CONFIGURATION
 * Connected to Project ID: xxlfbpykiyncoifpzzvx
 */

// VITE USES import.meta.env, NOT process.env
// We use optional chaining (?.) to prevent crashes if env is undefined during certain build/preview states
const env = (import.meta as any).env;
const supabaseUrl = env?.VITE_SUPABASE_URL || 'https://xxlfbpykiyncoifpzzvx.supabase.co'; 
// Updated with the provided public anon key
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bGZicHlraXluY29pZnB6enZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MjIzMTUsImV4cCI6MjA4MjQ5ODMxNX0.gwC6PmBBZ4x8Vgoe4oOtsqakwqZ5xQPBWY8OdUevthE';

// VALIDATION: Ensure key is a valid JWT (starts with 'ey') and URL is present.
// This prevents the app from crashing if the user hasn't set up valid credentials yet.
const isValidKey = supabaseAnonKey && supabaseAnonKey.startsWith('ey');

export const isSupabaseConfigured = supabaseUrl !== '' && isValidKey;

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
