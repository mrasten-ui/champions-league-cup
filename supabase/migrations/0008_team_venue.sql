-- Dedicated stadium-name column, separate from the combined `overview` text
-- (country/founded/venue bundled together) that seed-team-data.mjs already
-- writes. Lets the UI show just the venue name (e.g. in the match row's
-- kickoff line) without parsing it back out of that combined string.
--
-- NOT applied automatically. Run via `supabase db push` or the Supabase SQL
-- editor before running scripts/seed-team-data.mjs.

alter table public.teams add column if not exists venue text;
