-- Captures which two teams a prediction was actually made against, at the
-- moment it was saved. Previously predictions only stored match_id + a score,
-- so team identity was resolved by joining match_id -> matches.home_team_id /
-- away_team_id at READ time — meaning if a match's fixture ever got
-- reassigned later (reseed, data correction, a placeholder pairing getting
-- replaced by the real draw) while keeping the same match_id, every existing
-- prediction for it would silently be reinterpreted as applying to the new
-- teams. Denormalizing the team ids onto the prediction row itself makes a
-- prediction self-describing and immune to that drift.
--
-- NOT applied automatically. Run via `supabase db push` or the Supabase SQL
-- editor whenever you're ready. Safe to run any time — the predictions table
-- is currently empty, so no backfill is needed; both columns are nullable so
-- this doesn't break any in-flight code that hasn't been updated yet.

alter table public.predictions add column if not exists home_team_id text;
alter table public.predictions add column if not exists away_team_id text;
