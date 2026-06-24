/**
 * sync-player-stats.js
 *
 * Fetches per-match player statistics (including ratings) from API-Football
 * for all completed World Cup matches and upserts into player_match_stats.
 *
 * Safe to re-run: uses UNIQUE(match_id, player_id) to avoid duplicates.
 * Only fetches matches not yet covered — incremental by design.
 *
 * Usage:
 *   node scripts/sync-player-stats.js           — only uncovered matches
 *   node scripts/sync-player-stats.js --all     — re-fetch everything
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);
const API_KEY = process.env.API_FOOTBALL_KEY;
const REFETCH_ALL = process.argv.includes('--all');

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
  "Guinea": "GUI", "Cabo Verde": "CPV", "Cape Verde": "CPV",
  "DR Congo": "COD", "Congo DR": "COD", "Democratic Republic of Congo": "COD",
  "Japan": "JPN", "Korea Republic": "KOR", "South Korea": "KOR",
  "Saudi Arabia": "KSA", "Iran": "IRN", "IR Iran": "IRN",
  "Australia": "AUS", "Uzbekistan": "UZB", "Jordan": "JOR", "Iraq": "IRQ",
  "Qatar": "QAT", "New Zealand": "NZL",
  "Indonesia": "IDN", "China PR": "CHN", "China": "CHN",
  "Curacao": "CUW", "Curaçao": "CUW",
};

const FINISHED = ['FT', 'AET', 'PEN', 'FINISHED'];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  // 1. Get all completed matches with an API id
  const { data: matches, error: matchErr } = await supabase
    .from('matches')
    .select('id, api_id, home_team_id, away_team_id, status')
    .not('api_id', 'is', null)
    .in('status', FINISHED);

  if (matchErr) { console.error('Failed to fetch matches:', matchErr.message); process.exit(1); }
  console.log(`Found ${matches.length} completed matches with api_id`);

  // 2. Find which match_ids are already covered (unless --all)
  let coveredMatchIds = new Set();
  if (!REFETCH_ALL) {
    const { data: covered } = await supabase
      .from('player_match_stats')
      .select('match_id');
    if (covered) covered.forEach(r => coveredMatchIds.add(r.match_id));
    console.log(`Already covered: ${coveredMatchIds.size} matches — skipping those`);
  }

  const toFetch = matches.filter(m => !coveredMatchIds.has(m.id));
  console.log(`Fetching player stats for ${toFetch.length} match(es)...\n`);

  let totalRows = 0;

  for (const match of toFetch) {
    console.log(`\n[${match.id}] fixture ${match.api_id} (${match.home_team_id} vs ${match.away_team_id})`);

    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures/players?fixture=${match.api_id}`,
      { headers: { 'x-apisports-key': API_KEY } }
    );

    if (!res.ok) { console.error(`  HTTP ${res.status} — skipping`); await sleep(500); continue; }
    const data = await res.json();

    if (data.errors && Object.keys(data.errors).length) {
      console.error('  API error:', JSON.stringify(data.errors)); continue;
    }

    const teams = data.response ?? [];
    if (!teams.length) { console.log('  No player data yet'); continue; }

    const rows = [];
    for (const teamData of teams) {
      const teamName = teamData.team?.name ?? '';
      const teamId = TEAM_NAME_TO_ID[teamName]
        ?? (teamName === match.home_team_id ? match.home_team_id : null)
        ?? (teamName === match.away_team_id ? match.away_team_id : null)
        ?? null;

      for (const entry of (teamData.players ?? [])) {
        const p = entry.player;
        const s = entry.statistics?.[0];
        if (!p?.id || !s) continue;

        const ratingRaw = s.games?.rating;
        const rating = ratingRaw ? parseFloat(ratingRaw) : null;

        rows.push({
          match_id:            match.id,
          player_id:           p.id,
          player_name:         p.name ?? null,
          team_id:             teamId,
          minutes:             s.games?.minutes ?? null,
          rating:              rating,
          goals:               s.goals?.total    ?? 0,
          assists:             s.goals?.assists  ?? 0,
          shots_total:         s.shots?.total    ?? null,
          shots_on:            s.shots?.on       ?? null,
          passes_total:        s.passes?.total   ?? null,
          passes_key:          s.passes?.key     ?? null,
          pass_accuracy:       s.passes?.accuracy != null ? parseInt(s.passes.accuracy) : null,
          tackles:             s.tackles?.total  ?? null,
          dribbles_success:    s.dribbles?.success  ?? null,
          dribbles_attempts:   s.dribbles?.attempts ?? null,
          fouls_committed:     s.fouls?.committed ?? null,
          fouls_drawn:         s.fouls?.drawn     ?? null,
          yellow_cards:        s.cards?.yellow ?? 0,
          red_cards:           s.cards?.red    ?? 0,
        });
      }
    }

    if (!rows.length) { console.log('  No rows to insert'); continue; }

    if (REFETCH_ALL) {
      await supabase.from('player_match_stats').delete().eq('match_id', match.id);
    }

    const { error: upsertErr } = await supabase
      .from('player_match_stats')
      .upsert(rows, { onConflict: 'match_id,player_id', ignoreDuplicates: false });

    if (upsertErr) {
      console.error(`  ✗ Upsert failed: ${upsertErr.message}`);
    } else {
      totalRows += rows.length;
      console.log(`  ✓ ${rows.length} players upserted`);
    }

    // Respect API rate limits — Pro plan is generous but no need to hammer it
    await sleep(200);
  }

  console.log(`\nDone. Total player-stat rows inserted: ${totalRows}`);
}

run().catch(e => { console.error(e); process.exit(1); });
