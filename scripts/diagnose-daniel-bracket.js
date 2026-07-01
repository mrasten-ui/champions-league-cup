import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Pagination helper
async function fetchAll(table, query) {
  let all = [];
  let from = 0;
  while (true) {
    const { data, error } = await query(supabase.from(table)).range(from, from + 999);
    if (error) throw error;
    all = all.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return all;
}

async function run() {
  // 1. Find Daniel by name
  const { data: profiles, error: pe } = await supabase
    .from('profiles')
    .select('email, name, bracket_predictions')
    .ilike('name', '%daniel%');
  if (pe) throw pe;

  console.log('\n=== Profiles matching "daniel" ===');
  profiles.forEach(p => console.log(`  ${p.name} <${p.email}>`));

  if (!profiles.length) {
    console.log('No Daniel found!');
    return;
  }

  const daniel = profiles[0];
  const email = daniel.email;
  console.log(`\nUsing: ${daniel.name} <${email}>`);

  // 2. Get all of Daniel's predictions
  const preds = await fetchAll('predictions', q =>
    q.select('match_id, home, away').eq('user_id', email)
  );
  console.log(`\nTotal predictions: ${preds.length}`);

  // 3. Get all matches (with team IDs)
  const matches = await fetchAll('matches', q =>
    q.select('id, round, home_team_id, away_team_id, home_score, away_score, status')
  );

  // 4. Build a match map
  const matchMap = {};
  matches.forEach(m => { matchMap[m.id] = m; });

  // 5. Show knockout predictions with team context
  const koPreds = preds.filter(p => /^R(32|16)|^QF|^SF|^FIN|^3RD/.test(p.match_id));
  koPreds.sort((a, b) => a.match_id.localeCompare(b.match_id));

  console.log('\n=== Daniel\'s Knockout Predictions ===');
  console.log('MatchID     | Home Team | Away Team | Daniel\'s Pick | Result');
  console.log('------------|-----------|-----------|---------------|-------');
  koPreds.forEach(p => {
    const m = matchMap[p.match_id];
    if (!m) return;
    const pick = p.home > p.away ? `HOME (${p.home}-${p.away})` :
                 p.away > p.home ? `AWAY (${p.home}-${p.away})` : `DRAW (${p.home}-${p.away})`;
    const homeId = m.home_team_id || 'TBD';
    const awayId = m.away_team_id || 'TBD';
    const result = m.home_score !== null
      ? `${m.home_score}-${m.away_score} (${m.status})`
      : m.status;
    console.log(`${p.match_id.padEnd(11)} | ${homeId.padEnd(9)} | ${awayId.padEnd(9)} | ${pick.padEnd(13)} | ${result}`);
  });

  // 6. Look for France and Brazil in any match
  console.log('\n=== Matches involving FRA or BRA in KO rounds ===');
  const frabraMatches = matches.filter(m =>
    m.round && (m.home_team_id === 'FRA' || m.away_team_id === 'FRA' ||
                m.home_team_id === 'BRA' || m.away_team_id === 'BRA')
  );
  frabraMatches.sort((a, b) => a.id.localeCompare(b.id));
  frabraMatches.forEach(m => {
    const pred = preds.find(p => p.match_id === m.id);
    const predStr = pred
      ? (pred.home > pred.away ? `Daniel picks HOME (${pred.home}-${pred.away})` :
         pred.away > pred.home ? `Daniel picks AWAY (${pred.home}-${pred.away})` : `Daniel picks DRAW`)
      : 'No prediction';
    console.log(`  ${m.id}: ${m.home_team_id || 'TBD'} vs ${m.away_team_id || 'TBD'} — ${predStr}`);
  });

  // 7. Also check bracketPredictions for group stage
  const bp = daniel.bracket_predictions;
  if (bp) {
    console.log('\n=== Daniel\'s bracketPredictions (group stage snapshot) ===');
    const groups = {};
    Object.entries(bp).forEach(([matchId, scores]) => {
      const group = matchId[0];
      if (!groups[group]) groups[group] = [];
      groups[group].push({ matchId, ...scores });
    });
    // Group I specifically (France's group)
    if (groups['I']) {
      console.log('Group I matches in snapshot:');
      groups['I'].forEach(m => {
        const match = matchMap[m.matchId];
        const homeId = match?.home_team_id || 'TBD';
        const awayId = match?.away_team_id || 'TBD';
        console.log(`  ${m.matchId}: ${homeId} vs ${awayId} — ${m.home}-${m.away}`);
      });
    }
    // Group C (Brazil's group)
    if (groups['C']) {
      console.log('Group C matches in snapshot:');
      groups['C'].forEach(m => {
        const match = matchMap[m.matchId];
        const homeId = match?.home_team_id || 'TBD';
        const awayId = match?.away_team_id || 'TBD';
        console.log(`  ${m.matchId}: ${homeId} vs ${awayId} — ${m.home}-${m.away}`);
      });
    }
  } else {
    console.log('\nNo bracketPredictions stored (no subs used).');
  }
}

run().catch(console.error);
