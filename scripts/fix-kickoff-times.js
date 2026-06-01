import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

/**
 * fix-kickoff-times.js — Safe date-only patch from API-Football
 *
 * Dry run (default — no writes):
 *   node scripts/fix-kickoff-times.js
 *
 * Apply changes:
 *   node scripts/fix-kickoff-times.js --apply
 */

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_KEY   = process.env.API_FOOTBALL_KEY;
const LEAGUE_ID = 1;
const SEASON    = 2026;

const TEAM_NAME_TO_ID = {
  "Mexico": "MEX", "South Africa": "RSA", "Korea Republic": "KOR",
  "South Korea": "KOR", "Czech Republic": "CZE", "Czechia": "CZE",
  "Canada": "CAN", "Bosnia and Herzegovina": "BIH", "Bosnia": "BIH",
  "Bosnia & Herzegovina": "BIH", "Bosnia Herzegovina": "BIH",
  "Qatar": "QAT", "Switzerland": "SUI",
  "Brazil": "BRA", "Morocco": "MAR", "Haiti": "HAI", "Scotland": "SCO",
  "United States": "USA", "USA": "USA", "Paraguay": "PAR",
  "Australia": "AUS", "Turkey": "TUR", "Türkiye": "TUR",
  "Germany": "GER", "Curacao": "CUW", "Curaçao": "CUW",
  "Ivory Coast": "CIV", "Cote d'Ivoire": "CIV", "Ecuador": "ECU",
  "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
  "Albania": "ALB",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "IR Iran": "IRN",
  "New Zealand": "NZL",
  "Spain": "ESP", "Cabo Verde": "CPV", "Cape Verde": "CPV",
  "Cape Verde Islands": "CPV", "Saudi Arabia": "KSA", "Uruguay": "URU",
  "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
  "Chile": "CHI",
  "Argentina": "ARG", "Algeria": "ALG", "Austria": "AUT",
  "Jordan": "JOR", "Iraq": "IRQ",
  "Portugal": "POR", "DR Congo": "COD", "Congo DR": "COD",
  "Uzbekistan": "UZB", "Colombia": "COL",
  "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
  "Serbia": "SRB", "Nigeria": "NGA", "Italy": "ITA",
  "Denmark": "DEN", "Nigeria": "NGA",
};

// Convert ISO date string to a readable BST label for display
function toBST(isoStr) {
  if (!isoStr) return '(null)';
  const d = new Date(isoStr);
  return d.toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  }) + ' BST';
}

async function run() {
  console.log(APPLY
    ? '⚡ APPLY mode — changes will be written to Supabase'
    : '🔍 DRY RUN mode — no writes (pass --apply to commit)\n'
  );

  // 1. Fetch all WC2026 fixtures from API
  console.log('Fetching fixtures from API-Football...');
  const res  = await fetch(
    `https://v3.football.api-sports.io/fixtures?league=${LEAGUE_ID}&season=${SEASON}`,
    { headers: { 'x-apisports-key': API_KEY } }
  );
  const data = await res.json();

  if (!data.response?.length) {
    console.error('No fixtures returned from API. Check API key / quota.');
    process.exit(1);
  }
  console.log(`Got ${data.response.length} fixtures from API.\n`);

  // Build lookup maps from API response
  const apiById   = new Map(); // api_id (string) → fixture
  const apiByTeam = new Map(); // "HOME|AWAY" → fixture

  for (const item of data.response) {
    const apiId  = item.fixture.id.toString();
    const homeId = TEAM_NAME_TO_ID[item.teams.home.name];
    const awayId = TEAM_NAME_TO_ID[item.teams.away.name];

    apiById.set(apiId, item);

    if (homeId && awayId) {
      apiByTeam.set(`${homeId}|${awayId}`, item);
    }
  }

  // 2. Fetch all DB matches
  const { data: dbMatches, error } = await supabase
    .from('matches')
    .select('id, api_id, home_team_id, away_team_id, date');

  if (error) { console.error('DB fetch error:', error.message); process.exit(1); }
  console.log(`Fetched ${dbMatches.length} matches from database.\n`);

  // 3. Compare dates
  const toUpdate   = [];
  const unchanged  = [];
  const unmatched  = [];

  for (const match of dbMatches) {
    // Skip knockout TBD placeholders — no API fixture to match yet
    if (match.home_team_id === 'TBD' || match.away_team_id === 'TBD') continue;

    let apiItem = null;

    // Priority 1: match by existing api_id
    if (match.api_id) {
      apiItem = apiById.get(match.api_id.toString());
    }

    // Priority 2: match by team IDs
    if (!apiItem) {
      const key = `${match.home_team_id}|${match.away_team_id}`;
      apiItem = apiByTeam.get(key);
    }

    if (!apiItem) {
      unmatched.push(match);
      continue;
    }

    const apiDate = apiItem.fixture.date; // full ISO string from API
    const apiId   = apiItem.fixture.id.toString();
    const dbDate  = match.date;

    const dateChanged = apiDate !== dbDate;
    const idChanged   = match.api_id !== apiId;

    if (dateChanged || idChanged) {
      toUpdate.push({ match, apiDate, apiId, dateChanged, idChanged });
    } else {
      unchanged.push(match);
    }
  }

  // 4. Print report
  if (toUpdate.length === 0) {
    console.log('✅ All matched dates are already correct — nothing to update.');
  } else {
    const pad = (s, n) => String(s).padEnd(n);
    console.log(`${pad('Match ID', 8)} ${pad('Home', 5)} ${pad('Away', 5)} ${pad('DB date (BST)', 28)} → API date (BST)`);
    console.log('─'.repeat(90));
    for (const { match, apiDate, dateChanged } of toUpdate) {
      if (dateChanged) {
        console.log(
          `${pad(match.id, 8)} ${pad(match.home_team_id, 5)} ${pad(match.away_team_id, 5)} ` +
          `${pad(toBST(match.date), 28)} → ${toBST(apiDate)}`
        );
      }
    }
    console.log('─'.repeat(90));
    console.log(`${toUpdate.length} match(es) to update, ${unchanged.length} already correct.\n`);
  }

  if (unmatched.length > 0) {
    console.log(`⚠️  ${unmatched.length} group-stage match(es) could not be linked to any API fixture:`);
    for (const m of unmatched) {
      console.log(`   ${m.id}: ${m.home_team_id} vs ${m.away_team_id} (DB date: ${m.date?.slice(0,10)})`);
    }
    console.log('');
  }

  if (!APPLY) {
    if (toUpdate.length > 0) {
      console.log('Run with --apply to write these changes.');
    }
    return;
  }

  // 5. Apply updates
  if (toUpdate.length === 0) return;

  console.log('Writing updates...');
  let ok = 0, fail = 0;

  for (const { match, apiDate, apiId } of toUpdate) {
    const updates = { date: apiDate };
    if (match.api_id !== apiId) updates.api_id = apiId;

    const { error: updateErr } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', match.id);

    if (updateErr) {
      console.error(`  ✗ ${match.id}: ${updateErr.message}`);
      fail++;
    } else {
      console.log(`  ✓ ${match.id} (${match.home_team_id} vs ${match.away_team_id})`);
      ok++;
    }
  }

  console.log(`\nDone: ${ok} updated, ${fail} failed.`);
}

run();
