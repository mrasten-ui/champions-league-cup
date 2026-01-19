import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 1. Load the .env file explicitly
const envPath = path.resolve(process.cwd(), '.env');
console.log(`🔍 Looking for .env file at: ${envPath}`);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Found and loaded .env file');
} else {
  console.error('❌ Could not find .env file!');
  dotenv.config({ path: '.env.local' }); // Fallback
}

// 2. Get Variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing API Credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- HYPOTHETICAL PLAYOFF WINNERS (For Testing Only) ---
// Based on current FIFA rankings/odds for the March 2026 playoffs
const TEST_TEAMS = {
  // Group A: Winner of UEFA Path A (TBD vs KOR)
  'A2': { id: 'CZE', name: 'Czechia' }, 
  'A4': { id: 'CZE', name: 'Czechia' },
  'A5': { id: 'CZE', name: 'Czechia' },

  // Group B: Winner of UEFA Path B (CAN vs TBD)
  'B1': { id: 'ITA', name: 'Italy' }, 
  'B3': { id: 'ITA', name: 'Italy' },
  'B6': { id: 'ITA', name: 'Italy' },

  // Group D: Winner of UEFA Path C (AUS vs TBD)
  'D2': { id: 'TUR', name: 'Turkey' }, 
  'D4': { id: 'TUR', name: 'Turkey' },
  'D5': { id: 'TUR', name: 'Turkey' },

  // Group F: Winner of UEFA Path D (TBD vs TUN)
  'F2': { id: 'UKR', name: 'Ukraine' }, 
  'F3': { id: 'UKR', name: 'Ukraine' },
  'F6': { id: 'UKR', name: 'Ukraine' },

  // Group I: Intercontinental Playoff 1 (TBD vs NOR)
  'I2': { id: 'CHI', name: 'Chile' }, 
  'I3': { id: 'CHI', name: 'Chile' },
  'I6': { id: 'CHI', name: 'Chile' },

  // Group K: Intercontinental Playoff 2 (POR vs TBD)
  'K1': { id: 'CRC', name: 'Costa Rica' }, 
  'K4': { id: 'CRC', name: 'Costa Rica' },
  'K6': { id: 'CRC', name: 'Costa Rica' },
};

async function seedTestTeams() {
  console.log('🧪 Injecting Hypothetical Playoff Winners for Testing...');

  let updateCount = 0;

  for (const [matchId, team] of Object.entries(TEST_TEAMS)) {
    // 1. Fetch the match to see which side is TBD
    const { data: match, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .maybeSingle();
    
    if (error || !match) {
      console.warn(`⚠️ Could not find match ${matchId}`);
      continue;
    }

    const updates = {};
    // Only replace if it is currently 'TBD' (don't overwrite real teams)
    if (match.home_team_id === 'TBD') updates.home_team_id = team.id;
    if (match.away_team_id === 'TBD') updates.away_team_id = team.id;

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', matchId);
        
      if (!updateError) {
        process.stdout.write('.'); // Progress dot
        updateCount++;
      } else {
        console.error(`❌ Error updating ${matchId}:`, updateError.message);
      }
    }
  }

  console.log(`\n✅ Success! Filled ${updateCount} matches with test teams.`);
  console.log('   (Italy, Czechia, Turkey, Ukraine, Chile, Costa Rica)');
}

seedTestTeams();