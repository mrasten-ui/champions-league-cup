-- scouting_overview has no unique constraint on team_id, so the
-- `.upsert(row, { onConflict: 'team_id' })` pattern already used by both
-- scripts/seed-team-data.mjs and scripts/generate-scouting-content.mjs fails
-- against the live DB with "no unique or exclusion constraint matching the
-- ON CONFLICT specification" (confirmed live on 2026-08-31 — the table is
-- currently empty, so this is a safe, non-destructive add).
--
-- NOT applied automatically. Run via `supabase db push` or the Supabase SQL
-- editor before running scripts/generate-scouting-content.mjs.

alter table public.scouting_overview add constraint scouting_overview_team_id_key unique (team_id);
