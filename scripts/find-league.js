import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const API_KEY = process.env.API_FOOTBALL_KEY;

async function findLeague() {
  console.log('🕵️‍♀️ Searching for "World Cup" in API-Football...');

  try {
    const response = await fetch(`https://v3.football.api-sports.io/leagues?search=World Cup`, {
      method: 'GET',
      headers: {
        'x-apisports-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.errors && Object.keys(data.errors).length > 0) {
        console.error('❌ API Error:', data.errors);
        return;
    }

    const leagues = data.response;
    console.log(`✅ Found ${leagues.length} leagues. Here are the top matches:`);
    console.log('------------------------------------------------');

    leagues.forEach(item => {
      const league = item.league;
      const country = item.country;
      const seasons = item.seasons;
      
      // We only care about "World" leagues, not "World Cup Qualification" for now
      if (country.name === "World") {
          console.log(`🏆 NAME:   ${league.name}`);
          console.log(`🆔 ID:     ${league.id}`);
          console.log(`🌍 TYPE:   ${league.type}`);
          console.log(`📅 SEASONS: ${seasons.map(s => s.year).join(', ')}`);
          
          // Check if 2026 is active
          const season2026 = seasons.find(s => s.year === 2026);
          if (season2026) {
              console.log(`✨ 2026 DATA: Available! (Start: ${season2026.start}, End: ${season2026.end})`);
          } else {
              console.log(`⚠️ 2026 DATA: Not listed yet.`);
          }
          console.log('------------------------------------------------');
      }
    });

  } catch (err) {
    console.error('Critical Error:', err);
  }
}

findLeague();