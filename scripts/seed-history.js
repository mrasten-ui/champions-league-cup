
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // Use Service Key for writing
const CSV_FILE = 'match_history.csv';

// --- TEAM MAPPING ---
// Maps names in your CSV to the 3-letter IDs used in the app
const TEAM_MAP = {
  "Netherlands": "NED", "USA": "USA", "United States": "USA", "England": "ENG",
  "Argentina": "ARG", "France": "FRA", "Brazil": "BRA", "Mexico": "MEX",
  "South Africa": "RSA", "South Korea": "KOR", "Korea Republic": "KOR",
  "Czechia": "CZE", "Canada": "CAN", "Bosnia": "BIH", "Qatar": "QAT",
  "Switzerland": "SUI", "Haiti": "HAI", "Scotland": "SCO", "Morocco": "MAR",
  "Paraguay": "PAR", "Australia": "AUS", "Kosovo": "KOS", "Germany": "GER",
  "Curacao": "CUW", "Curaçao": "CUW", "Ivory Coast": "CIV", "Cote d'Ivoire": "CIV",
  "Ecuador": "ECU", "Japan": "JPN", "Albania": "ALB", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "New Zealand": "NZL",
  "Spain": "ESP", "Cape Verde": "CPV", "Cabo Verde": "CPV", "Saudi Arabia": "KSA",
  "Uruguay": "URU", "Senegal": "SEN", "Bolivia": "BOL", "Norway": "NOR",
  "Algeria": "ALG", "Austria": "AUT", "Jordan": "JOR", "Portugal": "POR",
  "DR Congo": "COD", "Congo DR": "COD", "Uzbekistan": "UZB", "Colombia": "COL",
  "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN"
};

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedHistory() {
  console.log("⚽ Starting History Import...");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error("❌ Missing Environment Variables.");
      console.log("Usage: export SUPABASE_URL=... SUPABASE_SERVICE_KEY=... && node scripts/seed-history.js");
      return;
  }

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const filePath = path.join(__dirname, '..', CSV_FILE);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${CSV_FILE}`);
    console.log("Please export your 'Match Details' tab as match_history.csv and place it in the root folder.");
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  // Handle Windows (\r\n) and Unix (\n) line endings
  const lines = fileContent.split(/\r?\n/);
  const records = [];

  console.log(`Processing ${lines.length} lines...`);

  // Parse CSV (Assuming Format: Date,Home,Away,Score,Tournament)
  // Example: 2022-12-18,Argentina,France,3-3,World Cup
  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (!line) continue;

    // Simple comma split (Handles basic quotes)
    const cols = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    if (cols.length < 4) continue;

    const dateStr = cols[0]; // YYYY-MM-DD
    const homeName = cols[1];
    const awayName = cols[2];
    const scoreStr = cols[3]; // "2-1"
    const tournament = cols[4] || 'Friendly';

    const homeId = TEAM_MAP[homeName] || TEAM_MAP[homeName.replace(/"/g, '')];
    const awayId = TEAM_MAP[awayName] || TEAM_MAP[awayName.replace(/"/g, '')];

    if (homeId && awayId && scoreStr.includes('-')) {
        const [scoreA, scoreB] = scoreStr.split('-').map(Number);
        if (!isNaN(scoreA) && !isNaN(scoreB)) {
            const year = new Date(dateStr).getFullYear();
            
            records.push({
                team_a: homeId,
                team_b: awayId,
                year: isNaN(year) ? 2024 : year,
                score_a: scoreA,
                score_b: scoreB,
                competition: tournament
            });
        }
    }
  }

  if (records.length === 0) {
      console.log("⚠️ No valid records found. Check CSV format and Team Names.");
      return;
  }

  console.log(`Found ${records.length} valid matches. Uploading to Supabase...`);

  // Batch Insert
  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('head_to_head').insert(batch);
      
      if (error) console.error("Error inserting batch:", error.message);
      else console.log(`Inserted rows ${i + 1} to ${i + batch.length}`);
  }

  console.log("✅ History Import Complete!");
}

seedHistory();
