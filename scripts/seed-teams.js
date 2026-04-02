import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 1. Load Environment
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config({ path: '.env.local' });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing Supabase credentials in .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. The Official 2026 Team List
const TEAM_NAMES = {
  MEX: "Mexico", RSA: "South Africa", KOR: "Korea Republic", CZE: "Czechia",
  CAN: "Canada", BIH: "Bosnia", QAT: "Qatar", SUI: "Switzerland",
  BRA: "Brazil", MAR: "Morocco", HAI: "Haiti", SCO: "Scotland",
  USA: "USA", PAR: "Paraguay", AUS: "Australia", TUR: "Turkey",
  GER: "Germany", CUW: "Curacao", CIV: "Ivory Coast", ECU: "Ecuador",
  NED: "Netherlands", JPN: "Japan", SWE: "Sweden", TUN: "Tunisia",
  BEL: "Belgium", EGY: "Egypt", IRN: "Iran", NZL: "New Zealand",
  ESP: "Spain", CPV: "Cabo Verde", KSA: "Saudi Arabia", URU: "Uruguay",
  FRA: "France", SEN: "Senegal", IRQ: "Iraq", NOR: "Norway",
  ARG: "Argentina", ALG: "Algeria", AUT: "Austria", JOR: "Jordan",
  POR: "Portugal", COD: "Congo DR", UZB: "Uzbekistan", COL: "Colombia",
  ENG: "England", CRO: "Croatia", GHA: "Ghana", PAN: "Panama",
  TBD: "TBD"
};

// Map to standard 2-letter ISO codes for flagcdn
const FLAG_MAP = {
  MEX: "mx", RSA: "za", KOR: "kr", CZE: "cz",
  CAN: "ca", BIH: "ba", QAT: "qa", SUI: "ch",
  BRA: "br", MAR: "ma", HAI: "ht", SCO: "gb-sct",
  USA: "us", PAR: "py", AUS: "au", TUR: "tr",
  GER: "de", CUW: "cw", CIV: "ci", ECU: "ec",
  NED: "nl", JPN: "jp", SWE: "se", TUN: "tn",
  BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz",
  ESP: "es", CPV: "cv", KSA: "sa", URU: "uy",
  FRA: "fr", SEN: "sn", IRQ: "iq", NOR: "no",
  ARG: "ar", ALG: "dz", AUT: "at", JOR: "jo",
  POR: "pt", COD: "cd", UZB: "uz", COL: "co",
  ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa",
  TBD: ""
};

async function seedTeams() {
  console.log('🔍 Checking existing database to protect your scouting/tactics data...');
  
  // Fetch existing teams to map names to whatever IDs are already safely in the DB
  const { data: existingTeams, error: fetchError } = await supabase.from('teams').select('id, name');
  if (fetchError) {
      console.error("❌ Failed to fetch existing teams:", fetchError);
      return;
  }

  const nameToIdMap = {};
  if (existingTeams) {
      existingTeams.forEach(t => {
          nameToIdMap[t.name] = t.id;
      });
  }

  console.log('🌍 Updating Teams Table with flags...');
  const rows = Object.entries(TEAM_NAMES).map(([defaultId, name]) => {
      // Use the existing DB ID if it exists (e.g. 'mex'), otherwise use the default ('MEX')
      const actualId = nameToIdMap[name] || defaultId;
      return {
          id: actualId,
          name: name,
          flag: FLAG_MAP[defaultId] ? `https://flagcdn.com/w320/${FLAG_MAP[defaultId]}.png` : '',
          rank: 50, 
          rating: 75,
          att: 75,
          mid: 75,
          def: 75,
          overview: 'Team Overview TBD'
      };
  });

  const { error } = await supabase.from('teams').upsert(rows, { onConflict: 'id' });

  if (error) {
      console.error('❌ Insert Error:', error.message);
  } else {
      console.log(`✅ Successfully updated ${rows.length} teams with flags without breaking any constraints!`);
  }
}

seedTeams();