-- Initial schema for the Champions League Cup Supabase project.
--
-- Reverse-engineered from every supabase.from('...') call across the app,
-- hooks, services, components, edge functions, and scripts — not just
-- supabase.ts's Database type, which had already drifted from reality
-- (missing predicted_winner_id, bracket_predictions, sc_draft, minute_extra,
-- and the settings/match_lineups/match_stats/player_match_stats/team_content
-- tables entirely).
--
-- Tables are created in the PRE-0001 shape (e.g. matches still has group_id,
-- not yet matchday) so that 0001_swiss_format.sql -> 0002_matchday_column.sql
-- -> 0003_risk_profile.sql apply cleanly on top, in order, after this one.
--
-- NOT applied automatically — run this before the other three, via
-- `supabase db push` or the Supabase SQL editor.

-- ============================================================================
-- Tables
-- ============================================================================

create table public.teams (
  id text primary key,
  name text,
  flag text,
  rank integer,
  rating integer,
  att integer,
  mid integer,
  def integer,
  overview text,
  iso_code text,
  region text,
  elo_rating integer
);

create table public.matches (
  id text primary key,
  date text,
  venue text,
  group_id text,
  round text,
  home_team_id text,
  away_team_id text,
  home_score integer,
  away_score integer,
  status text,
  is_locked boolean default false,
  api_id text,
  next_match_id text,
  channels jsonb,
  minute integer,
  minute_extra integer
);

create table public.profiles (
  email text primary key,
  id uuid unique,
  name text,
  avatar text,
  tokens integer default 0,
  substitutions integer default 0,
  favorites text[] default '{}',
  leagues text[] default '{}',
  spied_matches text[] default '{}',
  unlocked_matches text[] default '{}',
  has_taken_second_chance boolean default false,
  second_chance_status text default 'NONE',
  is_admin boolean default false,
  bracket_predictions jsonb,
  sc_draft jsonb,
  tours_completed jsonb,
  created_at timestamptz default now()
);

create table public.predictions (
  id bigserial primary key,
  user_id text not null,
  match_id text not null,
  home integer,
  away integer,
  predicted_winner_id text,
  auto_filled boolean default false,
  created_at timestamptz default now(),
  unique (user_id, match_id)
);

create table public.head_to_head (
  id bigserial primary key,
  team_a text,
  team_b text,
  score_a integer,
  score_b integer,
  year integer,
  competition text,
  created_at timestamptz default now()
);

create table public.match_events (
  id bigserial primary key,
  match_id text,
  api_event_id text,
  minute integer,
  minute_extra integer,
  type text,
  detail text,
  team_id text,
  player text,
  player_id integer,
  assist text,
  created_at timestamptz default now()
);

create table public.match_lineups (
  id bigserial primary key,
  match_id text,
  team_id text,
  player_name text,
  player_id integer,
  player_number integer,
  position text,
  grid text,
  is_starting boolean default false,
  formation text,
  kit_bg text,
  kit_text text
);

create table public.match_stats (
  match_id text primary key,
  home_xg numeric,
  away_xg numeric,
  home_shots integer,
  away_shots integer,
  home_shots_on_target integer,
  away_shots_on_target integer,
  home_possession integer,
  away_possession integer,
  home_corners integer,
  away_corners integer,
  home_fouls integer,
  away_fouls integer,
  home_yellow integer,
  away_yellow integer,
  home_red integer,
  away_red integer,
  home_offsides integer,
  away_offsides integer
);

create table public.player_match_stats (
  id bigserial primary key,
  match_id text,
  player_id integer,
  player_name text,
  team_id text,
  minutes integer,
  rating numeric,
  goals integer default 0,
  assists integer default 0,
  shots_total integer,
  shots_on integer,
  passes_total integer,
  passes_key integer,
  pass_accuracy integer,
  tackles integer,
  dribbles_success integer,
  dribbles_attempts integer,
  fouls_committed integer,
  fouls_drawn integer,
  yellow_cards integer default 0,
  red_cards integer default 0
);

create table public.scouting_overview (
  id bigserial primary key,
  team_id text,
  team_name text,
  confederation text,
  fifa_rank integer,
  star_player text,
  strengths text,
  weaknesses text,
  scout_notes text,
  recent_form text,
  last_5_matches text,
  created_at timestamptz default now()
);

create table public.scouting_reports (
  team_id text not null,
  lang text not null,
  strengths text,
  weaknesses text,
  star_player text,
  primary key (team_id, lang)
);

