
import { createClient } from '@supabase/supabase-js';

// Configuration
// NOTE: Run this with: node scripts/sync-scores.js
// Ensure you have a .env file or pass variables in command line
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use Service Key to bypass RLS for writing
);

const API_KEY = process.env.API_FOOTBALL_KEY;
const LEAGUE_ID = 1; // World Cup League ID in API-Football
const SEASON = 2026;

// --- ID MAPPING CONFIGURATION ---
// This is the most important part: mapping real world data to our App's constants.
// 
// 1. Team Mapping: External Name/Code -> Internal 3-Letter Code
// If the API returns "The Netherlands", we need to map it to "NED"
const TEAM_NAME_TO_ID = {
  "Netherlands": "NED",
  "United States": "USA",
  "England": "ENG",
  "Argentina": "ARG",
  "France": "FRA",
  "Brazil": "BRA",
  // ... Add all teams here based on your API's naming convention
};

// 2. Match Mapping: External Match ID -> Internal Match ID (A1, R16_1, etc)
// Ideally, you store the 'api_id' in your Supabase 'matches' table once manually 
// or via a seeding script, so you don't need to hardcode this map every time.
// However, if we rely on Round names, we can deduce it.

async function syncScores() {
  console.log('Starting score sync...');

  try {
    // 1. Fetch Fixtures from API-Football
    const response = await fetch(`https://v3.football.api-sports.io/fixtures?league=${LEAGUE_ID}&season=${SEASON}`, {
      method: 'GET',
      headers: {
        'x-apisports-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!data.response || data.response.length === 0) {
      console.log('No fixtures found. Check League ID and Season.');
      return;
    }

    const updates = [];

    // 2. Process each match
    for (const item of data.response) {
      const fixture = item.fixture;
      const goals = item.goals;
      const teams = item.teams;
      const league = item.league;

      // Extract Status
      const statusShort = fixture.status.short; // 'NS', 'FT', '1H', etc.
      
      // Determine if Match is Locked (Started or Finished)
      const isLocked = ['1H', '2H', 'HT', 'ET', 'P', 'FT', 'AET', 'PEN', 'LIVE', 'INT'].includes(statusShort);

      // Construct Payload
      const payload = {
        api_id: fixture.id.toString(), // Store external ID for reference
        status: statusShort,
        home_score: goals.home,
        away_score: goals.away,
        minute: fixture.status.elapsed, // For live display
        updated_at: new Date().toISOString()
      };

      // Optional: Update teams if they were TBD and are now known (mostly for Knockouts)
      // This requires your DB to allow writing team_ids
      const homeId = TEAM_NAME_TO_ID[teams.home.name];
      const awayId = TEAM_NAME_TO_ID[teams.away.name];
      
      if (homeId) payload.home_team_id = homeId;
      if (awayId) payload.away_team_id = awayId;

      // 3. Upsert Logic
      // We match based on 'api_id' if your DB has it, otherwise we need a robust mapping strategy.
      // For this script, we assume the DB 'matches' table has a column 'api_id' that matches this.
      
      const { error } = await supabase
        .from('matches')
        .update(payload)
        .eq('api_id', fixture.id.toString()); // Update rows where API ID matches

      if (error) {
        console.error(`Error updating match ${fixture.id}:`, error.message);
      } else {
        updates.push(fixture.id);
      }
    }

    console.log(`Successfully synced ${updates.length} matches.`);
    
  } catch (err) {
    console.error('Critical Error:', err);
    process.exit(1);
  }
}

syncScores();
