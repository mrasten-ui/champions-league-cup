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
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const VENUES = {
  AZTECA: "Estadio Azteca, Mexico City", AKRON: "Estadio Guadalajara, Zapopan", MONTERREY: "Estadio Monterrey, Guadalupe",
  TORONTO: "Toronto Stadium, Toronto", VANCOUVER: "BC Place, Vancouver", ATLANTA: "Atlanta Stadium, Atlanta",
  BOSTON: "Boston Stadium, Foxborough", DALLAS: "Dallas Stadium, Arlington", HOUSTON: "Houston Stadium, Houston",
  KC: "Kansas City Stadium, Kansas City", LA: "Los Angeles Stadium, Inglewood", MIAMI: "Miami Stadium, Miami Gardens",
  NYNJ: "New York New Jersey Stadium, East Rutherford", PHILLY: "Philadelphia Stadium, Philadelphia",
  SF: "San Francisco Bay Area Stadium, Santa Clara", SEATTLE: "Seattle Stadium, Seattle"
};

// REAL TEAMS FOR EACH GROUP
const GROUP_TEAMS = {
  A: ['MEX', 'RSA', 'KOR', 'CZE'], B: ['CAN', 'BIH', 'QAT', 'SUI'], C: ['BRA', 'MAR', 'HAI', 'SCO'],
  D: ['USA', 'PAR', 'AUS', 'TUR'], E: ['GER', 'CUW', 'CIV', 'ECU'], F: ['NED', 'JPN', 'SWE', 'TUN'],
  G: ['BEL', 'EGY', 'IRN', 'NZL'], H: ['ESP', 'CPV', 'KSA', 'URU'], I: ['FRA', 'SEN', 'IRQ', 'NOR'],
  J: ['ARG', 'ALG', 'AUT', 'JOR'], K: ['POR', 'COD', 'UZB', 'COL'], L: ['ENG', 'CRO', 'GHA', 'PAN']
};

// HELPER TO GENERATE THE 6 MATCHUPS PER GROUP
const getGroupMatchups = (teams) => {
  const [t1, t2, t3, t4] = teams;
  return [
    { home: t1, away: t2 }, // Match 1
    { home: t3, away: t4 }, // Match 2
    { home: t1, away: t3 }, // Match 3
    { home: t4, away: t2 }, // Match 4
    { home: t4, away: t1 }, // Match 5
    { home: t2, away: t3 }  // Match 6
  ];
};