create table public.team_form_data (
  id bigserial primary key,
  team_id text,
  team_name text,
  fifa_rank integer,
  match_date text,
  opponent text,
  score text,
  result text,
  competition text,
  last_updated timestamptz default now()
);

create table public.team_tactics (
  team_id text primary key,
  style text,
  att integer,
  mid integer,
  def integer,
  pace integer,
  phys integer,
  tech integer,
  key_player_role text,
  narrative jsonb
);

create table public.team_content (
  team_id text not null,
  language_code text not null,
  voice_persona text not null,
  star_player text,
  strengths text,
  weaknesses text,
  overview text,
  primary key (team_id, language_code, voice_persona)
);

create table public.settings (
  key text primary key,
  value jsonb
);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.teams enable row level security;
alter table public.matches enable row level security;
alter table public.profiles enable row level security;
alter table public.predictions enable row level security;
alter table public.head_to_head enable row level security;
alter table public.match_events enable row level security;
alter table public.match_lineups enable row level security;
alter table public.match_stats enable row level security;
alter table public.player_match_stats enable row level security;
alter table public.scouting_overview enable row level security;
alter table public.scouting_reports enable row level security;
alter table public.team_form_data enable row level security;
alter table public.team_tactics enable row level security;
alter table public.team_content enable row level security;
alter table public.settings enable row level security;

-- Reusable admin check. security definer so it can read profiles regardless
-- of the calling request's own row visibility.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where email = auth.jwt() ->> 'email' and is_admin = true
  );
$$;

-- Public read on every game-data table — standings/leaderboards/rival picks
-- are shown to everyone in the app today.
create policy "public read" on public.teams for select using (true);
create policy "public read" on public.matches for select using (true);
create policy "public read" on public.profiles for select using (true);
create policy "public read" on public.predictions for select using (true);
create policy "public read" on public.head_to_head for select using (true);
create policy "public read" on public.match_events for select using (true);
create policy "public read" on public.match_lineups for select using (true);
create policy "public read" on public.match_stats for select using (true);
create policy "public read" on public.player_match_stats for select using (true);
create policy "public read" on public.scouting_overview for select using (true);
create policy "public read" on public.scouting_reports for select using (true);
create policy "public read" on public.team_form_data for select using (true);
create policy "public read" on public.team_tactics for select using (true);
create policy "public read" on public.team_content for select using (true);
create policy "public read" on public.settings for select using (true);

-- No client-side write policy on the remaining game-data tables — only the
-- service-role key (scripts, edge functions) can write to them; RLS
-- default-denies anything without an explicit permissive policy.

-- matches / settings: admin-only client writes — keeps DebugTools' admin
-- panel (onUpdateMatchChannels, onBulkUpdateChannels, league_langs /
-- late_joiner_cutoff) working from the browser.
create policy "admin insert" on public.matches for insert with check (public.is_admin());
create policy "admin update" on public.matches for update using (public.is_admin());
create policy "admin delete" on public.matches for delete using (public.is_admin());
create policy "admin insert" on public.settings for insert with check (public.is_admin());
create policy "admin update" on public.settings for update using (public.is_admin());
create policy "admin delete" on public.settings for delete using (public.is_admin());

-- profiles: your own row, or an admin acting on someone else's (covers
-- onToggleAdmin/onRenameUser/onUpdateUserLeagues/onDeleteUser).
create policy "own row insert" on public.profiles for insert
  with check (auth.jwt() ->> 'email' = email or public.is_admin());
create policy "own row update" on public.profiles for update
  using (auth.jwt() ->> 'email' = email or public.is_admin());
create policy "admin delete" on public.profiles for delete using (public.is_admin());

-- Blocks a non-admin from granting themselves admin through the "own row
-- update" policy above — silently keeps is_admin unchanged unless the
-- requester is already an admin.
create or replace function public.prevent_self_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_admin_escalation
  before update on public.profiles
  for each row execute function public.prevent_self_admin_escalation();

-- predictions: your own rows, or an admin (covers the DebugTools bulk-fill tool).
create policy "own rows insert" on public.predictions for insert
  with check (auth.jwt() ->> 'email' = user_id or public.is_admin());
create policy "own rows update" on public.predictions for update
  using (auth.jwt() ->> 'email' = user_id or public.is_admin());
create policy "own rows delete" on public.predictions for delete
  using (auth.jwt() ->> 'email' = user_id or public.is_admin());

-- ============================================================================
-- Storage: avatars bucket
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars public read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars authenticated write" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "avatars authenticated update" on storage.objects for update
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');
