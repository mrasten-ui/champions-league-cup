/**
 * sync-tv-channels.js
 * Scrapes two sources daily and updates channels in Supabase:
 *  - EN / SCO: live-footballontv.com (UK — BBC/ITV/STV)
 *  - US:       sportsmediawatch.com  (FOX/FS1)
 *
 * Norway (TV2 for all 64 matches) is set once via Management → Bulk Apply.
 * Runs via GitHub Actions once a day.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const UK_URL = 'https://www.fanzo.com/en/tvguide/football/fifa-world-cup/10105';
const US_URL = 'https://www.sportsmediawatch.com/tv-schedules/fifa-world-cup-tv-schedule/';

// Website team name → our internal 3-letter ID
const TEAM_NAME_TO_ID = {
  'Mexico':                    'MEX',
  'South Africa':              'RSA',
  'Korea Republic':            'KOR',
  'South Korea':               'KOR',
  'Czech Republic':            'CZE',
  'Czechia':                   'CZE',
  'Canada':                    'CAN',
  'Bosnia and Herzegovina':    'BIH',
  'Bosnia':                    'BIH',
  'Qatar':                     'QAT',
  'Switzerland':               'SUI',
  'Brazil':                    'BRA',
  'Morocco':                   'MAR',
  'Haiti':                     'HAI',
  'Scotland':                  'SCO',
  'United States':             'USA',
  'USA':                       'USA',
  'Paraguay':                  'PAR',
  'Australia':                 'AUS',
  'Turkey':                    'TUR',
  'Türkiye':                   'TUR',
  'Germany':                   'GER',
  'Curacao':                   'CUW',
  'Curaçao':                   'CUW',
  "Ivory Coast":               'CIV',
  "Cote d'Ivoire":             'CIV',
  'Ecuador':                   'ECU',
  'Netherlands':               'NED',
  'Japan':                     'JPN',
  'Sweden':                    'SWE',
  'Tunisia':                   'TUN',
  'Belgium':                   'BEL',
  'Egypt':                     'EGY',
  'Iran':                      'IRN',
  'IR Iran':                   'IRN',
  'New Zealand':               'NZL',
  'Spain':                     'ESP',
  'Cabo Verde':                'CPV',
  'Cape Verde':                'CPV',
  'Saudi Arabia':              'KSA',
  'Uruguay':                   'URU',
  'France':                    'FRA',
  'Senegal':                   'SEN',
  'Iraq':                      'IRQ',
  'Norway':                    'NOR',
  'Argentina':                 'ARG',
  'Algeria':                   'ALG',
  'Austria':                   'AUT',
  'Jordan':                    'JOR',
  'Portugal':                  'POR',
  'DR Congo':                  'COD',
  'Congo DR':                  'COD',
  'Uzbekistan':                'UZB',
  'Colombia':                  'COL',
  'England':                   'ENG',
  'Croatia':                   'CRO',
  'Ghana':                     'GHA',
  'Panama':                    'PAN',
};

function toId(name, extraMap) {
  const n = name?.trim();
  return (extraMap && extraMap[n]) ?? TEAM_NAME_TO_ID[n] ?? null;
}

// ─── UK scraper (fanzo.com) ───────────────────────────────────────────────────

// "Thu, 11th Jun." → UTC midnight Date for 2026
function parseFanzoDate(str) {
  const clean = str
    .replace(/^[A-Za-z]+,\s*/, '')   // strip "Thu, "
    .replace(/(\d+)(st|nd|rd|th)/i, '$1')  // strip ordinal
    .replace(/\.$/, '');              // strip trailing dot
  const d = new Date(clean + ' 2026 UTC');
  return isNaN(d.getTime()) ? null : d;
}

// "ITV 1" / "ITV 2" → ITV,  "BBC One" / "BBC Two" → BBC
// SCO: ITV broadcasts as STV in Scotland
function extractUKChannels(channelStr) {
  const c = channelStr.toLowerCase();
  const hasBBC = c.includes('bbc');
  const hasITV = c.includes('itv');
  return {
    EN:  hasBBC ? 'BBC' : hasITV ? 'ITV' : null,
    SCO: hasBBC ? 'BBC' : hasITV ? 'STV' : null,  // ITV1 = STV in Scotland
  };
}

async function fetchUKListings() {
  console.log('\n── UK: Fetching', UK_URL);
  const res = await fetch(UK_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RastenCupBot/1.0)' },
  });
  if (!res.ok) throw new Error(`UK fetch failed: HTTP ${res.status}`);

  const html = await res.text();
  const listings = [];

  // Split into fixture-item blocks
  const fixtureBlocks = html.split(/<div[^>]*class="[^"]*fixture-item[^"]*"[^>]*>/);

  for (const block of fixtureBlocks.slice(1)) {
    // Date
    const dateMatch = block.match(/<div[^>]*class="[^"]*match-date[^"]*"[^>]*>([^<]+)</);
    if (!dateMatch) continue;
    const date = parseFanzoDate(dateMatch[1].trim());
    if (!date) continue;

    // Teams — first two <span class="team-name"> occurrences
    const teamMatches = [...block.matchAll(/<span[^>]*class="[^"]*team-name[^"]*"[^>]*>([^<]+)<\/span>/g)];
    if (teamMatches.length < 2) continue;
    const homeTeam = teamMatches[0][1].trim();
    const awayTeam = teamMatches[1][1].trim();

    // Channel — link text inside channel-info
    const chanMatch = block.match(/<div[^>]*class="[^"]*channel-info[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
    if (!chanMatch) continue;
    const channelStr = chanMatch[1].trim();

    listings.push({ date, homeTeam, awayTeam, channelStr });
  }

  console.log(`   Parsed ${listings.length} listings`);
  return listings;
}

