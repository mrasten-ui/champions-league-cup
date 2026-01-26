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

// 2. REALISTIC TEAM MAPPING
const TEAM_SLOTS = {
  A1: 'MEX', A2: 'RSA', A3: 'KOR', A4: 'CZE',
  B1: 'CAN', B2: 'SRB', B3: 'QAT', B4: 'SUI',
  C1: 'BRA', C2: 'DEN', C3: 'SCO', C4: 'MAR', 
  D1: 'USA', D2: 'NGA', D3: 'PAR', D4: 'AUS',
  E1: 'GER', E2: 'ITA', E3: 'CIV', E4: 'ECU',
  F1: 'NED', F2: 'JPN', F3: 'TUN', F4: 'ALB',
  G1: 'BEL', G2: 'EGY', G3: 'IRN', G4: 'NZL',
  H1: 'ESP', H2: 'KSA', H3: 'URU', H4: 'CPV',
  I1: 'FRA', I2: 'SEN', I3: 'CHI', I4: 'NOR',
  J1: 'ARG', J2: 'ALG', J3: 'AUT', J4: 'IRQ',
  K1: 'POR', K2: 'COL', K3: 'UZB', K4: 'COD',
  L1: 'ENG', L2: 'CRO', L3: 'GHA', L4: 'PAN',
};

