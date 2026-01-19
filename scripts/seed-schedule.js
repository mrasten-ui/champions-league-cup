import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // MUST use Service Role Key for bulk updates
);

// --- OFFICIAL SCHEDULE DATA (2026) ---
// Times are approximate standard kick-offs converted to UTC for storage
// Venues are official FIFA 2026 designations

const VENUES = {
  AZTECA: "Estadio Azteca, Mexico City",
  AKRON: "Estadio Guadalajara, Zapopan",
  MONTERREY: "Estadio Monterrey, Guadalupe",
  TORONTO: "Toronto Stadium, Toronto",
  VANCOUVER: "BC Place, Vancouver",
  ATLANTA: "Atlanta Stadium, Atlanta",
  BOSTON: "Boston Stadium, Foxborough",
  DALLAS: "Dallas Stadium, Arlington",
  HOUSTON: "Houston Stadium, Houston",
  KC: "Kansas City Stadium, Kansas City",
  LA: "Los Angeles Stadium, Inglewood",
  MIAMI: "Miami Stadium, Miami Gardens",
  NYNJ: "New York New Jersey Stadium, East Rutherford",
  PHILLY: "Philadelphia Stadium, Philadelphia",
  SF: "San Francisco Bay Area Stadium, Santa Clara",
  SEATTLE: "Seattle Stadium, Seattle"
};