// ─── US scraper (sportsmediawatch.com) ───────────────────────────────────────

function extractUSChannel(channelStr) {
  const c = channelStr;
  // Priority: named cable/broadcast first
  if (c.includes('FS1'))  return 'FS1';
  if (c.includes('FOX'))  return 'FOX';
  if (c.includes('CBS'))  return 'CBS';
  if (c.includes('NBC'))  return 'NBC';
  if (c.includes('ABC'))  return 'ABC';
  return null;
}

async function fetchUSListings() {
  console.log('\n── US: Fetching', US_URL);
  const res = await fetch(US_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RastenCupBot/1.0)' },
  });
  if (!res.ok) throw new Error(`US fetch failed: HTTP ${res.status}`);

  const html = await res.text();
  const listings = [];

  // Each match row is a <tr> — extract blocks between <tr> tags
  const rowBlocks = [...html.matchAll(/<tr[\s\S]*?<\/tr>/g)].map(m => m[0]);

  for (const block of rowBlocks) {
    // ISO timestamp in data-timestamp attribute (already UTC)
    const tsMatch = block.match(/data-timestamp="([^"]+)"/);
    if (!tsMatch) continue;
    const date = new Date(tsMatch[1]);
    if (isNaN(date.getTime())) continue;

    // Team names inside <span class="team-text">
    const teamMatches = [...block.matchAll(/<span class="team-text">([^<]+)<\/span>/g)];
    if (teamMatches.length < 2) continue;
    const homeTeam = teamMatches[0][1].trim();
    const awayTeam = teamMatches[1][1].trim();

    // Channel inside <span class="networkfcolor"> (strip any inner <a> tags)
    const chanMatch = block.match(/<span class="networkfcolor">([\s\S]*?)<\/span>/);
    if (!chanMatch) continue;
    const channelStr = chanMatch[1].replace(/<[^>]+>/g, '').trim();

    // Only World Cup rows
    if (!block.includes('World Cup') && !block.includes('FIFA')) continue;

    listings.push({ date, homeTeam, awayTeam, channelStr });
  }

  console.log(`   Parsed ${listings.length} listings`);
  return listings;
}

// ─── Supabase updater ─────────────────────────────────────────────────────────

function sameDay(d1, d2) {
  return d1.getUTCFullYear() === d2.getUTCFullYear()
    && d1.getUTCMonth()     === d2.getUTCMonth()
    && d1.getUTCDate()      === d2.getUTCDate();
}

async function applyListings(listings, extractFn, label, dbMatches, extraNameMap = null) {

  let updated = 0, skipped = 0, unmatched = 0;

  for (const listing of listings) {
    const homeId = toId(listing.homeTeam, extraNameMap);
    const awayId = toId(listing.awayTeam, extraNameMap);

    if (!homeId || !awayId) {
      console.warn(`   Unknown team: "${listing.homeTeam}" v "${listing.awayTeam}"`);
      unmatched++;
      continue;
    }

    const dbMatch = dbMatches.find(m =>
      sameDay(new Date(m.date), listing.date)
      && m.home_team_id?.toUpperCase() === homeId
      && m.away_team_id?.toUpperCase() === awayId
    );

    if (!dbMatch) {
      console.warn(`   No DB row: ${listing.homeTeam} v ${listing.awayTeam} on ${listing.date.toUTCString().slice(0,16)}`);
      unmatched++;
      continue;
    }

    const channelUpdates = extractFn(listing.channelStr);
    // Remove null values
    const patch = Object.fromEntries(Object.entries(channelUpdates).filter(([, v]) => v));

    if (Object.keys(patch).length === 0) { skipped++; continue; }

    const channels = { ...(dbMatch.channels || {}), ...patch };
    const { error: updateErr } = await supabase
      .from('matches').update({ channels }).eq('id', dbMatch.id);

    if (updateErr) {
      console.error(`   Update failed (${dbMatch.id}):`, updateErr.message);
    } else {
      const patchStr = Object.entries(patch).map(([k, v]) => `${k}=${v}`).join(' ');
      console.log(`   ✓ ${listing.homeTeam} v ${listing.awayTeam}: ${patchStr}`);
      // Keep local cache in sync for subsequent listings (same DB array reused)
      dbMatch.channels = channels;
      updated++;
    }
  }

  console.log(`   ${label}: ${updated} updated, ${skipped} skipped, ${unmatched} unmatched`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  // Load DB matches once — shared across all three scrapers
  const { data: dbMatches, error } = await supabase
    .from('matches')
    .select('id, home_team_id, away_team_id, date, channels');
  if (error) { console.error('Supabase fetch failed:', error.message); process.exit(1); }
  console.log(`Loaded ${dbMatches.length} matches from Supabase`);

  // Scrape all three sources in parallel
  const [ukListings, usListings, noListings] = await Promise.all([
    fetchUKListings().catch(err => { console.error('UK scrape failed:', err.message); return []; }),
    fetchUSListings().catch(err => { console.error('US scrape failed:', err.message); return []; }),
    fetchNOListings().catch(err => { console.error('NO scrape failed:', err.message); return []; }),
  ]);

  if (ukListings.length > 0) {
    await applyListings(ukListings, extractUKChannels, 'UK (EN/SCO)', dbMatches);
  }
  if (usListings.length > 0) {
    await applyListings(usListings, ch => ({ US: extractUSChannel(ch) }), 'US', dbMatches);
  }
  if (noListings.length > 0) {
    await applyListings(noListings, ch => ({ NO: ch }), 'NO (TV2 + NRK)', dbMatches, NO_TEAM_NAME_TO_ID);
  }

  console.log('\nAll done.');
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
