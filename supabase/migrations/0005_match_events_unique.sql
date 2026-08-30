-- Adds the unique constraint that scripts/sync-scores.js and the new
-- scripts/sync-scores-uefa.mjs both rely on for
-- `upsert(rows, { onConflict: 'match_id,api_event_id' })` to dedupe goals/
-- cards/VAR events across repeated polls. Without it, Postgres rejects the
-- upsert outright: "there is no unique or exclusion constraint matching the
-- ON CONFLICT specification" — this was never applied, so every event sync
-- has been failing silently (script logs a caught error and moves on).
--
-- NOT applied automatically. Run via `supabase db push` or the Supabase SQL
-- editor. Safe to run any time — if duplicate (match_id, api_event_id) rows
-- already exist from a partially-working sync, the ADD CONSTRAINT will fail
-- with a clear "could not create unique index" error naming the dupes; the
-- DELETE below removes exact duplicate rows (keeping the lowest id) so it
-- can be re-run before retrying.

delete from public.match_events a using public.match_events b
where a.id > b.id
  and a.match_id = b.match_id
  and a.api_event_id = b.api_event_id;

alter table public.match_events
  add constraint match_events_match_id_api_event_id_key unique (match_id, api_event_id);
