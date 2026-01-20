import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 1. Setup
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 2. REAL FIFA RANKINGS (Projected Jan 2026) & ATTRIBUTES
const REAL_TEAMS = [
  // --- GROUP A ---
  { id: 'MEX', name: 'Mexico', rank: 16, att: 79, mid: 78, def: 77, style: 'Possession' },
  { id: 'RSA', name: 'South Africa', rank: 61, att: 73, mid: 72, def: 70, style: 'Counter Attack' },
  { id: 'KOR', name: 'Korea Republic', rank: 22, att: 81, mid: 79, def: 76, style: 'High Press' },
  { id: 'CZE', name: 'Czechia', rank: 44, att: 76, mid: 77, def: 75, style: 'Physical' },

  // --- GROUP B ---
  { id: 'CAN', name: 'Canada', rank: 27, att: 79, mid: 77, def: 75, style: 'Direct' },
  { id: 'BIH', name: 'Bosnia', rank: 71, att: 73, mid: 74, def: 72, style: 'Balanced' },
  { id: 'QAT', name: 'Qatar', rank: 53, att: 72, mid: 73, def: 71, style: 'Possession' },
  { id: 'SUI', name: 'Switzerland', rank: 18, att: 78, mid: 81, def: 83, style: 'Low Block' },

  // --- GROUP C ---
  { id: 'HAI', name: 'Haiti', rank: 84, att: 68, mid: 66, def: 64, style: 'Counter Attack' },
  { id: 'SCO', name: 'Scotland', rank: 36, att: 75, mid: 79, def: 78, style: 'Low Block' },
  { id: 'BRA', name: 'Brazil', rank: 5, att: 89, mid: 87, def: 84, style: 'Possession' },
  { id: 'MAR', name: 'Morocco', rank: 8, att: 81, mid: 84, def: 87, style: 'Balanced' },

  // --- GROUP D ---
  { id: 'USA', name: 'USA', rank: 14, att: 80, mid: 81, def: 78, style: 'High Press' },
  { id: 'PAR', name: 'Paraguay', rank: 38, att: 74, mid: 75, def: 76, style: 'Physical' },
  { id: 'AUS', name: 'Australia', rank: 26, att: 75, mid: 76, def: 77, style: 'Direct' },
  { id: 'KOS', name: 'Kosovo', rank: 80, att: 70, mid: 72, def: 69, style: 'Balanced' },

  // --- GROUP E ---
  { id: 'GER', name: 'Germany', rank: 10, att: 85, mid: 87, def: 84, style: 'High Press' },
  { id: 'CUW', name: 'Curacao', rank: 82, att: 69, mid: 67, def: 66, style: 'Counter Attack' },
  { id: 'CIV', name: 'Ivory Coast', rank: 42, att: 79, mid: 78, def: 76, style: 'Physical' },
  { id: 'ECU', name: 'Ecuador', rank: 23, att: 77, mid: 79, def: 78, style: 'High Press' },

  // --- GROUP F ---
  { id: 'NED', name: 'Netherlands', rank: 7, att: 84, mid: 86, def: 87, style: 'Possession' },
  { id: 'JPN', name: 'Japan', rank: 19, att: 80, mid: 82, def: 78, style: 'Counter Attack' },
  { id: 'ALB', name: 'Albania', rank: 63, att: 71, mid: 73, def: 75, style: 'Low Block' },
  { id: 'TUN', name: 'Tunisia', rank: 41, att: 72, mid: 74, def: 75, style: 'Low Block' },

  // --- GROUP G ---
  { id: 'BEL', name: 'Belgium', rank: 9, att: 84, mid: 87, def: 80, style: 'Possession' },
  { id: 'EGY', name: 'Egypt', rank: 35, att: 80, mid: 75, def: 73, style: 'Counter Attack' },
  { id: 'IRN', name: 'Iran', rank: 20, att: 78, mid: 76, def: 77, style: 'Low Block' },
  { id: 'NZL', name: 'New Zealand', rank: 87, att: 69, mid: 68, def: 69, style: 'Physical' },

  // --- GROUP H ---
  { id: 'ESP', name: 'Spain', rank: 1, att: 86, mid: 90, def: 86, style: 'Possession' },
  { id: 'CPV', name: 'Cabo Verde', rank: 67, att: 73, mid: 71, def: 70, style: 'Counter Attack' },
  { id: 'KSA', name: 'Saudi Arabia', rank: 60, att: 74, mid: 73, def: 71, style: 'High Press' },
  { id: 'URU', name: 'Uruguay', rank: 17, att: 83, mid: 84, def: 83, style: 'Direct' },

  // --- GROUP I ---
  { id: 'FRA', name: 'France', rank: 3, att: 92, mid: 89, def: 88, style: 'Balanced' },
  { id: 'SEN', name: 'Senegal', rank: 12, att: 82, mid: 80, def: 83, style: 'Physical' },
  { id: 'BOL', name: 'Bolivia', rank: 76, att: 68, mid: 67, def: 66, style: 'Low Block' },
  { id: 'NOR', name: 'Norway', rank: 29, att: 87, mid: 79, def: 75, style: 'Direct' },

  // --- GROUP J ---
  { id: 'ARG', name: 'Argentina', rank: 2, att: 91, mid: 88, def: 85, style: 'Possession' },
  { id: 'ALG', name: 'Algeria', rank: 34, att: 78, mid: 77, def: 75, style: 'Technical' },
  { id: 'AUT', name: 'Austria', rank: 24, att: 77, mid: 80, def: 78, style: 'High Press' },
  { id: 'JOR', name: 'Jordan', rank: 64, att: 71, mid: 69, def: 67, style: 'Counter Attack' },

  // --- GROUP K ---
  { id: 'POR', name: 'Portugal', rank: 6, att: 88, mid: 89, def: 84, style: 'Possession' },
  { id: 'COD', name: 'Congo DR', rank: 56, att: 75, mid: 73, def: 72, style: 'Physical' },
  { id: 'UZB', name: 'Uzbekistan', rank: 50, att: 71, mid: 72, def: 70, style: 'Balanced' },
  { id: 'COL', name: 'Colombia', rank: 13, att: 83, mid: 80, def: 79, style: 'Counter Attack' },

  // --- GROUP L ---
  { id: 'ENG', name: 'England', rank: 4, att: 89, mid: 90, def: 85, style: 'Balanced' },
  { id: 'CRO', name: 'Croatia', rank: 11, att: 78, mid: 85, def: 82, style: 'Possession' },
  { id: 'GHA', name: 'Ghana', rank: 72, att: 76, mid: 75, def: 73, style: 'Counter Attack' },
  { id: 'PAN', name: 'Panama', rank: 30, att: 72, mid: 71, def: 71, style: 'Physical' },
];

