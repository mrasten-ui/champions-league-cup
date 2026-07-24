// Companion to pull-real-cl-2024.mjs — pulls the REAL final scores for the same
// 2024/25 League Phase fixtures, keyed by the exact same match IDs (LP-{md}-{idx})
// so they can be replayed onto the app's re-dated 2026/27 fixtures for admin
// "time travel" testing (see components/DebugTools.tsx). Must use the identical
// matchday/fixture-order assignment loop as pull-real-cl-2024.mjs or the IDs won't
// line up with what's actually seeded in Supabase.
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config({ path: '.env.local' });

const API_KEY = process.env.API_FOOTBALL_KEY;
const LEAGUE_ID = 2;
const SEASON = 2024;

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

  const byMatchday = new Map();
  leagueStage.forEach(f => {
    const md = parseInt(f.league.round.match(/\d+$/)[0], 10);
    if (!byMatchday.has(md)) byMatchday.set(md, []);
    byMatchday.get(md).push(f);
  });

  const results = {};
  let missing = 0;
  for (let md = 1; md <= 8; md++) {
    const fixtures = byMatchday.get(md) || [];
    fixtures.forEach((f, i) => {
      const id = `LP-${md}-${String(i + 1).padStart(2, '0')}`;
      if (f.goals.home == null || f.goals.away == null) { missing++; return; }
      results[id] = { home: f.goals.home, away: f.goals.away };
    });
  }

  console.log(`Results captured: ${Object.keys(results).length} (missing scores: ${missing})`);
  const outPath = path.resolve(process.cwd(), 'data', 'real-cl-2024-results.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Written to ${outPath}`);
  console.log('Sample:', Object.entries(results).slice(0, 3));
}

main().catch(e => { console.error(e); process.exit(1); });
