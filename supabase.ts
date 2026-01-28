import { createClient } from '@supabase/supabase-js';

// --- DATABASE TYPES ---
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ... (Keep your existing Database interface here) ...
export interface Database {
  public: {
    Tables: {
        // ... keep existing tables ...
        profiles: { Row: {}, Insert: {}, Update: {} } // (simplified for brevity)
    };
  };
}

// --- CLIENT CONFIGURATION & DEBUG ---
const env = (import.meta as any).env;

// 1. Load keys
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// 2. DEBUG LOGGING (Check your browser console!)
console.log("--- SUPABASE DEBUG ---");
console.log("URL Exists?", !!supabaseUrl);
console.log("URL Value:", supabaseUrl); // Safe to log URL
console.log("Key Exists?", !!supabaseAnonKey);
console.log("Key Start:", supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + "..." : "MISSING");
console.log("All Env Keys:", Object.keys(env).filter(k => k.startsWith('VITE_')));
console.log("----------------------");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ Supabase Credentials Missing! Check your .env file.");
}

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient<any>(supabaseUrl, supabaseAnonKey)
  : null as any;