import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 1. Load Environment Variables
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config({ path: '.env.local' });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing API Credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. OFFICIAL 2026 BRACKET LOGIC
// Source: FIFA World Cup 26™ Match Schedule (Dec 2025)
const BRACKET_MAP = [
  // --- Round of 16 Destinations ---
  // R16_1 (Philly) = Winner 74 vs Winner 77
  { id: 'R32_2', next: 'R16_1' }, { id: 'R32_5', next: 'R16_1' },
  
  // R16_2 (Houston) = Winner 73 vs Winner 75
  { id: 'R32_1', next: 'R16_2' }, { id: 'R32_3', next: 'R16_2' },
  
  // R16_3 (NY/NJ) = Winner 76 vs Winner 78
  { id: 'R32_4', next: 'R16_3' }, { id: 'R32_6', next: 'R16_3' },
  
  // R16_4 (Mexico City) = Winner 79 vs Winner 80
  { id: 'R32_7', next: 'R16_4' }, { id: 'R32_8', next: 'R16_4' },
  
  // R16_5 (Dallas) = Winner 83 vs Winner 84
  { id: 'R32_11', next: 'R16_5' }, { id: 'R32_12', next: 'R16_5' },
  
  // R16_6 (Seattle) = Winner 81 vs Winner 82
  { id: 'R32_9', next: 'R16_6' }, { id: 'R32_10', next: 'R16_6' },
  
  // R16_7 (Atlanta) = Winner 86 vs Winner 88
  { id: 'R32_14', next: 'R16_7' }, { id: 'R32_16', next: 'R16_7' },
  
  // R16_8 (Vancouver) = Winner 85 vs Winner 87
  { id: 'R32_13', next: 'R16_8' }, { id: 'R32_15', next: 'R16_8' },

  // --- Quarter Final Destinations ---
  // QF_1 (Boston) = Winner R16_1 vs Winner R16_2
  { id: 'R16_1', next: 'QF_1' }, { id: 'R16_2', next: 'QF_1' },
  
  // QF_2 (LA) = Winner R16_5 vs Winner R16_6
  { id: 'R16_5', next: 'QF_2' }, { id: 'R16_6', next: 'QF_2' },
  
  // QF_3 (Miami) = Winner R16_3 vs Winner R16_4
  { id: 'R16_3', next: 'QF_3' }, { id: 'R16_4', next: 'QF_3' },
  
  // QF_4 (KC) = Winner R16_7 vs Winner R16_8
  { id: 'R16_7', next: 'QF_4' }, { id: 'R16_8', next: 'QF_4' },

  // --- Semi Final Destinations ---
  // SF_1 (Dallas) = Winner QF_1 vs Winner QF_2
  { id: 'QF_1', next: 'SF_1' }, { id: 'QF_2', next: 'SF_1' },
  
  // SF_2 (Atlanta) = Winner QF_3 vs Winner QF_4
  { id: 'QF_3', next: 'SF_2' }, { id: 'QF_4', next: 'SF_2' },

  // --- Finals ---
  { id: 'SF_1', next: 'FIN_1' }, { id: 'SF_2', next: 'FIN_1' }
];

async function linkBracket() {
  console.log('🔗 Linking Bracket Matches (Official FIFA 2026 Logic)...');
  let count = 0;

  for (const map of BRACKET_MAP) {
    const { error } = await supabase
      .from('matches')
      .update({ next_match_id: map.next })
      .eq('id', map.id);

    if (error) {
      console.error(`❌ Error linking ${map.id} -> ${map.next}:`, error.message);
    } else {
      process.stdout.write('.');
      count++;
    }
  }

  console.log(`\n✅ Success! Linked ${count} matches. Bracket flow is now correct.`);
}

linkBracket();