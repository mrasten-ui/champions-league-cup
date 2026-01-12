import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// --- CONFIGURATION ---
const LEAGUE_ID = 1;      // Confirmed via your find-league script
const SEASON = 2026;      // Confirmed via your find-league script

// --- MAP ---
const EXTERNAL_TEAM_ID_MAP = {
  // South America (CONMEBOL)
  26: "ARG", // Argentina
  6: "BRA",  // Brazil
  7: "URU",  // Uruguay
  8: "COL",  // Colombia

  // Europe (UEFA)
  9: "FRA",  // France
  1: "BEL",  // Belgium
  10: "ENG", // England
  25: "GER", // Germany
  21: "ITA", // Italy
  4: "POR",  // Portugal
  11: "NED", // Netherlands
  9: "ESP",  // Spain (Warning: Check ID if map fails)
  3: "CRO",  // Croatia
  
  // North America (CONCACAF)
  2255: "USA", // United States
  2256: "MEX", // Mexico
  2257: "CAN", // Canada
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seedApiIds() {
  const API_KEY = process.env.API_FOOTBALL_KEY;
  console.log(`🌱 Starting API ID Seeding for League ${LEAGUE_ID}, Season ${SEASON}...`);

  if (!API_KEY) {
    console.error('❌ Missing API_FOOTBALL_KEY');
    process.exit(1);
  }

  try {
    // 1. Fetch Fixtures
    const url = `https://v3.football.api-sports.io/fixtures?league=${LEAGUE_ID}&season=${SEASON}`;
    console.log(`Fetching: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-apisports-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
        console.error('❌ API Error:', data.errors);
        return;
    }

    const fixtures = data.response;
    if (!fixtures || fixtures.length === 0) {
      console.log('⚠️ No fixtures found. The API might have the season metadata but not the match schedule yet.');
      return;
    }

    console.log(`Processing ${fixtures.length} fixtures...`);

    let linkedCount = 0;

    // 2. Loop and Link
    for (const item of fixtures) {
      const fixture = item.fixture;
      const teams = item.teams;

      const homeCode = EXTERNAL_TEAM_ID_MAP[teams.home.id];
      const awayCode = EXTERNAL_TEAM_ID_MAP[teams.away.id];

      // Only proceed if we know BOTH teams (skips TBD matches)
      if (homeCode && awayCode) {
        const { data: match } = await supabase
            .from('matches')
            .select('id')
            .eq('home_team_id', homeCode)
            .eq('away_team_id', awayCode)
            .single();

        if (match) {
            await supabase
            .from('matches')
            .update({ api_id: fixture.id.toString() })
            .eq('id', match.id);
            
            console.log(`✅ LINKED: ${homeCode} vs ${awayCode} -> API ID ${fixture.id}`);
            linkedCount++;
        }
      }
    }

    console.log(`🎉 Finished! Linked ${linkedCount} matches.`);

  } catch (err) {
    console.error('Critical Error:', err);
  }
}

seedApiIds();