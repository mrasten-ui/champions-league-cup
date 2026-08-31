// supabase/functions/generate-avatar/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODEL = 'gemini-2.5-flash-image'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { prompt, gender } = await req.json()

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY")

    const fullPrompt = `Pixar 3D animated character portrait. A ${gender} Champions League club manager on a European away night, sharp and full of matchday energy. ${prompt}. The character wears a club scarf in their team's colours, draped proudly around the neck. Big warm smile, large expressive cartoon eyes. EYES LOOKING DIRECTLY INTO THE CAMERA LENS. Face centred, extreme close-up, chin to forehead, face fills 90% of the frame. Art style: exactly like a character from a Pixar animated film — smooth stylised skin, vibrant colours, exaggerated friendly features, NOT photorealistic, NOT realistic. Background: dramatic blurred stadium at night lit in the iconic Champions League blue floodlight haze, soft star-shaped bokeh flares nostalgic of the competition's starball emblem, a hint of a tall silver trophy with oversized handles glinting out of focus, dark blurred crowd beyond, NO white background, NO light background, NO grey background. Shallow depth of field, cool blue rim lighting with a warm key light on the face. No suit. No tie. No office. No business.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { responseModalities: ['IMAGE'] },
        }),
      }
    )

    if (!response.ok) {
      const errBody = await response.text()
      console.error(`Gemini API ${response.status}:`, errBody)
      throw new Error(`Gemini API error ${response.status}: ${errBody}`)
    }

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    const parts = data.candidates?.[0]?.content?.parts ?? []
    const imagePart = parts.find((p: any) => p.inlineData?.data)
    const b64 = imagePart?.inlineData?.data
    if (!b64) throw new Error("No image returned from Gemini")

    return new Response(JSON.stringify({ data: [{ b64_json: b64 }] }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error("Edge Function Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
