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
                text: `Pixar 3D animated character portrait. A ${gender} football supporter at the 2026 World Cup. ${prompt}. The character is wearing a football jersey and a team scarf around their neck. They have colourful face paint on their cheeks. Big warm smile, large expressive cartoon eyes. EYES LOOKING DIRECTLY INTO THE CAMERA LENS. Face centred, extreme close-up, chin to forehead, face fills 90% of the frame. Art style: exactly like a character from a Pixar animated film — smooth stylised skin, vibrant colours, exaggerated friendly features, NOT photorealistic, NOT realistic. Background: very dark blurred stadium at night, dark bokeh crowd lights, NO white background, NO light background, NO grey background. Shallow depth of field, warm rim lighting on face. No suit. No tie. No office. No business.`
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ["IMAGE"]
        }
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