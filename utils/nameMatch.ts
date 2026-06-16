function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Matches a player name from match_events against a name from match_lineups.
 * Handles:
 *  - Diacritic differences: Pulišić ↔ Pulisic
 *  - Abbreviated first names: C. Pulisic ↔ Christian Pulisic
 * Safe against same-last-name collisions (D. Gómez ≠ G. Gómez).
 */
export function namesMatch(
  eventName: string | null | undefined,
  lineupName: string,
): boolean {
  if (!eventName) return false;
  const a = norm(eventName);
  const b = norm(lineupName);

  if (a === b) return true;

  const aParts = a.split(' ');
  const bParts = b.split(' ');
  if (aParts.length < 2 || bParts.length < 2) return false;

  const aLast = aParts.slice(1).join(' ');
  const bLast = bParts.slice(1).join(' ');
  if (aLast !== bLast) return false;

  // Last names match — require initial agreement to avoid same-surname collisions
  const aFirst = aParts[0].replace('.', '');
  const bFirst = bParts[0].replace('.', '');
  if (aFirst.length === 1) return bFirst.startsWith(aFirst);
  if (bFirst.length === 1) return aFirst.startsWith(bFirst);

  return false;
}

/**
 * Compacts a player name to "Initial. LastName" for tight display contexts
 * (e.g. substitution rows). Already-abbreviated names pass through unchanged;
 * single-word names (no last name) are returned as-is.
 */
export function abbreviateName(name: string | null | undefined): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name.trim();
  const first = parts[0].replace('.', '');
  const last = parts.slice(1).join(' ');
  return `${first.charAt(0).toUpperCase()}. ${last}`;
}
