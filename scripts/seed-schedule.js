import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: '.env.local' });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const VENUES = {
  AZTECA: "Estadio Azteca, Mexico City", AKRON: "Estadio Guadalajara, Zapopan", MONTERREY: "Estadio Monterrey, Guadalupe",
  TORONTO: "Toronto Stadium, Toronto", VANCOUVER: "BC Place, Vancouver", ATLANTA: "Atlanta Stadium, Atlanta",
  BOSTON: "Boston Stadium, Foxborough", DALLAS: "Dallas Stadium, Arlington", HOUSTON: "Houston Stadium, Houston",
  KC: "Kansas City Stadium, Kansas City", LA: "Los Angeles Stadium, Inglewood", MIAMI: "Miami Stadium, Miami Gardens",
  NYNJ: "New York New Jersey Stadium, East Rutherford", PHILLY: "Philadelphia Stadium, Philadelphia",
  SF: "San Francisco Bay Area Stadium, Santa Clara", SEATTLE: "Seattle Stadium, Seattle"
};

const GROUP_TEAMS = {
  A: ['MEX', 'RSA', 'KOR', 'CZE'], B: ['CAN', 'BIH', 'QAT', 'SUI'], C: ['BRA', 'MAR', 'HAI', 'SCO'],
  D: ['USA', 'PAR', 'AUS', 'TUR'], E: ['GER', 'CUW', 'CIV', 'ECU'], F: ['NED', 'JPN', 'SWE', 'TUN'],
  G: ['BEL', 'EGY', 'IRN', 'NZL'], H: ['ESP', 'CPV', 'KSA', 'URU'], I: ['FRA', 'SEN', 'IRQ', 'NOR'],
  J: ['ARG', 'ALG', 'AUT', 'JOR'], K: ['POR', 'COD', 'UZB', 'COL'], L: ['ENG', 'CRO', 'GHA', 'PAN']
};

const getGroupMatchups = (teams) => {
  const [t1, t2, t3, t4] = teams;
  return [
    { home: t1, away: t2 }, { home: t3, away: t4 }, { home: t1, away: t3 },
    { home: t4, away: t2 }, { home: t4, away: t1 }, { home: t2, away: t3 }
  ];
};