// Mapping App IDs (A1..A6) to Official Schedule Data
// Matches are ordered by Group sequence: 1v2, 3v4, 1v3, 4v2, 4v1, 2v3
const GROUP_SCHEDULES = {
  A: [
    { date: '2026-06-11T19:00:00Z', venue: VENUES.AZTECA },    // MEX vs RSA
    { date: '2026-06-11T23:00:00Z', venue: VENUES.AKRON },     // KOR vs CZE
    { date: '2026-06-18T23:00:00Z', venue: VENUES.AKRON },     // MEX vs KOR
    { date: '2026-06-18T16:00:00Z', venue: VENUES.ATLANTA },   // CZE vs RSA
    { date: '2026-06-24T23:00:00Z', venue: VENUES.AZTECA },    // CZE vs MEX
    { date: '2026-06-24T23:00:00Z', venue: VENUES.MONTERREY }, // RSA vs KOR
  ],
  B: [
    { date: '2026-06-12T19:00:00Z', venue: VENUES.TORONTO },   // CAN vs BIH
    { date: '2026-06-13T20:00:00Z', venue: VENUES.SF },        // QAT vs SUI
    { date: '2026-06-18T22:00:00Z', venue: VENUES.VANCOUVER }, // CAN vs QAT
    { date: '2026-06-18T19:00:00Z', venue: VENUES.LA },        // SUI vs BIH
    { date: '2026-06-24T19:00:00Z', venue: VENUES.VANCOUVER }, // SUI vs CAN
    { date: '2026-06-24T19:00:00Z', venue: VENUES.SEATTLE },   // BIH vs QAT
  ],
  C: [
    { date: '2026-06-13T19:00:00Z', venue: VENUES.BOSTON },    // HAI vs SCO
    { date: '2026-06-13T23:00:00Z', venue: VENUES.NYNJ },      // BRA vs MAR
    { date: '2026-06-19T23:00:00Z', venue: VENUES.PHILLY },    // BRA vs HAI
    { date: '2026-06-19T19:00:00Z', venue: VENUES.BOSTON },    // SCO vs MAR
    { date: '2026-06-24T22:00:00Z', venue: VENUES.MIAMI },     // SCO vs BRA
    { date: '2026-06-24T22:00:00Z', venue: VENUES.ATLANTA },   // MAR vs HAI
  ],
  D: [
    { date: '2026-06-12T23:00:00Z', venue: VENUES.LA },        // USA vs PAR
    { date: '2026-06-13T23:00:00Z', venue: VENUES.VANCOUVER }, // AUS vs KOS
    { date: '2026-06-19T22:00:00Z', venue: VENUES.SEATTLE },   // USA vs AUS
    { date: '2026-06-19T23:00:00Z', venue: VENUES.SF },        // KOS vs PAR
    { date: '2026-06-25T23:00:00Z', venue: VENUES.LA },        // KOS vs USA
    { date: '2026-06-25T23:00:00Z', venue: VENUES.SF },        // PAR vs AUS
  ],
  E: [
    { date: '2026-06-14T17:00:00Z', venue: VENUES.HOUSTON },   // GER vs CUW
    { date: '2026-06-14T23:00:00Z', venue: VENUES.PHILLY },    // CIV vs ECU
    { date: '2026-06-20T20:00:00Z', venue: VENUES.TORONTO },   // GER vs CIV
    { date: '2026-06-20T23:00:00Z', venue: VENUES.KC },        // ECU vs CUW
    { date: '2026-06-25T20:00:00Z', venue: VENUES.NYNJ },      // ECU vs GER
    { date: '2026-06-25T20:00:00Z', venue: VENUES.PHILLY },    // CUW vs CIV
  ],
  F: [
    { date: '2026-06-14T19:00:00Z', venue: VENUES.DALLAS },    // NED vs JPN
    { date: '2026-06-14T23:00:00Z', venue: VENUES.MONTERREY }, // ALB vs TUN
    { date: '2026-06-20T17:00:00Z', venue: VENUES.HOUSTON },   // NED vs ALB
    { date: '2026-06-20T23:00:00Z', venue: VENUES.MONTERREY }, // TUN vs JPN
    { date: '2026-06-25T23:00:00Z', venue: VENUES.KC },        // TUN vs NED
    { date: '2026-06-25T23:00:00Z', venue: VENUES.DALLAS },    // JPN vs ALB
  ],
  G: [
    { date: '2026-06-15T19:00:00Z', venue: VENUES.SEATTLE },   // BEL vs EGY
    { date: '2026-06-15T23:00:00Z', venue: VENUES.LA },        // IRN vs NZL
    { date: '2026-06-21T19:00:00Z', venue: VENUES.LA },        // BEL vs IRN
    { date: '2026-06-21T23:00:00Z', venue: VENUES.VANCOUVER }, // NZL vs EGY
    { date: '2026-06-26T23:00:00Z', venue: VENUES.SEATTLE },   // NZL vs BEL
    { date: '2026-06-26T23:00:00Z', venue: VENUES.VANCOUVER }, // EGY vs IRN
  ],
  H: [
    { date: '2026-06-15T16:00:00Z', venue: VENUES.ATLANTA },   // ESP vs CPV
    { date: '2026-06-15T22:00:00Z', venue: VENUES.MIAMI },     // KSA vs URU
    { date: '2026-06-21T16:00:00Z', venue: VENUES.ATLANTA },   // ESP vs KSA
    { date: '2026-06-21T22:00:00Z', venue: VENUES.MIAMI },     // URU vs CPV
    { date: '2026-06-26T20:00:00Z', venue: VENUES.AKRON },     // URU vs ESP
    { date: '2026-06-26T20:00:00Z', venue: VENUES.HOUSTON },   // CPV vs KSA
  ],
  I: [
    { date: '2026-06-16T19:00:00Z', venue: VENUES.NYNJ },      // FRA vs SEN
    { date: '2026-06-16T22:00:00Z', venue: VENUES.BOSTON },    // BOL vs NOR
    { date: '2026-06-22T20:00:00Z', venue: VENUES.PHILLY },    // FRA vs BOL
    { date: '2026-06-22T23:00:00Z', venue: VENUES.NYNJ },      // NOR vs SEN
    { date: '2026-06-26T17:00:00Z', venue: VENUES.PHILLY },    // NOR vs FRA
    { date: '2026-06-26T17:00:00Z', venue: VENUES.BOSTON },    // SEN vs BOL
  ],
  J: [
    { date: '2026-06-16T23:00:00Z', venue: VENUES.KC },        // ARG vs ALG
    { date: '2026-06-16T23:00:00Z', venue: VENUES.SF },        // AUT vs JOR
    { date: '2026-06-22T17:00:00Z', venue: VENUES.DALLAS },    // ARG vs AUT
    { date: '2026-06-22T23:00:00Z', venue: VENUES.SF },        // JOR vs ALG
    { date: '2026-06-27T23:00:00Z', venue: VENUES.KC },        // JOR vs ARG
    { date: '2026-06-27T23:00:00Z', venue: VENUES.DALLAS },    // ALG vs AUT
  ],
  K: [
    { date: '2026-06-17T17:00:00Z', venue: VENUES.HOUSTON },   // POR vs COD
    { date: '2026-06-17T23:00:00Z', venue: VENUES.AZTECA },    // UZB vs COL
    { date: '2026-06-23T17:00:00Z', venue: VENUES.HOUSTON },   // POR vs UZB
    { date: '2026-06-23T23:00:00Z', venue: VENUES.AKRON },     // COL vs COD
    { date: '2026-06-27T20:00:00Z', venue: VENUES.MIAMI },     // COL vs POR
    { date: '2026-06-27T20:00:00Z', venue: VENUES.ATLANTA },   // COD vs UZB
  ],
  L: [
    { date: '2026-06-17T19:00:00Z', venue: VENUES.DALLAS },    // ENG vs CRO
    { date: '2026-06-17T22:00:00Z', venue: VENUES.TORONTO },   // GHA vs PAN
    { date: '2026-06-23T19:00:00Z', venue: VENUES.BOSTON },    // ENG vs GHA
    { date: '2026-06-23T22:00:00Z', venue: VENUES.TORONTO },   // PAN vs CRO
    { date: '2026-06-27T17:00:00Z', venue: VENUES.NYNJ },      // PAN vs ENG
    { date: '2026-06-27T17:00:00Z', venue: VENUES.PHILLY },    // CRO vs GHA
  ]
};

