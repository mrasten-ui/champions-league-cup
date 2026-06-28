import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL         ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
);

const API_KEY   = process.env.API_FOOTBALL_KEY;
const LEAGUE_ID = 1;   // FIFA World Cup in API-Football
const SEASON    = 2026;

// API-Football team name → our internal 3-letter ID
// The /fixtures endpoint does not include a `code` field — only team names are available.
const TEAM_NAME_TO_ID = {
  "Mexico": "MEX", "Canada": "CAN", "United States": "USA", "USA": "USA",
  "Honduras": "HON", "Costa Rica": "CRC", "Jamaica": "JAM", "Panama": "PAN",
  "Haiti": "HAI", "Trinidad and Tobago": "TRI", "Trinidad & Tobago": "TRI",
  "El Salvador": "SLV", "Guatemala": "GUA",
  "Argentina": "ARG", "Brazil": "BRA", "Colombia": "COL", "Uruguay": "URU",
  "Ecuador": "ECU", "Paraguay": "PAR", "Venezuela": "VEN", "Chile": "CHI",
  "Peru": "PER", "Bolivia": "BOL",
  "England": "ENG", "France": "FRA", "Spain": "ESP", "Germany": "GER",
  "Portugal": "POR", "Netherlands": "NED", "Belgium": "BEL", "Croatia": "CRO",
  "Switzerland": "SUI", "Austria": "AUT", "Denmark": "DEN", "Sweden": "SWE",
  "Norway": "NOR", "Scotland": "SCO", "Wales": "WAL",
  "Ireland": "IRL", "Republic of Ireland": "IRL",
  "Serbia": "SRB", "Ukraine": "UKR", "Hungary": "HUN", "Romania": "ROU",
  "Slovakia": "SVK", "Slovenia": "SVN",
  "Czech Republic": "CZE", "Czechia": "CZE",
  "Poland": "POL", "Greece": "GRE", "Turkey": "TUR", "Türkiye": "TUR",
  "Albania": "ALB", "Georgia": "GEO", "Iceland": "ISL",
  "Bosnia and Herzegovina": "BIH", "Bosnia & Herzegovina": "BIH", "Bosnia": "BIH",
  "Morocco": "MAR", "Senegal": "SEN", "Nigeria": "NGA", "Egypt": "EGY",
  "Ghana": "GHA", "Cameroon": "CMR",
  "Ivory Coast": "CIV", "Cote d'Ivoire": "CIV", "Côte d'Ivoire": "CIV",
  "South Africa": "RSA", "Tunisia": "TUN", "Algeria": "ALG", "Mali": "MLI",
  "Guinea": "GUI", "Cabo Verde": "CPV", "Cape Verde": "CPV", "Cape Verde Islands": "CPV",
  "DR Congo": "COD", "Congo DR": "COD", "Democratic Republic of Congo": "COD",
  "Japan": "JPN", "Korea Republic": "KOR", "South Korea": "KOR",
  "Saudi Arabia": "KSA", "Iran": "IRN", "IR Iran": "IRN",
  "Australia": "AUS", "Uzbekistan": "UZB", "Jordan": "JOR", "Iraq": "IRQ",
  "Qatar": "QAT", "New Zealand": "NZL",
  "Indonesia": "IDN", "China PR": "CHN", "China": "CHN",
  "Curacao": "CUW", "Curaçao": "CUW",
};

const LOCKED_STATUSES    = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'FT', 'AET', 'PEN', 'LIVE', 'INT', 'ABD', 'AWD', 'WO'];
const LIVE_LOOP_STATUSES = ['1H', '2H', 'ET', 'P', 'LIVE', 'INT'];

// Knockout round name in API-Football → our internal round code
const KO_ROUND_MAP = [
  { apiName: 'Round of 32',     dbRound: 'R32' },
  { apiName: 'Round of 16',     dbRound: 'R16' },
  { apiName: 'Quarter-finals',  dbRound: 'QF'  },
  { apiName: 'Semi-finals',     dbRound: 'SF'  },
  { apiName: 'Final',           dbRound: 'FIN' },
  { apiName: '3rd Place Final', dbRound: '3RD' },
];