const GROUP_SCHEDULES = {
  A: [
    { date: '2026-06-11T19:00:00Z', venue: VENUES.AZTECA }, { date: '2026-06-11T23:00:00Z', venue: VENUES.AKRON },     
    { date: '2026-06-18T23:00:00Z', venue: VENUES.AKRON }, { date: '2026-06-18T16:00:00Z', venue: VENUES.ATLANTA },   
    { date: '2026-06-24T23:00:00Z', venue: VENUES.AZTECA }, { date: '2026-06-24T23:00:00Z', venue: VENUES.MONTERREY }, 
  ],
  B: [
    { date: '2026-06-12T19:00:00Z', venue: VENUES.TORONTO }, { date: '2026-06-13T20:00:00Z', venue: VENUES.SF },        
    { date: '2026-06-18T22:00:00Z', venue: VENUES.VANCOUVER }, { date: '2026-06-18T19:00:00Z', venue: VENUES.LA },        
    { date: '2026-06-24T19:00:00Z', venue: VENUES.VANCOUVER }, { date: '2026-06-24T19:00:00Z', venue: VENUES.SEATTLE },   
  ],
  C: [
    { date: '2026-06-13T19:00:00Z', venue: VENUES.BOSTON }, { date: '2026-06-13T23:00:00Z', venue: VENUES.NYNJ },      
    { date: '2026-06-19T23:00:00Z', venue: VENUES.PHILLY }, { date: '2026-06-19T19:00:00Z', venue: VENUES.BOSTON },    
    { date: '2026-06-24T22:00:00Z', venue: VENUES.MIAMI }, { date: '2026-06-24T22:00:00Z', venue: VENUES.ATLANTA },   
  ],
  D: [
    { date: '2026-06-12T23:00:00Z', venue: VENUES.LA }, { date: '2026-06-13T23:00:00Z', venue: VENUES.VANCOUVER }, 
    { date: '2026-06-19T22:00:00Z', venue: VENUES.SEATTLE }, { date: '2026-06-19T23:00:00Z', venue: VENUES.SF },        
    { date: '2026-06-25T23:00:00Z', venue: VENUES.LA }, { date: '2026-06-25T23:00:00Z', venue: VENUES.SF },        
  ],
  E: [
    { date: '2026-06-14T17:00:00Z', venue: VENUES.HOUSTON }, { date: '2026-06-14T23:00:00Z', venue: VENUES.PHILLY },    
    { date: '2026-06-20T20:00:00Z', venue: VENUES.TORONTO }, { date: '2026-06-20T23:00:00Z', venue: VENUES.KC },        
    { date: '2026-06-25T20:00:00Z', venue: VENUES.NYNJ }, { date: '2026-06-25T20:00:00Z', venue: VENUES.PHILLY },    
  ],
  F: [
    { date: '2026-06-14T19:00:00Z', venue: VENUES.DALLAS }, { date: '2026-06-14T23:00:00Z', venue: VENUES.MONTERREY }, 
    { date: '2026-06-20T17:00:00Z', venue: VENUES.HOUSTON }, { date: '2026-06-20T23:00:00Z', venue: VENUES.MONTERREY }, 
    { date: '2026-06-25T23:00:00Z', venue: VENUES.KC }, { date: '2026-06-25T23:00:00Z', venue: VENUES.DALLAS },    
  ],
  G: [
    { date: '2026-06-15T19:00:00Z', venue: VENUES.SEATTLE }, { date: '2026-06-15T23:00:00Z', venue: VENUES.LA },        
    { date: '2026-06-21T19:00:00Z', venue: VENUES.LA }, { date: '2026-06-21T23:00:00Z', venue: VENUES.VANCOUVER }, 
    { date: '2026-06-26T23:00:00Z', venue: VENUES.SEATTLE }, { date: '2026-06-26T23:00:00Z', venue: VENUES.VANCOUVER }, 
  ],
  H: [
    { date: '2026-06-15T16:00:00Z', venue: VENUES.ATLANTA }, { date: '2026-06-15T22:00:00Z', venue: VENUES.MIAMI },     
    { date: '2026-06-21T16:00:00Z', venue: VENUES.ATLANTA }, { date: '2026-06-21T22:00:00Z', venue: VENUES.MIAMI },     
    { date: '2026-06-26T20:00:00Z', venue: VENUES.AKRON }, { date: '2026-06-26T20:00:00Z', venue: VENUES.HOUSTON },   
  ],
  I: [
    { date: '2026-06-16T19:00:00Z', venue: VENUES.NYNJ }, { date: '2026-06-16T22:00:00Z', venue: VENUES.BOSTON },    
    { date: '2026-06-22T20:00:00Z', venue: VENUES.PHILLY }, { date: '2026-06-22T23:00:00Z', venue: VENUES.NYNJ },      
    { date: '2026-06-26T17:00:00Z', venue: VENUES.PHILLY }, { date: '2026-06-26T17:00:00Z', venue: VENUES.BOSTON },    
  ],
  J: [
    { date: '2026-06-16T23:00:00Z', venue: VENUES.KC }, { date: '2026-06-16T23:00:00Z', venue: VENUES.SF },        
    { date: '2026-06-22T17:00:00Z', venue: VENUES.DALLAS }, { date: '2026-06-22T23:00:00Z', venue: VENUES.SF },        
    { date: '2026-06-27T23:00:00Z', venue: VENUES.KC }, { date: '2026-06-27T23:00:00Z', venue: VENUES.DALLAS },    
  ],
  K: [
    { date: '2026-06-17T17:00:00Z', venue: VENUES.HOUSTON }, { date: '2026-06-17T23:00:00Z', venue: VENUES.AZTECA },    
    { date: '2026-06-23T17:00:00Z', venue: VENUES.HOUSTON }, { date: '2026-06-23T23:00:00Z', venue: VENUES.AKRON },     
    { date: '2026-06-27T20:00:00Z', venue: VENUES.MIAMI }, { date: '2026-06-27T20:00:00Z', venue: VENUES.ATLANTA },   
  ],
  L: [
    { date: '2026-06-17T19:00:00Z', venue: VENUES.DALLAS }, { date: '2026-06-17T22:00:00Z', venue: VENUES.TORONTO },   
    { date: '2026-06-23T19:00:00Z', venue: VENUES.BOSTON }, { date: '2026-06-23T22:00:00Z', venue: VENUES.TORONTO },   
    { date: '2026-06-27T17:00:00Z', venue: VENUES.NYNJ }, { date: '2026-06-27T17:00:00Z', venue: VENUES.PHILLY },    
  ]
};

