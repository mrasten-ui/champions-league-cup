import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// CONFIG
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const LOCAL_DIR = './public/avatars';
const BUCKET = 'avatars';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ ERROR: Missing keys.");
  process.exit(1);
}

// Fixed folder logic for 'man1.png', 'woman1.png', etc.
const getFolder = (filename) => {
  const lower = filename.toLowerCase();
  if (lower.startsWith('man') || lower.startsWith('0')) return 'men'; // Root 'men' folder
  if (lower.startsWith('woman') || lower.startsWith('1')) return 'women'; // Root 'women' folder
  return 'misc'; 
};

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function uploadAndOrganize() {
  console.log(`🚀 Connecting to ${SUPABASE_URL}...`);
  
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
    const storagePath = `${targetFolder}/${file}`;

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
}

uploadAndOrganize();