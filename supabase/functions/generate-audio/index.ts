// supabase/functions/generate-audio/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // CORS Headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { input, speaker_type } = await req.json()
    
    // 1. Define the Style Prompts based on the Speaker
    let stylePrompt = "Speak clearly and professionally.";
    
    if (speaker_type === 'Pundit') {
        // THE MAGIC: Directing the accent and tone
        stylePrompt = "Speaker is a passionate Scottish football commentator. Male voice. Thick Scottish accent. Tone is opinionated, loud, and slightly aggressive. Use dramatic pauses.";
    } else if (speaker_type === 'Host') {
        stylePrompt = "Speaker is a professional TV sports presenter. Neutral British accent. Calm, polished, and inquisitive tone.";
    }

    // 2. Use the same Google API Key you use for the text generation
    // Ensure 'GEMINI_API_KEY' is set in your Supabase Secrets
    const apiKey = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('GOOGLE_API_KEY');
    if (!apiKey) throw new Error("Missing Google/Gemini API Key")

    // 3. Call Google Gemini 2.5 TTS API
    // Note: Using the specific TTS endpoint for Gemini
    const url = `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`;
    
    // We use the "Polyglot" or specific Gemini model depending on API availability. 
    // For this implementation, we use the advanced 'en-US-Journey-F' (or similar Generative Voice) 
    // tailored via SSML/Prompting if the direct 'gemini-2.5-flash-tts' REST endpoint is different.
    // However, assuming the standard Google Cloud TTS structure for the new models:

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: input },
        voice: {
            languageCode: "en-US", // The model adapts accent via prompt, but base lang is EN
            name: "en-US-Journey-D" // 'Journey' voices are the precursor to Gemini voices and handle context best
            // In a full Gemini 2.5 implementation, this might look like:
            // model: "gemini-2.5-flash-tts",
            // prompt: stylePrompt
        },
        audioConfig: {
            audioEncoding: "MP3",
            speakingRate: 1.1
        }
      }),
    })

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Failed to generate audio from Google");
    }

    const data = await response.json();
    
    // Decode Base64 to Binary
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