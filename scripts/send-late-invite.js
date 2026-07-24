/**
 * send-late-invite.js
 *
 * Finds registered players with ZERO predictions and emails them a late-entry invite.
 * Each email includes a league-specific /?invite=slug&late=1 link and is written in
 * the language of their league.
 *
 * Usage:
 *   node scripts/send-late-invite.js           # sends emails
 *   node scripts/send-late-invite.js --dry-run # logs who would be emailed, no send
 *
 * Required env vars (same as send-reminders.js):
 *   SUPABASE_URL / VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY / SUPABASE_SERVICE_ROLE_KEY
 *   RESEND_API_KEY
 *   APP_URL      — e.g. https://clpredictor.com
 *   FROM_EMAIL   — e.g. CL Predictor <noreply@clpredictor.com>
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const isDryRun = process.argv.includes('--dry-run');

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL        = process.env.APP_URL    ?? 'https://clpredictor.com';
const FROM_EMAIL     = process.env.FROM_EMAIL ?? 'CL Predictor <noreply@clpredictor.com>';

// ── League → language mapping (mirrors constants.ts) ─────────────────────────
const LEAGUE_DEFAULT_LANGS = {
  armchair_gaffers:  'SCO',
  beeline:           'EN',
  sofa_ekspertene:   'NO',
  infantinos_hustle: 'SCO',
};

// ── Email templates per language ──────────────────────────────────────────────
function buildEmail(lang, name, inviteUrl, cutoffStr) {
  const cleanName = name || 'Manager';
  const cutoffNote = cutoffStr
    ? `<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:12px 16px;margin:0 0 16px;">
         <p style="margin:0;font-size:13px;color:#fca5a5;line-height:1.5;">
           ⏰ <strong>Window closes:</strong><br>
           <span style="color:#94a3b8;">${cutoffStr}</span>
         </p>
       </div>`
    : '';

  const templates = {
    EN: {
      subject: '⚽ CL Predictor — You still have a chance to join',
      heading: "You're still on the teamsheet",
      intro: `Hey ${cleanName}, the Champions League is underway — and you're still registered for CL Predictor but haven't filled in any predictions yet.`,
      window: "Click below to get a <strong style=\"color:#fbbf24;\">4-hour window</strong> to fill in your picks for upcoming matches.",
      zeroNote: "Matches already played will automatically score <strong style=\"color:#fbbf24;\">0 points</strong> — no action needed for those.",
      cta: 'Join Now →',
      footer: "You're receiving this because you registered for CL Predictor.",
    },
    NO: {
      subject: '⚽ CL Predictor — Du har fortsatt en sjanse',
      heading: 'Du er fortsatt med på laget',
      intro: `Hei ${cleanName}, Champions League er i gang — og du er registrert i CL Predictor, men har ikke lagt inn noen tips ennå.`,
      window: "Klikk nedenfor for å få et <strong style=\"color:#fbbf24;\">4-timers vindu</strong> til å legge inn tips på kommende kamper.",
      zeroNote: "Kamper som allerede er spilt gir automatisk <strong style=\"color:#fbbf24;\">0 poeng</strong> — du trenger ikke gjøre noe for dem.",
      cta: 'Bli med nå →',
      footer: 'Du mottar denne fordi du er registrert i CL Predictor.',
    },
    SCO: {
      subject: "⚽ CL Predictor — Ye're still on the teamsheet",
      heading: "Ye're no oot yet",
      intro: `Aye ${cleanName}, the Champions League has kicked off — ye're signed up for CL Predictor but haven't put a single tip in yet.`,
      window: "Click below and ye get a <strong style=\"color:#fbbf24;\">4-hour window</strong> tae fill in yer picks for the games still tae come.",
      zeroNote: "Games already played'll automatically score <strong style=\"color:#fbbf24;\">0 points</strong> — nae need tae worry aboot those.",
      cta: 'Get Stuck In →',
      footer: "Ye're getting this because ye registered for CL Predictor.",
    },
    US: {
      subject: '⚽ CL Predictor — You\'re still in the game',
      heading: "You're still in the game",
      intro: `Hey ${cleanName}, the Champions League is live — you're registered for CL Predictor but haven't entered any predictions yet.`,
      window: "Hit the button below for a <strong style=\"color:#fbbf24;\">4-hour window</strong> to lock in your picks for upcoming matches.",
      zeroNote: "Games already played will automatically score <strong style=\"color:#fbbf24;\">0 points</strong> — nothing to do for those.",
      cta: 'Get In The Game →',
      footer: "You're receiving this because you signed up for CL Predictor.",
    },
  };

  const t = templates[lang] ?? templates.EN;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:system-ui,sans-serif;color:#e2e8f0;">
  <div style="max-width:480px;margin:40px auto;padding:0 16px;">
    <div style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#78350f,#1e3a5f);padding:28px 28px 20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#94a3b8;">CL Predictor</p>
        <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;">⚽ ${t.heading}</h1>
      </div>

      <!-- Body -->
      <div style="padding:24px 28px;">
        <p style="margin:0 0 16px;font-size:15px;color:#cbd5e1;line-height:1.6;">${t.intro}</p>

        <!-- Window callout -->
        <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:10px;padding:12px 16px;margin:0 0 16px;">
          <p style="margin:0;font-size:13px;color:#fde68a;line-height:1.6;">
            🕐 ${t.window}
          </p>
        </div>

        <!-- Zero points callout -->
        <div style="background:rgba(148,163,184,0.06);border:1px solid rgba(148,163,184,0.15);border-radius:10px;padding:12px 16px;margin:0 0 16px;">
          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
            ⚙️ ${t.zeroNote}
          </p>
        </div>

        ${cutoffNote}

        <!-- CTA -->
        <a href="${inviteUrl}" style="display:inline-block;background:#f59e0b;color:#0f2545;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;padding:14px 28px;border-radius:10px;text-decoration:none;">
          ${t.cta}
        </a>
      </div>

      <!-- Footer -->
      <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0;font-size:11px;color:#475569;">${t.footer}</p>
      </div>

    </div>
  </div>
</body>
</html>`;

  return { subject: t.subject, html };
}

async function sendEmail(to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error for ${to}: ${res.status} ${err}`);
  }
  return res.json();
}

async function main() {
  console.log(`\n🏆 CL Predictor — Late Invite Script${isDryRun ? ' [DRY RUN]' : ''}\n`);

  if (!RESEND_API_KEY && !isDryRun) {
    console.error('❌  RESEND_API_KEY not set. Add it to .env or run with --dry-run.');
    process.exit(1);
  }

  // Load cutoff from settings table (if set)
  let cutoffStr = null;
  const { data: cutoffSetting } = await supabase
    .from('settings').select('value').eq('key', 'late_joiner_cutoff').maybeSingle();
  if (cutoffSetting?.value) {
    const cutoffDate = new Date(cutoffSetting.value);
    cutoffStr = cutoffDate.toLocaleString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short', timeZone: 'UTC',
    });
    console.log(`   Late entry cutoff: ${cutoffStr}`);
    if (Date.now() > cutoffDate.getTime()) {
      console.error('❌  Cutoff has already passed. No emails sent.');
      process.exit(1);
    }
  }

  // Fetch profiles with league info
  const { data: profiles, error: profErr } = await supabase
    .from('profiles').select('email, name, leagues');
  if (profErr) { console.error('Profiles fetch failed:', profErr.message); process.exit(1); }

  // Fetch all predictions (paginated)
  const PAGE = 1000;
  let allPredRows = [];
  let from = 0;
  let keepGoing = true;
  while (keepGoing) {
    const { data: page, error: pageErr } = await supabase
      .from('predictions').select('user_id').range(from, from + PAGE - 1);
    if (pageErr) { console.error('Predictions fetch error:', pageErr.message); process.exit(1); }
    if (page && page.length > 0) {
      allPredRows.push(...page);
      keepGoing = page.length === PAGE;
      from += PAGE;
    } else {
      keepGoing = false;
    }
  }

  const usersWithPredictions = new Set(allPredRows.map(p => p.user_id));
  const zeroPrediction = profiles.filter(p => !usersWithPredictions.has(p.email));

  console.log(`   Total registered: ${profiles.length}`);
  console.log(`   With predictions: ${usersWithPredictions.size}`);
  console.log(`   Zero predictions (will be emailed): ${zeroPrediction.length}\n`);

  if (zeroPrediction.length === 0) {
    console.log('   ✅  Everyone has at least one prediction. No late invites needed.\n');
    return;
  }

  for (const player of zeroPrediction) {
    const leagues = player.leagues ?? [];
    const primaryLeague = leagues[0] ?? null;
    const lang = primaryLeague ? (LEAGUE_DEFAULT_LANGS[primaryLeague] ?? 'EN') : 'EN';
    const inviteUrl = primaryLeague
      ? `${APP_URL}?invite=${primaryLeague}&late=1`
      : `${APP_URL}?late=1`;

    const label = `${player.name || player.email} <${player.email}> [${lang}${primaryLeague ? ` / ${primaryLeague}` : ' / no league'}]`;

    if (isDryRun) {
      console.log(`   📧  [DRY RUN] Would email: ${label}`);
      console.log(`       → ${inviteUrl}\n`);
      continue;
    }

    const { subject, html } = buildEmail(lang, player.name, inviteUrl, cutoffStr);

    try {
      await sendEmail(player.email, subject, html);
      console.log(`   ✅  Sent: ${label}`);
    } catch (err) {
      console.error(`   ❌  Failed: ${label}\n       ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n   Done.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
