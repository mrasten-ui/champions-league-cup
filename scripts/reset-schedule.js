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

// 2. THE NEW REALISTIC GROUPS (Must match constants.ts)
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

async function resetSchedule() {
  console.log('🗑️  Clearing old matches...');
  const { error: deleteError } = await supabase.from('matches').delete().neq('id', 'PLACEHOLDER');
  if (deleteError) console.error('Delete Error:', deleteError.message);

  console.log('📅 Generating new schedule with Real Teams...');
  const matches = [];
  let matchCounter = 0;

  // --- GENERATE GROUP MATCHES (Real Teams) ---
  for (const group of GROUP_CONFIG) {
    const [t1, t2, t3, t4] = group.teams;
    
    // Round 1
    matches.push(createMatch(`${group.id}1`, group.id, t1, t2, '2026-06-11'));
    matches.push(createMatch(`${group.id}2`, group.id, t3, t4, '2026-06-11'));
    
    // Round 2
    matches.push(createMatch(`${group.id}3`, group.id, t1, t3, '2026-06-15'));
    matches.push(createMatch(`${group.id}4`, group.id, t4, t2, '2026-06-15'));
    
    // Round 3
    matches.push(createMatch(`${group.id}5`, group.id, t4, t1, '2026-06-19'));
    matches.push(createMatch(`${group.id}6`, group.id, t2, t3, '2026-06-19'));
  }

  // --- GENERATE KNOCKOUT BRACKET (Placeholders) ---
  const rounds = ['R32', 'R16', 'QF', 'SF', '3RD', 'FIN'];
  const counts = [16, 8, 4, 2, 1, 1];

  rounds.forEach((round, idx) => {
    const count = counts[idx];
    for (let i = 1; i <= count; i++) {
      let nextMatchId = null;
      
      // Bracket Linking Logic
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
        date: '2026-07-01', // Dummy date
        venue: 'TBD',
        status: 'UPCOMING',
        is_locked: false,
        next_match_id: nextMatchId,
        channels: { EN: 'FOX' }
      });
    }
  });

  // --- BATCH INSERT ---
  // Supabase limits batch size, so we split chunks
  const chunkSize = 50;
  for (let i = 0; i < matches.length; i += chunkSize) {
    const chunk = matches.slice(i, i + chunkSize);
    const { error } = await supabase.from('matches').insert(chunk);
    if (error) console.error(`❌ Error inserting chunk ${i}:`, error.message);
    else console.log(`✅ Inserted matches ${i} to ${i + chunk.length}`);
  }

  console.log('🎉 Schedule Reset Complete! Reload your app.');
}

// Helper
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

resetSchedule();