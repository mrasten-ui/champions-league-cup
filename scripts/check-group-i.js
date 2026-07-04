import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ids = ['I1','I2','I3','I4','I5','I6'];
const { data } = await supabase.from('predictions').select('match_id,home,away')
  .eq('user_id','mrasten@gmail.com').in('match_id', ids);

const labels = { I1:'FRA vs SEN', I2:'IRQ vs NOR', I3:'FRA vs IRQ', I4:'NOR vs SEN', I5:'NOR vs FRA', I6:'SEN vs IRQ' };
console.log('\nGroup I predictions for mrasten@gmail.com:\n');
ids.forEach(id => {
  const p = data?.find(r => r.match_id === id);
  const label = labels[id];
  if (p) {
    const [h, a] = label.split(' vs ');
    const winner = p.home > p.away ? h + ' wins' : p.away > p.home ? a + ' wins' : 'Draw';
    console.log(`  ${id}  ${label.padEnd(12)}  ${p.home}-${p.away}  (${winner})`);
  } else {
    console.log(`  ${id}  ${label.padEnd(12)}  (no prediction)`);
  }
});

// Compute implied standings
const teamMatches = {
  I1: ['FRA','SEN'], I2: ['IRQ','NOR'], I3: ['FRA','IRQ'],
  I4: ['NOR','SEN'], I5: ['NOR','FRA'], I6: ['SEN','IRQ']
};
const pts = { FRA:0, NOR:0, SEN:0, IRQ:0 };
const gd  = { FRA:0, NOR:0, SEN:0, IRQ:0 };
const gf  = { FRA:0, NOR:0, SEN:0, IRQ:0 };

data?.forEach(p => {
  const [h, a] = teamMatches[p.match_id];
  if (!h) return;
  gf[h] += p.home; gf[a] += p.away;
  gd[h] += p.home - p.away; gd[a] += p.away - p.home;
  if (p.home > p.away) pts[h] += 3;
  else if (p.away > p.home) pts[a] += 3;
  else { pts[h] += 1; pts[a] += 1; }
});

console.log('\nImplied Group I standings from your picks:\n');
const sorted = Object.entries(pts).sort(([ta,a],[tb,b]) => b - a || gd[tb] - gd[ta] || gf[tb] - gf[ta]);
sorted.forEach(([t, p], i) => {
  const marker = i === 0 ? '← I1 (goes to R32_5)' : i === 1 ? '← I2 (goes to R32_6 vs ECU)' : '';
  console.log(`  ${i+1}. ${t}  ${p}pts  GD:${gd[t]>=0?'+':''}${gd[t]}  ${marker}`);
});
