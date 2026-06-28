import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LEAGUE_DEFAULT_LANGS: Record<string, string> = {
  armchair_gaffers:  'SCO',
  beeline:           'EN',
  sofa_ekspertene:   'NO',
  infantinos_hustle: 'SCO',
}

function buildEmail(lang: string, name: string, appUrl: string): { subject: string; html: string } {
  const cleanName = name || 'Manager'

  const templates: Record<string, { subject: string; heading: string; intro: string; detail: string; cta: string; footer: string }> = {
    EN: {
      subject: '🛡️ Second Chance — please review your bracket picks',
      heading: 'Your bracket picks need a review',
      intro: `Hey ${cleanName}, we found and fixed a bug in the Second Chance bracket that may have caused some teams to appear in incorrect slots.`,
      detail: `Your picks are still saved, but the teams they apply to may have shifted. <strong style="color:#fbbf24;">Please open the app and check your Second Chance bracket</strong> before the window closes — make any changes you need.`,
      cta: 'Review My Picks →',
      footer: "You're receiving this because you activated Second Chance in The Rasten Cup.",
    },
    NO: {
      subject: '🛡️ Second Chance — sjekk tipsene dine i brakett',
      heading: 'Brakett-tipsene dine bør sjekkes',
      intro: `Hei ${cleanName}, vi oppdaget og fikset en feil i Second Chance-brakketten som kan ha plassert noen lag i feil spor.`,
      detail: `Tipsene dine er lagret, men lagene de gjelder kan ha endret seg. <strong style="color:#fbbf24;">Åpne appen og sjekk Second Chance-brakketten din</strong> før vinduet stenger — gjør de endringene du trenger.`,
      cta: 'Sjekk tipsene mine →',
      footer: 'Du mottar dette fordi du aktiverte Second Chance i Rasten Cup.',
    },
    SCO: {
      subject: "🛡️ Second Chance — gie yer bracket picks a wee check",
      heading: "Yer bracket picks need a look",
      intro: `Aye ${cleanName}, we found and sorted a bug in the Second Chance bracket that micht've put some teams in the wrang slots.`,
      detail: `Yer picks are still there, but the teams they're attached tae may have shifted aboot. <strong style="color:#fbbf24;">Open the app and gie yer Second Chance bracket a wee look</strong> before the window shuts — fix whatever needs fixing.`,
      cta: 'Check My Picks →',
      footer: "Ye're getting this because ye activated Second Chance in The Rasten Cup.",
    },
    US: {
      subject: '🛡️ Second Chance — please review your bracket picks',
      heading: 'Your bracket picks need a review',
      intro: `Hey ${cleanName}, we found and fixed a bug in the Second Chance bracket that may have caused some teams to land in the wrong slots.`,
      detail: `Your picks are still saved, but the teams they apply to may have shifted. <strong style="color:#fbbf24;">Please open the app and check your Second Chance bracket</strong> before the window closes — make any adjustments you need.`,
      cta: 'Review My Picks →',
      footer: "You're receiving this because you activated Second Chance in The Rasten Cup.",
    },
  }

  const t = templates[lang] ?? templates.EN

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:system-ui,sans-serif;color:#e2e8f0;">
  <div style="max-width:480px;margin:40px auto;padding:0 16px;">
    <div style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
      <div style="background:linear-gradient(135deg,#312e81,#1e3a5f);padding:28px 28px 20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#94a3b8;">The Rasten Cup · Second Chance</p>
        <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;">🛡️ ${t.heading}</h1>
      </div>
      <div style="padding:24px 28px;">
        <p style="margin:0 0 16px;font-size:15px;color:#cbd5e1;line-height:1.6;">${t.intro}</p>
        <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:10px;padding:12px 16px;margin:0 0 24px;">
          <p style="margin:0;font-size:13px;color:#fde68a;line-height:1.6;">⚠️ ${t.detail}</p>
        </div>
        <a href="${appUrl}" style="display:inline-block;background:#6366f1;color:#ffffff;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;padding:14px 28px;border-radius:10px;text-decoration:none;">${t.cta}</a>
      </div>
      <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0;font-size:11px;color:#475569;">${t.footer}</p>
      </div>
    </div>
  </div>
</body>
</html>`

  return { subject: t.subject, html }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const dry_run = body.dry_run ?? false

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey   = Deno.env.get('RESEND_API_KEY')
    const appUrl      = Deno.env.get('APP_URL') ?? 'https://rastencup.com'
    const fromEmail   = Deno.env.get('FROM_EMAIL') ?? 'The Rasten Cup <noreply@rastencup.com>'

    if (!dry_run && !resendKey) throw new Error('RESEND_API_KEY not set in Supabase secrets')

    const db = createClient(supabaseUrl, serviceKey)

    // Fetch profiles that have activated Second Chance (PENDING or ACTIVE status, or permanently flagged)
    const { data: profiles, error: profErr } = await db
      .from('profiles')
      .select('email, name, leagues, second_chance_status, has_taken_second_chance')
    if (profErr) throw new Error(`Profiles fetch failed: ${profErr.message}`)

    const scProfiles = (profiles ?? []).filter((p: any) =>
      p.second_chance_status === 'PENDING' ||
      p.second_chance_status === 'ACTIVE' ||
      p.has_taken_second_chance === true
    )

    // Build recipient list with per-league language
    const recipients = scProfiles.map((p: any) => {
      const leagues: string[] = p.leagues ?? []
      const primaryLeague = leagues[0] ?? null
      const lang = primaryLeague ? (LEAGUE_DEFAULT_LANGS[primaryLeague] ?? 'EN') : 'EN'
      return { name: p.name || '', email: p.email, lang, status: p.second_chance_status }
    })

    if (dry_run) {
      return new Response(
        JSON.stringify({ recipients, total: recipients.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send emails
    let sent = 0
    let failed = 0
    const results: { email: string; ok: boolean; error?: string }[] = []

    for (const r of recipients) {
      const { subject, html } = buildEmail(r.lang, r.name, appUrl)
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: fromEmail, to: [r.email], subject, html }),
        })
        if (!res.ok) {
          const err = await res.text()
          throw new Error(`${res.status} ${err}`)
        }
        sent++
        results.push({ email: r.email, ok: true })
      } catch (err: any) {
        failed++
        results.push({ email: r.email, ok: false, error: err.message })
      }
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    return new Response(
      JSON.stringify({ sent, failed, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
