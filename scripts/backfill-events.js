/**
 * backfill-events.js
 *
 * Re-fetches and cleans match events for all completed matches (FT/AET/PEN).
 * Fixes two problems from old data:
 *   1. Duplicate events caused by player-name variants in the old api_event_id format
 *   2. VAR-cancelled goals that should not appear in event strips
 *
 * Safe to re-run: deletes and re-inserts events for each completed match.
 * created_at is set to the match kickoff time so freshness check never fires
 * goal notifications for historical events.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_KEY = process.env.API_FOOTBALL_KEY;

const TEAM_NAME_TO_ID = {
  "Mexico": "MEX", "South Africa": "RSA", "Korea Republic": "KOR",
  "South Korea": "KOR", "Czech Republic": "CZE", "Czechia": "CZE",
  "Canada": "CAN", "Bosnia and Herzegovina": "BIH", "Bosnia": "BIH",
  "Qatar": "QAT", "Switzerland": "SUI",
  "Brazil": "BRA", "Morocco": "MAR", "Haiti": "HAI", "Scotland": "SCO",
  "United States": "USA", "USA": "USA", "Paraguay": "PAR",
  "Australia": "AUS", "Turkey": "TUR", "Türkiye": "TUR",
  "Germany": "GER", "Curacao": "CUW", "Curaçao": "CUW",
  "Ivory Coast": "CIV", "Cote d'Ivoire": "CIV", "Ecuador": "ECU",
  "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "IR Iran": "IRN",
  "New Zealand": "NZL",
  "Spain": "ESP", "Cabo Verde": "CPV", "Cape Verde": "CPV",
  "Saudi Arabia": "KSA", "Uruguay": "URU",
  "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
  "Argentina": "ARG", "Algeria": "ALG", "Austria": "AUT", "Jordan": "JOR",
  "Portugal": "POR", "DR Congo": "COD", "Congo DR": "COD",
  "Uzbekistan": "UZB", "Colombia": "COL",
  "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
};

async function backfillMatch(match) {
  const { id: matchId, api_id: apiId, date: kickoffDate } = match;

  // Fetch events from API-Football
  const res = await fetch(
    `https://v3.football.api-sports.io/fixtures/events?fixture=${apiId}`,
    { headers: { 'x-apisports-key': API_KEY } }
  );
  const data = await res.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    console.error(`  [${matchId}] API error:`, JSON.stringify(data.errors));
    return { deleted: 0, inserted: 0 };
  }

  const events = data.response ?? [];
  console.log(`  [${matchId}] API returned ${events.length} raw events`);

  // --- VAR cancellation detection ---
  // For each "Goal Disallowed" VAR event, find the most recent goal at-or-before
  // that minute for the same team and mark it cancelled.
  const varEvents = events.filter(e => e.type === 'Var' && e.detail === 'Goal Disallowed');
  const cancelledGoalKeys = new Set();

  for (const varEvent of varEvents) {
    const varTeamId = TEAM_NAME_TO_ID[varEvent.team?.name] ?? null;
    const varMinute = varEvent.time?.elapsed ?? 0;

    const goalsBefore = events.filter(e =>
      e.type === 'Goal' &&
      (TEAM_NAME_TO_ID[e.team?.name] ?? null) === varTeamId &&
      (e.time?.elapsed ?? 0) <= varMinute
    );

    if (goalsBefore.length > 0) {
      const closest = goalsBefore[goalsBefore.length - 1];
      const key = `${varTeamId}_${closest.time?.elapsed ?? 0}_${closest.time?.extra ?? 0}`;
      cancelledGoalKeys.add(key);
      console.log(`  [${matchId}] VAR cancelled goal: ${varTeamId} ${closest.time?.elapsed}'`);
    }
  }

  // --- Build deduped, cleaned event list ---
  const seen = new Set();
  const toInsert = [];

  for (const event of events) {
    const teamId = TEAM_NAME_TO_ID[event.team?.name] ?? null;
    const elapsed = event.time?.elapsed ?? 0;
    const extra   = event.time?.extra   ?? 0;

    // Normalized player name in key: handles same-minute multi-subs while
    // collapsing duplicate API name variants (diacritics etc.)
    const normPlayer = (event.player?.name ?? '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/[^a-z]/g, '_');
    const apiEventId = `${matchId}_${teamId ?? ''}_${elapsed}_${extra}_${event.type}_${(event.detail ?? '').replace(/\s/g, '_')}_${normPlayer}`;

    if (seen.has(apiEventId)) {
      console.log(`  [${matchId}] Dedup skipped: ${event.type} ${event.detail} ${elapsed}'`);
      continue;
    }
    seen.add(apiEventId);

    // Skip goals that were cancelled by VAR
    if (event.type === 'Goal') {
      const goalKey = `${teamId}_${elapsed}_${extra}`;
      if (cancelledGoalKeys.has(goalKey)) {
        console.log(`  [${matchId}] Removing VAR-cancelled goal from DB: ${teamId} ${elapsed}'`);
        continue;
      }
    }

    toInsert.push({
      match_id:     matchId,
      api_event_id: apiEventId,
      minute:       elapsed || null,
      minute_extra: extra   || null,
      type:         event.type,
      detail:       event.detail    ?? null,
      team_id:      teamId,
      player:       event.player?.name ?? null,
      player_id:    event.player?.id   ?? null,
      assist:       event.assist?.name ?? null,
      // Set to kickoff time so freshness check never fires old notifications
      created_at:   kickoffDate,
    });
  }

  // --- Delete existing events for this match ---
  const { error: delError, count: deleted } = await supabase
    .from('match_events')
    .delete({ count: 'exact' })
    .eq('match_id', matchId);

  if (delError) {
    console.error(`  [${matchId}] Delete error:`, delError.message);
    return { deleted: 0, inserted: 0 };
  }

  // --- Insert clean events ---
  if (!toInsert.length) {
    console.log(`  [${matchId}] No events to insert after cleanup`);
    return { deleted: deleted ?? 0, inserted: 0 };
  }

  const { error: insError } = await supabase.from('match_events').insert(toInsert);
  if (insError) {
    console.error(`  [${matchId}] Insert error:`, insError.message);
    return { deleted: deleted ?? 0, inserted: 0 };
  }

  console.log(`  [${matchId}] Replaced ${deleted ?? 0} old → ${toInsert.length} clean events`);
  return { deleted: deleted ?? 0, inserted: toInsert.length };
}

async function main() {
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : null;

  console.log('Backfilling match events for completed matches...\n');

  const query = supabase
    .from('matches')
    .select('id, api_id, date, home_team_id, away_team_id')
    .in('status', ['FT', 'AET', 'PEN'])
    .not('api_id', 'is', null)
    .order('date', { ascending: false });

  if (limit) query.limit(limit);

  const { data: raw, error } = await query;
  // When limiting, we fetched newest-first; reverse so we process chronologically
  const completedMatches = limit ? (raw ?? []).reverse() : (raw ?? []);

  if (error) { console.error('Failed to fetch matches:', error.message); process.exit(1); }
  if (!completedMatches?.length) { console.log('No completed matches found.'); return; }

  console.log(`Found ${completedMatches.length} completed match(es):\n`);
  completedMatches.forEach(m => console.log(`  ${m.date.slice(0, 16)} ${m.home_team_id} vs ${m.away_team_id} (api_id=${m.api_id})`));
  console.log('');

  let totalDeleted = 0;
  let totalInserted = 0;

  for (const match of completedMatches) {
    console.log(`\nProcessing ${match.home_team_id} vs ${match.away_team_id}...`);
    const { deleted, inserted } = await backfillMatch(match);
    totalDeleted  += deleted;
    totalInserted += inserted;
    // Respect API rate limit between calls
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Done. Removed ${totalDeleted} old events, inserted ${totalInserted} clean events.`);
}

main().catch(err => { console.error(err); process.exit(1); });
