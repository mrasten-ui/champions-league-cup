import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 1. Setup Supabase
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 2. THE PROJECTED TEAMS (Real Stats + Ranks)
const TEAMS_DATA = [
  // GROUP A
  { id: 'MEX', name: 'Mexico', rank: 16, att: 79, mid: 78, def: 77, style: 'Possession' },
  { id: 'RSA', name: 'South Africa', rank: 61, att: 73, mid: 72, def: 70, style: 'Counter Attack' },
  { id: 'KOR', name: 'Korea Republic', rank: 22, att: 81, mid: 79, def: 76, style: 'High Press' },
  { id: 'CZE', name: 'Czechia', rank: 44, att: 76, mid: 77, def: 75, style: 'Physical' },
  // GROUP B
  { id: 'CAN', name: 'Canada', rank: 27, att: 79, mid: 77, def: 75, style: 'Direct' },
  { id: 'SRB', name: 'Serbia', rank: 32, att: 80, mid: 78, def: 76, style: 'Physical' },
  { id: 'QAT', name: 'Qatar', rank: 53, att: 72, mid: 73, def: 71, style: 'Possession' },
  { id: 'SUI', name: 'Switzerland', rank: 18, att: 78, mid: 81, def: 83, style: 'Low Block' },
  // GROUP C
  { id: 'DEN', name: 'Denmark', rank: 21, att: 80, mid: 82, def: 81, style: 'Balanced' },
  { id: 'SCO', name: 'Scotland', rank: 36, att: 75, mid: 79, def: 78, style: 'Low Block' },
  { id: 'BRA', name: 'Brazil', rank: 5, att: 89, mid: 87, def: 84, style: 'Possession' },
  { id: 'MAR', name: 'Morocco', rank: 8, att: 81, mid: 84, def: 87, style: 'Balanced' },
  // GROUP D
  { id: 'USA', name: 'USA', rank: 14, att: 80, mid: 81, def: 78, style: 'High Press' },
  { id: 'PAR', name: 'Paraguay', rank: 38, att: 74, mid: 75, def: 76, style: 'Physical' },
  { id: 'AUS', name: 'Australia', rank: 26, att: 75, mid: 76, def: 77, style: 'Direct' },
  { id: 'NGA', name: 'Nigeria', rank: 30, att: 78, mid: 75, def: 72, style: 'Counter Attack' },
  // GROUP E
  { id: 'GER', name: 'Germany', rank: 10, att: 85, mid: 87, def: 84, style: 'High Press' },
  { id: 'ITA', name: 'Italy', rank: 9, att: 83, mid: 86, def: 85, style: 'Tactical' },
  { id: 'CIV', name: 'Ivory Coast', rank: 42, att: 79, mid: 78, def: 76, style: 'Physical' },
  { id: 'ECU', name: 'Ecuador', rank: 23, att: 77, mid: 79, def: 78, style: 'High Press' },
  // GROUP F
  { id: 'NED', name: 'Netherlands', rank: 7, att: 84, mid: 86, def: 87, style: 'Possession' },
  { id: 'JPN', name: 'Japan', rank: 19, att: 80, mid: 82, def: 78, style: 'Counter Attack' },
  { id: 'ALB', name: 'Albania', rank: 63, att: 71, mid: 73, def: 75, style: 'Low Block' },
  { id: 'TUN', name: 'Tunisia', rank: 41, att: 72, mid: 74, def: 75, style: 'Low Block' },
  // GROUP G
  { id: 'BEL', name: 'Belgium', rank: 9, att: 84, mid: 87, def: 80, style: 'Possession' },
  { id: 'EGY', name: 'Egypt', rank: 35, att: 80, mid: 75, def: 73, style: 'Counter Attack' },
  { id: 'IRN', name: 'Iran', rank: 20, att: 78, mid: 76, def: 77, style: 'Low Block' },
  { id: 'NZL', name: 'New Zealand', rank: 87, att: 69, mid: 68, def: 69, style: 'Physical' },
  // GROUP H
  { id: 'ESP', name: 'Spain', rank: 1, att: 86, mid: 90, def: 86, style: 'Possession' },
  { id: 'CPV', name: 'Cabo Verde', rank: 67, att: 73, mid: 71, def: 70, style: 'Counter Attack' },
  { id: 'KSA', name: 'Saudi Arabia', rank: 60, att: 74, mid: 73, def: 71, style: 'High Press' },
  { id: 'URU', name: 'Uruguay', rank: 17, att: 83, mid: 84, def: 83, style: 'Direct' },
  // GROUP I
  { id: 'FRA', name: 'France', rank: 3, att: 92, mid: 89, def: 88, style: 'Balanced' },
  { id: 'SEN', name: 'Senegal', rank: 12, att: 82, mid: 80, def: 83, style: 'Physical' },
  { id: 'CHI', name: 'Chile', rank: 40, att: 74, mid: 75, def: 73, style: 'High Press' },
  { id: 'NOR', name: 'Norway', rank: 29, att: 87, mid: 79, def: 75, style: 'Direct' },
  // GROUP J
  { id: 'ARG', name: 'Argentina', rank: 2, att: 91, mid: 88, def: 85, style: 'Possession' },
  { id: 'ALG', name: 'Algeria', rank: 34, att: 78, mid: 77, def: 75, style: 'Technical' },
  { id: 'AUT', name: 'Austria', rank: 24, att: 77, mid: 80, def: 78, style: 'High Press' },
  { id: 'IRQ', name: 'Iraq', rank: 58, att: 72, mid: 70, def: 69, style: 'Low Block' },
  // GROUP K
  { id: 'POR', name: 'Portugal', rank: 6, att: 88, mid: 89, def: 84, style: 'Possession' },
  { id: 'COD', name: 'Congo DR', rank: 56, att: 75, mid: 73, def: 72, style: 'Physical' },
  { id: 'UZB', name: 'Uzbekistan', rank: 50, att: 71, mid: 72, def: 70, style: 'Balanced' },
  { id: 'COL', name: 'Colombia', rank: 13, att: 83, mid: 80, def: 79, style: 'Counter Attack' },
  // GROUP L
  { id: 'ENG', name: 'England', rank: 4, att: 89, mid: 90, def: 85, style: 'Balanced' },
  { id: 'CRO', name: 'Croatia', rank: 11, att: 78, mid: 85, def: 82, style: 'Possession' },
  { id: 'GHA', name: 'Ghana', rank: 72, att: 76, mid: 75, def: 73, style: 'Counter Attack' },
  { id: 'PAN', name: 'Panama', rank: 30, att: 72, mid: 71, def: 71, style: 'Physical' },
];

