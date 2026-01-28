// supabase/functions/generate-avatar/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // 1. Setup CORS so your website can talk to this function
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // 2. Get the prompt from your frontend
    const { prompt, gender } = await req.json()

    // 3. Get the API Key securely from the server environment
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) throw new Error("Missing OpenAI API Key")

    // 4. Call OpenAI
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `A professional 3D stylized avatar of a ${gender} football manager. ${prompt}. STYLE: High-fidelity Pixar/Disney style.`,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
        quality: "standard"
      })
    })

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    // 5. Send the image back to your website
    return new Response(JSON.stringify(data), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", 
      },
    })
  }
})
