// supabase/functions/generate-avatar/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // 1. Setup CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { prompt, gender } = await req.json()

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error("Missing Gemini API Key")

    // 2. Call the new unified Gemini Image Generation endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `A front-facing, close-up headshot avatar of a passionate ${gender} football fan attending the 2026 World Cup. The character is looking directly into the camera. ${prompt}. High-fidelity modern 3D animation studio style, expressive Pixar Disney vibe. Clean solid color background, soft studio lighting, sharp focus.`
              }
            ]
          }
        ]
      })
    })

    const data = await response.json()

    // 3. Handle API Rejections (Safety filters, bad keys, etc.)
    if (!response.ok) {
        console.error("Gemini API Error Response:", data);
        throw new Error(data.error?.message || "Failed to generate image from Gemini");
    }

    // 4. Safely extract the Base64 string
    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.inlineData?.data) {
        console.error("Unexpected Gemini response structure:", data);
        throw new Error("No image generated. The prompt might have been blocked by safety filters.");
    }

    const geminiBase64 = data.candidates[0].content.parts[0].inlineData.data;

    // 5. Mock the OpenAI response structure so your frontend doesn't break
    const mockOpenAiResponse = {
      data: [
        {
          b64_json: geminiBase64
        }
      ]
    };

    return new Response(JSON.stringify(mockOpenAiResponse), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })

  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", 
      },
    })
  }
})