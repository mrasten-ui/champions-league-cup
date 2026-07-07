/**
 * Verify KO round scoring for all players.
 * Replicates the exact logic from getQualifiedRounds in engine.ts:
 *   - computedRealBracket via cascade from realMatches
 *   - userTeams via predictedWinnerId of feeding round
 *   - correctTeams = intersection
 * Shows every player's predicted teams vs real teams per KO round.
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Current PROGRESSION (post-fix)
const PROGRESSION = {
  'R32_1':  { nextId: 'R16_1', slot: 'home' },
  'R32_2':  { nextId: 'R16_2', slot: 'home' },
  'R32_3':  { nextId: 'R16_3', slot: 'home' },
  'R32_4':  { nextId: 'R16_1', slot: 'away' },
  'R32_5':  { nextId: 'R16_2', slot: 'away' },
  'R32_6':  { nextId: 'R16_3', slot: 'away' },
  'R32_7':  { nextId: 'R16_5', slot: 'home' },
  'R32_8':  { nextId: 'R16_7', slot: 'away' },
  'R32_9':  { nextId: 'R16_7', slot: 'home' },
  'R32_10': { nextId: 'R16_4', slot: 'away' },
  'R32_11': { nextId: 'R16_4', slot: 'home' },
  'R32_12': { nextId: 'R16_5', slot: 'away' },
  'R32_13': { nextId: 'R16_6', slot: 'home' },
  'R32_14': { nextId: 'R16_8', slot: 'away' },
  'R32_15': { nextId: 'R16_6', slot: 'away' },
  'R32_16': { nextId: 'R16_8', slot: 'home' },
  'R16_1':  { nextId: 'QF_1', slot: 'away' },
  'R16_2':  { nextId: 'QF_2', slot: 'home' },
  'R16_3':  { nextId: 'QF_1', slot: 'home' },
  'R16_4':  { nextId: 'QF_2', slot: 'away' },
  'R16_5':  { nextId: 'QF_3', slot: 'away' },
  'R16_6':  { nextId: 'QF_3', slot: 'home' },
  'R16_7':  { nextId: 'QF_4', slot: 'home' },
  'R16_8':  { nextId: 'QF_4', slot: 'away' },
  'QF_1':   { nextId: 'SF_1', slot: 'home' },
  'QF_2':   { nextId: 'SF_1', slot: 'away' },
  'QF_3':   { nextId: 'SF_2', slot: 'home' },
  'QF_4':   { nextId: 'SF_2', slot: 'away' },
  'SF_1':   { nextId: 'FIN_1', slot: 'home' },
  'SF_2':   { nextId: 'FIN_1', slot: 'away' },
};

const SCORING = { R16: 3, QF: 4, SF: 6, FIN: 8, CHAMP: 20 };
const FEEDING = { R16: 'R32', QF: 'R16', SF: 'QF', FIN: 'SF' };

// Cascade real match results using PROGRESSION, returns cloned match array with derived teams
function computeRealBracket(matches) {
  const byId = {};
  matches.forEach(m => { byId[m.id] = { ...m }; });

  ['R32','R16','QF','SF'].forEach(round => {
    matches.filter(m => m.round === round).forEach(match => {
      const prog = PROGRESSION[match.id];
      if (!prog) return;
      if (match.home_score === null || match.away_score === null) return;
      const winner = match.home_score > match.away_score ? match.home_team_id
                   : match.away_score > match.home_score ? match.away_team_id
                   : null; // draw shouldn't happen in KO
      if (!winner) return;
      const nm = byId[prog.nextId];
      if (!nm) return;
      if (prog.slot === 'home') {
        if (nm.home_team_id !== winner) { nm.home_team_id = winner; nm.home_score = null; nm.away_score = null; }
      } else {
        if (nm.away_team_id !== winner) { nm.away_team_id = winner; nm.home_score = null; nm.away_score = null; }
      }
    });
  });
  return Object.values(byId);
}

function getTeamsInRound(matches, round) {
  const set = new Set();
  matches.filter(m => m.round === round).forEach(m => {
    if (m.home_team_id && !m.home_team_id.startsWith('TBD')) set.add(m.home_team_id);
    if (m.away_team_id && !m.away_team_id.startsWith('TBD')) set.add(m.away_team_id);
  });
  return set;
}

function getChamp(matches) {
  const fin = matches.find(m => m.round === 'FIN' && m.id === 'FIN_1');
  if (!fin || fin.home_score === null) return null;
  return fin.home_score > fin.away_score ? fin.home_team_id : fin.away_team_id;
}

async function run() {
  const [{ data: matches, error: mErr }, { data: predictions, error: pErr }, { data: profiles, error: prErr }] = await Promise.all([
    supabase.from('matches').select('id,round,home_team_id,away_team_id,home_score,away_score,status').in('round',['R32','R16','QF','SF','FIN']).order('id'),
    supabase.from('predictions').select('user_id,match_id,home,away,predicted_winner_id'),
    supabase.from('profiles').select('*'),
  ]);
  if (mErr) { console.error('matches error:', mErr); process.exit(1); }
  if (pErr) { console.error('predictions error:', pErr); process.exit(1); }
  if (prErr) { console.error('profiles error:', prErr); process.exit(1); }
  if (!profiles || profiles.length === 0) { console.error('No profiles returned'); process.exit(1); }

  const realBracket = computeRealBracket(matches);

  // Show what the computed real bracket has in each KO round
  console.log('\n══ COMPUTED REAL BRACKET (cascade from DB) ══\n');
  for (const round of ['R16','QF','SF','FIN']) {
    const rMs = realBracket.filter(m => m.round === round).sort((a,b) => a.id.localeCompare(b.id));
    if (rMs.length === 0) continue;
    console.log(`── ${round} ──`);
    rMs.forEach(m => {
      const score = m.home_score !== null ? `${m.home_score}-${m.away_score}` : 'upcoming';
      const winner = m.home_score !== null
        ? (m.home_score > m.away_score ? m.home_team_id : m.away_team_id)
        : 'TBD';
      console.log(`  ${m.id.padEnd(8)} ${(m.home_team_id||'TBD').padEnd(4)} vs ${(m.away_team_id||'TBD').padEnd(4)}  ${score.padEnd(8)} → ${winner}`);
    });
    console.log();
  }

  const realTeamsByRound = {};
  for (const round of ['R16','QF','SF','FIN']) {
    realTeamsByRound[round] = getTeamsInRound(realBracket, round);
  }
  const realChamp = getChamp(realBracket);

  console.log('Real teams confirmed per round:');
  for (const round of ['R16','QF','SF','FIN']) {
    console.log(`  ${round}: [${[...realTeamsByRound[round]].join(', ')}]`);
  }
  console.log(`  CHAMP: ${realChamp ?? 'TBD'}`);

  // Per-player scoring breakdown
  const predsByUser = {};
  predictions.forEach(p => {
    if (!predsByUser[p.user_id]) predsByUser[p.user_id] = [];
    predsByUser[p.user_id].push(p);
  });

  console.log('\n══ PER-PLAYER KO SCORING ══\n');

  const KO_ROUNDS = ['R16','QF','SF','FIN'];
  const summary = [];

  for (const profile of profiles) {
    const preds = predsByUser[profile.email] ?? [];
    const isSC = !!profile.has_taken_second_chance;
    const penalty = isSC ? 0.5 : 1;

    let totalKO = 0;
    const roundDetails = [];

    for (const round of KO_ROUNDS) {
      const feedPrefix = FEEDING[round];
      const pts = Math.floor(SCORING[round] * penalty);

      // User's predicted teams for this round = predictedWinnerId of feeding round matches
      const userTeams = new Set(
        preds
          .filter(p => p.match_id.startsWith(feedPrefix + '_') && p.predicted_winner_id && !p.predicted_winner_id.startsWith('TBD'))
          .map(p => p.predicted_winner_id)
      );

      const realTeams = realTeamsByRound[round];
      const correct = [...userTeams].filter(t => realTeams.has(t));
      const pts_earned = correct.length * pts;
      totalKO += pts_earned;

      if (userTeams.size > 0 || realTeams.size > 0) {
        roundDetails.push({ round, userTeams: [...userTeams], correct, pts, pts_earned });
      }
    }

    // CHAMP
    const champPred = preds.find(p => p.match_id === 'FIN_1');
    const userChamp = champPred?.predicted_winner_id ?? null;
    const champPts = Math.floor(SCORING.CHAMP * penalty);
    let champCorrect = false;
    if (realChamp && userChamp && realChamp === userChamp && !realChamp.startsWith('TBD')) {
      champCorrect = true;
      totalKO += champPts;
    }

    summary.push({ name: profile.name || profile.id, isSC, totalKO, roundDetails, userChamp, champCorrect, champPts });
  }

  // Print results
  summary.sort((a,b) => b.totalKO - a.totalKO);
  summary.forEach(({ name, isSC, totalKO, roundDetails, userChamp, champCorrect, champPts }) => {
    console.log(`${name}${isSC ? ' [SC]' : ''}  →  KO total: ${totalKO} pts`);
    roundDetails.forEach(({ round, userTeams, correct, pts, pts_earned }) => {
      const realSet = realTeamsByRound[round];
      const miss = userTeams.filter(t => !realSet.has(t));
      const pending = userTeams.filter(t => !realSet.has(t) && realSet.size < 8); // rough pending check
      console.log(`  ${round.padEnd(4)} ${pts}pts×${userTeams.length} predicted | confirmed: [${correct.join(',')}] +${pts_earned}pts | not yet in: [${miss.join(',')}]`);
    });
    const champStr = champCorrect ? `✓ ${userChamp} +${champPts}` : `${userChamp ?? '?'} (no match)`;
    console.log(`  CHAMP: ${champStr}`);
    console.log();
  });

  // Sanity: list any player with MORE QF points than is mathematically possible
  console.log('══ SANITY CHECKS ══\n');
  const maxQF = 8 * SCORING.QF; // 8 teams × 4 pts
  summary.forEach(s => {
    const qf = s.roundDetails.find(r => r.round === 'QF');
    if (qf && qf.pts_earned > maxQF) {
      console.log(`⚠ ${s.name}: QF pts_earned ${qf.pts_earned} exceeds max ${maxQF}`);
    }
    // Check no team counted twice
    s.roundDetails.forEach(({ round, correct }) => {
      const unique = new Set(correct);
      if (unique.size !== correct.length) {
        console.log(`⚠ ${s.name}: duplicate team in ${round} correct list: [${correct.join(',')}]`);
      }
    });
  });
  console.log('Done.');
}

run().catch(console.error);
