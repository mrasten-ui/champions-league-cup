import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// OFFICIAL 2026 VENUES
const VENUES = [
  'Estadio Azteca, Mexico City',
  'MetLife Stadium, New York/NJ',
  'AT&T Stadium, Dallas',
  'Arrowhead Stadium, Kansas City',
  'NRG Stadium, Houston',
  'Mercedes-Benz Stadium, Atlanta',
  'SoFi Stadium, Los Angeles',
  'Lincoln Financial Field, Philadelphia',
  'Lumen Field, Seattle',
  'Levi\'s Stadium, San Francisco',
  'Gillette Stadium, Boston',
  'Hard Rock Stadium, Miami',
  'BC Place, Vancouver',
  'BMO Field, Toronto',
  'Estadio Akron, Guadalajara',
  'Estadio BBVA, Monterrey'
];

async function seedVenues() {
  console.log('🏟️  Assigning Real 2026 Stadiums...');

  const { data: matches } = await supabase.from('matches').select('id');
  if (!matches) return;

  for (const match of matches) {
    // Pick a random venue for variety (or map specifically if you have the schedule)
    const randomVenue = VENUES[Math.floor(Math.random() * VENUES.length)];
    
    const { error } = await supabase
      .from('matches')
      .update({ venue: randomVenue })
      .eq('id', match.id);

    if (error) console.error(`❌ Failed to update ${match.id}:`, error.message);
  }

  console.log('✅ Venues Updated! Refresh your app.');
}

seedVenues();