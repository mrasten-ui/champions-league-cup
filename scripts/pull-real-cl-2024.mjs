// Pulls the real 2024/25 UEFA Champions League League Phase (the first season of the
// current 36-team Swiss format) from API-Football's free tier, and builds team + match
// seed rows for our app: real teams, real logos, real matchday pairings/home-away —
// but re-dated onto the real, UEFA-announced 2026/27 matchday windows, with scores
// reset to null/UPCOMING so it still works as a "predict this round" experience.
//
// Requires API_FOOTBALL_KEY in .env (free tier: 100 req/day, seasons 2022-2024 only).
// Output: real-cl-2024-teams.json / real-cl-2024-matches.json, consumed by
// scripts/seed-real-cl-2024.js to write into Supabase.
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config({ path: '.env.local' });

const API_KEY = process.env.API_FOOTBALL_KEY;
const LEAGUE_ID = 2; // UEFA Champions League
const SEASON = 2024; // 2024/25 — first season of the 36-team Swiss League Phase

const MATCHDAY_WINDOWS = {
  1: ['2026-09-08', '2026-09-09', '2026-09-10'],
  2: ['2026-10-13', '2026-10-14'],
  3: ['2026-10-20', '2026-10-21'],
  4: ['2026-11-03', '2026-11-04'],
  5: ['2026-11-24', '2026-11-25'],
  6: ['2026-12-08', '2026-12-09'],
  7: ['2027-01-19', '2027-01-20'],
  8: ['2027-01-27'],
};
const KICKOFF_TIMES = ['17:45:00Z', '20:00:00Z'];

async function main() {
  if (!API_KEY) { console.error('❌ Missing API_FOOTBALL_KEY in .env'); process.exit(1); }

  const res = await fetch(`https://v3.football.api-sports.io/fixtures?league=${LEAGUE_ID}&season=${SEASON}`, {
    headers: { 'x-apisports-key': API_KEY },
  });
  const data = await res.json();
  if (data.errors && Object.keys(data.errors).length) {
    console.error('API error:', data.errors);
    process.exit(1);
  }

  const leagueStage = data.response.filter(f => /^League Stage - \d+$/.test(f.league.round));
  console.log(`League Stage fixtures: ${leagueStage.length}`);

  // --- Build team roster from League Stage participants ---
  const teamsById = new Map(); // apiId -> { apiId, name, logo }
  leagueStage.forEach(f => {
    [f.teams.home, f.teams.away].forEach(t => {
      if (!teamsById.has(t.id)) teamsById.set(t.id, { apiId: t.id, name: t.name, logo: t.logo });
    });
  });
  console.log(`Unique teams: ${teamsById.size}`);

  // --- Real final standings (from actual results) to derive a meaningful rank/rating ---
  const table = new Map();
  for (const t of teamsById.values()) table.set(t.apiId, { apiId: t.apiId, pts: 0, gd: 0, gf: 0 });
  leagueStage.forEach(f => {
    if (f.goals.home == null || f.goals.away == null) return;
    const h = table.get(f.teams.home.id), a = table.get(f.teams.away.id);
    h.gf += f.goals.home; a.gf += f.goals.away;
    h.gd += f.goals.home - f.goals.away; a.gd += f.goals.away - f.goals.home;
    if (f.goals.home > f.goals.away) h.pts += 3;
    else if (f.goals.home < f.goals.away) a.pts += 3;
    else { h.pts += 1; a.pts += 1; }
  });
  const standings = [...table.values()].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  const rankByApiId = new Map(standings.map((s, i) => [s.apiId, i + 1]));

  // --- Short internal IDs: derived from team name initials, de-duplicated ---
  const usedIds = new Set();
  const shortId = (name) => {
    const words = name.replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    let base = words.length === 1 ? words[0].slice(0, 3).toUpperCase() : words.map(w => w[0]).join('').slice(0, 4).toUpperCase();
    if (base.length < 2) base = name.slice(0, 3).toUpperCase();
    let id = base, n = 1;
    while (usedIds.has(id)) { id = base + (++n); }
    usedIds.add(id);
    return id;
  };

  const idByApiId = new Map();
  const teamRows = [...teamsById.values()].map(t => {
    const id = shortId(t.name);
    idByApiId.set(t.apiId, id);
    const rank = rankByApiId.get(t.apiId);
    const rating = Math.round(95 - (rank - 1) * (35 / 35)); // linear 95 -> 60 across 36 ranks
    return {
      id, name: t.name, flag: t.logo,
      rank, rating,
      att: Math.min(99, rating + 2), mid: rating, def: Math.max(1, rating - 2),
      overview: `Qualified for the 2026/27 UEFA Champions League league phase.`,
      iso_code: '', region: '',
    };
  });

  // --- Matches: real pairings/home-away per matchday, re-dated onto the real 2026/27 windows ---
  const byMatchday = new Map();
  leagueStage.forEach(f => {
    const md = parseInt(f.league.round.match(/\d+$/)[0], 10);
    if (!byMatchday.has(md)) byMatchday.set(md, []);
    byMatchday.get(md).push(f);
  });

  const matchRows = [];
  for (let md = 1; md <= 8; md++) {
    const fixtures = byMatchday.get(md) || [];
    const days = MATCHDAY_WINDOWS[md];
    fixtures.forEach((f, i) => {
      const day = days[i % days.length];
      const time = KICKOFF_TIMES[i % KICKOFF_TIMES.length];
      matchRows.push({
        id: `LP-${md}-${String(i + 1).padStart(2, '0')}`,
        group_id: null,
        round: null,
        matchday: md,
        date: `${day}T${time}`,
        venue: 'TBD',
        home_team_id: idByApiId.get(f.teams.home.id),
        away_team_id: idByApiId.get(f.teams.away.id),
        home_score: null,
        away_score: null,
        status: 'UPCOMING',
        is_locked: false,
      });
    });
  }

  // --- Validate: 36 teams, 144 matches, every team plays exactly 8 distinct opponents ---
  if (teamRows.length !== 36) throw new Error(`Expected 36 teams, got ${teamRows.length}`);
  if (matchRows.length !== 144) throw new Error(`Expected 144 matches, got ${matchRows.length}`);
  const opponentsSeen = {};
  teamRows.forEach(t => { opponentsSeen[t.id] = new Set(); });
  matchRows.forEach(m => {
    opponentsSeen[m.home_team_id].add(m.away_team_id);
    opponentsSeen[m.away_team_id].add(m.home_team_id);
  });
  Object.entries(opponentsSeen).forEach(([id, set]) => {
    if (set.size !== 8) throw new Error(`Team ${id} has ${set.size} distinct opponents, expected 8`);
  });
  console.log('✅ Validated: 36 teams, 144 matches, every team plays exactly 8 distinct real opponents.');

  fs.writeFileSync('real-cl-2024-teams.json', JSON.stringify(teamRows, null, 2));
  fs.writeFileSync('real-cl-2024-matches.json', JSON.stringify(matchRows, null, 2));
  console.log('Written to real-cl-2024-teams.json / real-cl-2024-matches.json');
  console.log('\nSample team:', teamRows[0]);
  console.log('Sample match:', matchRows[0]);
}

main().catch(e => { console.error(e); process.exit(1); });
