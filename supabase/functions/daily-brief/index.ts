import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MODEL = 'gemini-3.6-flash'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { prompt } = await req.json()
    if (!prompt) throw new Error('Missing prompt')

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY not set in Supabase secrets')

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // gemini-3.6-flash spends part of maxOutputTokens on invisible
          // "thinking" tokens before the visible answer (~190 tokens' worth
          // in testing) — thinkingConfig.thinkingBudget:0 to disable it was
          // rejected by this model version ("invalid argument"), so the
          // budget just needs enough headroom for thinking + the real ~100
          // word answer instead.
          generationConfig: { maxOutputTokens: 2000, temperature: 0.85 },
        }),
      }
    )

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
