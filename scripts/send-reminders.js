/**
 * send-reminders.js
 *
 * Finds players with incomplete group stage predictions and emails them via Resend.
 *
 * Usage:
 *   node scripts/send-reminders.js           # sends emails
 *   node scripts/send-reminders.js --dry-run # logs who would be emailed, sends nothing
 *
 * Required env vars:
 *   SUPABASE_URL / VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY / SUPABASE_SERVICE_ROLE_KEY
 *   RESEND_API_KEY                             — from resend.com
 *   APP_URL                                    — e.g. https://rastencup.com (for the CTA link)
 *   FROM_EMAIL                                 — e.g. noreply@rastencup.com (must be verified in Resend)
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const isDryRun = process.argv.includes('--dry-run');

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const APP_URL        = process.env.APP_URL        ?? 'https://rastencup.com';
const FROM_EMAIL     = process.env.FROM_EMAIL     ?? 'The Rasten Cup <noreply@rastencup.com>';

function formatLockCountdown(firstMatchDate) {
  const now = Date.now();
  const msLeft = firstMatchDate - now;
  if (msLeft <= 0) return 'very soon';
  const totalHours = Math.floor(msLeft / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `in ${days} day${days > 1 ? 's' : ''} and ${hours} hour${hours !== 1 ? 's' : ''}`;
  if (hours > 0) return `in ${hours} hour${hours !== 1 ? 's' : ''}`;
  const mins = Math.floor((msLeft / (1000 * 60)) % 60);
  return `in ${mins} minute${mins !== 1 ? 's' : ''}`;
}

function formatLockDate(firstMatchDate) {
  return new Date(firstMatchDate).toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    timeZone: 'UTC',
  });
}

async function sendEmail(to, name, missingCount, totalGroupMatches, firstMatchDate) {
  const lockCountdown = formatLockCountdown(firstMatchDate);
  const lockDate     = formatLockDate(firstMatchDate);

  const body = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:system-ui,sans-serif;color:#e2e8f0;">
  <div style="max-width:480px;margin:40px auto;padding:0 16px;">
    <div style="background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1e3a5f,#1e1b4b);padding:28px 28px 20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:900;letter-spacing:0.15em;text-transform:uppercase;color:#94a3b8;">The Rasten Cup</p>
        <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;">⚽ You're missing ${missingCount} predictions</h1>
      </div>

      <!-- Body -->
      <div style="padding:24px 28px;">
        <p style="margin:0 0 16px;font-size:15px;color:#cbd5e1;line-height:1.6;">
          Hey ${name || 'Manager'}, the World Cup kicks off <strong style="color:#fbbf24;">${lockCountdown}</strong>
          — and you still have <strong style="color:#fbbf24;">${missingCount} of ${totalGroupMatches} group stage predictions</strong> to fill in.
        </p>

        <!-- Lock time callout -->
        <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.25);border-radius:10px;padding:12px 16px;margin:0 0 16px;">
          <p style="margin:0;font-size:13px;color:#fca5a5;line-height:1.5;">
            🔒 <strong>Predictions lock at opening kick-off</strong><br>
            <span style="color:#94a3b8;">${lockDate}</span>
          </p>
        </div>

        <!-- Auto-fill notice -->
        <div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:10px;padding:12px 16px;margin:0 0 24px;">
          <p style="margin:0;font-size:13px;color:#a5b4fc;line-height:1.6;">
            🤖 <strong>Don't worry — we've got you covered.</strong><br>
            <span style="color:#94a3b8;">Any predictions you haven't filled in will be automatically completed for you at kick-off, using our AI simulation. But your own picks will always score better — so it's worth filling them in yourself.</span>
          </p>
        </div>

        <!-- CTA -->
        <a href="${APP_URL}" style="display:inline-block;background:#eab308;color:#0f2545;font-weight:900;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;padding:14px 28px;border-radius:10px;text-decoration:none;">
          Fill In My Predictions →
        </a>
      </div>

      <!-- Footer -->
      <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);">
        <p style="margin:0;font-size:11px;color:#475569;">You're receiving this because you're registered for The Rasten Cup.</p>
      </div>

    </div>
  </div>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: '⚽ Your Rasten Cup predictions are incomplete',
      html: body,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error for ${to}: ${res.status} ${err}`);
  }
  return res.json();
}

async function main() {
  console.log(`\n🏆 Rasten Cup — Prediction Reminder Script${isDryRun ? ' [DRY RUN]' : ''}\n`);

  if (!RESEND_API_KEY && !isDryRun) {
    console.error('❌  RESEND_API_KEY not set. Add it to .env or GitHub Secrets.');
    process.exit(1);
  }

  // Fetch all profiles
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('email, name');
  if (profErr) { console.error('Profiles fetch failed:', profErr.message); process.exit(1); }

  // Fetch all group matches (need date for lock countdown)
  const { data: groupMatches, error: matchErr } = await supabase
    .from('matches')
    .select('id, date')
    .not('group_id', 'is', null);
  if (matchErr) { console.error('Matches fetch failed:', matchErr.message); process.exit(1); }

  const groupMatchIds = new Set(groupMatches.map(m => m.id));
  const totalGroupMatches = groupMatchIds.size;

  const firstMatchDate = groupMatches
    .map(m => new Date(m.date).getTime())
    .filter(t => !isNaN(t))
    .sort((a, b) => a - b)[0] ?? null;

  console.log(`   Group matches total: ${totalGroupMatches}`);
  if (firstMatchDate) console.log(`   First kick-off: ${formatLockDate(firstMatchDate)} (${formatLockCountdown(firstMatchDate)})`);

  // Fetch all predictions for group matches
  const { data: predictions, error: predErr } = await supabase
    .from('predictions')
    .select('user_id, match_id')
    .in('match_id', [...groupMatchIds]);
  if (predErr) { console.error('Predictions fetch failed:', predErr.message); process.exit(1); }

  // Count predictions per user
  const predCounts = {};
  for (const p of predictions) {
    predCounts[p.user_id] = (predCounts[p.user_id] || 0) + 1;
  }

  // Find incomplete users
  const incomplete = profiles.filter(p => (predCounts[p.email] || 0) < totalGroupMatches);
  console.log(`\n   Players with missing predictions: ${incomplete.length} / ${profiles.length}\n`);

  if (incomplete.length === 0) {
    console.log('   ✅  Everyone is fully predicted. No emails needed.\n');
    return;
  }

  for (const player of incomplete) {
    const missing = totalGroupMatches - (predCounts[player.email] || 0);
    const label = `${player.name || player.email} <${player.email}> — missing ${missing}/${totalGroupMatches}`;

    if (isDryRun) {
      console.log(`   📧  [DRY RUN] Would email: ${label}`);
      continue;
    }

    try {
      await sendEmail(player.email, player.name, missing, totalGroupMatches, firstMatchDate);
      console.log(`   ✅  Sent: ${label}`);
    } catch (err) {
      console.error(`   ❌  Failed: ${label}\n       ${err.message}`);
    }

    // Small delay to stay within Resend rate limits
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n   Done.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
