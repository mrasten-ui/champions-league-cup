// Pulls the REAL 2026/27 UEFA Champions League League Phase — the actual draw held
// Aug 27, 2026 — directly from UEFA's own public match/draw APIs (no API key needed;
// these are the same endpoints uefa.com's own fixtures page calls). Produces the same
// real-cl-2026-teams.json / real-cl-2026-matches.json shape as the earlier 2024/25
// pull script, so it plugs into the same seed-real-cl-2026.js loader.
import fs from 'fs';
import path from 'path';

const DRAW_URL = 'https://fsp-draw-service.uefa.com/v1/draws?drawId=6da15cf2-3c1f-47fa-83ab-bce3f0986647&optionalFields=GROUPS%2CPOTS%2CROUNDS%2CTEAMS';
const MATCHES_URL = 'https://match.uefa.com/v5/matches?competitionId=1&fromDate=2026-09-01&limit=200&offset=0&order=ASC&phase=ALL&seasonYear=2027&toDate=2027-02-01&utcOffset=1';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://www.uefa.com/',
};

async function main() {
  const drawRes = await fetch(DRAW_URL, { headers: HEADERS });
  if (!drawRes.ok) throw new Error(`Draw fetch failed: ${drawRes.status}`);
  const draw = await drawRes.json();
  const pots = draw[0].rounds[0].pots; // 4 pots x 9 teams, in strength order — used for rank/rating only
  const rankByTeamId = new Map();
  pots.forEach((pot, potIdx) => {
    pot.teams.forEach((t, i) => rankByTeamId.set(t.id, potIdx * 9 + i + 1));
  });

  const matchesRes = await fetch(MATCHES_URL, { headers: HEADERS });
  if (!matchesRes.ok) throw new Error(`Matches fetch failed: ${matchesRes.status}`);
  const matches = await matchesRes.json();
  console.log(`Matches fetched: ${matches.length}`);

  // --- Teams: use UEFA's own team codes directly as our internal ids (already unique) ---
  const teamsById = new Map(); // uefaTeamId -> { id, name, logo }
  matches.forEach(m => {
    [m.homeTeam, m.awayTeam].forEach(t => {
      if (!teamsById.has(t.id)) teamsById.set(t.id, { uefaId: t.id, id: t.teamCode, name: t.internationalName, logo: t.bigLogoUrl || t.logoUrl });
    });
  });
  if (teamsById.size !== 36) throw new Error(`Expected 36 teams, got ${teamsById.size}`);

  const teamRows = [...teamsById.values()].map(t => {
    const rank = rankByTeamId.get(t.uefaId) ?? 36;
    const rating = Math.round(95 - (rank - 1) * (35 / 35));
    return {
      id: t.id, name: t.name, flag: t.logo,
      rank, rating,
      att: Math.min(99, rating + 2), mid: rating, def: Math.max(1, rating - 2),
      overview: `Qualified for the 2026/27 UEFA Champions League league phase.`,
      iso_code: '', region: '',
    };
  });

  // --- Matches: real matchday/date/pairing, straight from UEFA, re-indexed onto our LP-{md}-{idx} ids ---
  const byMatchday = new Map();
  matches.forEach(m => {
    const md = parseInt(m.matchday.sequenceNumber, 10);
    if (!byMatchday.has(md)) byMatchday.set(md, []);
    byMatchday.get(md).push(m);
  });

  const matchRows = [];
  for (let md = 1; md <= 8; md++) {
    const fixtures = (byMatchday.get(md) || []).sort((a, b) => new Date(a.kickOffTime.dateTime) - new Date(b.kickOffTime.dateTime));
    fixtures.forEach((m, i) => {
      matchRows.push({
        id: `LP-${md}-${String(i + 1).padStart(2, '0')}`,
        group_id: null,
        round: null,
        matchday: md,
        date: m.kickOffTime.dateTime,
        venue: 'TBD',
        home_team_id: teamsById.get(m.homeTeam.id).id,
        away_team_id: teamsById.get(m.awayTeam.id).id,
        home_score: null,
        away_score: null,
        status: 'UPCOMING',
        is_locked: false,
      });
    });
  }

  // --- Validate: 36 teams, 144 matches, every team plays exactly 8 distinct real opponents ---
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

  const dataDir = path.resolve(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'real-cl-2026-teams.json'), JSON.stringify(teamRows, null, 2));
  fs.writeFileSync(path.join(dataDir, 'real-cl-2026-matches.json'), JSON.stringify(matchRows, null, 2));
  console.log('Written to data/real-cl-2026-teams.json / data/real-cl-2026-matches.json');
  console.log('\nSample team:', teamRows[0]);
  console.log('Sample match:', matchRows[0]);
}

main().catch(e => { console.error(e); process.exit(1); });
