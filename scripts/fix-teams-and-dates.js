// Restores correct team assignments and dates without touching predictions.
// Uses seed-schedule.js team/matchup data + seed-official-schedule.js dates (where safely mappable).

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

// ── CORRECT TEAM ASSIGNMENTS (from the official draw) ────────────────────────
const GROUP_TEAMS = {
  A: ['MEX', 'RSA', 'KOR', 'CZE'],
  B: ['CAN', 'BIH', 'QAT', 'SUI'],
  C: ['BRA', 'MAR', 'HAI', 'SCO'],
  D: ['USA', 'PAR', 'AUS', 'TUR'],
  E: ['GER', 'CUW', 'CIV', 'ECU'],
  F: ['NED', 'JPN', 'SWE', 'TUN'],
  G: ['BEL', 'EGY', 'IRN', 'NZL'],
  H: ['ESP', 'CPV', 'KSA', 'URU'],
  I: ['FRA', 'SEN', 'IRQ', 'NOR'],
  J: ['ARG', 'ALG', 'AUT', 'JOR'],
  K: ['POR', 'COD', 'UZB', 'COL'],
  L: ['ENG', 'CRO', 'GHA', 'PAN'],
};

// Match pattern: for [t1,t2,t3,t4], the 6 matches in order are:
// 1: t1 vs t2,  2: t3 vs t4,  3: t1 vs t3
// 4: t4 vs t2,  5: t4 vs t1,  6: t2 vs t3
const getMatchups = ([t1, t2, t3, t4]) => [
  { home: t1, away: t2 },
  { home: t3, away: t4 },
  { home: t1, away: t3 },
  { home: t4, away: t2 },
  { home: t4, away: t1 },
  { home: t2, away: t3 },
];

