-- Champions League Swiss-format refactor: drop dead World Cup tables/columns.
--
-- NOT applied automatically. Run via `supabase db push` or the Supabase SQL
-- editor once you're ready — this is a destructive change on live data.
--
-- matches.group_id is intentionally NOT dropped here: Leaderboard, ManagerHub,
-- MyPredictions, and the World Cup final-recap feature still read it to render
-- the (concluded) World Cup tournament's historical group-stage data correctly.
-- It simply won't be populated for new League Phase matches going forward.
-- Drop it in a later migration once those legacy display components are
-- migrated off the group-stage functions in services/engine.ts.

alter table public.teams drop column if exists group_letter;
drop table if exists public.worldcup2026_schedule;