// 3. THE OFFICIAL SCHEDULE (UTC TIMES)
const SCHEDULE = [
  // --- OPENING DAY (June 11) ---
  { id: 1, group: 'A', home: 'A1', away: 'A2', date: '2026-06-11T21:00:00Z', venue: 'Estadio Azteca, Mexico City' }, 
  { id: 2, group: 'A', home: 'A3', away: 'A4', date: '2026-06-12T02:00:00Z', venue: 'Estadio Akron, Guadalajara' },

  // --- DAY 2 (June 12) ---
  { id: 3, group: 'B', home: 'B1', away: 'B2', date: '2026-06-12T19:00:00Z', venue: 'BMO Field, Toronto' }, 
  { id: 4, group: 'D', home: 'D1', away: 'D2', date: '2026-06-13T01:00:00Z', venue: 'SoFi Stadium, Los Angeles' }, 

  // --- DAY 3 (June 13) ---
  { id: 5, group: 'C', home: 'C3', away: 'C4', date: '2026-06-13T19:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 6, group: 'D', home: 'D3', away: 'D4', date: '2026-06-13T19:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 7, group: 'C', home: 'C1', away: 'C2', date: '2026-06-13T19:00:00Z', venue: 'MetLife Stadium, New York/NJ' },
  { id: 8, group: 'B', home: 'B3', away: 'B4', date: '2026-06-14T02:00:00Z', venue: 'Levi\'s Stadium, San Francisco' },

  // --- DAY 4 (June 14) ---
  { id: 9,  group: 'E', home: 'E1', away: 'E2', date: '2026-06-14T19:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  { id: 10, group: 'E', home: 'E3', away: 'E4', date: '2026-06-14T19:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 11, group: 'F', home: 'F1', away: 'F2', date: '2026-06-14T22:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 12, group: 'F', home: 'F3', away: 'F4', date: '2026-06-15T01:00:00Z', venue: 'Estadio BBVA, Monterrey' },

  // --- DAY 5 (June 15) ---
  { id: 13, group: 'H', home: 'H1', away: 'H2', date: '2026-06-15T19:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 14, group: 'H', home: 'H3', away: 'H4', date: '2026-06-15T22:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 15, group: 'G', home: 'G1', away: 'G2', date: '2026-06-15T22:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 16, group: 'G', home: 'G3', away: 'G4', date: '2026-06-16T01:00:00Z', venue: 'Lumen Field, Seattle' },

  // --- DAY 6 (June 16) ---
  { id: 17, group: 'I', home: 'I1', away: 'I2', date: '2026-06-16T19:00:00Z', venue: 'MetLife Stadium, New York/NJ' },
  { id: 18, group: 'I', home: 'I3', away: 'I4', date: '2026-06-16T22:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 19, group: 'J', home: 'J1', away: 'J2', date: '2026-06-17T01:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 20, group: 'J', home: 'J3', away: 'J4', date: '2026-06-17T03:00:00Z', venue: 'Levi\'s Stadium, San Francisco' },

  // --- DAY 7 (June 17) ---
  { id: 21, group: 'L', home: 'L1', away: 'L2', date: '2026-06-17T19:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 22, group: 'L', home: 'L3', away: 'L4', date: '2026-06-17T22:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 23, group: 'K', home: 'K1', away: 'K2', date: '2026-06-18T00:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 24, group: 'K', home: 'K3', away: 'K4', date: '2026-06-18T03:00:00Z', venue: 'Estadio Azteca, Mexico City' },

  // --- MATCHDAY 2 & 3 ---
  { id: 25, group: 'A', home: 'A2', away: 'A4', date: '2026-06-18T22:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 26, group: 'B', home: 'B2', away: 'B4', date: '2026-06-19T01:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 27, group: 'B', home: 'B1', away: 'B3', date: '2026-06-19T03:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 28, group: 'A', home: 'A1', away: 'A3', date: '2026-06-19T01:30:00Z', venue: 'Estadio Akron, Guadalajara' },

  { id: 29, group: 'C', home: 'C2', away: 'C4', date: '2026-06-19T19:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  { id: 30, group: 'C', home: 'C1', away: 'C3', date: '2026-06-19T22:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 31, group: 'D', home: 'D2', away: 'D4', date: '2026-06-20T01:00:00Z', venue: 'Levi\'s Stadium, San Francisco' },
  { id: 32, group: 'D', home: 'D1', away: 'D3', date: '2026-06-20T03:00:00Z', venue: 'Lumen Field, Seattle' },

  { id: 33, group: 'E', home: 'E1', away: 'E3', date: '2026-06-20T19:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 34, group: 'E', home: 'E2', away: 'E4', date: '2026-06-20T22:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 35, group: 'F', home: 'F1', away: 'F3', date: '2026-06-21T01:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 36, group: 'F', home: 'F2', away: 'F4', date: '2026-06-21T03:00:00Z', venue: 'Estadio BBVA, Monterrey' },

  { id: 37, group: 'H', home: 'H2', away: 'H4', date: '2026-06-21T19:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 38, group: 'H', home: 'H1', away: 'H3', date: '2026-06-21T22:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 39, group: 'G', home: 'G1', away: 'G3', date: '2026-06-22T01:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 40, group: 'G', home: 'G2', away: 'G4', date: '2026-06-22T03:00:00Z', venue: 'BC Place, Vancouver' },

  { id: 41, group: 'I', home: 'I2', away: 'I4', date: '2026-06-22T19:00:00Z', venue: 'MetLife Stadium, New York/NJ' },
  { id: 42, group: 'I', home: 'I1', away: 'I3', date: '2026-06-22T22:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  { id: 43, group: 'J', home: 'J1', away: 'J3', date: '2026-06-23T01:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 44, group: 'J', home: 'J2', away: 'J4', date: '2026-06-23T03:00:00Z', venue: 'Levi\'s Stadium, San Francisco' },

  { id: 45, group: 'L', home: 'L1', away: 'L3', date: '2026-06-23T19:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 46, group: 'L', home: 'L2', away: 'L4', date: '2026-06-23T22:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 47, group: 'K', home: 'K1', away: 'K3', date: '2026-06-24T01:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 48, group: 'K', home: 'K2', away: 'K4', date: '2026-06-24T03:00:00Z', venue: 'Estadio Akron, Guadalajara' },

  // Matchday 3 - Simultaneous Kickoffs
  { id: 49, group: 'C', home: 'C3', away: 'C1', date: '2026-06-24T22:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 50, group: 'C', home: 'C4', away: 'C2', date: '2026-06-24T22:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 51, group: 'B', home: 'B4', away: 'B1', date: '2026-06-25T01:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 52, group: 'B', home: 'B2', away: 'B3', date: '2026-06-25T01:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 53, group: 'A', home: 'A1', away: 'A4', date: '2026-06-25T03:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 54, group: 'A', home: 'A2', away: 'A3', date: '2026-06-25T03:00:00Z', venue: 'Estadio BBVA, Monterrey' },

  { id: 55, group: 'E', home: 'E4', away: 'E1', date: '2026-06-25T19:00:00Z', venue: 'MetLife Stadium, New York/NJ' },
  { id: 56, group: 'E', home: 'E3', away: 'E2', date: '2026-06-25T19:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  { id: 57, group: 'F', home: 'F3', away: 'F1', date: '2026-06-25T22:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 58, group: 'F', home: 'F2', away: 'F4', date: '2026-06-25T22:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 59, group: 'D', home: 'D2', away: 'D1', date: '2026-06-26T01:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 60, group: 'D', home: 'D3', away: 'D4', date: '2026-06-26T01:00:00Z', venue: 'Levi\'s Stadium, San Francisco' },

  // Remaining Groups 
  { id: 61, group: 'H', home: 'H4', away: 'H2', date: '2026-06-26T19:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 62, group: 'H', home: 'H3', away: 'H1', date: '2026-06-26T19:00:00Z', venue: 'Estadio Akron, Guadalajara' },
  { id: 63, group: 'G', home: 'G4', away: 'G1', date: '2026-06-26T22:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 64, group: 'G', home: 'G2', away: 'G3', date: '2026-06-26T22:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 65, group: 'I', home: 'I3', away: 'I1', date: '2026-06-27T01:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 66, group: 'I', home: 'I2', away: 'I4', date: '2026-06-27T01:00:00Z', venue: 'BMO Field, Toronto' },

  { id: 67, group: 'J', home: 'J2', away: 'J3', date: '2026-06-27T19:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 68, group: 'J', home: 'J4', away: 'J1', date: '2026-06-27T19:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 69, group: 'K', home: 'K2', away: 'K1', date: '2026-06-27T22:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 70, group: 'K', home: 'K4', away: 'K3', date: '2026-06-27T22:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 71, group: 'L', home: 'L4', away: 'L1', date: '2026-06-28T01:00:00Z', venue: 'MetLife Stadium, New York/NJ' },
  { id: 72, group: 'L', home: 'L2', away: 'L3', date: '2026-06-28T01:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },

  // --- KNOCKOUTS (UTC) ---
  { id: 73, round: 'R32', date: '2026-06-29T01:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 74, round: 'R32', date: '2026-06-29T19:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 75, round: 'R32', date: '2026-06-29T22:00:00Z', venue: 'Estadio BBVA, Monterrey' },
  { id: 76, round: 'R32', date: '2026-06-30T01:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 77, round: 'R32', date: '2026-06-30T19:00:00Z', venue: 'MetLife Stadium, New York/NJ' },
  { id: 78, round: 'R32', date: '2026-06-30T22:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 79, round: 'R32', date: '2026-07-01T01:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 80, round: 'R32', date: '2026-07-01T19:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 81, round: 'R32', date: '2026-07-01T22:00:00Z', venue: 'Levi\'s Stadium, San Francisco' },
  { id: 82, round: 'R32', date: '2026-07-02T01:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 83, round: 'R32', date: '2026-07-02T19:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 84, round: 'R32', date: '2026-07-02T22:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 85, round: 'R32', date: '2026-07-03T01:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 86, round: 'R32', date: '2026-07-03T19:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 87, round: 'R32', date: '2026-07-03T22:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 88, round: 'R32', date: '2026-07-04T01:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },

  // Round of 16
  { id: 89, round: 'R16', date: '2026-07-04T19:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 90, round: 'R16', date: '2026-07-05T01:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 91, round: 'R16', date: '2026-07-05T19:00:00Z', venue: 'MetLife Stadium, New York/NJ' },
  { id: 92, round: 'R16', date: '2026-07-06T01:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 93, round: 'R16', date: '2026-07-06T19:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 94, round: 'R16', date: '2026-07-07T01:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 95, round: 'R16', date: '2026-07-07T19:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 96, round: 'R16', date: '2026-07-08T01:00:00Z', venue: 'Levi\'s Stadium, San Francisco' },

  // Quarter Finals
  { id: 97, round: 'QF', date: '2026-07-10T01:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 98, round: 'QF', date: '2026-07-11T01:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 99, round: 'QF', date: '2026-07-11T19:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 100, round: 'QF', date: '2026-07-12T01:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },

  // Semi Finals
  { id: 101, round: 'SF', date: '2026-07-15T01:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 102, round: 'SF', date: '2026-07-16T01:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },

  // Finals
  { id: 103, round: '3RD', date: '2026-07-18T22:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 104, round: 'FIN', date: '2026-07-19T20:00:00Z', venue: 'MetLife Stadium, New York/NJ' }
];

async function seedOfficialSchedule() {
  console.log('🌍 Seeding OFFICIAL FIFA 2026 Schedule (Matches 1-104)...');

  console.log('🗑️  Clearing old matches...');
  await supabase.from('matches').delete().neq('id', 'PLACEHOLDER');

  const finalMatches = [];
  const matchesByGroup = {};

  // HELPER: Assign TV Channels (UPDATED)
  const getChannels = (homeId, awayId) => {
      const channels = { 
          US: 'FOX', 
          NO: 'NRK', 
          EN: 'BBC' // Default for UK/English users
      }; 
      
      // Scotland logic
      if (homeId === 'SCO' || awayId === 'SCO') {
          channels['SCO'] = 'STV'; // Scotland-specific branding
          channels['EN'] = 'ITV';  // ITV usually carries STV games in England
      } 
      // England logic
      else if (homeId === 'ENG' || awayId === 'ENG') {
          channels['EN'] = 'BBC'; 
          channels['SCO'] = 'BBC';
      }
      return channels;
  };

  // 1. GROUP MATCHES
  for (const item of SCHEDULE) {
    if (item.group) {
        matchesByGroup[item.group] = (matchesByGroup[item.group] || 0) + 1;
        const appMatchId = `${item.group}${matchesByGroup[item.group]}`;
        
        const homeId = TEAM_SLOTS[item.home] || 'TBD';
        const awayId = TEAM_SLOTS[item.away] || 'TBD';

        finalMatches.push({
            id: appMatchId,
            group_id: item.group,
            home_team_id: homeId,
            away_team_id: awayId,
            home_score: null,
            away_score: null,
            date: item.date,
            venue: item.venue,
            status: 'UPCOMING',
            is_locked: false,
            next_match_id: null,
            // CRITICAL FIX: Use the helper instead of hardcoded object
            channels: getChannels(homeId, awayId)
        });
    } else {
        // 2. KNOCKOUT MATCHES
        let roundId = '';
        let nextId = null;

        if (item.round === 'R32') {
            const idx = item.id - 72; // 1..16
            roundId = `R32_${idx}`;
            nextId = `R16_${Math.ceil(idx/2)}`;
        } else if (item.round === 'R16') {
            const idx = item.id - 88; // 1..8
            roundId = `R16_${idx}`;
            nextId = `QF_${Math.ceil(idx/2)}`;
        } else if (item.round === 'QF') {
            const idx = item.id - 96; // 1..4
            roundId = `QF_${idx}`;
            nextId = `SF_${Math.ceil(idx/2)}`;
        } else if (item.round === 'SF') {
            const idx = item.id - 100; // 1..2
            roundId = `SF_${idx}`;
            nextId = `FIN_1`;
        } else if (item.round === '3RD') {
            roundId = `3RD_1`;
        } else if (item.round === 'FIN') {
            roundId = `FIN_1`;
        }

        finalMatches.push({
            id: roundId,
            group_id: null,
            round: item.round,
            home_team_id: 'TBD',
            away_team_id: 'TBD',
            home_score: null,
            away_score: null,
            date: item.date,
            venue: item.venue,
            status: 'UPCOMING',
            is_locked: false,
            next_match_id: nextId,
            // CRITICAL FIX: Default channels for Knockouts (usually all BBC/ITV share)
            channels: { EN: 'BBC', NO: 'NRK', US: 'FOX', SCO: 'STV' } 
        });
    }
  }

  // --- BATCH INSERT ---
  const chunkSize = 50;
  for (let i = 0; i < finalMatches.length; i += chunkSize) {
    const chunk = finalMatches.slice(i, i + chunkSize);
    const { error } = await supabase.from('matches').insert(chunk);
    if (error) console.error(`❌ Insert Error:`, error.message);
    else console.log(`✅ Inserted matches ${i} to ${i + chunk.length}`);
  }

  console.log('🎉 OFFICIAL SCHEDULE LOADED! (Timezone Aware)');
}

seedOfficialSchedule();