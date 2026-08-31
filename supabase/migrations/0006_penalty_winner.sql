-- Records the real penalty-shootout winner for a knockout match/tie that was
-- level at the final whistle (90/120 min) and was actually decided on
-- penalties. home_score/away_score stay the pre-penalties football score —
-- this column is the separate source of truth for who actually advanced,
-- used by calculatePoints (outcome-tier credit for the correct winner) and
-- calculatePenaltyBonus (the +4/-1 did-it-go-to-pens bonus/malus).
--
-- NOT applied automatically. Run via `supabase db push` or the Supabase SQL
-- editor whenever you're ready.

alter table public.matches add column if not exists penalty_winner_id text;
