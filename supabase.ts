import { createClient } from '@supabase/supabase-js';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      head_to_head: {
        Row: { id: number; team_a: string | null; team_b: string | null; score_a: number | null; score_b: number | null; year: number | null; competition: string | null; created_at: string | null; };
        Insert: { id?: number; team_a?: string | null; team_b?: string | null; score_a?: number | null; score_b?: number | null; year?: number | null; competition?: string | null; created_at?: string | null; };
        Update: { id?: number; team_a?: string | null; team_b?: string | null; score_a?: number | null; score_b?: number | null; year?: number | null; competition?: string | null; created_at?: string | null; };
      };
      match_events: {
        Row: { id: number; match_id: string | null; api_event_id: string | null; minute: number | null; minute_extra: number | null; type: string | null; detail: string | null; team_id: string | null; player: string | null; assist: string | null; created_at: string | null; };
        Insert: { id?: number; match_id?: string | null; api_event_id?: string | null; minute?: number | null; minute_extra?: number | null; type?: string | null; detail?: string | null; team_id?: string | null; player?: string | null; assist?: string | null; created_at?: string | null; };
        Update: { id?: number; match_id?: string | null; api_event_id?: string | null; minute?: number | null; minute_extra?: number | null; type?: string | null; detail?: string | null; team_id?: string | null; player?: string | null; assist?: string | null; created_at?: string | null; };
      };
      matches: {
        Row: { id: string; date: string | null; venue: string | null; group_id: string | null; round: string | null; home_team_id: string | null; away_team_id: string | null; home_score: number | null; away_score: number | null; status: string | null; is_locked: boolean | null; api_id: string | null; next_match_id: string | null; channels: Json | null; minute: number | null; };
        Insert: { id: string; date?: string | null; venue?: string | null; group_id?: string | null; round?: string | null; home_team_id?: string | null; away_team_id?: string | null; home_score?: number | null; away_score?: number | null; status?: string | null; is_locked?: boolean | null; api_id?: string | null; next_match_id?: string | null; channels?: Json | null; minute?: number | null; };
        Update: { id?: string; date?: string | null; venue?: string | null; group_id?: string | null; round?: string | null; home_team_id?: string | null; away_team_id?: string | null; home_score?: number | null; away_score?: number | null; status?: string | null; is_locked?: boolean | null; api_id?: string | null; next_match_id?: string | null; channels?: Json | null; minute?: number | null; };
      };
      predictions: {
        Row: { id: number; user_id: string | null; match_id: string | null; home: number | null; away: number | null; created_at: string | null; };
        Insert: { id?: number; user_id?: string | null; match_id?: string | null; home?: number | null; away?: number | null; created_at?: string | null; };
        Update: { id?: number; user_id?: string | null; match_id?: string | null; home?: number | null; away?: number | null; created_at?: string | null; };
      };
      profiles: {
        Row: { email: string; name: string | null; avatar: string | null; tokens: number | null; favorites: string[] | null; leagues: string[] | null; spied_matches: string[] | null; has_taken_second_chance: boolean | null; second_chance_status: string | null; is_admin: boolean | null; created_at: string | null; id: string; substitutions: number | null; unlocked_matches: string[] | null; tours_completed: Json | null; };
        Insert: { email: string; name?: string | null; avatar?: string | null; tokens?: number | null; favorites?: string[] | null; leagues?: string[] | null; spied_matches?: string[] | null; has_taken_second_chance?: boolean | null; second_chance_status?: string | null; is_admin?: boolean | null; created_at?: string | null; id?: string; substitutions?: number | null; unlocked_matches?: string[] | null; tours_completed?: Json | null; };
        Update: { email?: string; name?: string | null; avatar?: string | null; tokens?: number | null; favorites?: string[] | null; leagues?: string[] | null; spied_matches?: string[] | null; has_taken_second_chance?: boolean | null; second_chance_status?: string | null; is_admin?: boolean | null; created_at?: string | null; id?: string; substitutions?: number | null; unlocked_matches?: string[] | null; tours_completed?: Json | null; };
      };
      scouting_overview: {
        Row: { team_id: string | null; team_name: string | null; confederation: string | null; fifa_rank: number | null; star_player: string | null; strengths: string | null; weaknesses: string | null; scout_notes: string | null; recent_form: string | null; last_5_matches: string | null; created_at: string | null; id: number; };
        Insert: { team_id?: string | null; team_name?: string | null; confederation?: string | null; fifa_rank?: number | null; star_player?: string | null; strengths?: string | null; weaknesses?: string | null; scout_notes?: string | null; recent_form?: string | null; last_5_matches?: string | null; created_at?: string | null; id?: number; };
        Update: { team_id?: string | null; team_name?: string | null; confederation?: string | null; fifa_rank?: number | null; star_player?: string | null; strengths?: string | null; weaknesses?: string | null; scout_notes?: string | null; recent_form?: string | null; last_5_matches?: string | null; created_at?: string | null; id?: number; };
      };
      scouting_reports: {
        Row: { team_id: string | null; lang: string | null; strengths: string | null; weaknesses: string | null; star_player: string | null; };
        Insert: { team_id?: string | null; lang?: string | null; strengths?: string | null; weaknesses?: string | null; star_player?: string | null; };
        Update: { team_id?: string | null; lang?: string | null; strengths?: string | null; weaknesses?: string | null; star_player?: string | null; };
      };
      team_form_data: {
        Row: { id: number; team_id: string | null; team_name: string | null; fifa_rank: number | null; match_date: string | null; opponent: string | null; score: string | null; result: string | null; competition: string | null; last_updated: string | null; };
        Insert: { id?: number; team_id?: string | null; team_name?: string | null; fifa_rank?: number | null; match_date?: string | null; opponent?: string | null; score?: string | null; result?: string | null; competition?: string | null; last_updated?: string | null; };
        Update: { id?: number; team_id?: string | null; team_name?: string | null; fifa_rank?: number | null; match_date?: string | null; opponent?: string | null; score?: string | null; result?: string | null; competition?: string | null; last_updated?: string | null; };
      };
      team_tactics: {
        Row: { team_id: string | null; style: string | null; att: number | null; mid: number | null; def: number | null; pace: number | null; phys: number | null; tech: number | null; key_player_role: string | null; narrative: Json | null; };
        Insert: { team_id?: string | null; style?: string | null; att?: number | null; mid?: number | null; def?: number | null; pace?: number | null; phys?: number | null; tech?: number | null; key_player_role?: string | null; narrative?: Json | null; };
        Update: { team_id?: string | null; style?: string | null; att?: number | null; mid?: number | null; def?: number | null; pace?: number | null; phys?: number | null; tech?: number | null; key_player_role?: string | null; narrative?: Json | null; };
      };
      teams: {
        Row: { id: string; name: string | null; flag: string | null; rank: number | null; rating: number | null; att: number | null; mid: number | null; def: number | null; overview: string | null; group_letter: string | null; iso_code: string | null; region: string | null; elo_rating: number | null; };
        Insert: { id: string; name?: string | null; flag?: string | null; rank?: number | null; rating?: number | null; att?: number | null; mid?: number | null; def?: number | null; overview?: string | null; group_letter?: string | null; iso_code?: string | null; region?: string | null; elo_rating?: number | null; };
        Update: { id?: string; name?: string | null; flag?: string | null; rank?: number | null; rating?: number | null; att?: number | null; mid?: number | null; def?: number | null; overview?: string | null; group_letter?: string | null; iso_code?: string | null; region?: string | null; elo_rating?: number | null; };
      };
      worldcup2026_schedule: {
        Row: { matchid: number | null; matchdate: string | null; time_uk: string | null; stage: string | null; hometeam: string | null; awayteam: string | null; channel_uk_england: string | null; channel_uk_scotland: string | null; channel_norway: string | null; channel_us: string | null; };
        Insert: { matchid?: number | null; matchdate?: string | null; time_uk?: string | null; stage?: string | null; hometeam?: string | null; awayteam?: string | null; channel_uk_england?: string | null; channel_uk_scotland?: string | null; channel_norway?: string | null; channel_us?: string | null; };
        Update: { matchid?: number | null; matchdate?: string | null; time_uk?: string | null; stage?: string | null; hometeam?: string | null; awayteam?: string | null; channel_uk_england?: string | null; channel_uk_scotland?: string | null; channel_norway?: string | null; channel_us?: string | null; };
      };
    };
  };
}

const env = (import.meta as any).env;

// NO HARDCODED FALLBACKS. If env vars fail, we fail loud and clear.
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL ERROR: Supabase Environment Variables are missing!");
}

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null as any;