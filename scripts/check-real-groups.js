/**
 * Check real group standings and R32 lineup from the actual DB match results.
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GROUP_CONFIG = [
  { id: 'A', teams: ['MEX', 'RSA', 'KOR', 'CZE'] },
  { id: 'B', teams: ['CAN', 'BIH', 'QAT', 'SUI'] },
  { id: 'C', teams: ['BRA', 'MAR', 'HAI', 'SCO'] },
  { id: 'D', teams: ['USA', 'PAR', 'AUS', 'TUR'] },
  { id: 'E', teams: ['GER', 'CUW', 'CIV', 'ECU'] },
  { id: 'F', teams: ['NED', 'JPN', 'SWE', 'TUN'] },
  { id: 'G', teams: ['BEL', 'EGY', 'IRN', 'NZL'] },
  { id: 'H', teams: ['ESP', 'CPV', 'KSA', 'URU'] },
  { id: 'I', teams: ['FRA', 'SEN', 'IRQ', 'NOR'] },
  { id: 'J', teams: ['ARG', 'ALG', 'AUT', 'JOR'] },
  { id: 'K', teams: ['POR', 'COD', 'UZB', 'COL'] },
  { id: 'L', teams: ['ENG', 'CRO', 'GHA', 'PAN'] },
];

// Fetch all finished group stage matches from DB
const { data: dbMatches } = await supabase
  .from('matches')
  .select('id, home_team_id, away_team_id, home_score, away_score, group_id, status')
  .not('group_id', 'is', null)
  .in('status', ['FT', 'AET', 'PEN', 'FINISHED', 'FT', 'AWD', 'WO']);

console.log(`\nReal group standings (from ${dbMatches?.length || 0} finished group matches)\n`);

for (const { id: gid, teams } of GROUP_CONFIG) {
  const s = {};
  teams.forEach(t => { s[t] = { teamId: t, pts: 0, gf: 0, ga: 0, gd: 0, w: 0 }; });

  (dbMatches || []).filter(m => m.group_id === gid && m.home_score !== null).forEach(m => {
    const h = s[m.home_team_id], a = s[m.away_team_id];
    if (!h || !a) return;
    h.gf += m.home_score; h.ga += m.away_score; h.gd = h.gf - h.ga;
    a.gf += m.away_score; a.ga += m.home_score; a.gd = a.gf - a.ga;
    if (m.home_score > m.away_score) { h.pts += 3; h.w++; }
    else if (m.away_score > m.home_score) { a.pts += 3; a.w++; }
    else { h.pts++; a.pts++; }
  });

  const sorted = Object.values(s).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  const ranks = sorted.map((t, i) => `${i+1}.${t.teamId}(${t.pts}pts)`).join('  ');
  console.log(`  Group ${gid}: ${ranks}`);
}

// Also show real R32 matchups from the DB
console.log('\nReal R32 matchups from DB:\n');
const { data: r32 } = await supabase
  .from('matches')
  .select('id, home_team_id, away_team_id, home_score, away_score, status')
  .like('id', 'R32_%')
  .order('id');

(r32 || []).forEach(m => {
  const score = m.home_score !== null ? `${m.home_score}-${m.away_score}` : 'upcoming';
  console.log(`  ${m.id.padEnd(8)}  ${(m.home_team_id||'TBD').padEnd(4)} vs ${(m.away_team_id||'TBD').padEnd(4)}  ${score}`);
});
