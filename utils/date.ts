import { Match } from '../types';

/** Returns "YYYY-MM-DD" in UTC — safe date bucket key across all timezones */
export const utcDay = (d: string | Date): string =>
  (typeof d === 'string' ? new Date(d) : d).toISOString().slice(0, 10);

/**
 * Whether two matches belong to the same round: matchday number for the
 * League Phase (round undefined), round code for knockout ties.
 */
export const sameRound = (
  a: Pick<Match, 'round' | 'matchday'>,
  b: Pick<Match, 'round' | 'matchday'>
): boolean => (a.round ? a.round === b.round : !b.round && a.matchday === b.matchday);

/**
 * The single moment an entire round locks: the earliest kickoff among the
 * matches passed in. Predictions for every match in a round stay open right
 * up until this moment — no earlier, no per-match buffer — then the whole
 * round locks together. Pass in just the matches belonging to one round
 * (e.g. via `sameRound`); returns null if none have a real kickoff time yet.
 */
export const getRoundLockTime = (roundMatches: Pick<Match, 'date'>[]): number | null => {
  const kickoffs = roundMatches
    .map(m => (m.date && m.date !== 'TBD' ? new Date(m.date).getTime() : NaN))
    .filter(t => !isNaN(t));
  return kickoffs.length ? Math.min(...kickoffs) : null;
};

/**
 * Single source of truth for "can this match still be predicted". Order
 * matters: an admin hard-lock (postponements, corrections) always wins, then
 * real-world match state, then the round's shared lock time (see
 * getRoundLockTime) — every match in a round locks together at the round's
 * first kickoff, not on its own individual kickoff.
 */
export const isMatchLocked = (
  match: Pick<Match, 'isLocked' | 'status'>,
  roundLockTime: number | null,
  now: number = Date.now()
): boolean => {
  if (match.isLocked) return true;
  if (!['UPCOMING', 'NS'].includes(match.status)) return true;
  if (roundLockTime === null) return false;
  return now >= roundLockTime;
};

/**
 * Milliseconds until the round locks. Returns null when there's no round
 * lock time to count down to, or the match is already locked by something
 * other than the round clock (admin lock / live / finished) — callers should
 * check isMatchLocked first for those.
 */
export const msUntilLock = (
  roundLockTime: number | null,
  now: number = Date.now()
): number | null => {
  if (roundLockTime === null) return null;
  return roundLockTime - now;
};
