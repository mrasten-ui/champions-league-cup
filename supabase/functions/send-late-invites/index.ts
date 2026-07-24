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

function buildEmail(lang: string, name: string, inviteUrl: string, cutoffStr: string | null): { subject: string; html: string } {
  const cleanName = name || 'Manager'
  const cutoffNote = cutoffStr
    ? `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:12px 16px;margin:0 0 16px;">
         <p style="margin:0;font-size:13px;color:#fca5a5;line-height:1.5;">
           ⏰ <strong>Window closes:</strong><br>
           <span style="color:#94a3b8;">${cutoffStr}</span>
         </p>
       </div>`
    : ''

  const templates: Record<string, { subject: string; heading: string; intro: string; window: string; zeroNote: string; cta: string; footer: string }> = {
    EN: {
      subject: '⚽ CL Predictor — You still have a chance to join',
      heading: "You're still on the teamsheet",
      intro: `Hey ${cleanName}, the Champions League is underway — and you're registered for CL Predictor but haven't filled in any predictions yet.`,
      window: `Click below to get a <strong style="color:#fbbf24;">4-hour window</strong> to fill in your picks for upcoming matches.`,
      zeroNote: `Matches already played will automatically score <strong style="color:#fbbf24;">0 points</strong> — no action needed for those.`,
      cta: 'Join Now →',
      footer: "You're receiving this because you registered for CL Predictor.",
    },
    NO: {
      subject: '⚽ CL Predictor — Du har fortsatt en sjanse',
      heading: 'Du er fortsatt med på laget',
      intro: `Hei ${cleanName}, Champions League er i gang — og du er registrert i CL Predictor, men har ikke lagt inn noen tips ennå.`,
      window: `Klikk nedenfor for å få et <strong style="color:#fbbf24;">4-timers vindu</strong> til å legge inn tips på kommende kamper.`,
      zeroNote: `Kamper som allerede er spilt gir automatisk <strong style="color:#fbbf24;">0 poeng</strong> — du trenger ikke gjøre noe for dem.`,
      cta: 'Bli med nå →',
      footer: 'Du mottar denne fordi du er registrert i CL Predictor.',
    },
    SCO: {
      subject: "⚽ CL Predictor — Ye're still on the teamsheet",
      heading: "Ye're no oot yet",
      intro: `Aye ${cleanName}, the Champions League has kicked off — ye're signed up for CL Predictor but haven't put a single tip in yet.`,
      window: `Click below and ye get a <strong style="color:#fbbf24;">4-hour window</strong> tae fill in yer picks for the games still tae come.`,
      zeroNote: `Games already played'll automatically score <strong style="color:#fbbf24;">0 points</strong> — nae need tae worry aboot those.`,
      cta: 'Get Stuck In →',
      footer: "Ye're getting this because ye registered for CL Predictor.",
    },
    US: {
      subject: "⚽ CL Predictor — You're still in the game",
      heading: "You're still in the game",
      intro: `Hey ${cleanName}, the Champions League is live — you're registered for CL Predictor but haven't entered any predictions yet.`,
      window: `Hit the button below for a <strong style="color:#fbbf24;">4-hour window</strong> to lock in your picks for upcoming matches.`,
      zeroNote: `Games already played will automatically score <strong style="color:#fbbf24;">0 points</strong> — nothing to do for those.`,
      cta: 'Get In The Game →',
      footer: "You're receiving this because you signed up for CL Predictor.",
    },
  }

  const t = templates[lang] ?? templates.EN

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:system-ui,sans-serif;color:#e2e8f0;">
  <div style="max-width:480px;margin:40px auto;padding:0 16px;">
    <div style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
      <div style="background:linear-gradient(135deg,#78350f,#1e3a5f);padding:28px 28px 20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#94a3b8;">CL Predictor</p>
        <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;">⚽ ${t.heading}</h1>
      </div>
      <div style="padding:24px 28px;">
        <p style="margin:0 0 16px;font-size:15px;color:#cbd5e1;line-height:1.6;">${t.intro}</p>
        <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:10px;padding:12px 16px;margin:0 0 16px;">
          <p style="margin:0;font-size:13px;color:#fde68a;line-height:1.6;">🕐 ${t.window}</p>
        </div>
        <div style="background:rgba(148,163,184,0.06);border:1px solid rgba(148,163,184,0.15);border-radius:10px;padding:12px 16px;margin:0 0 16px;">
          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">⚙️ ${t.zeroNote}</p>
        </div>
        ${cutoffNote}
        <a href="${inviteUrl}" style="display:inline-block;background:#f59e0b;color:#0f2545;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;padding:14px 28px;border-radius:10px;text-decoration:none;">${t.cta}</a>
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
    const { dry_run } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendKey   = Deno.env.get('RESEND_API_KEY')
    const appUrl      = Deno.env.get('APP_URL') ?? 'https://clpredictor.com'
    const fromEmail   = Deno.env.get('FROM_EMAIL') ?? 'CL Predictor <noreply@clpredictor.com>'

    if (!dry_run && !resendKey) throw new Error('RESEND_API_KEY not set in Supabase secrets')

    const db = createClient(supabaseUrl, serviceKey)

    // Load cutoff
    let cutoffStr: string | null = null
    const { data: cutoffRow } = await db.from('settings').select('value').eq('key', 'late_joiner_cutoff').maybeSingle()
    if (cutoffRow?.value) {
      const cutoffDate = new Date(cutoffRow.value as string)
      if (!dry_run && Date.now() > cutoffDate.getTime()) {
        throw new Error('Cutoff has already passed — no emails sent.')
      }
      cutoffStr = cutoffDate.toLocaleString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short', timeZone: 'UTC',
      })
    }

    // Fetch profiles
    const { data: profiles, error: profErr } = await db.from('profiles').select('email, name, leagues')
    if (profErr) throw new Error(`Profiles fetch failed: ${profErr.message}`)

    // Fetch predictions (paginated)
    const PAGE = 1000
    let allPredRows: any[] = []
    let from = 0
    let keepGoing = true
    while (keepGoing) {
      const { data: page, error: pageErr } = await db.from('predictions').select('user_id').range(from, from + PAGE - 1)
      if (pageErr) throw new Error(`Predictions fetch failed: ${pageErr.message}`)
      if (page && page.length > 0) {
        allPredRows.push(...page)
        keepGoing = page.length === PAGE
        from += PAGE
      } else {
        keepGoing = false
      }
    }

    const usersWithPreds = new Set(allPredRows.map((p: any) => p.user_id))
    const targets = (profiles ?? []).filter((p: any) => !usersWithPreds.has(p.email))

    // Build recipient list
    const recipients = targets.map((p: any) => {
      const leagues: string[] = p.leagues ?? []
      const primaryLeague = leagues[0] ?? null
      const lang = primaryLeague ? (LEAGUE_DEFAULT_LANGS[primaryLeague] ?? 'EN') : 'EN'
      const url = primaryLeague ? `${appUrl}?invite=${primaryLeague}&late=1` : `${appUrl}?late=1`
      return { name: p.name || '', email: p.email, league: primaryLeague, lang, url }
    })

    if (dry_run) {
      return new Response(
        JSON.stringify({ recipients, cutoff: cutoffStr }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send emails
    let sent = 0
    let failed = 0
    const results: { email: string; ok: boolean; error?: string }[] = []

    for (const r of recipients) {
      const { subject, html } = buildEmail(r.lang, r.name, r.url, cutoffStr)
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
      // Small delay to stay within Resend rate limits
      await new Promise(r => setTimeout(r, 200))
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
