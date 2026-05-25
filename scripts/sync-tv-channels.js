/**
 * sync-tv-channels.js
 *
 * Group stage (72 matches) channels are hard-coded from official announcements:
 *   EN / SCO : live-footballontv.com  (BBC / ITV, ITV→STV for Scotland)
 *   US       : foxsports.com          (FOX / FS1)
 *   NO       : nrk.no                 (TV2 / NRK)
 *
 * Knockout stage: NRK article is scraped daily — they update it as assignments
 * are confirmed. BBC/ITV and FOX/FS1 knockout splits need a solution closer to
 * June 28; both announce with short notice. See fetchNOListings() below.
 *
 * Runs via GitHub Actions once a day (07:00 UTC) + manual dispatch.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Hard-coded group stage channel assignments ────────────────────────────────
// Sources: live-footballontv.com (EN/SCO), foxsports.com (US), nrk.no (NO)
// Matched by team pair — home/away order doesn't matter (each pair plays once).
// ITV broadcasts in Scotland as STV, so SCO = 'STV' when EN = 'ITV'.

const GROUP_STAGE = [
  { t1:'MEX', t2:'RSA', EN:'ITV', SCO:'STV', US:'FOX',  NO:'TV2' },
  { t1:'KOR', t2:'CZE', EN:'ITV', SCO:'STV', US:'FS1',  NO:'NRK' },
  { t1:'CAN', t2:'BIH', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'NRK' },
  { t1:'USA', t2:'PAR', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'TV2' },
  { t1:'QAT', t2:'SUI', EN:'ITV', SCO:'STV', US:'FOX',  NO:'NRK' },
  { t1:'BRA', t2:'MAR', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'TV2' },
  { t1:'HAI', t2:'SCO', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'TV2' },
  { t1:'AUS', t2:'TUR', EN:'ITV', SCO:'STV', US:'FOX',  NO:'TV2' },
  { t1:'GER', t2:'CUW', EN:'ITV', SCO:'STV', US:'FOX',  NO:'NRK' },
  { t1:'NED', t2:'JPN', EN:'ITV', SCO:'STV', US:'FOX',  NO:'TV2' },
  { t1:'CIV', t2:'ECU', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'TV2' },
  { t1:'SWE', t2:'TUN', EN:'ITV', SCO:'STV', US:'FS1',  NO:'TV2' },
  { t1:'ESP', t2:'CPV', EN:'ITV', SCO:'STV', US:'FOX',  NO:'TV2' },
  { t1:'BEL', t2:'EGY', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'NRK' },
  { t1:'KSA', t2:'URU', EN:'ITV', SCO:'STV', US:'FS1',  NO:'NRK' },
  { t1:'IRN', t2:'NZL', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'NRK' },
  { t1:'FRA', t2:'SEN', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'TV2' },
  { t1:'IRQ', t2:'NOR', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'TV2' },
  { t1:'ARG', t2:'ALG', EN:'ITV', SCO:'STV', US:'FOX',  NO:'NRK' },
  { t1:'AUT', t2:'JOR', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'NRK' },
  { t1:'POR', t2:'COD', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'NRK' },
  { t1:'ENG', t2:'CRO', EN:'ITV', SCO:'STV', US:'FOX',  NO:'TV2' },
  { t1:'GHA', t2:'PAN', EN:'ITV', SCO:'STV', US:'FS1',  NO:'TV2' },
  { t1:'UZB', t2:'COL', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'TV2' },
  { t1:'CZE', t2:'RSA', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'NRK' },
  { t1:'SUI', t2:'BIH', EN:'ITV', SCO:'STV', US:'FOX',  NO:'TV2' },
  { t1:'CAN', t2:'QAT', EN:'ITV', SCO:'STV', US:'FS1',  NO:'TV2' },
  { t1:'MEX', t2:'KOR', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'TV2' },
  { t1:'USA', t2:'AUS', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'NRK' },
  { t1:'SCO', t2:'MAR', EN:'ITV', SCO:'STV', US:'FOX',  NO:'NRK' },
  { t1:'BRA', t2:'HAI', EN:'ITV', SCO:'STV', US:'FOX',  NO:'NRK' },
  { t1:'TUR', t2:'PAR', EN:'ITV', SCO:'STV', US:'FS1',  NO:'NRK' },
  { t1:'NED', t2:'SWE', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'NRK' },
  { t1:'GER', t2:'CIV', EN:'ITV', SCO:'STV', US:'FOX',  NO:'TV2' },
  { t1:'ECU', t2:'CUW', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'TV2' },
  { t1:'TUN', t2:'JPN', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'NRK' },
  { t1:'ESP', t2:'KSA', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'NRK' },
  { t1:'BEL', t2:'IRN', EN:'ITV', SCO:'STV', US:'FS1',  NO:'TV2' },
  { t1:'URU', t2:'CPV', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'TV2' },
  { t1:'NZL', t2:'EGY', EN:'ITV', SCO:'STV', US:'FS1',  NO:'TV2' },
  { t1:'ARG', t2:'AUT', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'TV2' },
  { t1:'FRA', t2:'IRQ', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'NRK' },
  { t1:'NOR', t2:'SEN', EN:'ITV', SCO:'STV', US:'FOX',  NO:'NRK' },
  { t1:'JOR', t2:'ALG', EN:'ITV', SCO:'STV', US:'FS1',  NO:'TV2' },
  { t1:'POR', t2:'UZB', EN:'ITV', SCO:'STV', US:'FOX',  NO:'TV2' },
  { t1:'ENG', t2:'GHA', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'NRK' },
  { t1:'PAN', t2:'CRO', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'NRK' },
  { t1:'COL', t2:'COD', EN:'ITV', SCO:'STV', US:'FS1',  NO:'TV2' },
  { t1:'SUI', t2:'CAN', EN:'ITV', SCO:'STV', US:'FOX',  NO:'NRK' },
  { t1:'BIH', t2:'QAT', EN:'ITV', SCO:'STV', US:'FS1',  NO:'NRK' },
  { t1:'SCO', t2:'BRA', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'NRK' },
  { t1:'MAR', t2:'HAI', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'NRK' },
  { t1:'MEX', t2:'CZE', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'TV2' },
  { t1:'RSA', t2:'KOR', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'TV2' },
  { t1:'CUW', t2:'CIV', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'TV2' },
  { t1:'ECU', t2:'GER', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'TV2' },
  { t1:'TUN', t2:'NED', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'TV2' },
  { t1:'JPN', t2:'SWE', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'TV2' },
  { t1:'TUR', t2:'USA', EN:'ITV', SCO:'STV', US:'FOX',  NO:'NRK' },
  { t1:'PAR', t2:'AUS', EN:'ITV', SCO:'STV', US:'FS1',  NO:'NRK' },
  { t1:'NOR', t2:'FRA', EN:'ITV', SCO:'STV', US:'FOX',  NO:'NRK' },
  { t1:'SEN', t2:'IRQ', EN:'ITV', SCO:'STV', US:'FS1',  NO:'NRK' },
  { t1:'CPV', t2:'KSA', EN:'ITV', SCO:'STV', US:'FS1',  NO:'NRK' },
  { t1:'URU', t2:'ESP', EN:'ITV', SCO:'STV', US:'FOX',  NO:'NRK' },
  { t1:'EGY', t2:'IRN', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'TV2' },
  { t1:'NZL', t2:'BEL', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'TV2' },
  { t1:'PAN', t2:'ENG', EN:'ITV', SCO:'STV', US:'FOX',  NO:'TV2' },
  { t1:'CRO', t2:'GHA', EN:'ITV', SCO:'STV', US:'FS1',  NO:'TV2' },
  { t1:'COL', t2:'POR', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'NRK' },
  { t1:'COD', t2:'UZB', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'NRK' },
  { t1:'ALG', t2:'AUT', EN:'BBC', SCO:'BBC', US:'FS1',  NO:'NRK' },
  { t1:'JOR', t2:'ARG', EN:'BBC', SCO:'BBC', US:'FOX',  NO:'NRK' },
];

async function applyHardcodedChannels(dbMatches) {
  console.log('\n── Group stage: applying hard-coded channels (72 matches)');
  let updated = 0, skipped = 0, notFound = 0;

  for (const entry of GROUP_STAGE) {
    const dbMatch = dbMatches.find(m => {
      const h = m.home_team_id?.toUpperCase();
      const a = m.away_team_id?.toUpperCase();
      return (h === entry.t1 && a === entry.t2) || (h === entry.t2 && a === entry.t1);
    });

    if (!dbMatch) {
      console.warn(`   Not found in DB: ${entry.t1} vs ${entry.t2}`);
      notFound++;
      continue;
    }

    const patch = { EN: entry.EN, SCO: entry.SCO, US: entry.US, NO: entry.NO };
    const existing = dbMatch.channels || {};
    const changed = Object.entries(patch).some(([k, v]) => existing[k] !== v);

    if (!changed) { skipped++; continue; }

    const channels = { ...existing, ...patch };
    const { error } = await supabase.from('matches').update({ channels }).eq('id', dbMatch.id);
    if (error) {
      console.error(`   Update failed (${dbMatch.id}):`, error.message);
    } else {
      console.log(`   ✓ ${entry.t1} vs ${entry.t2}: EN=${entry.EN} SCO=${entry.SCO} US=${entry.US} NO=${entry.NO}`);
      dbMatch.channels = channels;
      updated++;
    }
  }

  console.log(`   Result: ${updated} updated, ${skipped} unchanged, ${notFound} not found`);
}

// ─── NO scraper (nrk.no) — used for knockout stage once announced ─────────────
// nrk.no updates their article as TV2/NRK assignments are confirmed per round.
// EN/SCO/US knockout splits: TODO — find reliable SSR source closer to June 28.

const NO_URL = 'https://www.nrk.no/sport/program-og-tv-guide-for-fotball-vm_-slik-ser-du-norges-kamper-pa-tv-1.17694535';

const NO_MONTHS = { januar:0, februar:1, mars:2, april:3, mai:4, juni:5, juli:6, august:7, september:8, oktober:9, november:10, desember:11 };

const NO_TEAM_NAME_TO_ID = {
  'Mexico':'MEX', 'Sør-Afrika':'RSA', 'Sør-Korea':'KOR', 'Tsjekkia':'CZE',
  'Canada':'CAN', 'Bosnia og Herzegovina':'BIH', 'Qatar':'QAT', 'Sveits':'SUI',
  'Brasil':'BRA', 'Marokko':'MAR', 'Haiti':'HAI', 'Skottland':'SCO',
  'USA':'USA', 'Paraguay':'PAR', 'Australia':'AUS', 'Tyrkia':'TUR',
  'Tyskland':'GER', 'Curaçao':'CUW', 'Elfenbeinkysten':'CIV', 'Ecuador':'ECU',
  'Nederland':'NED', 'Japan':'JPN', 'Sverige':'SWE', 'Tunisia':'TUN',
  'Belgia':'BEL', 'Egypt':'EGY', 'Iran':'IRN', 'New Zealand':'NZL',
  'Spania':'ESP', 'Kapp Verde':'CPV', 'Saudi Arabia':'KSA', 'Uruguay':'URU',
  'Frankrike':'FRA', 'Senegal':'SEN', 'Irak':'IRQ', 'Norge':'NOR',
  'Argentina':'ARG', 'Algerie':'ALG', 'Østerrike':'AUT', 'Østerrika':'AUT',
  'Jordan':'JOR', 'Portugal':'POR', 'DR Kongo':'COD', 'Usbekistan':'UZB',
  'Colombia':'COL', 'England':'ENG', 'Kroatia':'CRO', 'Ghana':'GHA', 'Panama':'PAN',
};

function parseNorwegianDate(str) {
  const m = str.trim().match(/(\d+)\.\s*(\S+)/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = NO_MONTHS[m[2].toLowerCase()];
  if (month === undefined) return null;
  return new Date(Date.UTC(2026, month, day));
}

async function fetchNOKnockoutListings() {
  console.log('\n── NO knockout: Fetching', NO_URL);
  const res = await fetch(NO_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RastenCupBot/1.0)' } });
  if (!res.ok) throw new Error(`NO fetch failed: HTTP ${res.status}`);

  const html = await res.text();
  const listings = [];
  const tokens = [...html.matchAll(/<(dt|dd)[^>]*>([\s\S]*?)<\/\1>/g)];

  let currentDate = null;
  let ddBuffer = [];

  const flush = () => {
    if (!currentDate || ddBuffer.length < 2) { ddBuffer = []; return; }
    const timeChannel = ddBuffer[0].replace(/<[^>]+>/g, '').trim();
    const chanMatch = timeChannel.match(/\b(TV2|NRK)\b/i);
    if (!chanMatch) { ddBuffer = []; return; }
    const channel = chanMatch[1].toUpperCase();
    const teamsRaw = ddBuffer[1].replace(/<[^>]+>/g, '').trim();
    const parts = teamsRaw.split(/\s*[–—-]\s*/u);
    if (parts.length < 2) { ddBuffer = []; return; }
    const homeId = NO_TEAM_NAME_TO_ID[parts[0].trim()];
    const awayId = NO_TEAM_NAME_TO_ID[parts[1].trim()];
    if (homeId && awayId) listings.push({ date: currentDate, homeId, awayId, channel });
    ddBuffer = [];
  };

  for (const [, tag, inner] of tokens) {
    if (tag === 'dt') { flush(); currentDate = parseNorwegianDate(inner.replace(/<[^>]+>/g, '')); }
    else { ddBuffer.push(inner); if (ddBuffer.length === 3) flush(); }
  }
  flush();

  // Filter to knockout only (after June 28)
  const knockoutCutoff = new Date(Date.UTC(2026, 5, 29)); // June 29
  return listings.filter(l => l.date >= knockoutCutoff);
}

