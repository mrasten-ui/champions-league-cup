/**
 * generate-scouting-content.mjs
 *
 * Fills scouting_overview.strengths / weaknesses / scout_notes for all 36
 * League Phase teams using Gemini (via the already-deployed `daily-brief`
 * edge function, which is really just a generic "prompt -> Gemini text"
 * endpoint despite its name).
 *
 * Deliberately does NOT generate: star_player, recent_form, last_5_matches.
 * Those need real, current, verifiable data (this season's squad, actual
 * recent results) that we don't have a live source for yet — an LLM asked
 * to fill them in would be fabricating specific facts, not characterizing a
 * well-known team's identity. The prompt below is scoped to durable,
 * well-established traits (playing style, tactical identity, historic
 * strengths/limitations) that a real football scout could write about any
 * of these famous clubs without needing this week's team sheet, and
 * explicitly tells the model to avoid naming current players/managers/
 * scorelines for exactly that reason.
 *
 * Usage:
 *   node scripts/generate-scouting-content.mjs --dry-run   # logs output, writes nothing
 *   node scripts/generate-scouting-content.mjs             # writes to Supabase
 *   node scripts/generate-scouting-content.mjs --force     # also re-generates teams that already have a row
 *
 * Required env vars:
 *   SUPABASE_URL / VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY / SUPABASE_SERVICE_ROLE_KEY
 *   (no Gemini key needed locally — the daily-brief edge function already
 *   has GEMINI_API_KEY configured as a Supabase secret)
 *
 * Gemini's free tier caps gemini-3.6-flash at 20 requests/minute — and in
 * practice a REJECTED call still seems to count against that window (its
 * "retry in Ns" hint kept resetting back up after immediate retries rather
 * than counting down to zero), so this script does NOT retry in-run at all:
 * one attempt per team, skip on failure, move to the next team after the
 * normal pacing delay. Teams that already have a scouting_overview row are
 * skipped by default, so re-running the script later is a safe, idempotent
 * way to backfill whatever failed on a previous pass — pass --force to
 * regenerate everyone regardless.
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const isDryRun = process.argv.includes('--dry-run');
const isForce = process.argv.includes('--force');

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildPrompt(team) {
  const context = [team.name, team.region, team.rank ? `rank ${team.rank}/36 in this season's League Phase strength ratings` : null]
    .filter(Boolean).join(', ');
  return `You are a football scout writing an internal dossier on ${context}, a club competing in the 2026/27 UEFA Champions League League Phase.

Write a factual characterization based on this club's real, well-established playing identity, history and reputation as a football institution — NOT predictions, NOT fabricated recent results. Do not name specific current players, the current manager, or recent match scores — that information changes too often for you to know it's still accurate. Focus on durable, well-known traits: playing style, tactical identity, historic strengths as a club, well-known limitations.

Return ONLY valid JSON, no markdown fences, in exactly this shape:
{"strengths": ["...", "...", "..."], "weaknesses": ["...", "...", "..."], "scout_notes": "..."}

- "strengths": exactly 3 items, each a single sentence naming one concrete tactical or institutional strength.
- "weaknesses": exactly 3 items, each a single sentence naming one concrete tactical or institutional weakness.
- "scout_notes": one crisp paragraph (2-3 sentences) summarising their overall profile in this competition.`;
}

function parseJsonLoose(text) {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  return JSON.parse(cleaned);
}

async function generateForTeam(team) {
  const { data, error } = await supabase.functions.invoke('daily-brief', { body: { prompt: buildPrompt(team) } });
  if (error) {
    // Surface the real Gemini error body (quota/rate-limit messages included)
    // instead of the generic "non-2xx status code" the SDK gives by default.
    let detail = error.message;
    if (error.context && typeof error.context.json === 'function') {
      try { detail = (await error.context.json()).error ?? detail; } catch { /* keep generic message */ }
    }
    throw new Error(detail);
  }
  if (data?.error) throw new Error(`Gemini error: ${data.error}`);
  const parsed = parseJsonLoose(data.text ?? '');
  if (!Array.isArray(parsed.strengths) || parsed.strengths.length !== 3) throw new Error('bad strengths shape');
  if (!Array.isArray(parsed.weaknesses) || parsed.weaknesses.length !== 3) throw new Error('bad weaknesses shape');
  if (typeof parsed.scout_notes !== 'string' || !parsed.scout_notes) throw new Error('bad scout_notes shape');
  return parsed;
}

async function attemptOnce(fn, label) {
  try { return await fn(); }
  catch (e) { console.warn(`⚠️  ${label}: ${e.message}`); return null; }
}

async function main() {
  console.log(`\n=== generate-scouting-content.mjs ${isDryRun ? '(DRY RUN)' : '(LIVE)'} ===\n`);

  const { data: allTeams, error } = await supabase.from('teams').select('id, name, region, rank').order('rank', { nullsFirst: false });
  if (error) throw error;

  let teams = allTeams;
  if (!isForce) {
    const { data: existing } = await supabase.from('scouting_overview').select('team_id');
    const done = new Set((existing ?? []).map(r => r.team_id));
    teams = allTeams.filter(t => !done.has(t.id));
    if (done.size) console.log(`Skipping ${done.size} team(s) that already have scouting content (use --force to regenerate).`);
  }
  console.log(`Generating scouting content for ${teams.length} team(s) via Gemini...\n`);

  const rows = [];
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const result = await attemptOnce(() => generateForTeam(team), `${team.id} (${team.name})`);
    if (result) {
      rows.push({
        team_id: team.id,
        strengths: JSON.stringify(result.strengths),
        weaknesses: JSON.stringify(result.weaknesses),
        scout_notes: result.scout_notes,
      });
      console.log(`  [${i + 1}/${teams.length}] ${team.id}: ok`);
    } else {
      console.log(`  [${i + 1}/${teams.length}] ${team.id}: MISSING`);
    }
    // Gemini free tier: 20 requests/minute — pace comfortably under that.
    await sleep(3500);
  }

  console.log(`\nGenerated ${rows.length}/${teams.length} team profiles.`);
  if (rows.length) {
    console.log('\n--- Sample (first team) ---');
    console.log(JSON.stringify(rows[0], null, 2));
  }

  if (isDryRun) {
    console.log('\nDry run — nothing written. Re-run without --dry-run to commit.');
    return;
  }

  console.log('\nWriting scouting_overview table...');
  for (const row of rows) {
    const { error: upsertErr } = await supabase.from('scouting_overview').upsert(row, { onConflict: 'team_id' });
    if (upsertErr) console.warn(`⚠️  scouting_overview upsert failed for ${row.team_id}:`, upsertErr.message);
  }
  console.log('\nDone.');
}

main().catch((e) => { console.error(e); process.exit(1); });
