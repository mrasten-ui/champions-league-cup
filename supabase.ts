import { createClient } from '@supabase/supabase-js';

// --- DATABASE TYPES ---
// (Keeping your existing types exactly as they were)
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          email: string;
          name: string;
          avatar: string;
          tokens: number;
          substitutions: number;
          unlocked_matches: string[] | null;
          has_taken_second_chance: boolean;
          spied_matches: string[] | null;
          favorites: string[] | null;
          leagues: string[] | null;
          created_at?: string;
        };
        Insert: {
          email: string;
          name: string;
          avatar?: string;
          tokens?: number;
          substitutions?: number;
          unlocked_matches?: string[] | null;
          has_taken_second_chance?: boolean;
          spied_matches?: string[] | null;
          favorites?: string[] | null;
          leagues?: string[] | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          name?: string;
          avatar?: string;
          tokens?: number;
          substitutions?: number;
          unlocked_matches?: string[] | null;
          has_taken_second_chance?: boolean;
          spied_matches?: string[] | null;
          favorites?: string[] | null;
          leagues?: string[] | null;
          created_at?: string;
        };
      };
      predictions: {
        Row: {
          user_id: string;
          match_id: string;
          home: number;
          away: number;
          timestamp?: string;
        };
        Insert: {
          user_id: string;
          match_id: string;
          home: number;
          away: number;
          timestamp?: string;
        };
        Update: {
          user_id?: string;
          match_id?: string;
          home?: number;
          away?: number;
          timestamp?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          home_score: number | null;
          away_score: number | null;
          status: string;
          date?: string;
          venue?: string;
        };
        Insert: {
          id: string;
          home_score?: number | null;
          away_score?: number | null;
          status?: string;
          date?: string;
          venue?: string;
        };
        Update: {
          id?: string;
          home_score?: number | null;
          away_score?: number | null;
          status?: string;
          date?: string;
          venue?: string;
        };
      };
      head_to_head: {
        Row: {
          id: number;
          team_a: string;
          team_b: string;
          score_a: number;
          score_b: number;
          year: number;
          competition?: string;
        };
        Insert: {
          team_a: string;
          team_b: string;
          score_a: number;
          score_b: number;
          year: number;
          competition?: string;
        };
        Update: {
          id?: number;
          team_a?: string;
          team_b?: string;
          score_a?: number;
          score_b?: number;
          year?: number;
          competition?: string;
        };
      };
      scouting_reports: {
        Row: {
          id: number;
          team_id: string;
          lang: string;
          strengths: string;
          weaknesses: string;
          star_player: string;
        };
        Insert: {
          team_id: string;
          lang: string;
          strengths: string;
          weaknesses: string;
          star_player: string;
        };
        Update: {
          team_id?: string;
          lang?: string;
          strengths?: string;
          weaknesses?: string;
          star_player?: string;
        };
      };
      team_form_data: {
        Row: {
          id: number;
          team_id: string;
          fifa_rank: number;
          match_date: string;
          opponent: string;
          result: string;
          score: string;
        };
        Insert: {
          team_id: string;
          fifa_rank: number;
          match_date: string;
          opponent: string;
          result: string;
          score: string;
        };
        Update: {
          team_id?: string;
          fifa_rank?: number;
          match_date?: string;
          opponent?: string;
          result?: string;
          score?: string;
        };
      };
    };
  };
}

// --- CLIENT CONFIGURATION ---
const env = (import.meta as any).env;

// 1. Load strictly from Environment Variables
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// 2. Validate configuration (Fail fast if missing)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ Supabase Credentials Missing! Check your .env file.");
  console.error("Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY");
}

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// 3. Initialize Client
// We cast to 'any' for the export to prevent strict TypeScript errors if the client fails to init
export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null as any;