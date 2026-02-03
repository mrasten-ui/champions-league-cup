import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // 1. Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { input, speaker_type, lang } = await req.json()
    
    // 2. VOICE CONFIGURATION
    let languageCode = 'en-US';
    let voiceName = 'en-US-Wavenet-F'; // Default Host (Female)

    if (lang === 'no') {
        languageCode = 'nb-NO';
        voiceName = speaker_type === 'Pundit' ? 'nb-NO-Wavenet-D' : 'nb-NO-Wavenet-E';
    } 
    else if (lang === 'sco' || lang === 'en') {
        languageCode = 'en-GB';
        voiceName = speaker_type === 'Pundit' ? 'en-GB-Wavenet-D' : 'en-GB-Wavenet-A';
    } 
    else {
        languageCode = 'en-US';
        voiceName = speaker_type === 'Pundit' ? 'en-US-Wavenet-D' : 'en-US-Wavenet-F';
    }

    // 3. Verify API Key
    const apiKey = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error("Server Error: Missing GOOGLE_API_KEY");
    }

    // 4. Call Google Cloud TTS API
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: input },
        voice: {
            languageCode: languageCode,
            name: voiceName,
        },
        audioConfig: {
            audioEncoding: "MP3",
            // Pundit: Lower pitch (-2.0), Faster rate (1.15) for aggression
            pitch: speaker_type === 'Pundit' ? -2.0 : 0, 
            speakingRate: speaker_type === 'Pundit' ? 1.15 : 1.0 
        }
      }),
    })

    if (!response.ok) {
      const err = await response.json();
      console.error("Google TTS Error:", JSON.stringify(err));
      throw new Error(`Google API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // 5. CRITICAL FIX: Return Base64 String directly (Reliable)
    // We send the audio content string back so the frontend can use it directly.
    return new Response(JSON.stringify({ audioContent: data.audioContent }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      },
    })
  }
})