const GROUP_SCHEDULES = {
  A: [{ date: '2026-06-11T19:00:00Z', venue: VENUES.AZTECA }, { date: '2026-06-11T23:00:00Z', venue: VENUES.AKRON }, { date: '2026-06-18T23:00:00Z', venue: VENUES.AKRON }, { date: '2026-06-18T16:00:00Z', venue: VENUES.ATLANTA }, { date: '2026-06-24T23:00:00Z', venue: VENUES.AZTECA }, { date: '2026-06-24T23:00:00Z', venue: VENUES.MONTERREY }],
  B: [{ date: '2026-06-12T19:00:00Z', venue: VENUES.TORONTO }, { date: '2026-06-13T20:00:00Z', venue: VENUES.SF }, { date: '2026-06-18T22:00:00Z', venue: VENUES.VANCOUVER }, { date: '2026-06-18T19:00:00Z', venue: VENUES.LA }, { date: '2026-06-24T19:00:00Z', venue: VENUES.VANCOUVER }, { date: '2026-06-24T19:00:00Z', venue: VENUES.SEATTLE }],
  C: [{ date: '2026-06-13T19:00:00Z', venue: VENUES.BOSTON }, { date: '2026-06-13T23:00:00Z', venue: VENUES.NYNJ }, { date: '2026-06-19T23:00:00Z', venue: VENUES.PHILLY }, { date: '2026-06-19T19:00:00Z', venue: VENUES.BOSTON }, { date: '2026-06-24T22:00:00Z', venue: VENUES.MIAMI }, { date: '2026-06-24T22:00:00Z', venue: VENUES.ATLANTA }],
  D: [{ date: '2026-06-12T23:00:00Z', venue: VENUES.LA }, { date: '2026-06-13T23:00:00Z', venue: VENUES.VANCOUVER }, { date: '2026-06-19T22:00:00Z', venue: VENUES.SEATTLE }, { date: '2026-06-19T23:00:00Z', venue: VENUES.SF }, { date: '2026-06-25T23:00:00Z', venue: VENUES.LA }, { date: '2026-06-25T23:00:00Z', venue: VENUES.SF }],
  E: [{ date: '2026-06-14T17:00:00Z', venue: VENUES.HOUSTON }, { date: '2026-06-14T23:00:00Z', venue: VENUES.PHILLY }, { date: '2026-06-20T20:00:00Z', venue: VENUES.TORONTO }, { date: '2026-06-20T23:00:00Z', venue: VENUES.KC }, { date: '2026-06-25T20:00:00Z', venue: VENUES.NYNJ }, { date: '2026-06-25T20:00:00Z', venue: VENUES.PHILLY }],
  F: [{ date: '2026-06-14T19:00:00Z', venue: VENUES.DALLAS }, { date: '2026-06-14T23:00:00Z', venue: VENUES.MONTERREY }, { date: '2026-06-20T17:00:00Z', venue: VENUES.HOUSTON }, { date: '2026-06-20T23:00:00Z', venue: VENUES.MONTERREY }, { date: '2026-06-25T23:00:00Z', venue: VENUES.KC }, { date: '2026-06-25T23:00:00Z', venue: VENUES.DALLAS }],
  G: [{ date: '2026-06-15T19:00:00Z', venue: VENUES.SEATTLE }, { date: '2026-06-15T23:00:00Z', venue: VENUES.LA }, { date: '2026-06-21T19:00:00Z', venue: VENUES.LA }, { date: '2026-06-21T23:00:00Z', venue: VENUES.VANCOUVER }, { date: '2026-06-26T23:00:00Z', venue: VENUES.SEATTLE }, { date: '2026-06-26T23:00:00Z', venue: VENUES.VANCOUVER }],
  H: [{ date: '2026-06-15T16:00:00Z', venue: VENUES.ATLANTA }, { date: '2026-06-15T22:00:00Z', venue: VENUES.MIAMI }, { date: '2026-06-21T16:00:00Z', venue: VENUES.ATLANTA }, { date: '2026-06-21T22:00:00Z', venue: VENUES.MIAMI }, { date: '2026-06-26T20:00:00Z', venue: VENUES.AKRON }, { date: '2026-06-26T20:00:00Z', venue: VENUES.HOUSTON }],
  I: [{ date: '2026-06-16T19:00:00Z', venue: VENUES.NYNJ }, { date: '2026-06-16T22:00:00Z', venue: VENUES.BOSTON }, { date: '2026-06-22T20:00:00Z', venue: VENUES.PHILLY }, { date: '2026-06-22T23:00:00Z', venue: VENUES.NYNJ }, { date: '2026-06-26T17:00:00Z', venue: VENUES.PHILLY }, { date: '2026-06-26T17:00:00Z', venue: VENUES.BOSTON }],
  J: [{ date: '2026-06-16T23:00:00Z', venue: VENUES.KC }, { date: '2026-06-16T23:00:00Z', venue: VENUES.SF }, { date: '2026-06-22T17:00:00Z', venue: VENUES.DALLAS }, { date: '2026-06-22T23:00:00Z', venue: VENUES.SF }, { date: '2026-06-27T23:00:00Z', venue: VENUES.KC }, { date: '2026-06-27T23:00:00Z', venue: VENUES.DALLAS }],
  K: [{ date: '2026-06-17T17:00:00Z', venue: VENUES.HOUSTON }, { date: '2026-06-17T23:00:00Z', venue: VENUES.AZTECA }, { date: '2026-06-23T17:00:00Z', venue: VENUES.HOUSTON }, { date: '2026-06-23T23:00:00Z', venue: VENUES.AKRON }, { date: '2026-06-27T20:00:00Z', venue: VENUES.MIAMI }, { date: '2026-06-27T20:00:00Z', venue: VENUES.ATLANTA }],
  L: [{ date: '2026-06-17T19:00:00Z', venue: VENUES.DALLAS }, { date: '2026-06-17T22:00:00Z', venue: VENUES.TORONTO }, { date: '2026-06-23T19:00:00Z', venue: VENUES.BOSTON }, { date: '2026-06-23T22:00:00Z', venue: VENUES.TORONTO }, { date: '2026-06-27T17:00:00Z', venue: VENUES.NYNJ }, { date: '2026-06-27T17:00:00Z', venue: VENUES.PHILLY }]
};