// ── CORRECT DATES & VENUES ────────────────────────────────────────────────────
// Slot pair (home_slot, away_slot) → date + venue for each group
// Built from seed-official-schedule.js which has the authoritative UTC times.
// For each group, match index 0-5 maps to the 6 matchup slots above.
const GROUP_SCHEDULE = {
  A: [
    { date: '2026-06-11T21:00:00Z', venue: 'Estadio Azteca, Mexico City' },          // M1: 1v2
    { date: '2026-06-12T02:00:00Z', venue: 'Estadio Akron, Guadalajara' },            // M2: 3v4
    { date: '2026-06-19T01:30:00Z', venue: 'Estadio Akron, Guadalajara' },            // M3: 1v3
    { date: '2026-06-18T22:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },        // M4: 4v2
    { date: '2026-06-25T03:00:00Z', venue: 'Estadio Azteca, Mexico City' },           // M5: 4v1
    { date: '2026-06-25T03:00:00Z', venue: 'Estadio BBVA, Monterrey' },              // M6: 2v3
  ],
  B: [
    { date: '2026-06-12T19:00:00Z', venue: 'BMO Field, Toronto' },
    { date: '2026-06-14T02:00:00Z', venue: "Levi's Stadium, San Francisco" },
    { date: '2026-06-19T03:00:00Z', venue: 'BC Place, Vancouver' },
    { date: '2026-06-19T01:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
    { date: '2026-06-25T01:00:00Z', venue: 'BC Place, Vancouver' },
    { date: '2026-06-25T01:00:00Z', venue: 'Lumen Field, Seattle' },
  ],
  C: [
    { date: '2026-06-13T19:00:00Z', venue: 'MetLife Stadium, New York/NJ' },
    { date: '2026-06-13T19:00:00Z', venue: 'Gillette Stadium, Boston' },
    { date: '2026-06-19T22:00:00Z', venue: 'Gillette Stadium, Boston' },
    { date: '2026-06-19T19:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
    { date: '2026-06-24T22:00:00Z', venue: 'Hard Rock Stadium, Miami' },
    { date: '2026-06-24T22:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  ],
  D: [
    { date: '2026-06-13T01:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
    { date: '2026-06-13T19:00:00Z', venue: 'BC Place, Vancouver' },
    { date: '2026-06-20T03:00:00Z', venue: 'Lumen Field, Seattle' },
    { date: '2026-06-20T01:00:00Z', venue: "Levi's Stadium, San Francisco" },
    { date: '2026-06-26T01:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
    { date: '2026-06-26T01:00:00Z', venue: "Levi's Stadium, San Francisco" },
  ],
  E: [
    { date: '2026-06-14T19:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
    { date: '2026-06-14T19:00:00Z', venue: 'NRG Stadium, Houston' },
    { date: '2026-06-20T19:00:00Z', venue: 'BMO Field, Toronto' },
    { date: '2026-06-20T22:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
    { date: '2026-06-25T19:00:00Z', venue: 'MetLife Stadium, New York/NJ' },
    { date: '2026-06-25T19:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  ],
  F: [
    { date: '2026-06-14T22:00:00Z', venue: 'AT&T Stadium, Dallas' },
    { date: '2026-06-15T01:00:00Z', venue: 'Estadio BBVA, Monterrey' },
    { date: '2026-06-21T01:00:00Z', venue: 'NRG Stadium, Houston' },
    { date: '2026-06-21T03:00:00Z', venue: 'Estadio BBVA, Monterrey' },
    { date: '2026-06-25T22:00:00Z', venue: 'AT&T Stadium, Dallas' },
    { date: '2026-06-25T22:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  ],
  G: [
    { date: '2026-06-15T22:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
    { date: '2026-06-16T01:00:00Z', venue: 'Lumen Field, Seattle' },
    { date: '2026-06-22T01:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
    { date: '2026-06-22T03:00:00Z', venue: 'BC Place, Vancouver' },
    { date: '2026-06-26T22:00:00Z', venue: 'BC Place, Vancouver' },
    { date: '2026-06-26T22:00:00Z', venue: 'Lumen Field, Seattle' },
  ],
  H: [
    { date: '2026-06-15T19:00:00Z', venue: 'Hard Rock Stadium, Miami' },
    { date: '2026-06-15T22:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { date: '2026-06-21T19:00:00Z', venue: 'Hard Rock Stadium, Miami' },
    { date: '2026-06-21T22:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
    { date: '2026-06-26T19:00:00Z', venue: 'Estadio Akron, Guadalajara' },
    { date: '2026-06-26T19:00:00Z', venue: 'NRG Stadium, Houston' },
  ],
  I: [
    { date: '2026-06-16T19:00:00Z', venue: 'MetLife Stadium, New York/NJ' },
    { date: '2026-06-16T22:00:00Z', venue: 'Gillette Stadium, Boston' },
    { date: '2026-06-22T19:00:00Z', venue: 'MetLife Stadium, New York/NJ' },
    { date: '2026-06-22T22:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
    { date: '2026-06-27T01:00:00Z', venue: 'Gillette Stadium, Boston' },
    { date: '2026-06-27T01:00:00Z', venue: 'BMO Field, Toronto' },
  ],
  J: [
    { date: '2026-06-17T01:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
    { date: '2026-06-17T03:00:00Z', venue: "Levi's Stadium, San Francisco" },
    { date: '2026-06-23T01:00:00Z', venue: 'AT&T Stadium, Dallas' },
    { date: '2026-06-23T03:00:00Z', venue: "Levi's Stadium, San Francisco" },
    { date: '2026-06-27T19:00:00Z', venue: 'AT&T Stadium, Dallas' },
    { date: '2026-06-27T19:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  ],
  K: [
    { date: '2026-06-18T00:00:00Z', venue: 'NRG Stadium, Houston' },
    { date: '2026-06-18T03:00:00Z', venue: 'Estadio Azteca, Mexico City' },
    { date: '2026-06-24T01:00:00Z', venue: 'NRG Stadium, Houston' },
    { date: '2026-06-24T03:00:00Z', venue: 'Estadio Akron, Guadalajara' },
    { date: '2026-06-27T22:00:00Z', venue: 'Hard Rock Stadium, Miami' },
    { date: '2026-06-27T22:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  ],
  L: [
    { date: '2026-06-17T19:00:00Z', venue: 'BMO Field, Toronto' },
    { date: '2026-06-17T22:00:00Z', venue: 'AT&T Stadium, Dallas' },
    { date: '2026-06-23T19:00:00Z', venue: 'Gillette Stadium, Boston' },
    { date: '2026-06-23T22:00:00Z', venue: 'BMO Field, Toronto' },
    { date: '2026-06-28T01:00:00Z', venue: 'MetLife Stadium, New York/NJ' },
    { date: '2026-06-28T01:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  ],
};

// ── KNOCKOUT DATES (from seed-official-schedule.js) ──────────────────────────
const KNOCKOUT = [
  { id: 'R32_1',  date: '2026-06-29T01:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'R32_2',  date: '2026-06-29T19:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 'R32_3',  date: '2026-06-29T22:00:00Z', venue: 'Estadio BBVA, Monterrey' },
  { id: 'R32_4',  date: '2026-06-30T01:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 'R32_5',  date: '2026-06-30T19:00:00Z', venue: 'MetLife Stadium, New York/NJ' },
  { id: 'R32_6',  date: '2026-06-30T22:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 'R32_7',  date: '2026-07-01T01:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 'R32_8',  date: '2026-07-01T19:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'R32_9',  date: '2026-07-01T22:00:00Z', venue: "Levi's Stadium, San Francisco" },
  { id: 'R32_10', date: '2026-07-02T01:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 'R32_11', date: '2026-07-02T19:00:00Z', venue: 'BMO Field, Toronto' },
  { id: 'R32_12', date: '2026-07-02T22:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'R32_13', date: '2026-07-03T01:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 'R32_14', date: '2026-07-03T19:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 'R32_15', date: '2026-07-03T22:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 'R32_16', date: '2026-07-04T01:00:00Z', venue: 'Lincoln Financial Field, Philadelphia' },
  { id: 'R16_1',  date: '2026-07-04T19:00:00Z', venue: 'NRG Stadium, Houston' },
  { id: 'R16_2',  date: '2026-07-05T01:00:00Z', venue: 'Lumen Field, Seattle' },
  { id: 'R16_3',  date: '2026-07-05T19:00:00Z', venue: 'MetLife Stadium, New York/NJ' },
  { id: 'R16_4',  date: '2026-07-06T01:00:00Z', venue: 'Estadio Azteca, Mexico City' },
  { id: 'R16_5',  date: '2026-07-06T19:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 'R16_6',  date: '2026-07-07T01:00:00Z', venue: 'BC Place, Vancouver' },
  { id: 'R16_7',  date: '2026-07-07T19:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'R16_8',  date: '2026-07-08T01:00:00Z', venue: "Levi's Stadium, San Francisco" },
  { id: 'QF_1',   date: '2026-07-10T01:00:00Z', venue: 'Gillette Stadium, Boston' },
  { id: 'QF_2',   date: '2026-07-11T01:00:00Z', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'QF_3',   date: '2026-07-11T19:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 'QF_4',   date: '2026-07-12T01:00:00Z', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 'SF_1',   date: '2026-07-15T01:00:00Z', venue: 'AT&T Stadium, Dallas' },
  { id: 'SF_2',   date: '2026-07-16T01:00:00Z', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: '3RD_1',  date: '2026-07-18T22:00:00Z', venue: 'Hard Rock Stadium, Miami' },
  { id: 'FIN_1',  date: '2026-07-19T20:00:00Z', venue: 'MetLife Stadium, New York/NJ' },
];

async function fixTeamsAndDates() {
  console.log('🔧 Fixing team assignments and dates (predictions untouched)...');

  const updates = [];

  // Group stage
  for (const [group, teams] of Object.entries(GROUP_TEAMS)) {
    const matchups = getMatchups(teams);
    const schedule = GROUP_SCHEDULE[group];

    matchups.forEach((matchup, i) => {
      updates.push({
        id: `${group}${i + 1}`,
        home_team_id: matchup.home,
        away_team_id: matchup.away,
        date: schedule[i].date,
        venue: schedule[i].venue,
        group_id: group,
        status: 'UPCOMING',
        is_locked: false,
        home_score: null,
        away_score: null,
      });
    });
  }

  // Knockout stage
  for (const k of KNOCKOUT) {
    updates.push({
      id: k.id,
      home_team_id: 'TBD',
      away_team_id: 'TBD',
      date: k.date,
      venue: k.venue,
      status: 'UPCOMING',
      is_locked: false,
      home_score: null,
      away_score: null,
    });
  }

  console.log(`📋 Upserting ${updates.length} matches...`);

  const chunkSize = 50;
  let fixed = 0;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('matches')
      .upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Error on chunk ${i}:`, error.message);
    } else {
      fixed += chunk.length;
      console.log(`✅ Fixed ${fixed}/${updates.length}`);
    }
  }

  console.log('🎉 Done! Teams and dates restored. Predictions were not touched.');
}

fixTeamsAndDates();