// Determine which polling tier applies right now.
// Returns 'live' | 'window' | 'skip' — no API calls, only DB queries.
async function checkTier() {
  const now = new Date();

  const liveStart = new Date(now - 36 * 60 * 60 * 1000).toISOString(); // 36h ago (guards against stale cross-day matches)
  const { data: live } = await supabase
    .from('matches').select('id')
    .in('status', LIVE_LOOP_STATUSES)
    .gte('date', liveStart)
    .limit(1);
  if (live?.length) return 'live';

  const nsStart = new Date(now - 60  * 60 * 1000).toISOString(); // 60 min ago (late-start buffer)
  const nsEnd   = new Date(now + 45  * 60 * 1000).toISOString(); // 45 min ahead
  const ftStart = new Date(now - 210 * 60 * 1000).toISOString(); // 3.5h ago (covers AET/PEN lag)
  const { data: window } = await supabase
    .from('matches').select('id')
    .or(
      `status.in.(HT,BT),` +
      `and(status.in.(NS,UPCOMING),date.gte.${nsStart},date.lte.${nsEnd}),` +
      `and(status.in.(NS,UPCOMING),date.gte.${new Date(now - 36 * 60 * 60 * 1000).toISOString()},date.lt.${now.toISOString()}),` +
      `and(status.in.(FT,AET,PEN),date.gte.${ftStart})`
    )
    .limit(1);
  if (window?.length) return 'window';

  return 'skip';
}