async function seedDatabase() {
  console.log('🧹 Wiping old predictions to prevent security lockouts...');
  await supabase.from('predictions').delete().neq('id', -1);

  console.log('🧹 Exterminating ghost matches...');
  await supabase.from('matches').delete().neq('id', 'WIPE_ALL');
  
  console.log('🌍 Enforcing strict 104-Match Schema in Supabase...');
  
  const allMatches = [];

  // 1. Build Group Matches (72 Matches)
  for (const [group, dates] of Object.entries(GROUP_SCHEDULES)) {
    const matchups = getGroupMatchups(GROUP_TEAMS[group]);
    dates.forEach((matchInfo, index) => {
      allMatches.push({
        id: `${group}${index + 1}`, 
        group_id: group, 
        round: null,
        date: matchInfo.date,
        venue: matchInfo.venue,
        home_team_id: matchups[index].home,
        away_team_id: matchups[index].away,
        status: 'UPCOMING',
        is_locked: false,
        next_match_id: null
      });
    });
  }

  // 2. Build Knockout Matches (32 Matches)
  const rounds = ['R32', 'R16', 'QF', 'SF', '3RD', 'FIN'];
  const counts = [16, 8, 4, 2, 1, 1];
  
  rounds.forEach((round, idx) => {
    const count = counts[idx];
    for(let i=1; i<=count; i++) {
      let nextMatchId = null;
      if (round === 'R32') {
          if (i === 2 || i === 5) nextMatchId = 'R16_1';
          else if (i === 1 || i === 3) nextMatchId = 'R16_2';
          else if (i === 4 || i === 6) nextMatchId = 'R16_3';
          else if (i === 7 || i === 8) nextMatchId = 'R16_4';
          else if (i === 11 || i === 12) nextMatchId = 'R16_5';
          else if (i === 9 || i === 10) nextMatchId = 'R16_6';
          else if (i === 14 || i === 16) nextMatchId = 'R16_7';
          else if (i === 13 || i === 15) nextMatchId = 'R16_8';
      }
      else if (round === 'R16') {
          if (i === 1 || i === 2) nextMatchId = 'QF_1';
          else if (i === 5 || i === 6) nextMatchId = 'QF_2';
          else if (i === 3 || i === 4) nextMatchId = 'QF_3';
          else if (i === 7 || i === 8) nextMatchId = 'QF_4';
      }
      else if (round === 'QF') {
          if (i === 1 || i === 2) nextMatchId = 'SF_1';
          else if (i === 3 || i === 4) nextMatchId = 'SF_2';
      }
      else if (round === 'SF') nextMatchId = 'FIN';

      const matchId = count === 1 ? round : `${round}_${i}`;

      allMatches.push({
        id: matchId,
        group_id: null,
        round: round,
        date: '2026-07-01T12:00:00Z', 
        venue: 'TBD',
        home_team_id: 'TBD',
        away_team_id: 'TBD',
        status: 'UPCOMING',
        is_locked: false,
        next_match_id: nextMatchId 
      });
    }
  });

  // 3. Insert Exactly 104 Matches
  const { error } = await supabase.from('matches').insert(allMatches);

  if (error) {
    console.error(`❌ Failed:`, error.message);
  } else {
    console.log(`✅ Finished! Exactly 104 matches perfectly synced to the database.`);
  }
}

seedDatabase();