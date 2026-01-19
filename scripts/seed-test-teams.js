import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Based on FIFA World Cup 2026 Playoff Brackets (March 2026)
const HYPOTHETICAL_QUALIFIERS = {
  // Group A needs UEFA Path D Winner (Favorites: Denmark or Czechia)
  'A2': { id: 'CZE', name: 'Czechia' }, 
  'A4': { id: 'CZE', name: 'Czechia' },
  'A5': { id: 'CZE', name: 'Czechia' },

  // Group B needs UEFA Path A Winner (Favorite: Italy)
  'B1': { id: 'ITA', name: 'Italy' }, 
  'B3': { id: 'ITA', name: 'Italy' },
  'B6': { id: 'ITA', name: 'Italy' },

  // Group D needs UEFA Path C Winner (Favorites: Turkey or Romania)
  'D2': { id: 'TUR', name: 'Turkey' }, 
  'D4': { id: 'TUR', name: 'Turkey' },
  'D5': { id: 'TUR', name: 'Turkey' },

  // Group F needs UEFA Path B Winner (Favorites: Ukraine or Sweden)
  'F2': { id: 'UKR', name: 'Ukraine' }, 
  'F3': { id: 'UKR', name: 'Ukraine' },
  'F6': { id: 'UKR', name: 'Ukraine' },

  // Group I needs Intercontinental Playoff 2 Winner (Favorites: Iraq or Bolivia)
  'I2': { id: 'IRQ', name: 'Iraq' }, 
  'I3': { id: 'IRQ', name: 'Iraq' },
  'I6': { id: 'IRQ', name: 'Iraq' },

  // Group K needs Intercontinental Playoff 1 Winner (Favorites: DR Congo or Jamaica)
  'K1': { id: 'JAM', name: 'Jamaica' }, 
  'K4': { id: 'JAM', name: 'Jamaica' },
  'K6': { id: 'JAM', name: 'Jamaica' },
};

async function seedTestTeams() {
  console.log('🧪 Injecting Hypothetical Playoff Winners for Testing...');

  for (const [matchId, team] of Object.entries(HYPOTHETICAL_QUALIFIERS)) {
    // We need to fetch the match first to see if TBD is home or away
    const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single();
    
    if (!match) continue;

    const updates = {};
    if (match.home_team_id === 'TBD') updates.home_team_id = team.id;
    if (match.away_team_id === 'TBD') updates.away_team_id = team.id;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', matchId);
        
      if (!error) console.log(`✅ Match ${matchId}: Replaced TBD with ${team.name}`);
    }
  }
}

seedTestTeams();