const GROUP_CONFIG = [
  { id: 'A', teams: ['MEX', 'RSA', 'KOR', 'CZE'] },
  { id: 'B', teams: ['CAN', 'SRB', 'QAT', 'SUI'] },
  { id: 'C', teams: ['DEN', 'SCO', 'BRA', 'MAR'] },
  { id: 'D', teams: ['USA', 'PAR', 'AUS', 'NGA'] },
  { id: 'E', teams: ['GER', 'ITA', 'CIV', 'ECU'] },
  { id: 'F', teams: ['NED', 'JPN', 'ALB', 'TUN'] },
  { id: 'G', teams: ['BEL', 'EGY', 'IRN', 'NZL'] },
  { id: 'H', teams: ['ESP', 'CPV', 'KSA', 'URU'] },
  { id: 'I', teams: ['FRA', 'SEN', 'CHI', 'NOR'] },
  { id: 'J', teams: ['ARG', 'ALG', 'AUT', 'IRQ'] },
  { id: 'K', teams: ['POR', 'COD', 'UZB', 'COL'] },
  { id: 'L', teams: ['ENG', 'CRO', 'GHA', 'PAN'] }
];

async function seedMasterPlan() {
  console.log('🚀 STARTING MASTER SEED...');

  // --- STEP 1: UPSERT TEAMS ---
  console.log('🌍 1. Updating Teams Table...');
  for (const team of TEAMS_DATA) {
    const ovr = Math.round((team.att + team.mid + team.def) / 3);
    const { error } = await supabase.from('teams').upsert({
      id: team.id,
      name: team.name,
      rank: team.rank,
      rating: ovr,
      att: team.att,
      mid: team.mid,
      def: team.def,
      flag: `https://flagcdn.com/w320/${team.id === 'ENG' ? 'gb-eng' : team.id === 'SCO' ? 'gb-sct' : team.id.toLowerCase().slice(0, 2)}.png`
    });
    if (error) console.error(`❌ Team Error (${team.id}):`, error.message);
  }

  // --- STEP 2: UPSERT TACTICS ---
  console.log('📊 2. Updating Tactics Table...');
  for (const team of TEAMS_DATA) {
    let pace = team.att; let phys = team.def; let tech = team.mid;
    if (team.style === 'Counter Attack') { pace += 8; tech -= 4; }
    if (team.style === 'Physical') { phys += 8; tech -= 5; }
    if (team.style === 'Possession') { tech += 8; pace -= 5; }
    if (team.style === 'Direct') { pace += 5; phys += 5; tech -= 5; }
    if (team.style === 'Tactical') { tech += 10; phys -= 5; }

    const { error } = await supabase.from('team_tactics').upsert({
      team_id: team.id,
      style: team.style,
      att: team.att,
      mid: team.mid,
      def: team.def,
      pace: Math.min(99, pace),
      phys: Math.min(99, phys),
      tech: Math.min(99, tech)
    });
    if (error) console.error(`❌ Tactics Error (${team.id}):`, error.message);
  }

  // --- STEP 3: RESET & SEED SCHEDULE ---
  console.log('🗓️  3. Rebuilding Match Schedule...');
  await supabase.from('matches').delete().neq('id', 'PLACEHOLDER');

  const matches = [];
  
  // Group Matches
  for (const group of GROUP_CONFIG) {
    const [t1, t2, t3, t4] = group.teams;
    matches.push(createMatch(`${group.id}1`, group.id, t1, t2, '2026-06-11'));
    matches.push(createMatch(`${group.id}2`, group.id, t3, t4, '2026-06-11'));
    matches.push(createMatch(`${group.id}3`, group.id, t1, t3, '2026-06-15'));
    matches.push(createMatch(`${group.id}4`, group.id, t4, t2, '2026-06-15'));
    matches.push(createMatch(`${group.id}5`, group.id, t4, t1, '2026-06-19'));
    matches.push(createMatch(`${group.id}6`, group.id, t2, t3, '2026-06-19'));
  }

  // Knockout Matches
  const rounds = ['R32', 'R16', 'QF', 'SF', '3RD', 'FIN'];
  const counts = [16, 8, 4, 2, 1, 1];
  rounds.forEach((round, idx) => {
    const count = counts[idx];
    for (let i = 1; i <= count; i++) {
      let nextMatchId = null;
      if (round === 'R32') nextMatchId = `R16_${Math.ceil(i/2)}`;
      else if (round === 'R16') nextMatchId = `QF_${Math.ceil(i/2)}`;
      else if (round === 'QF') nextMatchId = `SF_${Math.ceil(i/2)}`;
      else if (round === 'SF') nextMatchId = `FIN_1`;

      matches.push({
        id: `${round}_${i}`,
        group_id: null,
        round: round,
        home_team_id: 'TBD',
        away_team_id: 'TBD',
        home_score: null,
        away_score: null,
        date: '2026-07-01',
        venue: 'TBD',
        status: 'UPCOMING',
        is_locked: false,
        next_match_id: nextMatchId,
        channels: { EN: 'FOX' }
      });
    }
  });

  // Batch Insert
  const chunkSize = 50;
  for (let i = 0; i < matches.length; i += chunkSize) {
    const chunk = matches.slice(i, i + chunkSize);
    const { error } = await supabase.from('matches').insert(chunk);
    if (error) console.error(`❌ Match Insert Error:`, error.message);
  }

  console.log('✅ MASTER SEED COMPLETE! Please refresh your app.');
}

function createMatch(id, groupId, home, away, date) {
  return {
    id,
    group_id: groupId,
    round: null,
    home_team_id: home,
    away_team_id: away,
    home_score: null,
    away_score: null,
    date,
    venue: 'Stadium',
    status: 'UPCOMING',
    is_locked: false,
    channels: { EN: 'FOX', NO: 'NRK' }
  };
}

seedMasterPlan();