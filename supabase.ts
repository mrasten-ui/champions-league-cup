import { createClient } from '@supabase/supabase-js';

// --- DATABASE TYPES ---
// These interfaces tell TypeScript exactly what your database looks like.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          email: string
          name: string
          avatar: string
          tokens: number
          substitutions: number
          unlocked_matches: string[] | null
          has_taken_second_chance: boolean
          spied_matches: string[] | null
          favorites: string[] | null
          leagues: string[] | null
          created_at?: string
        }
        Insert: {
          email: string
          name: string
          avatar?: string
          tokens?: number
          substitutions?: number
          unlocked_matches?: string[] | null
          has_taken_second_chance?: boolean
          spied_matches?: string[] | null
          favorites?: string[] | null
          leagues?: string[] | null
          created_at?: string
        }
        Update: {
          email?: string
          name?: string
          avatar?: string
          tokens?: number
          substitutions?: number
          unlocked_matches?: string[] | null
          has_taken_second_chance?: boolean
          spied_matches?: string[] | null
          favorites?: string[] | null
          leagues?: string[] | null
          created_at?: string
        }
      }
      predictions: {
        Row: {
          user_id: string
          match_id: string
          home: number
          away: number
          timestamp?: string
        }
        Insert: {
          user_id: string
          match_id: string
          home: number
          away: number
          timestamp?: string
        }
        Update: {
          user_id?: string
          match_id?: string
          home?: number
          away?: number
          timestamp?: string
        }
      }
      matches: {
        Row: {
          id: string
          home_score: number | null
          away_score: number | null
          status: string
          date?: string
          venue?: string
        }
        Insert: {
          id: string
          home_score?: number | null
          away_score?: number | null
          status?: string
          date?: string
          venue?: string
        }
        Update: {
          id?: string
          home_score?: number | null
          away_score?: number | null
          status?: string
          date?: string
          venue?: string
        }
      }
      head_to_head: {
        Row: {
          id: number
          team_a: string
          team_b: string
          score_a: number
          score_b: number
          year: number
          competition?: string
        }
        Insert: {
          team_a: string
          team_b: string
          score_a: number
          score_b: number
          year: number
          competition?: string
        }
      }
      scouting_reports: {
        Row: {
          id: number
          team_id: string
          lang: string
          strengths: string
          weaknesses: string
          star_player: string
        }
        Insert: {
          team_id: string
          lang: string
          strengths: string
          weaknesses: string
          star_player: string
        }
      }
      team_form_data: {
        Row: {
          id: number
          team_id: string
          fifa_rank: number
          match_date: string
          opponent: string
          result: string
          score: string
        }
        Insert: {
          team_id: string
          fifa_rank: number
          match_date: string
          opponent: string
          result: string
          score: string
        }
      }
    }
  }
}

// --- CLIENT CONFIGURATION ---
const env = (import.meta as any).env;
const supabaseUrl = env?.VITE_SUPABASE_URL || 'https://xxlfbpykiyncoifpzzvx.supabase.co'; 
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4bGZicHlraXluY29pZnB6enZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MjIzMTUsImV4cCI6MjA4MjQ5ODMxNX0.gwC6PmBBZ4x8Vgoe4oOtsqakwqZ5xQPBWY8OdUevthE';

const isValidKey = supabaseAnonKey && supabaseAnonKey.startsWith('ey');
export const isSupabaseConfigured = supabaseUrl !== '' && isValidKey;

export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;