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
    let voiceName = 'en-US-Wavenet-F'; // Default Host

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

    const apiKey = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("Missing API Key");

    // 3. Call Google TTS
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: input },
        voice: { languageCode, name: voiceName },
        audioConfig: {
            audioEncoding: "MP3",
            pitch: speaker_type === 'Pundit' ? -2.0 : 0, 
            speakingRate: speaker_type === 'Pundit' ? 1.15 : 1.0 
        }
      }),
    })

    const data = await response.json();

    if (!response.ok) {
      console.error("TTS Error:", JSON.stringify(data));
      throw new Error(`TTS Error: ${data.error?.message || 'Unknown'}`);
    }
    
    // 4. RETURN JSON (Base64) - Crucial Fix
    // We send the 'audioContent' string directly. The frontend expects this exact format.
    return new Response(JSON.stringify({ audioContent: data.audioContent }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error: any) {
    console.error("Function Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  }
})