// Fill confirmed knockout matchups into TBD DB slots as soon as the API publishes them.
// Uses positional matching: both the API fixtures and the DB slots are sorted by kickoff time,
// then paired by index. Exits immediately if no TBD slots remain.
async function prefetchKnockoutBracket() {
  const { data: tbdRows, error } = await supabase
    .from('matches')
    .select('id, round, date, home_team_id, away_team_id, api_id')
    .in('round', ['R32', 'R16', 'QF', 'SF', 'FIN', '3RD'])
    .or('home_team_id.eq.TBD,away_team_id.eq.TBD');

  if (error) { console.error('[Bracket] DB fetch error:', error.message); return; }
  if (!tbdRows || tbdRows.length === 0) {
    console.log('[Bracket] All knockout slots filled — skipping prefetch.');
    return;
  }

  console.log(`[Bracket] ${tbdRows.length} TBD knockout slot(s) — fetching from API...`);

  // Fetch already-linked knockout rows so we can skip api_ids already in use.
  // This prevents duplicate assignments if the script runs more than once.
  const { data: linkedKORows } = await supabase
    .from('matches')
    .select('api_id')
    .in('round', ['R32', 'R16', 'QF', 'SF', 'FIN', '3RD'])
    .not('api_id', 'is', null);

  const usedApiIds = new Set((linkedKORows ?? []).map(r => r.api_id));

  // Group TBD rows by round, each sorted by kickoff time
  const tbdByRound = {};
  for (const row of tbdRows) {
    (tbdByRound[row.round] ??= []).push(row);
  }
  for (const rows of Object.values(tbdByRound)) {
    rows.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  let totalUpdated = 0;

  for (const { apiName, dbRound } of KO_ROUND_MAP) {
    const slots = tbdByRound[dbRound];
    if (!slots?.length) continue;

    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${LEAGUE_ID}&season=${SEASON}&round=${encodeURIComponent(apiName)}`,
      { headers: { 'x-apisports-key': API_KEY } }
    );
    const data = await res.json();
    if (!data.response?.length) { console.log(`[Bracket] ${dbRound}: no fixtures from API yet.`); continue; }

    // Only fixtures where both teams are resolved, sorted by kickoff time
    const known = data.response
      .filter(f => TEAM_NAME_TO_ID[f.teams.home.name] && TEAM_NAME_TO_ID[f.teams.away.name])
      .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));

    console.log(`[Bracket] ${dbRound}: ${data.results} total from API, ${known.length} with resolved teams.`);

    // Pair by position: nth API fixture (by time) → nth TBD DB slot (by time)
    let slotIndex = 0;
    for (let i = 0; i < known.length && slotIndex < slots.length; i++) {
      const f    = known[i];
      const slot = slots[slotIndex];
      const apiIdStr = f.fixture.id.toString();

      if (usedApiIds.has(apiIdStr)) {
        console.log(`[Bracket] api_id ${apiIdStr} already linked — skipping duplicate.`);
        continue; // don't advance slotIndex — this API fixture is already covered
      }

      const homeId = TEAM_NAME_TO_ID[f.teams.home.name];
      const awayId = TEAM_NAME_TO_ID[f.teams.away.name];
      const status = f.fixture.status.short;

      const patch = {
        home_team_id: homeId,
        away_team_id: awayId,
        api_id:       apiIdStr,
        date:         f.fixture.date,          // use actual kickoff time from API
        is_locked:    LOCKED_STATUSES.includes(status),
      };
      if (f.goals.home !== null) patch.home_score = f.goals.home;
      if (f.goals.away !== null) patch.away_score = f.goals.away;
      if (status !== 'TBD' && status !== 'NS') patch.status = status;

      const { error: upErr } = await supabase.from('matches').update(patch).eq('id', slot.id);
      if (upErr) {
        console.error(`[Bracket] ${slot.id} update failed: ${upErr.message}`);
      } else {
        console.log(`[Bracket] ${slot.id} → ${homeId} vs ${awayId} (api_id=${apiIdStr}, date=${f.fixture.date.slice(0, 16)})`);
        usedApiIds.add(apiIdStr); // prevent same api_id from matching another slot in this run
        totalUpdated++;
      }
      slotIndex++;
    }
  }

  console.log(`[Bracket] Prefetch done — ${totalUpdated} slot(s) updated.`);
}

async function syncScores() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  console.log(`[${new Date().toISOString()}] Starting score sync for ${today}...`);

  try {
    // 1. Pre-fetch all DB matches so we can detect stale live-status matches from previous days
    const { data: dbMatches, error: dbError } = await supabase
      .from('matches')
      .select('id, api_id, home_team_id, away_team_id, date, status');

    if (dbError) {
      console.error('Failed to fetch DB matches:', dbError.message);
      return;
    }

    // 2. Collect all dates to fetch: today + any previous days with stale live statuses
    const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE', 'INT'];
    const datesToFetch = new Set([today]);
    for (const m of dbMatches) {
      if (LIVE_STATUSES.includes(m.status) && m.date?.slice(0, 10) < today) {
        datesToFetch.add(m.date.slice(0, 10));
      }
    }
    if (datesToFetch.size > 1) {
      console.log(`Also fetching stale dates: ${[...datesToFetch].filter(d => d !== today).join(', ')}`);
    }

    // 3. Fetch fixtures for all needed dates (usually just today)
    const allFixtures = [];
    let lastResponse = null;
    for (const date of datesToFetch) {
      const response = await fetch(
        `https://v3.football.api-sports.io/fixtures?league=${LEAGUE_ID}&season=${SEASON}&date=${date}`,
        { headers: { 'x-apisports-key': API_KEY } }
      );
      const data = await response.json();
      if (date === today) {
        lastResponse = { response, data };
        console.log(`API HTTP status: ${response.status}`);
        console.log(`API remaining requests: ${response.headers.get('x-ratelimit-requests-remaining') ?? 'unknown'}`);
        console.log(`API errors:`, JSON.stringify(data.errors));
        console.log(`API results count: ${data.results ?? 'undefined'}`);
        if (data.errors && Object.keys(data.errors).length > 0) {
          console.error('API returned errors:', JSON.stringify(data.errors));
          return;
        }
      }
      if (data.response?.length) allFixtures.push(...data.response);
    }

    if (!allFixtures.length) {
      console.log('No fixtures returned — check API key and plan tier.');
      return;
    }

    console.log(`Fetched ${allFixtures.length} fixtures from API (${datesToFetch.size} date(s)).`);
    // Log live match states so we can see what the API is actually returning
    allFixtures.filter(i => ['1H','HT','2H','ET','P','BT','LIVE'].includes(i.fixture?.status?.short)).forEach(i => {
      console.log(`  LIVE: ${i.teams.home.name} ${i.goals.home ?? '-'}:${i.goals.away ?? '-'} ${i.teams.away.name} [${i.fixture.status.short} ${i.fixture.status.elapsed ?? '?'}']`);
    });

    // Fast lookup for already-linked fixtures
    const linkedByApiId = new Map(
      dbMatches.filter(m => m.api_id).map(m => [m.api_id, m])
    );
    // Candidates for auto-linking (knockout slots not yet linked)
    const unlinked = dbMatches.filter(m => !m.api_id);

    console.log(`DB: ${linkedByApiId.size} linked, ${unlinked.length} unlinked.`);

    let updated = 0;
    let autoLinked = 0;
    let skipped = 0;

    for (const item of allFixtures) {
      const { fixture, goals, teams } = item;
      const apiId   = fixture.id.toString();
      const apiDate = fixture.date?.slice(0, 10);
      const status  = fixture.status.short;
      const isLocked = LOCKED_STATUSES.includes(status);

      // Resolve team IDs (used in payload + auto-link matching)
      const homeId = TEAM_NAME_TO_ID[teams.home.name];
      const awayId = TEAM_NAME_TO_ID[teams.away.name];

      const payload = {
        status,
        home_score:   goals.home ?? null,
        away_score:   goals.away ?? null,
        is_locked:    isLocked,
        minute:     fixture.status.elapsed ?? null,
      };

      // Populate team IDs whenever we can resolve them (fills TBD knockout slots)
      if (homeId) payload.home_team_id = homeId;
      if (awayId) payload.away_team_id = awayId;

      // Penalty shootout: goals are equal after AET — override so pen winner
      // has a strictly higher score. Scoring engine ignores status, only compares scores.
      if (status === 'PEN') {
        if (teams.home.winner === true) {
          payload.home_score = (goals.away ?? 0) + 1;
          payload.away_score = goals.away ?? 0;
          console.log(`  PEN (${teams.home.name} vs ${teams.away.name}): home won → ${payload.home_score}-${payload.away_score}`);
        } else if (teams.away.winner === true) {
          payload.home_score = goals.home ?? 0;
          payload.away_score = (goals.home ?? 0) + 1;
          console.log(`  PEN (${teams.home.name} vs ${teams.away.name}): away won → ${payload.home_score}-${payload.away_score}`);
        } else {
          // Fallback: compare score.penalty (winner may be null mid-shootout)
          const penHome = item.score?.penalty?.home;
          const penAway = item.score?.penalty?.away;
          if (penHome != null && penAway != null && penHome !== penAway) {
            const base = goals.away ?? 0;
            if (penHome > penAway) {
              payload.home_score = base + 1;
              payload.away_score = base;
            } else {
              payload.home_score = base;
              payload.away_score = base + 1;
            }
            console.log(`  PEN fallback (${teams.home.name} vs ${teams.away.name}): ${penHome}-${penAway} pens → stored ${payload.home_score}-${payload.away_score}`);
          } else {
            console.warn(`  PEN in progress (${teams.home.name} vs ${teams.away.name}): winner not yet determined`);
          }
        }
      }

      // 3. Two-path update: fast path if already linked, auto-link path if not
      if (linkedByApiId.has(apiId)) {
        // Fast path: api_id already in DB — just update scores
        const { error } = await supabase
          .from('matches')
          .update(payload)
          .eq('api_id', apiId);

        if (error) {
          console.error(`  ✗ ${teams.home.name} vs ${teams.away.name}: ${error.message}`);
          skipped++;
        } else {
          updated++;
        }
      } else if (homeId && awayId) {
        // Auto-link path: teams are now known — find the unlinked DB row and link it
        const match = unlinked.find(m =>
          m.home_team_id?.toUpperCase() === homeId &&
          m.away_team_id?.toUpperCase() === awayId &&
          m.date?.slice(0, 10) === apiDate
        );

        if (match) {
          const { error } = await supabase
            .from('matches')
            .update({ ...payload, api_id: apiId })
            .eq('id', match.id);

          if (error) {
            console.error(`  ✗ Auto-link failed ${homeId} vs ${awayId}: ${error.message}`);
            skipped++;
          } else {
            console.log(`  Auto-linked: ${homeId} vs ${awayId} (${apiDate}) → api_id=${apiId}`);
            linkedByApiId.set(apiId, match); // prevent re-processing within this run
            autoLinked++;
            updated++;
          }
        }
        // else: DB doesn't have this fixture — skip silently
      }
      // else: teams still TBD — skip, will auto-link on next run once API has team names
    }

    console.log(`Done. Updated: ${updated} (${autoLinked} newly auto-linked), Skipped/Errors: ${skipped}`);

    // 4. Sync match events for live + recently-finished matches
    const EVENTS_STATUSES = ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE', 'INT', 'FT', 'AET', 'PEN'];
    const eventsQueue = [];
    for (const item of allFixtures) {
      const apiId  = item.fixture.id.toString();
      const status = item.fixture.status.short;
      const dbMatch = linkedByApiId.get(apiId);
      if (dbMatch && EVENTS_STATUSES.includes(status)) {
        eventsQueue.push({ apiId, matchId: dbMatch.id, homeApiTeamId: String(item.teams.home.id), awayApiTeamId: String(item.teams.away.id), homeCode: dbMatch.home_team_id, awayCode: dbMatch.away_team_id });
      }
    }

    let eventsUpserted = 0;
    for (const { apiId, matchId, homeApiTeamId, awayApiTeamId, homeCode, awayCode } of eventsQueue) {
      const evRes = await fetch(
        `https://v3.football.api-sports.io/fixtures/events?fixture=${apiId}`,
        { headers: { 'x-apisports-key': API_KEY } }
      );
      const evData = await evRes.json();
      if (!evData.response?.length) continue;

      // Delete stale null-team records (1 DB call)
      await supabase.from('match_events').delete().eq('match_id', matchId).is('team_id', null);

      // Build all rows then upsert in one batch (1 DB call instead of N)
      const rows = evData.response.map(event => {
        const eventApiTeamId = event.team?.id ? String(event.team.id) : null;
        let teamId = null;
        if (eventApiTeamId && eventApiTeamId === homeApiTeamId)      teamId = homeCode;
        else if (eventApiTeamId && eventApiTeamId === awayApiTeamId) teamId = awayCode;
        else teamId = TEAM_NAME_TO_ID[event.team?.name] ?? null;

        const normPlayer = (event.player?.name ?? '')
          .normalize('NFD').replace(/[̀-ͯ]/g, '')
          .toLowerCase().replace(/[^a-z]/g, '_');
        return {
          match_id:     matchId,
          api_event_id: `${matchId}_${teamId ?? ''}_${event.time?.elapsed ?? 0}_${event.time?.extra ?? 0}_${event.type}_${(event.detail ?? '').replace(/\s/g, '_')}_${normPlayer}`,
          minute:       event.time?.elapsed ?? null,
          minute_extra: event.time?.extra   ?? null,
          type:         event.type,
          detail:       event.detail        ?? null,
          team_id:      teamId,
          player:       event.player?.name  ?? null,
          player_id:    event.player?.id    ?? null,
          assist:       event.assist?.name  ?? null,
        };
      });

      const { error } = await supabase.from('match_events').upsert(rows, { onConflict: 'match_id,api_event_id', ignoreDuplicates: true });
      if (!error) eventsUpserted += rows.length;
    }
    if (eventsQueue.length) console.log(`Events: synced ${eventsUpserted} events across ${eventsQueue.length} match(es).`);

  } catch (err) {
    console.error('Sync error:', err);
    throw err; // let orchestrator handle — keeps live loop running on transient failures
  }
}

// --- Adaptive orchestration ---
// Always run bracket prefetch first — fills confirmed knockout matchups as soon as the API has them.
await prefetchKnockoutBracket();

const tier = await checkTier();

if (tier === 'live') {
  console.log('[TIER] Live — syncing every 20 s (12 iterations)');
  for (let i = 0; i < 12; i++) {
    try { await syncScores(); } catch { /* logged inside syncScores */ }
    if (i < 11) await new Promise(r => setTimeout(r, 20_000));
  }
} else if (tier === 'window') {
  console.log('[TIER] Window — single sync');
  await syncScores();
} else {
  console.log('[TIER] Silent — no active match window, skipping API call');
}
