/**
 * seed-team-data.mjs
 *
 * Fills in real, live data for all 36 League Phase teams instead of the
 * hand-guessed placeholder numbers pull-real-cl-2026.mjs seeded (rank/rating
 * derived purely from UEFA draw-pot position, e.g. Inter landed "rank 1" just
 * because of pot order, not actual strength).
 *
 * country/venue specifically are also hardcoded as TEAM_VENUE/TEAM_COUNTRY in
 * constants.ts, used as a client-side fallback (see useAppData.ts) whenever
 * teams.region/venue is empty — that data barely ever changes, so the app
 * isn't blocked on this script's rate-limited API calls to show it. This
 * script's job for those two fields is now periodic verification (catch a
 * stadium rename, a promoted/relegated confederation, etc.), not the primary
 * source — run it whenever API-Football quota allows, no urgency.
 *
 * Three real, free, no-fabrication data sources:
 *   1. ClubElo (http://api.clubelo.com) — live, continuously-updated club Elo
 *      ratings. No key needed. Used to recompute rank/rating/att/mid/def on a
 *      calibrated scale, and to populate teams.elo_rating (which
 *      generateMagicScores in services/engine.ts already prefers over the
 *      crude rank field whenever it's present).
 *   2. API-Football (v3.football.api-sports.io) — team facts (country,
 *      founded, venue) via /teams?search=, which the free plan allows with no
 *      season restriction. Written into teams.iso_code/region and a factual
 *      one-line teams.overview string.
 *   3. API-Football topscorers (league=2, season=2024 — the most recent
 *      season the free plan permits) — real UCL top scorers, written to
 *      scouting_overview.star_player IF the team played in that season,
 *      clearly labeled with the season so nobody mistakes it for current form.
 *
 * Deliberately NOT populated in this pass (free-tier API-Football blocks the
 * `last` fixtures parameter, and the free plan's most recent /teams season is
 * 2024 — two seasons stale): recent_form, last_5_matches, strengths,
 * weaknesses, scout_notes. Left blank rather than guessed. Revisit once
 * either a paid API-Football tier or an LLM key (OPENAI_API_KEY /
 * VITE_GEMINI_API_KEY) is configured.
 *
 * Usage:
 *   node scripts/seed-team-data.mjs --dry-run   # logs the full plan, writes nothing
 *   node scripts/seed-team-data.mjs             # writes to Supabase
 *   node scripts/seed-team-data.mjs --elo-only  # skips API-Football entirely —
 *                                                # for when its daily quota is
 *                                                # exhausted but Elo shouldn't wait
 *
 * Required env vars:
 *   SUPABASE_URL / VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY / SUPABASE_SERVICE_ROLE_KEY
 *   API_FOOTBALL_KEY (not needed with --elo-only)
 *
 * Free-tier rate limit is 10 req/min — API-Football calls are spaced 6.5s
 * apart (~37 calls, ~4 minutes total runtime). Free-tier daily quota is 100
 * requests — this script alone uses ~37 of them per run.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const isDryRun = process.argv.includes('--dry-run');
const eloOnly = process.argv.includes('--elo-only');

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);
const API_KEY = process.env.API_FOOTBALL_KEY;
const API_BASE = 'https://v3.football.api-sports.io';
const UCL_LEAGUE_ID = 2;
const LAST_FREE_SEASON = 2024;

// Verified live against http://api.clubelo.com/<today> on 2026-08-31 — exact
// string match against the CSV's Club column (not fuzzy — several near
// duplicates exist, e.g. "Paris SG" vs "Paris FC", "Viking" vs "Vikingur",
// "Brugge" vs "Cercle Brugge", so guessing would silently mismatch).
const CLUBELO_NAME = {
  BRU: 'Brugge', AVL: 'Aston Villa', AEK: 'AEK', LASK: 'LASK',
  RMA: 'Real Madrid', INT: 'Inter', BVB: 'Dortmund', VIL: 'Villarreal',
  POR: 'Porto', MCI: 'Man City', LIL: 'Lille', BET: 'Betis',
  BAR: 'Barcelona', FEY: 'Feyenoord', STU: 'Stuttgart', VFK: 'Viking',
  PSG: 'Paris SG', SLB: 'Slovan Bratislava', LIV: 'Liverpool', ATM: 'Atletico',
  SPO: 'Sporting', GAL: 'Galatasaray', NAP: 'Napoli', ARS: 'Arsenal',
  PSV: 'PSV', SHK: 'Shakhtar', FEN: 'Fenerbahce', ROM: 'Roma',
  BAY: 'Bayern', BOD: 'Bodoe Glimt', MUN: 'Man United', SAB: 'Sabah',
  SLA: 'Slavia Praha', LEN: 'Lens', COM: 'Como', RBL: 'RB Leipzig',
};

// API-Football's /teams?search= term per club — verified live where the
// obvious name failed (Bodo/Glimt, AEK Athens, Sabah all needed a shorter
// search term plus manual disambiguation from the U19/reserve/women's-team
// results search= returns).
const API_FOOTBALL_SEARCH = {
  BRU: 'Club Brugge', AVL: 'Aston Villa', AEK: 'AEK', LASK: 'LASK',
  RMA: 'Real Madrid', INT: 'Inter', BVB: 'Borussia Dortmund', VIL: 'Villarreal',
  POR: 'FC Porto', MCI: 'Manchester City', LIL: 'Lille', BET: 'Real Betis',
  BAR: 'Barcelona', FEY: 'Feyenoord', STU: 'Stuttgart', VFK: 'Viking',
  PSG: 'Paris Saint Germain', SLB: 'Slovan Bratislava', LIV: 'Liverpool', ATM: 'Atletico Madrid',
  SPO: 'Sporting CP', GAL: 'Galatasaray', NAP: 'Napoli', ARS: 'Arsenal',
  PSV: 'PSV', SHK: 'Shakhtar Donetsk', FEN: 'Fenerbahce', ROM: 'Roma',
  BAY: 'Bayern', BOD: 'Bodo', MUN: 'Manchester United', SAB: 'Sabah',
  SLA: 'Slavia Praha', LEN: 'Lens', COM: 'Como', RBL: 'RB Leipzig',
};

// Disambiguates search= results that return multiple hits (reserve/U19/
// women's sides, unrelated clubs sharing a short name like "AEK" or "Sabah").
const EXCLUDE_NAME_PATTERN = /\b(U1[0-9]|U2[0-3]|II|W|Women|Reserve|Youth)\b/i;
const PREFERRED_COUNTRY = {
  AEK: 'Greece', SAB: 'Azerbaijan', BOD: 'Norway', SPO: 'Portugal',
};

const COUNTRY_ISO2 = {
  England: 'GB', Germany: 'DE', Spain: 'ES', France: 'FR', Italy: 'IT',
  Portugal: 'PT', Netherlands: 'NL', Belgium: 'BE', Turkey: 'TR', 'Türkiye': 'TR',
  Greece: 'GR', 'Czech-Republic': 'CZ', Czechia: 'CZ', Slovakia: 'SK',
  Norway: 'NO', Ukraine: 'UA', Azerbaijan: 'AZ',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A ~4-minute run making 37 sequential external calls will occasionally hit
// a transient DNS/network blip — retry a couple of times before giving up on
// that one team, rather than crashing the whole run and losing all prior
// progress.
async function withRetry(fn, label, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === attempts) { console.warn(`⚠️  ${label}: failed after ${attempts} attempts (${e.message})`); return null; }
      console.warn(`   retrying ${label} (${i}/${attempts}) after: ${e.message}`);
      await sleep(3000);
    }
  }
}

async function fetchElo() {
  const today = new Date().toISOString().slice(0, 10);
  const res = await fetch(`http://api.clubelo.com/${today}`);
  if (!res.ok) throw new Error(`ClubElo fetch failed: ${res.status}`);
  const text = await res.text();
  const rows = text.trim().split('\n').slice(1).map((line) => {
    const [rank, club, country, level, elo] = line.split(',');
    return { club: club.trim(), country: country.trim(), elo: parseFloat(elo) };
  });
  const byClub = new Map(rows.map((r) => [r.club, r]));

  const matched = {};
  const unmatched = [];
  for (const [id, cluebloName] of Object.entries(CLUBELO_NAME)) {
    const row = byClub.get(cluebloName);
    if (row) matched[id] = row.elo;
    else unmatched.push(`${id} (looked for "${cluebloName}")`);
  }
  if (unmatched.length) console.warn(`⚠️  ClubElo: no match for: ${unmatched.join(', ')}`);
  return matched;
}

async function fetchTeamFacts(id) {
  const search = API_FOOTBALL_SEARCH[id];
  const res = await fetch(`${API_BASE}/teams?search=${encodeURIComponent(search)}`, {
    headers: { 'x-apisports-key': API_KEY },
  });
  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length) {
    console.warn(`⚠️  API-Football ${id}: ${JSON.stringify(data.errors)}`);
    return null;
  }
  let candidates = data.response || [];
  candidates = candidates.filter((c) => !EXCLUDE_NAME_PATTERN.test(c.team.name));
  if (PREFERRED_COUNTRY[id]) {
    const preferred = candidates.filter((c) => c.team.country === PREFERRED_COUNTRY[id]);
    if (preferred.length) candidates = preferred;
  }
  const best = candidates[0];
  if (!best) { console.warn(`⚠️  API-Football ${id}: no usable result for search "${search}"`); return null; }
  return {
    apiFootballId: best.team.id,
    country: best.team.country,
    founded: best.team.founded,
    venueName: best.venue?.name ?? null,
    venueCity: best.venue?.city ?? null,
    venueCapacity: best.venue?.capacity ?? null,
  };
}

async function fetchTopScorers() {
  const res = await fetch(`${API_BASE}/players/topscorers?league=${UCL_LEAGUE_ID}&season=${LAST_FREE_SEASON}`, {
    headers: { 'x-apisports-key': API_KEY },
  });
  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length) {
    console.warn(`⚠️  API-Football topscorers: ${JSON.stringify(data.errors)}`);
    return new Map();
  }
  // Keyed by API-Football's numeric team id — NOT name-matched. Club names
  // collide too easily for substring/first-word matching to be safe (e.g.
  // "Villarreal" contains "real", "Manchester United"/"Manchester City" share
  // their first word) — an earlier version of this script mismatched Real
  // Madrid's and Man City's scorers onto Villarreal/Betis/Man Utd this way.
  // First (highest-scoring) entry per team wins since the endpoint returns
  // goals-descending.
  const byTeamId = new Map();
  for (const p of data.response || []) {
    const teamId = p.statistics[0].team.id;
    if (!byTeamId.has(teamId)) {
      byTeamId.set(teamId, { player: p.player.name, goals: p.statistics[0].goals.total });
    }
  }
  return byTeamId;
}

// Elo ranges roughly 1300-2100 across active European clubs; this UCL field
// specifically clusters ~1600-2100. Anchor the 0-99 scale so a mid-table UCL
// side (~1650) lands near 50 and the very best (~2050+) approach 99 — matches
// the spread outcomePointsForRound/generateMagicScores already expect.
function ratingFromElo(elo) {
  return Math.max(1, Math.min(99, Math.round(50 + (elo - 1650) / 8)));
}

async function main() {
  console.log(`\n=== seed-team-data.mjs ${isDryRun ? '(DRY RUN)' : '(LIVE)'} ===\n`);

  console.log('Fetching ClubElo ratings…');
  const eloById = (await withRetry(fetchElo, 'ClubElo')) ?? {};
  console.log(`  Matched ${Object.keys(eloById).length}/36 teams.\n`);

  const { data: currentTeams, error: fetchErr } = await supabase.from('teams').select('*');
  if (fetchErr) throw fetchErr;
  const currentById = Object.fromEntries((currentTeams || []).map((t) => [t.id, t]));

  // Rank strictly by Elo among matched teams; unmatched teams keep their
  // existing rank (pushed to the bottom is wrong — better to leave alone and
  // flag than silently misrank a team we have no live data for).
  const rankedIds = Object.keys(eloById).sort((a, b) => eloById[b] - eloById[a]);

  const facts = {};
  let topScorers = new Map();
  if (eloOnly) {
    console.log('--elo-only: skipping API-Football entirely.\n');
  } else {
    console.log('Fetching API-Football team facts (rate-limited to 10/min)…');
    const ids = Object.keys(API_FOOTBALL_SEARCH);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      facts[id] = await withRetry(() => fetchTeamFacts(id), `team facts for ${id}`);
      process.stdout.write(`  [${i + 1}/${ids.length}] ${id}: ${facts[id] ? 'ok' : 'MISSING'}\n`);
      if (i < ids.length - 1) await sleep(6500);
    }
    await sleep(6500);
    console.log('\nFetching last-free-season UCL top scorers…');
    topScorers = (await withRetry(fetchTopScorers, 'topscorers')) ?? new Map();
  }

  const teamRows = [];
  const scoutingRows = [];
  for (const id of Object.keys(CLUBELO_NAME)) {
    const existing = currentById[id] ?? {};
    const elo = eloById[id];
    const fact = facts[id];

    const row = { id, ...existing };
    if (elo !== undefined) {
      row.elo_rating = Math.round(elo);
      row.rank = rankedIds.indexOf(id) + 1;
      row.rating = ratingFromElo(elo);
      row.att = Math.min(99, row.rating + 2);
      row.mid = row.rating;
      row.def = Math.max(1, row.rating - 2);
    }
    if (fact) {
      row.iso_code = COUNTRY_ISO2[fact.country] ?? existing.iso_code ?? '';
      row.region = fact.country;
      row.venue = fact.venueName || existing.venue || '';
      const venueBit = fact.venueName ? ` · ${fact.venueName}${fact.venueCapacity ? ` (${fact.venueCapacity.toLocaleString()})` : ''}` : '';
      const foundedBit = fact.founded ? `Founded ${fact.founded}` : '';
      row.overview = [fact.country, foundedBit].filter(Boolean).join(' · ') + venueBit;
    }
    teamRows.push(row);

    // Match this team's last-free-season UCL top scorer by API-Football's own
    // numeric team id (captured in fetchTeamFacts) — exact, no name collision
    // risk (unlike matching on name text, which mismatched Real Madrid's and
    // Man City's scorers onto Villarreal/Betis/Man Utd in an earlier version
    // of this script, since "Villarreal" contains "real" and both Manchester
    // clubs share a first word).
    if (fact) {
      const scorer = topScorers.get(fact.apiFootballId);
      if (scorer) {
        scoutingRows.push({
          team_id: id,
          star_player: `${scorer.player} (${scorer.goals} UCL goals, ${LAST_FREE_SEASON}/${String(LAST_FREE_SEASON + 1).slice(2)})`,
        });
      }
    }
  }

  console.log('\n=== SUMMARY ===\n');
  console.log('Team'.padEnd(6), 'Old Rank'.padEnd(9), 'New Rank'.padEnd(9), 'Old Rating'.padEnd(11), 'New Rating'.padEnd(11), 'Elo');
  for (const row of teamRows) {
    const old = currentById[row.id] ?? {};
    console.log(
      row.id.padEnd(6),
      String(old.rank ?? '-').padEnd(9),
      String(row.rank ?? '-').padEnd(9),
      String(old.rating ?? '-').padEnd(11),
      String(row.rating ?? '-').padEnd(11),
      row.elo_rating ? row.elo_rating.toFixed(0) : '-'
    );
  }
  console.log(`\nStar players resolved: ${scoutingRows.length}/36 (only teams present in the ${LAST_FREE_SEASON} UCL top-scorer list get one — new qualifiers are left blank, not guessed).`);
  if (scoutingRows.length) {
    scoutingRows.forEach((r) => console.log(`  ${r.team_id}: ${r.star_player}`));
  }

  if (isDryRun) {
    console.log('\nDry run — nothing written. Re-run without --dry-run to commit.');
    return;
  }

  console.log('\nWriting teams table…');
  const { error: teamsErr } = await supabase.from('teams').upsert(teamRows, { onConflict: 'id' });
  if (teamsErr) throw teamsErr;

  if (scoutingRows.length) {
    console.log('Writing scouting_overview table…');
    for (const r of scoutingRows) {
      const { error } = await supabase.from('scouting_overview').upsert(r, { onConflict: 'team_id' });
      if (error) console.warn(`⚠️  scouting_overview upsert failed for ${r.team_id}:`, error.message);
    }
  }
  console.log('\nDone.');
}

main().catch((e) => { console.error(e); process.exit(1); });
