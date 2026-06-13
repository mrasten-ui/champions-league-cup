import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const API_KEY = process.env.API_FOOTBALL_KEY;
const today = new Date().toISOString().slice(0, 10);

console.log(`Fetching lineups for all matches on ${today}...`);

const { data: matches, error } = await supabase
  .from('matches')
  .select('id, api_id, home_team_id, away_team_id, status')
  .not('api_id', 'is', null);

if (error) { console.error('DB fetch failed:', error.message); process.exit(1); }

// Filter to today's matches (any status — covers upcoming, live, finished)
const todayMatches = matches.filter(m => {
  // api_id is numeric; we can't filter by date directly here but we get all and let the API filter
  return true;
});

console.log(`Found ${matches.length} total matches with api_id`);

// Fetch today's fixtures from API to get only today's api_ids
const apiRes = await fetch(
  `https://v3.football.api-sports.io/fixtures?date=${today}&league=1&season=2026`,
  { headers: { 'x-apisports-key': API_KEY } }
);
if (!apiRes.ok) { console.error(`API HTTP ${apiRes.status}`); process.exit(1); }
const apiData = await apiRes.json();
if (apiData.errors && Object.keys(apiData.errors).length) {
  console.error('API errors:', JSON.stringify(apiData.errors)); process.exit(1);
}

const todayApiIds = new Set((apiData.response ?? []).map(f => String(f.fixture.id)));
console.log(`API returned ${todayApiIds.size} fixtures for today`);

const todayDbMatches = matches.filter(m => todayApiIds.has(String(m.api_id)));
console.log(`Matched ${todayDbMatches.length} DB matches to today's fixtures`);

let totalRows = 0;

for (const match of todayDbMatches) {
  console.log(`\nFetching lineups for match ${match.id} (fixture ${match.api_id})…`);

  const [lineupRes, fixtureRes] = await Promise.all([
    fetch(`https://v3.football.api-sports.io/fixtures/lineups?fixture=${match.api_id}`, { headers: { 'x-apisports-key': API_KEY } }),
    fetch(`https://v3.football.api-sports.io/fixtures?id=${match.api_id}`, { headers: { 'x-apisports-key': API_KEY } }),
  ]);

  if (!lineupRes.ok) { console.error(`  HTTP ${lineupRes.status} — skipping`); continue; }
  const lineupData = await lineupRes.json();
  const fixtureData = fixtureRes.ok ? await fixtureRes.json() : null;

  if (!lineupData.response?.length) { console.log('  No lineup data yet — skipping'); continue; }

  const fixture = fixtureData?.response?.[0];
  const homeApiId = fixture ? String(fixture.teams.home.id) : null;

  const rows = [];
  for (const teamData of lineupData.response) {
    const apiTeamId = String(teamData.team?.id);
    const isHome = homeApiId ? apiTeamId === homeApiId : null;
    const teamId = isHome === true ? match.home_team_id
                 : isHome === false ? match.away_team_id
                 : null;
    if (!teamId) { console.warn(`  Could not resolve team for ${teamData.team?.name}`); continue; }

    const formation = teamData.formation ?? null;
    const rawColors = teamData.team?.colors?.player;
    const kitBg   = rawColors?.primary ? `#${rawColors.primary}` : null;
    const kitText  = rawColors?.number  ? `#${rawColors.number}`  : null;
    console.log(`  ${teamData.team?.name} (${teamId}) — kit: ${kitBg ?? 'n/a'} / ${kitText ?? 'n/a'} — formation: ${formation ?? 'n/a'}`);

    for (const { player: p } of (teamData.startXI ?? [])) {
      rows.push({ match_id: match.id, team_id: teamId, player_name: p.name, player_number: p.number ?? null, position: p.pos ?? null, grid: p.grid ?? null, is_starting: true, formation, kit_bg: kitBg, kit_text: kitText });
    }
    for (const { player: p } of (teamData.substitutes ?? [])) {
      rows.push({ match_id: match.id, team_id: teamId, player_name: p.name, player_number: p.number ?? null, position: p.pos ?? null, grid: null, is_starting: false, formation: null, kit_bg: kitBg, kit_text: kitText });
    }
  }

  if (!rows.length) { console.log('  No rows to insert'); continue; }

  const { error: upsertErr } = await supabase
    .from('match_lineups')
    .upsert(rows, { onConflict: 'match_id,team_id,player_name', ignoreDuplicates: false });

  if (upsertErr) {
    console.error(`  ✗ Upsert failed: ${upsertErr.message}`);
  } else {
    totalRows += rows.length;
    console.log(`  ✓ ${rows.length} rows upserted`);
  }
}

console.log(`\nDone. Total rows inserted: ${totalRows}`);
