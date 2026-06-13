import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);
const API_KEY = process.env.API_FOOTBALL_KEY;

const FINISHED = ['FT', 'AET', 'PEN', 'FINISHED'];

const { data: matches, error } = await supabase
  .from('matches')
  .select('id, api_id, home_team_id, away_team_id, status')
  .in('status', FINISHED)
  .not('api_id', 'is', null);

if (error) { console.error('DB fetch failed:', error.message); process.exit(1); }
console.log(`Found ${matches.length} finished matches with api_id`);

let totalRows = 0;

for (const match of matches) {
  console.log(`\nFetching lineups for match ${match.id} (fixture ${match.api_id})...`);

  // Also fetch the fixture to get numeric team IDs for reliable mapping
  const [lineupRes, fixtureRes] = await Promise.all([
    fetch(`https://v3.football.api-sports.io/fixtures/lineups?fixture=${match.api_id}`, { headers: { 'x-apisports-key': API_KEY } }),
    fetch(`https://v3.football.api-sports.io/fixtures?id=${match.api_id}`, { headers: { 'x-apisports-key': API_KEY } }),
  ]);

  if (!lineupRes.ok) { console.error(`  HTTP ${lineupRes.status} — skipping`); continue; }
  const lineupData = await lineupRes.json();
  const fixtureData = fixtureRes.ok ? await fixtureRes.json() : null;

  if (lineupData.errors && Object.keys(lineupData.errors).length) {
    console.error('  API errors:', JSON.stringify(lineupData.errors));
    continue;
  }
  console.log(`  response length: ${lineupData.response?.length ?? 'undefined'}, results: ${lineupData.results}`);
  if (!lineupData.response?.length) { console.log('  No lineup data — skipping'); continue; }

  const fixture = fixtureData?.response?.[0];
  const homeApiId = fixture ? String(fixture.teams.home.id) : null;

  const rows = [];
  for (const teamData of lineupData.response) {
    const apiTeamId = String(teamData.team?.id);
    const isHome = homeApiId ? apiTeamId === homeApiId : null;
    // Fall back to name match if fixture fetch failed
    const teamId = isHome === true
      ? match.home_team_id
      : isHome === false
      ? match.away_team_id
      : (teamData.team?.name === fixture?.teams?.home?.name ? match.home_team_id : match.away_team_id);

    if (!teamId) { console.warn(`  Could not resolve team for ${teamData.team?.name}`); continue; }

    const formation = teamData.formation ?? null;
    const rawColors = teamData.team?.colors?.player;
    const kitBg   = rawColors?.primary ? `#${rawColors.primary}` : null;
    const kitText  = rawColors?.number  ? `#${rawColors.number}`  : null;
    console.log(`  ${teamData.team?.name} (${teamId}) — ${teamData.startXI?.length ?? 0} starters, ${teamData.substitutes?.length ?? 0} subs — formation: ${formation ?? 'n/a'} — kit: ${kitBg ?? 'n/a'}`);

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
