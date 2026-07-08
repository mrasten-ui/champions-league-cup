import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PROG = {
  'R32_1':{nextId:'R16_1',slot:'home'},'R32_2':{nextId:'R16_2',slot:'home'},
  'R32_3':{nextId:'R16_3',slot:'home'},'R32_4':{nextId:'R16_1',slot:'away'},
  'R32_5':{nextId:'R16_2',slot:'away'},'R32_6':{nextId:'R16_3',slot:'away'},
  'R32_7':{nextId:'R16_5',slot:'home'},'R32_8':{nextId:'R16_7',slot:'away'},
  'R32_9':{nextId:'R16_7',slot:'home'},'R32_10':{nextId:'R16_4',slot:'home'},
  'R32_11':{nextId:'R16_4',slot:'away'},'R32_12':{nextId:'R16_5',slot:'away'},
  'R32_13':{nextId:'R16_6',slot:'home'},'R32_14':{nextId:'R16_8',slot:'away'},
  'R32_15':{nextId:'R16_6',slot:'away'},'R32_16':{nextId:'R16_8',slot:'home'},
  'R16_1':{nextId:'QF_1',slot:'away'},'R16_2':{nextId:'QF_2',slot:'home'},
  'R16_3':{nextId:'QF_1',slot:'home'},'R16_4':{nextId:'QF_2',slot:'away'},
  'R16_5':{nextId:'QF_3',slot:'away'},'R16_6':{nextId:'QF_3',slot:'home'},
  'R16_7':{nextId:'QF_4',slot:'home'},'R16_8':{nextId:'QF_4',slot:'away'},
  'QF_1':{nextId:'SF_1',slot:'home'},'QF_2':{nextId:'SF_1',slot:'away'},
  'QF_3':{nextId:'SF_2',slot:'home'},'QF_4':{nextId:'SF_2',slot:'away'},
  'SF_1':{nextId:'FIN_1',slot:'home'},'SF_2':{nextId:'FIN_1',slot:'away'},
};
const SC_PTS   = {R32_START:3,R16:4,QF:6, SF:8, FIN:12,CHAMP:20};
const FULL_PTS = {R32_START:3,R16:8,QF:12,SF:16,FIN:24,CHAMP:40};

const [{ data: preds }, { data: realMatches }] = await Promise.all([
  sb.from('predictions').select('match_id,home,away,predicted_winner_id').eq('user_id','mrasten@gmail.com'),
  sb.from('matches').select('id,round,home_team_id,away_team_id,home_score,away_score').in('round',['R32','R16','QF','SF','FIN']).order('id'),
]);

function computeRealBracket(ms) {
  const byId = {};
  ms.forEach(m => byId[m.id] = {...m});
  for (const rnd of ['R32','R16','QF','SF']) {
    ms.filter(m=>m.round===rnd).forEach(m => {
      const p = PROG[m.id]; if (!p||m.home_score===null||m.away_score===null) return;
      const winner = m.home_score>m.away_score?m.home_team_id:m.away_team_id;
      const nm = byId[p.nextId]; if(!nm) return;
      if (p.slot==='home'){if(nm.home_team_id!==winner){nm.home_team_id=winner;nm.home_score=null;nm.away_score=null;}}
      else {if(nm.away_team_id!==winner){nm.away_team_id=winner;nm.home_score=null;nm.away_score=null;}}
    });
  }
  return Object.values(byId);
}

function teamsInRound(ms, rnd) {
  const s = new Set();
  ms.filter(m=>m.round===(rnd==='R32_START'?'R32':rnd)).forEach(m=>{
    if(m.home_team_id&&!m.home_team_id.startsWith('TBD'))s.add(m.home_team_id);
    if(m.away_team_id&&!m.away_team_id.startsWith('TBD'))s.add(m.away_team_id);
  });
  return s;
}
function predictedTeams(feedPrefix) {
  const s = new Set();
  preds.forEach(p => {
    if(p.match_id.startsWith(feedPrefix+'_')&&p.predicted_winner_id&&!p.predicted_winner_id.startsWith('TBD'))
      s.add(p.predicted_winner_id);
  });
  return s;
}

const realBracket = computeRealBracket(realMatches);
const KO_ROUNDS = [
  {key:'R32_START',label:'Round of 32 qualifying',feed:null},
  {key:'R16',label:'Round of 16 qualifying',feed:'R32'},
  {key:'QF', label:'Quarter Finals qualifying',feed:'R16'},
  {key:'SF', label:'Semi Finals qualifying',feed:'QF'},
  {key:'FIN',label:'Final qualifying',feed:'SF'},
];

console.log('=== mrasten: same picks, WITH vs WITHOUT 50% SC penalty ===\n');
let totalSC=0, totalFull=0;

for (const r of KO_ROUNDS) {
  const realTeams = teamsInRound(realBracket, r.key);
  const userTeams = r.key==='R32_START' ? predictedTeams('R32') : predictedTeams(r.feed);
  const correct = [...userTeams].filter(t=>realTeams.has(t));
  const wrong   = [...userTeams].filter(t=>!realTeams.has(t));
  const ptsSC   = correct.length * SC_PTS[r.key];
  const ptsFull = correct.length * FULL_PTS[r.key];
  totalSC+=ptsSC; totalFull+=ptsFull;
  console.log(r.label + ': ' + correct.length + '/' + userTeams.size);
  console.log('  Correct: [' + correct.join(', ') + ']');
  console.log('  Not confirmed/wrong: [' + wrong.join(', ') + ']');
  console.log('  SC pts: +' + ptsSC + '  |  Full pts: +' + ptsFull);
  console.log();
}

const champPred = preds.find(p=>p.match_id==='FIN_1');
const userChamp = champPred?.predicted_winner_id ?? null;
const fin = realBracket.find(m=>m.round==='FIN');
const realChamp = (fin&&fin.home_score!==null) ? (fin.home_score>fin.away_score?fin.home_team_id:fin.away_team_id) : null;
const champOk = realChamp&&userChamp&&realChamp===userChamp;
console.log('Champion: you picked ' + (userChamp||'?') + '  |  real champ: ' + (realChamp||'TBD (pending)'));
console.log('  SC: +' + (champOk?SC_PTS.CHAMP:0) + '  |  Full: +' + (champOk?FULL_PTS.CHAMP:0));
if(champOk){totalSC+=SC_PTS.CHAMP;totalFull+=FULL_PTS.CHAMP;}

console.log('\n--- Qualifying totals (KO bonus pts only, excl. match score predictions) ---');
console.log('With SC penalty (current):        ' + totalSC + ' pts');
console.log('Without SC penalty (hypothetical): ' + totalFull + ' pts');
console.log('Penalty cost so far:              -' + (totalFull-totalSC) + ' pts');
