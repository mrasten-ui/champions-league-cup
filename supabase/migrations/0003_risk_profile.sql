-- Adds a persistent per-user risk profile (set at signup) and a marker for
-- predictions the missed-deadline auto-fill job generates on a user's behalf.
--
-- NOT applied automatically. Run via `supabase db push` or the Supabase SQL
-- editor whenever you're ready — safe to run any time, independent of any
-- app deploy. Both new profiles columns are nullable with no default: null
-- means "never set a risk profile," which scripts/auto-fill-missed-predictions.js
-- treats as "leave this user alone."

alter table public.profiles add column if not exists risk_result numeric;
alter table public.profiles add column if not exists risk_scoring numeric;
alter table public.predictions add column if not exists auto_filled boolean default false;