// --- KNOCKOUT SCHEDULE ---
const KNOCKOUT_SCHEDULE = [
  // Round of 32 (June 28 - July 3)
  { id: 'R32_1', date: '2026-06-28T20:00:00Z', venue: VENUES.LA },
  { id: 'R32_2', date: '2026-06-28T23:00:00Z', venue: VENUES.NYNJ },
  { id: 'R32_3', date: '2026-06-29T16:00:00Z', venue: VENUES.BOSTON },
  { id: 'R32_4', date: '2026-06-29T19:00:00Z', venue: VENUES.TORONTO },
  { id: 'R32_5', date: '2026-06-29T22:00:00Z', venue: VENUES.HOUSTON },
  { id: 'R32_6', date: '2026-06-30T16:00:00Z', venue: VENUES.MIAMI },
  { id: 'R32_7', date: '2026-06-30T19:00:00Z', venue: VENUES.ATLANTA },
  { id: 'R32_8', date: '2026-06-30T22:00:00Z', venue: VENUES.DALLAS },
  { id: 'R32_9', date: '2026-07-01T19:00:00Z', venue: VENUES.SEATTLE },
  { id: 'R32_10', date: '2026-07-01T22:00:00Z', venue: VENUES.SF },
  { id: 'R32_11', date: '2026-07-02T19:00:00Z', venue: VENUES.VANCOUVER },
  { id: 'R32_12', date: '2026-07-02T22:00:00Z', venue: VENUES.LA },
  { id: 'R32_13', date: '2026-07-03T16:00:00Z', venue: VENUES.AZTECA },
  { id: 'R32_14', date: '2026-07-03T19:00:00Z', venue: VENUES.MONTERREY },
  { id: 'R32_15', date: '2026-07-03T22:00:00Z', venue: VENUES.AKRON },
  { id: 'R32_16', date: '2026-07-03T19:00:00Z', venue: VENUES.KC },

  // Round of 16 (July 4 - July 7)
  { id: 'R16_1', date: '2026-07-04T18:00:00Z', venue: VENUES.PHILLY },
  { id: 'R16_2', date: '2026-07-04T22:00:00Z', venue: VENUES.HOUSTON },
  { id: 'R16_3', date: '2026-07-05T18:00:00Z', venue: VENUES.NYNJ },
  { id: 'R16_4', date: '2026-07-05T22:00:00Z', venue: VENUES.AZTECA },
  { id: 'R16_5', date: '2026-07-06T18:00:00Z', venue: VENUES.DALLAS },
  { id: 'R16_6', date: '2026-07-06T22:00:00Z', venue: VENUES.SEATTLE },
  { id: 'R16_7', date: '2026-07-07T18:00:00Z', venue: VENUES.ATLANTA },
  { id: 'R16_8', date: '2026-07-07T22:00:00Z', venue: VENUES.VANCOUVER },

  // Quarter Finals (July 9 - 11)
  { id: 'QF_1', date: '2026-07-09T20:00:00Z', venue: VENUES.BOSTON },
  { id: 'QF_2', date: '2026-07-10T20:00:00Z', venue: VENUES.LA },
  { id: 'QF_3', date: '2026-07-11T16:00:00Z', venue: VENUES.MIAMI },
  { id: 'QF_4', date: '2026-07-11T20:00:00Z', venue: VENUES.KC },

  // Semi Finals
  { id: 'SF_1', date: '2026-07-14T20:00:00Z', venue: VENUES.DALLAS },
  { id: 'SF_2', date: '2026-07-15T20:00:00Z', venue: VENUES.ATLANTA },

  // Finals
  { id: '3RD_1', date: '2026-07-18T20:00:00Z', venue: VENUES.MIAMI },
  { id: 'FIN_1', date: '2026-07-19T20:00:00Z', venue: VENUES.NYNJ },
];

async function seedSchedule() {
  console.log('🌍 Starting Official 2026 Schedule Update...');

  const updates = [];

  // 1. Prepare Group Updates
  for (const [group, matches] of Object.entries(GROUP_SCHEDULES)) {
    matches.forEach((match, index) => {
      updates.push({
        id: `${group}${index + 1}`, // e.g., A1, A2
        date: match.date,
        venue: match.venue
      });
    });
  }

  // 2. Prepare Knockout Updates
  updates.push(...KNOCKOUT_SCHEDULE);

  // 3. Execute Updates
  for (const update of updates) {
    const { error } = await supabase
      .from('matches')
      .update({ date: update.date, venue: update.venue })
      .eq('id', update.id);

    if (error) {
      console.error(`❌ Failed to update ${update.id}:`, error.message);
    } else {
      process.stdout.write('.');
    }
  }

  console.log('\n✅ Schedule synchronized with FIFA 2026 Official Data.');
}

seedSchedule();