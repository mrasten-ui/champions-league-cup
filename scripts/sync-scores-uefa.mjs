// Live score + goal/card/VAR event sync for the real UEFA Champions League
// League Phase, pulled directly from UEFA's own public match-center API —
// the same free, no-key endpoints already used by pull-real-cl-2026.mjs for
// fixtures/crests. No API-Football key needed, no rate limit, no season
// restriction.
//
// UNVERIFIED UNTIL A REAL MATCH GOES LIVE: 'UPCOMING' and 'FINISHED' statuses
// are confirmed from real data (see mapStatus below), but the exact in-play
// status string(s) UEFA uses (LIVE? IN_PLAY? something else?) could not be
// tested before the 2026/27 season starts (2026-09-08). mapStatus() logs a
// warning and falls back to 'LIVE' for anything unrecognised — watch the
// [STATUS] log line the first time Round 1 kicks off and extend the map if
// UEFA uses a different string. Same caveat for whether a live-minute/clock
// field appears on in-play matches — none was visible on UPCOMING/FINISHED
// samples, so `minute` will likely stay null until that's confirmed too.
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const COMPETITION_ID = 1;   // UEFA Champions League
const SEASON_YEAR = 2027;   // UEFA's seasonYear param for the 2026/27 season
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://www.uefa.com/',
};

const LIVE_STATUSES = new Set(['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT']);
const KNOWN_STATUSES = new Set(['UPCOMING', 'FINISHED', ...LIVE_STATUSES]);

// Maps UEFA's status vocabulary onto ours (types.ts Match['status']).
// UPCOMING/FINISHED are confirmed from real fixture data; anything else is
// logged once and treated as LIVE so scores/events still flow while the
// exact string gets confirmed against a real match.
function mapStatus(uefaStatus) {
  if (uefaStatus === 'UPCOMING') return 'UPCOMING';
  if (uefaStatus === 'FINISHED') return 'FINISHED';
  if (!KNOWN_STATUSES.has(uefaStatus)) {
    console.warn(`[STATUS] Unrecognised UEFA status "${uefaStatus}" — treating as LIVE. Update mapStatus() in sync-scores-uefa.mjs.`);
  }
  return 'LIVE';
}

function utcDateStr(d) {
  return d.toISOString().slice(0, 10);
}

async function fetchUefaMatches(fromDate, toDate) {
  const url = `https://match.uefa.com/v5/matches?competitionId=${COMPETITION_ID}&fromDate=${fromDate}&toDate=${toDate}&seasonYear=${SEASON_YEAR}&limit=200&offset=0&order=ASC&phase=ALL&utcOffset=0`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`UEFA matches fetch failed: ${res.status}`);
  return res.json();
}

