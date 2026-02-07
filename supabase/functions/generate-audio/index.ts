import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// --- VOICE PROFILES ---
// This acts as the "Director". It tells Google exactly how to perform each character.
const VOICE_PROFILES = {
  // 1. UK TEAM (Sarah & Gaz)
  'EN_Host': { 
    name: 'en-GB-Neural2-A', // Female, Professional News Anchor
    pitch: 0.0, 
    speed: 1.05 
  },
  'EN_Pundit': { 
    name: 'en-GB-Neural2-D', // Male
    pitch: -2.0, // Slight drop to sound like a tough ex-player
    speed: 1.15  // Faster: Aggressive, interrupts often
  },

  // 2. US TEAM (Jessica & Chuck)
  'US_Host': { 
    name: 'en-US-Neural2-F', // Female, High energy News Anchor
    pitch: 0.0, 
    speed: 1.1 
  },
  'US_Pundit': { 
    // "Deep American"
    name: 'en-US-Polyglot-1', // A deeper, resonant male voice
    pitch: -6.0, // HEAVY DROP: Creates that booming "Movie Trailer" / Shock Jock bass
    speed: 1.10  // High energy, fast talker
  },

  // 3. SCOTTISH TEAM (Shona & Rab)
  // Note: Google lacks a true "Scottish" model, so we hack en-GB
  'SCO_Host': { 
    name: 'en-GB-Wavenet-C', 
    pitch: 0.0, 
    speed: 1.0 
  },
  'SCO_Pundit': { 
    name: 'en-GB-Wavenet-D', 
    pitch: -4.5, // DEEP DROP: Hides the "Posh" accent, makes him sound gruff/working class
    speed: 0.95  // Slower: Deliberate, cynical tone ("Whit are ye on aboot?")
  },

  // 4. NORWEGIAN TEAM (Silje & Nils Arne)
  'NO_Host': { 
    name: 'nb-NO-Wavenet-C', // Female standard
    pitch: 0.0, 
    speed: 1.0 
  },
  'NO_Pundit': { 
    // "Nils Arne" - Needs to sound old and philosophical
    name: 'nb-NO-Wavenet-B', // Standard Male
    pitch: -5.5, // HEAVY DROP: Simulates old age (vocal cords loosen)
    speed: 0.85  // SLOW: Simulates a thoughtful, older philosopher ("Godfoten takes time")
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { input, speaker_type, lang } = await req.json()

    if (!input) throw new Error('Missing input text')

    // 2. DETERMINE VOICE SETTINGS
    // Map incoming language codes to our Profile Keys
    let langKey = 'EN'; // Default
    
    // Normalize Lang Codes (Frontend sends 'no', 'sco', 'en-US', etc.)
    if (lang === 'no' || lang === 'nb' || lang === 'no-NO') langKey = 'NO';
    else if (lang === 'sco') langKey = 'SCO';
    else if (lang === 'us' || lang === 'en-US') langKey = 'US';
    else langKey = 'EN'; // Fallback for 'en', 'en-GB'

    // Construct Key (e.g., "NO_Pundit")
    // Normalize speaker_type to Title Case just in case (Host/Pundit)
    const typeKey = speaker_type.charAt(0).toUpperCase() + speaker_type.slice(1).toLowerCase(); 
    const profileKey = `${langKey}_${typeKey}`;
    
    // Get Profile (or fall back to EN Host if missing)
    const profile = VOICE_PROFILES[profileKey] || VOICE_PROFILES['EN_Host'];

    // Map LangKey back to Google's LanguageCode format
    let googleLangCode = 'en-GB';
    if (langKey === 'US') googleLangCode = 'en-US';
    if (langKey === 'NO') googleLangCode = 'nb-NO';
    if (langKey === 'SCO') googleLangCode = 'en-GB'; // Scotland uses GB base

    console.log(`Generating: ${profileKey} | Voice: ${profile.name} | Pitch: ${profile.pitch} | Speed: ${profile.speed}`);

    // 3. Call Google Text-to-Speech
    const apiKey = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('Google API Key is missing in Supabase Secrets');

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: input },
          voice: { 
            languageCode: googleLangCode,
            name: profile.name 
          },
          audioConfig: { 
            audioEncoding: 'MP3',
            pitch: profile.pitch,       // <--- CHARACTER APPLIED HERE
            speakingRate: profile.speed // <--- CHARACTER APPLIED HERE
          },
        }),
      }
    )

    const data = await response.json()

    if (data.error) {
      console.error("Google TTS Error:", data.error);
      throw new Error(data.error.message)
    }

    return new Response(
      JSON.stringify({ audioContent: data.audioContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})