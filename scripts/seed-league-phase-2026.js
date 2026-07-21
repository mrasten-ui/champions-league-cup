import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// -----------------------------------------------------------------------
// Seeds the 2026/27 UEFA Champions League league phase: 36 teams + an
// 8-matchday schedule.
//
// IMPORTANT — this is placeholder data, not the real fixture list:
//   - 29 teams are the confirmed automatic qualifiers (cross-checked against
//     multiple sources as of July 2026: England 5, Spain 5, Germany 4,
//     Italy 4, France 3, Netherlands 2, Portugal 2, Belgium/Czechia/
//     Turkey/Ukraine 1 each = 29).
//   - The remaining 7 slots go to play-off round winners (5 Champions Path,
//     2 League Path) who aren't decided until August 2026 — seeded here as
//     TBDCP1-5 / TBDLP1-2 placeholders.
//   - The actual League Phase pairings are set by UEFA's Swiss-system draw
//     on 27 August 2026. The schedule below is a SYNTHETIC stand-in: a
//     round-robin circle-method schedule (first 8 of the 35 possible
//     rounds), which guarantees the one real structural constraint that
//     matters for testing — each team plays 8 different opponents, once
//     each, one match per matchday. It is NOT the real pairings.
//   - Matchday date windows (Sept 2026 - Jan 2027) are UEFA's announced
//     calendar and are real, but individual kickoff times within a window
//     are placeholder.
//
// Re-run this script once the real draw + fixture list are known to
// replace the synthetic pairings with the real ones.
// -----------------------------------------------------------------------

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: '.env.local' });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = process.argv.includes('--dry-run');

// --- 1. THE 36 TEAMS -----------------------------------------------------
// tier = a rough 1-99 "strength" placeholder used for rank/rating/att/mid/def.
// Confirmed clubs are grouped by association exactly as the 29 automatic
// qualifiers currently stand; TBD entries fill the 7 play-off slots.
const CONFIRMED_TEAMS = [
  // England (5)
  { id: 'ARS', name: 'Arsenal', city: 'London, England', tier: 92 },
  { id: 'MCI', name: 'Manchester City', city: 'Manchester, England', tier: 93 },
  { id: 'MUN', name: 'Manchester United', city: 'Manchester, England', tier: 84 },
  { id: 'AVL', name: 'Aston Villa', city: 'Birmingham, England', tier: 82 },
  { id: 'LIV', name: 'Liverpool', city: 'Liverpool, England', tier: 91 },
  // Spain (5)
  { id: 'BAR', name: 'Barcelona', city: 'Barcelona, Spain', tier: 92 },
  { id: 'RMA', name: 'Real Madrid', city: 'Madrid, Spain', tier: 94 },
  { id: 'VIL', name: 'Villarreal', city: 'Villarreal, Spain', tier: 79 },
  { id: 'ATM', name: 'Atletico Madrid', city: 'Madrid, Spain', tier: 86 },
  { id: 'BET', name: 'Real Betis', city: 'Seville, Spain', tier: 77 },
  // Germany (4)
  { id: 'BAY', name: 'Bayern Munich', city: 'Munich, Germany', tier: 92 },
  { id: 'BVB', name: 'Borussia Dortmund', city: 'Dortmund, Germany', tier: 85 },
  { id: 'RBL', name: 'RB Leipzig', city: 'Leipzig, Germany', tier: 83 },
  { id: 'VFB', name: 'VfB Stuttgart', city: 'Stuttgart, Germany', tier: 79 },
  // Italy (4)
  { id: 'INT', name: 'Inter Milan', city: 'Milan, Italy', tier: 90 },
  { id: 'NAP', name: 'Napoli', city: 'Naples, Italy', tier: 86 },
  { id: 'ROM', name: 'Roma', city: 'Rome, Italy', tier: 80 },
  { id: 'COM', name: 'Como', city: 'Como, Italy', tier: 73 },
  // France (3)
  { id: 'PSG', name: 'Paris Saint-Germain', city: 'Paris, France', tier: 93 },
  { id: 'LEN', name: 'Lens', city: 'Lens, France', tier: 75 },
  { id: 'LIL', name: 'Lille', city: 'Lille, France', tier: 78 },
  // Netherlands (2)
  { id: 'PSV', name: 'PSV Eindhoven', city: 'Eindhoven, Netherlands', tier: 81 },
  { id: 'FEY', name: 'Feyenoord', city: 'Rotterdam, Netherlands', tier: 79 },
  // Portugal (2)
  { id: 'POR', name: 'Porto', city: 'Porto, Portugal', tier: 84 },
  { id: 'SCP', name: 'Sporting CP', city: 'Lisbon, Portugal', tier: 83 },
  // Belgium (1)
  { id: 'CLB', name: 'Club Brugge', city: 'Bruges, Belgium', tier: 78 },
  // Czechia (1)
  { id: 'SLA', name: 'Slavia Praha', city: 'Prague, Czechia', tier: 74 },
  // Turkey (1)
  { id: 'GAL', name: 'Galatasaray', city: 'Istanbul, Turkey', tier: 81 },
  // Ukraine (1)
  { id: 'SHA', name: 'Shakhtar Donetsk', city: 'Neutral venue (Ukraine)', tier: 76 },
];