async function seedRealData() {
  console.log('🌍 Seeding UPDATED FIFA Rankings & Stats...');

  for (const team of REAL_TEAMS) {
    // 1. Update the Main 'teams' table
    const ovr = Math.round((team.att + team.mid + team.def) / 3);
    
    const { error: teamError } = await supabase
      .from('teams')
      .update({
        rank: team.rank,
        rating: ovr,
        att: team.att,
        mid: team.mid,
        def: team.def
      })
      .eq('id', team.id);

    if (teamError) console.error(`❌ Failed to update team ${team.id}:`, teamError.message);

    // 2. Update the 'team_tactics' table (Detailed Stats)
    let pace = team.att; 
    let phys = team.def;
    let tech = team.mid;

    // Adjust detailed stats based on playstyle
    if (team.style === 'Counter Attack') { pace += 8; tech -= 4; }
    if (team.style === 'Physical') { phys += 8; tech -= 5; }
    if (team.style === 'Possession') { tech += 8; pace -= 5; }
    if (team.style === 'Direct') { pace += 5; phys += 5; tech -= 5; }
    if (team.style === 'Technical') { tech += 10; phys -= 5; }

    // Cap at 99
    pace = Math.min(99, pace);
    phys = Math.min(99, phys);
    tech = Math.min(99, tech);

    const { error: tacticError } = await supabase
      .from('team_tactics')
      .update({
        style: team.style,
        att: team.att,
        mid: team.mid,
        def: team.def,
        pace: pace,
        phys: phys,
        tech: tech
      })
      .eq('team_id', team.id);

    if (tacticError) console.error(`❌ Failed to update tactics ${team.id}:`, tacticError.message);
  }

  console.log('✅ Success! Data is now consistent with official FIFA Rankings.');
}

seedRealData();