const KNOCKOUT_SCHEDULE = [
  { id: 'R32_1', date: '2026-06-28T20:00:00Z', venue: VENUES.LA }, { id: 'R32_2', date: '2026-06-28T23:00:00Z', venue: VENUES.NYNJ },
  { id: 'R32_3', date: '2026-06-29T16:00:00Z', venue: VENUES.BOSTON }, { id: 'R32_4', date: '2026-06-29T19:00:00Z', venue: VENUES.TORONTO },
  { id: 'R32_5', date: '2026-06-29T22:00:00Z', venue: VENUES.HOUSTON }, { id: 'R32_6', date: '2026-06-30T16:00:00Z', venue: VENUES.MIAMI },
  { id: 'R32_7', date: '2026-06-30T19:00:00Z', venue: VENUES.ATLANTA }, { id: 'R32_8', date: '2026-06-30T22:00:00Z', venue: VENUES.DALLAS },
  { id: 'R32_9', date: '2026-07-01T19:00:00Z', venue: VENUES.SEATTLE }, { id: 'R32_10', date: '2026-07-01T22:00:00Z', venue: VENUES.SF },
  { id: 'R32_11', date: '2026-07-02T19:00:00Z', venue: VENUES.VANCOUVER }, { id: 'R32_12', date: '2026-07-02T22:00:00Z', venue: VENUES.LA },
  { id: 'R32_13', date: '2026-07-03T16:00:00Z', venue: VENUES.AZTECA }, { id: 'R32_14', date: '2026-07-03T19:00:00Z', venue: VENUES.MONTERREY },
  { id: 'R32_15', date: '2026-07-03T22:00:00Z', venue: VENUES.AKRON }, { id: 'R32_16', date: '2026-07-03T19:00:00Z', venue: VENUES.KC },
  { id: 'R16_1', date: '2026-07-04T18:00:00Z', venue: VENUES.PHILLY }, { id: 'R16_2', date: '2026-07-04T22:00:00Z', venue: VENUES.HOUSTON },
  { id: 'R16_3', date: '2026-07-05T18:00:00Z', venue: VENUES.NYNJ }, { id: 'R16_4', date: '2026-07-05T22:00:00Z', venue: VENUES.AZTECA },
  { id: 'R16_5', date: '2026-07-06T18:00:00Z', venue: VENUES.DALLAS }, { id: 'R16_6', date: '2026-07-06T22:00:00Z', venue: VENUES.SEATTLE },
  { id: 'R16_7', date: '2026-07-07T18:00:00Z', venue: VENUES.ATLANTA }, { id: 'R16_8', date: '2026-07-07T22:00:00Z', venue: VENUES.VANCOUVER },
  { id: 'QF_1', date: '2026-07-09T20:00:00Z', venue: VENUES.BOSTON }, { id: 'QF_2', date: '2026-07-10T20:00:00Z', venue: VENUES.LA },
  { id: 'QF_3', date: '2026-07-11T16:00:00Z', venue: VENUES.MIAMI }, { id: 'QF_4', date: '2026-07-11T20:00:00Z', venue: VENUES.KC },
  { id: 'SF_1', date: '2026-07-14T20:00:00Z', venue: VENUES.DALLAS }, { id: 'SF_2', date: '2026-07-15T20:00:00Z', venue: VENUES.ATLANTA },
  { id: '3RD', date: '2026-07-18T20:00:00Z', venue: VENUES.MIAMI }, { id: 'FIN', date: '2026-07-19T19:00:00Z', venue: VENUES.NYNJ },
];

async function seedSchedule() {
  console.log('🌍 Pushing Dates, Venues, AND Teams to Supabase...');

  const updates = [];

  // 1. Group Updates (Injects Home/Away Teams too!)
  for (const [group, dates] of Object.entries(GROUP_SCHEDULES)) {
    const matchups = getGroupMatchups(GROUP_TEAMS[group]);
    
    dates.forEach((matchInfo, index) => {
      updates.push({
        id: `${group}${index + 1}`, 
        date: matchInfo.date,
        venue: matchInfo.venue,
        home_team_id: matchups[index].home,
        away_team_id: matchups[index].away
      });
    });
  }

  // 2. Knockout Updates (Only Dates/Venues, Teams remain 'TBD')
  KNOCKOUT_SCHEDULE.forEach(ko => {
      updates.push({
          id: ko.id,
          date: ko.date,
          venue: ko.venue
      });
  });

  let successCount = 0;
  for (const update of updates) {
    // If it has home_team_id, update everything. If not, just date/venue
    const payload = update.home_team_id 
        ? { date: update.date, venue: update.venue, home_team_id: update.home_team_id, away_team_id: update.away_team_id }
        : { date: update.date, venue: update.venue };

    const { error } = await supabase
      .from('matches')
      .update(payload)
      .eq('id', update.id);

    if (error) {
      console.error(`❌ Failed: ${update.id}`, error.message);
    } else {
      process.stdout.write('.');
      successCount++;
    }
  }

  console.log(`\n✅ Finished! ${successCount} matches updated with real teams and dates.`);
}

seedSchedule();