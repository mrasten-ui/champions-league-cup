import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);
const API_KEY = process.env.API_FOOTBALL_KEY;

// Fallback: resolve API team name → internal 3-letter ID when fixture fetch fails
const TEAM_NAME_TO_ID = {
  "Mexico": "MEX", "Canada": "CAN", "United States": "USA", "USA": "USA",
  "Honduras": "HON", "Costa Rica": "CRC", "Jamaica": "JAM", "Panama": "PAN",
  "Haiti": "HAI", "Trinidad and Tobago": "TRI", "Trinidad & Tobago": "TRI",
  "El Salvador": "SLV", "Guatemala": "GUA",
  "Argentina": "ARG", "Brazil": "BRA", "Colombia": "COL", "Uruguay": "URU",
  "Ecuador": "ECU", "Paraguay": "PAR", "Venezuela": "VEN", "Chile": "CHI",
  "Peru": "PER", "Bolivia": "BOL",
  "England": "ENG", "France": "FRA", "Spain": "ESP", "Germany": "GER",
  "Portugal": "POR", "Netherlands": "NED", "Belgium": "BEL", "Croatia": "CRO",
  "Switzerland": "SUI", "Austria": "AUT", "Denmark": "DEN", "Sweden": "SWE",
  "Norway": "NOR", "Scotland": "SCO", "Wales": "WAL",
  "Ireland": "IRL", "Republic of Ireland": "IRL",
  "Serbia": "SRB", "Ukraine": "UKR", "Hungary": "HUN", "Romania": "ROU",
  "Slovakia": "SVK", "Slovenia": "SVN",
  "Czech Republic": "CZE", "Czechia": "CZE",
  "Poland": "POL", "Greece": "GRE", "Turkey": "TUR", "Türkiye": "TUR",
  "Albania": "ALB", "Georgia": "GEO", "Iceland": "ISL",
  "Bosnia and Herzegovina": "BIH", "Bosnia & Herzegovina": "BIH", "Bosnia": "BIH",
  "Morocco": "MAR", "Senegal": "SEN", "Nigeria": "NGA", "Egypt": "EGY",
  "Ghana": "GHA", "Cameroon": "CMR",
  "Ivory Coast": "CIV", "Cote d'Ivoire": "CIV", "Côte d'Ivoire": "CIV",
  "South Africa": "RSA", "Tunisia": "TUN", "Algeria": "ALG", "Mali": "MLI",
  "Guinea": "GUI", "Cabo Verde": "CPV", "Cape Verde": "CPV", "Cape Verde Islands": "CPV",
  "DR Congo": "COD", "Congo DR": "COD", "Democratic Republic of Congo": "COD",
  "Japan": "JPN", "Korea Republic": "KOR", "South Korea": "KOR",
  "Saudi Arabia": "KSA", "Iran": "IRN", "IR Iran": "IRN",
  "Australia": "AUS", "Uzbekistan": "UZB", "Jordan": "JOR", "Iraq": "IRQ",
  "Qatar": "QAT", "New Zealand": "NZL", "Curacao": "CUW", "Curaçao": "CUW",
};

const FINISHED = ['FT', 'AET', 'PEN', 'FINISHED'];

const limitArg = process.argv.indexOf('--limit');
const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1], 10) : null;

const query = supabase
  .from('matches')
  .select('id, api_id, home_team_id, away_team_id, status')
  .in('status', FINISHED)
  .not('api_id', 'is', null)
  .order('date', { ascending: false });

if (limit) query.limit(limit);

const { data: raw, error } = await query;
// Reverse so we process chronologically (oldest first when limiting)
const matches = limit ? (raw ?? []).reverse() : (raw ?? []);

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

    // Primary: match by numeric API team ID from fixture response
    let teamId = null;
    if (homeApiId) {
      if (apiTeamId === homeApiId) teamId = match.home_team_id;
      else if (apiTeamId === String(fixture.teams.away.id)) teamId = match.away_team_id;
    }

    // Fallback: resolve via team name when fixture fetch failed or ID didn't match
    if (!teamId) {
      const nameId = TEAM_NAME_TO_ID[teamData.team?.name];
      if (nameId === match.home_team_id) teamId = match.home_team_id;
      else if (nameId === match.away_team_id) teamId = match.away_team_id;
    }

    if (!teamId) {
      console.warn(`  Could not resolve team for "${teamData.team?.name}" — skipping`);
      continue;
    }

    const formation = teamData.formation ?? null;
    const rawColors = teamData.team?.colors?.player;
    const kitBg   = rawColors?.primary ? `#${rawColors.primary}` : null;
    const kitText  = rawColors?.number  ? `#${rawColors.number}`  : null;
    console.log(`  ${teamData.team?.name} (${teamId}) — ${teamData.startXI?.length ?? 0} starters, ${teamData.substitutes?.length ?? 0} subs — formation: ${formation ?? 'n/a'} — kit: ${kitBg ?? 'n/a'}`);

    for (const { player: p } of (teamData.startXI ?? [])) {
      rows.push({ match_id: match.id, team_id: teamId, player_name: p.name, player_id: p.id ?? null, player_number: p.number ?? null, position: p.pos ?? null, grid: p.grid ?? null, is_starting: true, formation, kit_bg: kitBg, kit_text: kitText });
    }
    for (const { player: p } of (teamData.substitutes ?? [])) {
      rows.push({ match_id: match.id, team_id: teamId, player_name: p.name, player_id: p.id ?? null, player_number: p.number ?? null, position: p.pos ?? null, grid: null, is_starting: false, formation: null, kit_bg: kitBg, kit_text: kitText });
    }
  }

  if (!rows.length) { console.log('  No rows to insert'); continue; }

  // Delete existing rows first so re-runs always produce clean data
  // (prevents stale rows from lingering when the API corrects its data)
  const { error: delErr } = await supabase
    .from('match_lineups')
    .delete()
    .eq('match_id', match.id);
  if (delErr) { console.error(`  ✗ Delete failed: ${delErr.message}`); continue; }

  // Deduplicate by conflict key — API sometimes returns the same player in both
  // startXI and substitutes, which would cause Postgres to reject the batch.
  const seen = new Set();
  const deduped = rows.filter(r => {
    const k = `${r.match_id}_${r.team_id}_${r.player_name}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const { error: upsertErr } = await supabase
    .from('match_lineups')
    .insert(deduped);

  if (upsertErr) {
    console.error(`  ✗ Insert failed: ${upsertErr.message}`);
  } else {
    totalRows += deduped.length;
    console.log(`  ✓ ${deduped.length} rows inserted`);
  }

  // 3 s between matches keeps us well under the 30 req/min API rate limit
  // (each match makes 2 API calls, so 3 s spacing → ~40 req/min including latency)
  await new Promise(r => setTimeout(r, 3000));
}

console.log(`\nDone. Total rows inserted: ${totalRows}`);