async function applyNOKnockout(dbMatches) {
  const listings = await fetchNOKnockoutListings();
  if (listings.length === 0) { console.log('   No NO knockout listings found yet.'); return; }

  console.log(`   Found ${listings.length} NO knockout listings`);
  let updated = 0, skipped = 0;

  for (const { homeId, awayId, channel, date } of listings) {
    const dbMatch = dbMatches.find(m => {
      const h = m.home_team_id?.toUpperCase();
      const a = m.away_team_id?.toUpperCase();
      const sameTeams = (h === homeId && a === awayId) || (h === awayId && a === homeId);
      const sameDay = Math.abs(new Date(m.date) - date) < 86400000 * 2; // within 2 days
      return sameTeams || sameDay; // TBD slots matched by date
    });
    if (!dbMatch) { console.warn(`   No DB row for ${homeId} vs ${awayId}`); continue; }
    if (dbMatch.channels?.NO === channel) { skipped++; continue; }

    const channels = { ...(dbMatch.channels || {}), NO: channel };
    const { error } = await supabase.from('matches').update({ channels }).eq('id', dbMatch.id);
    if (error) { console.error(`   Update failed:`, error.message); }
    else { console.log(`   ✓ ${homeId} vs ${awayId}: NO=${channel}`); dbMatch.channels = channels; updated++; }
  }

  console.log(`   NO knockout: ${updated} updated, ${skipped} unchanged`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const { data: dbMatches, error } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, date, channels');
  if (error) { console.error('Supabase fetch failed:', error.message); process.exit(1); }
  console.log(`Loaded ${dbMatches.length} matches from Supabase`);

  // 1. Apply all 72 group stage channels from hard-coded table
  await applyHardcodedChannels(dbMatches);

  // 2. Scrape NRK for any NO knockout assignments (returns empty until June 29)
  await applyNOKnockout(dbMatches).catch(err => console.error('NO knockout scrape failed:', err.message));

  // TODO (before June 28): Add EN/SCO and US knockout channel scraping.
  // BBC/ITV and FOX/FS1 announce Round of 32 splits with ~1 week notice.

  console.log('\nAll done.');
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