const TBD_TEAMS = [
  { id: 'TBDCP1', name: 'TBD (Champions Path Winner 1)', city: 'TBD', tier: 68 },
  { id: 'TBDCP2', name: 'TBD (Champions Path Winner 2)', city: 'TBD', tier: 68 },
  { id: 'TBDCP3', name: 'TBD (Champions Path Winner 3)', city: 'TBD', tier: 68 },
  { id: 'TBDCP4', name: 'TBD (Champions Path Winner 4)', city: 'TBD', tier: 68 },
  { id: 'TBDCP5', name: 'TBD (Champions Path Winner 5)', city: 'TBD', tier: 68 },
  { id: 'TBDLP1', name: 'TBD (League Path Winner 1)', city: 'TBD', tier: 68 },
  { id: 'TBDLP2', name: 'TBD (League Path Winner 2)', city: 'TBD', tier: 68 },
];

const ALL_TEAMS = [...CONFIRMED_TEAMS, ...TBD_TEAMS];
if (ALL_TEAMS.length !== 36) throw new Error(`Expected 36 teams, got ${ALL_TEAMS.length}`);

const clamp = (n) => Math.max(1, Math.min(99, n));

const teamRows = [...ALL_TEAMS]
  .sort((a, b) => b.tier - a.tier)
  .map((t, i) => ({
    id: t.id,
    name: t.name,
    flag: '',
    rank: i + 1,
    rating: t.tier,
    att: clamp(t.tier + 2),
    mid: t.tier,
    def: clamp(t.tier - 2),
    overview: t.id.startsWith('TBD')
      ? 'Play-off round slot — confirmed once the 2026/27 play-off round concludes in August 2026.'
      : 'Qualified for the 2026/27 UEFA Champions League league phase.',
    iso_code: '',
    region: t.city,
  }));

// --- 2. SCHEDULE GENERATION (round-robin circle method) ------------------
// Interleave 4 "pots" of 9 teams (strongest -> weakest) so early matchdays
// aren't systematically big-club-vs-big-club only.
const byTier = [...ALL_TEAMS].sort((a, b) => b.tier - a.tier).map(t => t.id);
const pots = [0, 1, 2, 3].map(p => byTier.slice(p * 9, p * 9 + 9));
const order = [];
for (let i = 0; i < 9; i++) for (const pot of pots) order.push(pot[i]);

// Standard circle-method round-robin: fix order[0], rotate the rest.
function roundRobinRounds(ids, numRounds) {
  const n = ids.length;
  const fixed = ids[0];
  let rotating = ids.slice(1);
  const rounds = [];
  for (let r = 0; r < numRounds; r++) {
    const current = [fixed, ...rotating];
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = current[i];
      const b = current[n - 1 - i];
      // Alternate home/away by round parity for rough 4-home/4-away balance.
      pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
  }
  return rounds;
}

const rounds = roundRobinRounds(order, 8);

// --- 3. MATCHDAY DATE WINDOWS (UEFA's announced 2026/27 calendar) --------
// Real windows; kickoff times within each window are placeholder.
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

const matchRows = [];
rounds.forEach((pairs, roundIdx) => {
  const matchday = roundIdx + 1;
  const days = MATCHDAY_WINDOWS[matchday];
  pairs.forEach(([home, away], i) => {
    const day = days[i % days.length];
    const time = KICKOFF_TIMES[i % KICKOFF_TIMES.length];
    matchRows.push({
      id: `LP-${matchday}-${String(i + 1).padStart(2, '0')}`,
      group_id: null,
      round: null,
      matchday,
      date: `${day}T${time}`,
      venue: 'TBD',
      home_team_id: home,
      away_team_id: away,
      home_score: null,
      away_score: null,
      status: 'UPCOMING',
      is_locked: false,
    });
  });
});

// --- 4. VALIDATION ---------------------------------------------------------
const opponentsSeen = {};
ALL_TEAMS.forEach(t => { opponentsSeen[t.id] = new Set(); });
matchRows.forEach(m => {
  if (opponentsSeen[m.home_team_id].has(m.away_team_id) || opponentsSeen[m.away_team_id].has(m.home_team_id)) {
    throw new Error(`Duplicate opponent pairing detected: ${m.home_team_id} vs ${m.away_team_id}`);
  }
  opponentsSeen[m.home_team_id].add(m.away_team_id);
  opponentsSeen[m.away_team_id].add(m.home_team_id);
});
Object.entries(opponentsSeen).forEach(([id, set]) => {
  if (set.size !== 8) throw new Error(`Team ${id} has ${set.size} distinct opponents, expected 8`);
});
console.log(`✅ Validated: ${matchRows.length} matches, every team plays exactly 8 distinct opponents.`);

// --- 5. WRITE --------------------------------------------------------------
async function run() {
  if (DRY_RUN) {
    console.log(`🧪 Dry run — would upsert ${teamRows.length} teams and ${matchRows.length} matches.`);
    console.log('Sample team:', teamRows[0]);
    console.log('Sample match:', matchRows[0]);
    return;
  }

  console.log(`🌍 Upserting ${teamRows.length} teams...`);
  const { error: teamsError } = await supabase.from('teams').upsert(teamRows, { onConflict: 'id' });
  if (teamsError) { console.error('❌ Team upsert failed:', teamsError.message); process.exit(1); }

  console.log(`🗓️  Upserting ${matchRows.length} League Phase matches...`);
  const { error: matchesError } = await supabase.from('matches').upsert(matchRows, { onConflict: 'id' });
  if (matchesError) { console.error('❌ Match upsert failed:', matchesError.message); process.exit(1); }

  console.log('✅ Done. Teams + League Phase schedule seeded.');
}

run();
