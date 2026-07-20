-- Adds the League Phase matchday number (1-8) to matches, so the UI can show
-- "League Phase - Matchday X" instead of falling back to venue/"FRIENDLY".
--
-- NOT applied automatically. Run via `supabase db push` or the Supabase SQL
-- editor whenever you're ready — safe to run any time, independent of any
-- app deploy (the column is optional/nullable; the app already handles it
-- being absent by falling back to showing the venue).

alter table public.matches add column if not exists matchday smallint;
