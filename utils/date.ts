import { Match } from '../types';

/** Returns "YYYY-MM-DD" in UTC — safe date bucket key across all timezones */
export const utcDay = (d: string | Date): string =>
  (typeof d === 'string' ? new Date(d) : d).toISOString().slice(0, 10);

/** Predictions lock this long before kickoff. */
export const LOCK_WINDOW_MS = 60 * 60 * 1000;

/**
 * Single source of truth for "can this match still be predicted".
 * Order matters: an admin hard-lock (postponements, corrections) always wins,
 * then real-world match state, then the rolling 1-hour-before-kickoff window.
 */
export const isMatchLocked = (
  match: Pick<Match, 'date' | 'isLocked' | 'status'>,
  now: number = Date.now()
): boolean => {
  if (match.isLocked) return true;
  if (!['UPCOMING', 'NS'].includes(match.status)) return true;
  if (!match.date || match.date === 'TBD') return false;
  const kickoff = new Date(match.date).getTime();
  if (isNaN(kickoff)) return false;
  return now >= kickoff - LOCK_WINDOW_MS;
};

/**
 * Milliseconds until this match's rolling lock takes effect.
 * Returns null when there's no kickoff time to count down to, or the match
 * is already locked by something other than the rolling window (admin lock /
 * live / finished) — callers should check isMatchLocked first for those.
 */
export const msUntilLock = (
  match: Pick<Match, 'date'>,
  now: number = Date.now()
): number | null => {
  if (!match.date || match.date === 'TBD') return null;
  const kickoff = new Date(match.date).getTime();
  if (isNaN(kickoff)) return null;
  return kickoff - LOCK_WINDOW_MS - now;
};
