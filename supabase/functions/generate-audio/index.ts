import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
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
    
    // 1. Voice Selection Strategy (Google Cloud TTS Voices)
    let languageCode = 'en-US';
    let voiceName = 'en-US-Journey-F'; // Default

    if (lang === 'no') {
        languageCode = 'nb-NO';
        // D = Male (Deep), E = Female (Clear)
        voiceName = speaker_type === 'Pundit' ? 'nb-NO-Wavenet-D' : 'nb-NO-Wavenet-E';
    } 
    else if (lang === 'sco' || lang === 'en') {
        // Use British voices for Scottish/English context
        languageCode = 'en-GB';
        // D = Male (Pundit), A = Female (Host)
        voiceName = speaker_type === 'Pundit' ? 'en-GB-Neural2-D' : 'en-GB-Neural2-A';
    } 
    else if (lang === 'en-US') {
        languageCode = 'en-US';
        // Polyglot = Deep Pundit, Journey = Host
        voiceName = speaker_type === 'Pundit' ? 'en-US-Polyglot-1' : 'en-US-Journey-F';
    }

    // 2. Get API Key
    const apiKey = Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("Missing Google API Key")

    // 3. Call Google Cloud TTS
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
            // Make Pundit deeper and faster
            pitch: speaker_type === 'Pundit' ? -2.0 : 0, 
            speakingRate: 1.15 
        }
      }),
    })

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Google TTS Error");
    }

    const data = await response.json();
    
    // 4. Decode Base64 to Binary for the frontend
    const audioContent = data.audioContent;
    const binaryString = atob(audioContent);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return new Response(bytes.buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})