// supabase/functions/generate-avatar/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { prompt, gender } = await req.json()

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) throw new Error("Missing OpenAI API Key")

    const fullPrompt = `Pixar 3D animated character portrait. A ${gender} football supporter at the 2026 World Cup. ${prompt}. The character is wearing a football jersey and a team scarf around their neck. They have colourful face paint on their cheeks. Big warm smile, large expressive cartoon eyes. EYES LOOKING DIRECTLY INTO THE CAMERA LENS. Face centred, extreme close-up, chin to forehead, face fills 90% of the frame. Art style: exactly like a character from a Pixar animated film — smooth stylised skin, vibrant colours, exaggerated friendly features, NOT photorealistic, NOT realistic. Background: very dark blurred stadium at night, dark bokeh crowd lights, NO white background, NO light background, NO grey background. Shallow depth of field, warm rim lighting on face. No suit. No tie. No office. No business.`

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: fullPrompt,
        n: 1,
        size: '1024x1024',
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error(`OpenAI API ${response.status}:`, errBody)
      throw new Error(`OpenAI API error ${response.status}: ${errBody}`)
    }

    const data = await response.json()

    // gpt-image-1 returns b64_json directly; fall back to fetching URL if needed
    let b64 = data.data?.[0]?.b64_json
    if (!b64) {
      const imageUrl = data.data?.[0]?.url
      if (!imageUrl) throw new Error("No image returned from OpenAI")
      const imgResponse = await fetch(imageUrl)
      const imgBuffer = await imgResponse.arrayBuffer()
      b64 = btoa(String.fromCharCode(...new Uint8Array(imgBuffer)))
    }

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
