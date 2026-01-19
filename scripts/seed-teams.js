import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// 1. Load Environment
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 2. Data from constants.ts
const TEAM_NAMES = {
  MEX: "Mexico", RSA: "South Africa", KOR: "Korea Republic", CZE: "Czechia",
  CAN: "Canada", BIH: "Bosnia", QAT: "Qatar", SUI: "Switzerland",
  HAI: "Haiti", SCO: "Scotland", BRA: "Brazil", MAR: "Morocco",
  USA: "USA", PAR: "Paraguay", AUS: "Australia", KOS: "Kosovo",
  GER: "Germany", CUW: "Curacao", CIV: "Ivory Coast", ECU: "Ecuador",
  NED: "Netherlands", JPN: "Japan", ALB: "Albania", TUN: "Tunisia",
  BEL: "Belgium", EGY: "Egypt", IRN: "Iran", NZL: "New Zealand",
  ESP: "Spain", CPV: "Cabo Verde", KSA: "Saudi Arabia", URU: "Uruguay",
  FRA: "France", SEN: "Senegal", BOL: "Bolivia", NOR: "Norway",
  ARG: "Argentina", ALG: "Algeria", AUT: "Austria", JOR: "Jordan",
  POR: "Portugal", COD: "Congo DR", UZB: "Uzbekistan", COL: "Colombia",
  ENG: "England", CRO: "Croatia", GHA: "Ghana", PAN: "Panama",
  TBD: "TBD"
};

const FLAG_MAP = {
  MEX: "mx", RSA: "za", KOR: "kr", CZE: "cz",
  CAN: "ca", BIH: "ba", QAT: "qa", SUI: "ch",
  HAI: "ht", SCO: "gb-sct", BRA: "br", MAR: "ma",
  USA: "us", PAR: "py", AUS: "au", KOS: "xk",
  GER: "de", CUW: "cw", CIV: "ci", ECU: "ec",
  NED: "nl", JPN: "jp", ALB: "al", TUN: "tn",
  BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz",
  ESP: "es", CPV: "cv", KSA: "sa", URU: "uy",
  FRA: "fr", SEN: "sn", BOL: "bo", NOR: "no",
  ARG: "ar", ALG: "dz", AUT: "at", JOR: "jo",
  POR: "pt", COD: "cd", UZB: "uz", COL: "co",
  ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa"
};

async function seedTeams() {
  console.log('🌍 Seeding Teams Table...');
  const rows = Object.entries(TEAM_NAMES).map(([id, name]) => ({
    id,
    name,
    flag: FLAG_MAP[id] ? `https://flagcdn.com/w320/${FLAG_MAP[id]}.png` : '',
    rank: 50, // Default, update later via SQL if needed
    rating: 75
  }));

  const { error } = await supabase.from('teams').upsert(rows);

  if (error) console.error('❌ Error:', error);
  else console.log(`✅ Successfully seeded ${rows.length} teams.`);
}

seedTeams();