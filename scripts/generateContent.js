import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase and OpenAI
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// The 4 distinct personas we are generating
const PERSONAS = [
  {
    code: 'EN',
    voice: 'neutral',
    instructions: 'Write as a professional, highly analytical English tactical pundit.'
  },
  {
    code: 'US',
    voice: 'brutally_honest',
    instructions: 'Write as a brutally honest, highly skilled US elite coach. Pressure-test their hype, expose their flaws, and give a harsh market reality assessment.'
  },
  {
    code: 'SCO',
    voice: 'scottish_pundit',
    instructions: 'Write as a passionate, heavily biased Scottish pundit. Use Scottish colloquialisms (e.g., braw, pure dug meat, cracking). Hype up Scotland, tear down rivals.'
  },
  {
    code: 'NO',
    voice: 'neutral',
    instructions: 'Write as a professional, highly analytical Norwegian football commentator. The output MUST be in natural, fluent Norwegian.'
  }
];

// Delay helper to prevent hitting OpenAI API rate limits
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateTeamContent() {
  console.log('Fetching teams from Supabase...');
  const { data: teams, error } = await supabase.from('teams').select('id, name');

  if (error) {
    console.error('Error fetching teams:', error);
    return;
  }

  for (const team of teams) {
    console.log(`\n--- Processing ${team.name} (${team.id}) ---`);

    for (const persona of PERSONAS) {
      console.log(`Generating ${persona.code} (${persona.voice})...`);

      const prompt = `
        You are generating a highly detailed scouting report for the national football team of ${team.name} for the 2026 World Cup.
        ${persona.instructions}

        CRITICAL FORMATTING RULES:
        1. Return ONLY a valid JSON object.
        2. 'star_player': Just the name of their best active player.
        3. 'strengths': Exactly 3 bullet points. Each point MUST start with the '•' symbol. Each point MUST be 2 to 3 sentences of deep tactical analysis.
        4. 'weaknesses': Exactly 3 bullet points. Each point MUST start with the '•' symbol. Each point MUST be 2 to 3 sentences of deep tactical analysis.
        5. 'overview': A 2-sentence summary of the team's tournament prospects.
      `;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "system", content: prompt }],
          response_format: { type: "json_object" }
        });

        const result = JSON.parse(completion.choices[0].message.content);

        const { error: insertError } = await supabase.from('team_content').upsert({
          team_id: team.id.toLowerCase(),
          language_code: persona.code,
          voice_persona: persona.voice,
          star_player: result.star_player,
          strengths: result.strengths,
          weaknesses: result.weaknesses,
          overview: result.overview
        }, { onConflict: 'team_id, language_code, voice_persona' });

        if (insertError) {
          console.error(`❌ DB Error for ${team.name} (${persona.code}):`, insertError.message);
        } else {
          console.log(`✅ Saved ${persona.code} profile for ${team.name}`);
        }

        await delay(2000);

      } catch (err) {
        console.error(`❌ API Error for ${team.name} (${persona.code}):`, err.message);
      }
    }
  }

  console.log('\n🎉 ALL DONE! Your database is fully populated.');
}

generateTeamContent();
