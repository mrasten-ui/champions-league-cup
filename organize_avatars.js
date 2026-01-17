import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

// --- CONFIGURATION ---
// 1. Try to load from .env
let SUPABASE_URL = process.env.VITE_SUPABASE_URL;
let SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// 2. FALLBACK: IF .ENV FAILS, PASTE YOUR KEYS HERE MANUALLY:
// const MANUAL_URL = "https://your-project.supabase.co";
// const MANUAL_KEY = "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";
// if (!SUPABASE_URL) SUPABASE_URL = MANUAL_URL;
// if (!SUPABASE_KEY) SUPABASE_KEY = MANUAL_KEY;

const LOCAL_DIR = './public/avatars';
const BUCKET = 'avatars';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ ERROR: Could not find Supabase URL or Key.");
  console.error("   Please check your .env file OR uncomment the MANUAL lines in this script.");
  process.exit(1);
}

// 00-09 = Men, 10-19 = Women, Others = Misc
const getFolder = (filename) => {
  if (filename.startsWith('0')) return 'presets/men';
  if (filename.startsWith('1')) return 'presets/women';
  return 'presets/misc'; 
};

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadAndOrganize() {
  console.log(`🚀 Connecting to ${SUPABASE_URL}...`);
  console.log(`📂 Organizing avatars from ${LOCAL_DIR}...`);

  try {
    if (!fs.existsSync(LOCAL_DIR)) {
      console.error(`❌ Directory not found: ${LOCAL_DIR}`);
      return;
    }

    const files = fs.readdirSync(LOCAL_DIR);
    
    for (const file of files) {
      if (file.startsWith('.')) continue; 

      const filePath = path.join(LOCAL_DIR, file);
      const fileBuffer = fs.readFileSync(filePath);
      
      const targetFolder = getFolder(file);
      const storagePath = `${targetFolder}/${file}`; // e.g. "presets/men/00.png"

      process.stdout.write(`Uploading ${file} -> ${storagePath} ... `);

      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
          contentType: 'image/png',
          upsert: true
        });

      if (error) console.log(`❌ ${error.message}`);
      else console.log(`✅ OK`);
    }

    console.log("\n🎉 Done! All avatars are now in the cloud.");
  } catch (err) {
    console.error("Script failed:", err);
  }
}

uploadAndOrganize();