async function fetchUefaEvents(uefaMatchId, filter) {
  const url = `https://match.uefa.com/v5/matches/${uefaMatchId}/events?filter=${filter}&offset=0&limit=100&order=ASC`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function normPlayer(name) {
  return (name ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '_');
}

// Only surface VAR reviews that actually changed or confirmed something —
// skips the noisy SILENT_CHECK/OFFICIAL_REVIEW intermediate states.
// 'Goal Disallowed' is the one App.tsx explicitly checks for (goal-banner
// cancel logic); the rest are included for completeness in the events feed.
function varDetail(varInfo) {
  const { incident, status, result } = varInfo || {};
  if (status !== 'CHANGED' && status !== 'CONFIRMED') return null;
  if (incident === 'GOAL' && result === 'NO_GOAL') return 'Goal Disallowed';
  if (incident === 'PENALTY' && result === 'PENALTY') return 'Penalty Awarded';
  if (incident === 'PENALTY' && result === 'NO_PENALTY') return 'Penalty Overturned';
  if (incident === 'RED_CARD' && result === 'RED_CARD') return 'Red Card Given';
  if (incident === 'RED_CARD' && result === 'NO_RED_CARD') return 'Red Card Overturned';
  return null;
}

async function syncEventsForMatch(dbMatchId, uefaMatchId) {
  const [goals, cards, vars] = await Promise.all([
    fetchUefaEvents(uefaMatchId, 'GOALS'),
    fetchUefaEvents(uefaMatchId, 'CARDS'),
    fetchUefaEvents(uefaMatchId, 'VAR'),
  ]);

  const rows = [];

  for (const g of goals) {
    const teamCode = g.primaryActor?.team?.teamCode ?? null;
    const player = g.primaryActor?.person?.internationalName ?? null;
    rows.push({
      match_id: dbMatchId,
      api_event_id: `${dbMatchId}_${teamCode}_${g.time?.minute ?? 0}_${g.time?.second ?? 0}_Goal_${normPlayer(player)}`,
      minute: g.time?.minute ?? null,
      minute_extra: null,
      type: 'Goal',
      detail: 'Normal Goal',
      team_id: teamCode,
      player,
      player_id: g.primaryActor?.person?.id ? parseInt(g.primaryActor.person.id, 10) : null,
      assist: g.secondaryActor?.person?.internationalName ?? null,
    });
  }

  for (const c of cards) {
    const teamCode = c.primaryActor?.team?.teamCode ?? null;
    const player = c.primaryActor?.person?.internationalName ?? null;
    const detail = c.type === 'RED_CARD' ? 'Red Card'
      : c.type === 'SECOND_YELLOW_CARD' ? 'Second Yellow card'
      : 'Yellow Card';
    rows.push({
      match_id: dbMatchId,
      api_event_id: `${dbMatchId}_${teamCode}_${c.time?.minute ?? 0}_${c.time?.second ?? 0}_Card_${normPlayer(player)}`,
      minute: c.time?.minute ?? null,
      minute_extra: null,
      type: 'Card',
      detail,
      team_id: teamCode,
      player,
      player_id: c.primaryActor?.person?.id ? parseInt(c.primaryActor.person.id, 10) : null,
      assist: null,
    });
  }

  for (const v of vars) {
    const detail = varDetail(v.varInfo);
    if (!detail) continue; // skip silent checks / no-op reviews
    rows.push({
      match_id: dbMatchId,
      api_event_id: `${dbMatchId}_VAR_${v.id}`,
      minute: v.time?.minute ?? null,
      minute_extra: null,
      type: 'Var',
      detail,
      team_id: v.primaryActor?.team?.teamCode ?? null,
      player: v.primaryActor?.person?.internationalName ?? null,
      player_id: null,
      assist: null,
    });
  }

  if (rows.length === 0) return 0;
  const { error } = await supabase
    .from('match_events')
    .upsert(rows, { onConflict: 'match_id,api_event_id', ignoreDuplicates: true });
  if (error) { console.error(`  events upsert failed for ${dbMatchId}:`, error.message); return 0; }
  return rows.length;
}

async function syncWindow(fromDate, toDate) {
  const uefaMatches = await fetchUefaMatches(fromDate, toDate);
  console.log(`Fetched ${uefaMatches.length} UEFA match(es) for ${fromDate}..${toDate}.`);

  const { data: dbMatches, error } = await supabase
    .from('matches')
    .select('id, api_id, matchday, home_team_id, away_team_id, status')
    .is('round', null)
    .not('matchday', 'is', null);
  if (error) { console.error('DB fetch failed:', error.message); return; }

  const byApiId = new Map(dbMatches.filter(m => m.api_id).map(m => [m.api_id, m]));
  const byMdTeams = new Map(dbMatches.map(m => [`${m.matchday}_${m.home_team_id}_${m.away_team_id}`, m]));

  let updated = 0, linked = 0, eventRows = 0;

  for (const um of uefaMatches) {
    const uefaId = um.id;
    const md = parseInt(um.matchday?.sequenceNumber, 10);
    const homeCode = um.homeTeam?.teamCode;
    const awayCode = um.awayTeam?.teamCode;
    if (!homeCode || !awayCode) continue; // TBD slot — not relevant to League Phase

    const dbMatch = byApiId.get(uefaId) ?? byMdTeams.get(`${md}_${homeCode}_${awayCode}`);
    if (!dbMatch) continue; // not one of our matches

    const status = mapStatus(um.status);
    const patch = { status, is_locked: status !== 'UPCOMING' };
    if (um.score) {
      patch.home_score = um.score.total?.home ?? um.score.regular?.home ?? null;
      patch.away_score = um.score.total?.away ?? um.score.regular?.away ?? null;
    }
    const needsLink = !dbMatch.api_id;
    if (needsLink) patch.api_id = uefaId;

    if (dbMatch.status !== status || needsLink) {
      const { error: upErr } = await supabase.from('matches').update(patch).eq('id', dbMatch.id);
      if (upErr) {
        console.error(`  ✗ ${dbMatch.id}:`, upErr.message);
      } else {
        updated++;
        if (needsLink) linked++;
        console.log(`  ${dbMatch.id}: ${dbMatch.status} → ${status}${needsLink ? ` (linked api_id=${uefaId})` : ''}`);
      }
    }

    if (status !== 'UPCOMING') {
      eventRows += await syncEventsForMatch(dbMatch.id, uefaId);
    }
  }

  console.log(`Done. ${updated} match(es) updated (${linked} newly linked), ${eventRows} event row(s) synced.`);
}

// Decide the polling tier purely from our own DB (no API call needed to check).
async function checkTier() {
  const { data, error } = await supabase
    .from('matches')
    .select('date, status')
    .is('round', null)
    .not('matchday', 'is', null);
  if (error) { console.error('Tier check failed:', error.message); return 'skip'; }

  if (data.some(m => LIVE_STATUSES.has(m.status))) return 'live';

  const now = Date.now();
  const inWindow = data.some(m => {
    if (m.status !== 'UPCOMING' || !m.date || m.date === 'TBD') return false;
    const kickoff = new Date(m.date).getTime();
    const diff = kickoff - now;
    return diff < 45 * 60 * 1000 && diff > -210 * 60 * 1000; // 45 min before to 3.5h after kickoff
  });
  return inWindow ? 'window' : 'skip';
}

// FORCE_TIER=window|live node scripts/sync-scores-uefa.mjs — manual override for testing
// outside an actual match window (e.g. to confirm DB linking ahead of kickoff).
const tier = process.env.FORCE_TIER ?? await checkTier();
const today = new Date();
// FROM_DATE/TO_DATE overrides — useful with FORCE_TIER=window to test against a specific
// matchday's dates (e.g. Round 1, 2026-09-08) ahead of or outside the live polling window.
const fromDate = process.env.FROM_DATE ?? utcDateStr(new Date(today.getTime() - 24 * 3600 * 1000));
const toDate = process.env.TO_DATE ?? utcDateStr(new Date(today.getTime() + 24 * 3600 * 1000));

if (tier === 'live') {
  console.log('[TIER] Live — polling every 30s (10 iterations)');
  for (let i = 0; i < 10; i++) {
    try { await syncWindow(fromDate, toDate); } catch (e) { console.error('Sync error:', e); }
    if (i < 9) await new Promise(r => setTimeout(r, 30_000));
  }
} else if (tier === 'window') {
  console.log('[TIER] Window — single sync');
  await syncWindow(fromDate, toDate);
} else {
  console.log('[TIER] Silent — no match window right now, skipping API call');
}
