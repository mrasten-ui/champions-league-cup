import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const TEAM_NAME_TO_ID: Record<string, string> = {
  // North & Central America
  "Mexico": "MEX", "Canada": "CAN",
  "United States": "USA", "USA": "USA", "US": "USA",
  "Honduras": "HON", "Costa Rica": "CRC",
  "Jamaica": "JAM", "Panama": "PAN", "Haiti": "HAI",
  "Trinidad and Tobago": "TRI", "Trinidad & Tobago": "TRI",
  "El Salvador": "SLV", "Guatemala": "GUA",
  // South America
  "Argentina": "ARG", "Brazil": "BRA", "Colombia": "COL",
  "Uruguay": "URU", "Ecuador": "ECU", "Paraguay": "PAR",
  "Venezuela": "VEN", "Chile": "CHI", "Peru": "PER",
  "Bolivia": "BOL",
  // Europe
  "England": "ENG", "France": "FRA", "Spain": "ESP",
  "Germany": "GER", "Portugal": "POR", "Netherlands": "NED",
  "Belgium": "BEL", "Croatia": "CRO", "Switzerland": "SUI",
  "Austria": "AUT", "Denmark": "DEN", "Sweden": "SWE",
  "Norway": "NOR", "Scotland": "SCO", "Wales": "WAL",
  "Ireland": "IRL", "Republic of Ireland": "IRL",
  "Serbia": "SRB", "Ukraine": "UKR", "Hungary": "HUN",
  "Romania": "ROU", "Slovakia": "SVK", "Slovenia": "SVN",
  "Czech Republic": "CZE", "Czechia": "CZE",
  "Poland": "POL", "Greece": "GRE", "Turkey": "TUR", "Türkiye": "TUR",
  "Albania": "ALB", "Georgia": "GEO", "Iceland": "ISL",
  "Finland": "FIN", "Bulgaria": "BUL", "North Macedonia": "MKD",
  "Bosnia and Herzegovina": "BIH", "Bosnia & Herzegovina": "BIH", "Bosnia": "BIH",
  // Africa
  "Morocco": "MAR", "Senegal": "SEN", "Nigeria": "NGA",
  "Egypt": "EGY", "Ghana": "GHA", "Cameroon": "CMR",
  "Ivory Coast": "CIV", "Cote d'Ivoire": "CIV", "Côte d'Ivoire": "CIV",
  "South Africa": "RSA", "Tunisia": "TUN", "Algeria": "ALG",
  "Mali": "MLI", "Guinea": "GUI", "Cabo Verde": "CPV", "Cape Verde": "CPV",
  "Mozambique": "MOZ", "Tanzania": "TAN", "Comoros": "COM",
  "Benin": "BEN", "Zambia": "ZAM", "DR Congo": "COD", "Congo DR": "COD",
  "Democratic Republic of Congo": "COD", "Congo": "COG",
  // Asia
  "Japan": "JPN", "Korea Republic": "KOR", "South Korea": "KOR",
  "Saudi Arabia": "KSA", "Iran": "IRN", "IR Iran": "IRN",
  "Australia": "AUS", "Uzbekistan": "UZB", "Jordan": "JOR",
  "Iraq": "IRQ", "Qatar": "QAT", "UAE": "UAE",
  "United Arab Emirates": "UAE", "Oman": "OMA",
  "Indonesia": "IDN", "Thailand": "THA", "Vietnam": "VIE",
  "China": "CHN", "China PR": "CHN",
  "New Zealand": "NZL",
  // Caribbean / Other
  "Curacao": "CUW", "Curaçao": "CUW",
  "Suriname": "SUR",
  // Misc API-Football variations
  "Scotland": "SCO", "Haiti": "HAI", "New Zealand": "NZL",
}

const LOCKED_STATUSES = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'FT', 'AET', 'PEN', 'LIVE', 'INT', 'ABD', 'AWD', 'WO']
const LIVE_STATUSES   = ['1H', 'HT', '2H', 'ET', 'P', 'BT', 'LIVE', 'INT']
const EVENTS_STATUSES = [...LIVE_STATUSES, 'FT', 'AET', 'PEN'] // fetch events for live + just-finished

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-sync-secret, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }


  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )
  const API_KEY = Deno.env.get('API_FOOTBALL_KEY')!
  const today   = new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC

  // Guard: skip API call when outside an active match window
  // Covers: live matches, HT/BT breaks, NS within [-60min,+45min] for late starts,
  // and recently finished matches (kickoff within last 3.5h for AET/PEN lag).
  const now = new Date()
  const nsStart = new Date(now.getTime() -  60 * 60 * 1000).toISOString() // 60 min ago
  const nsEnd   = new Date(now.getTime() +  45 * 60 * 1000).toISOString() // 45 min ahead
  const ftStart   = new Date(now.getTime() - 210 * 60 * 1000).toISOString() // 3.5h ago
  const liveStart = new Date(now.getTime() -  36 * 60 * 60 * 1000).toISOString() // 36h ago — catches cross-day stale matches

  const { data: windowCheck, error: wcError } = await supabase
    .from('matches')
    .select('id')
    .or(
      `and(status.in.(1H,HT,2H,ET,P,BT,LIVE,INT),date.gte.${liveStart}),` +
      `and(status.in.(FT,AET,PEN),date.gte.${ftStart}),` +
      `and(status.in.(NS,UPCOMING),date.gte.${nsStart},date.lte.${nsEnd}),` +
      `and(status.in.(NS,UPCOMING),date.gte.${liveStart},date.lt.${now.toISOString()})`
    )
    .limit(1)

  if (wcError) {
    console.error(`[${today}] windowCheck failed:`, wcError.message)
    return new Response(JSON.stringify({ error: 'window_check_failed', detail: wcError.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }

  if (!windowCheck?.length) {
    console.log(`[${today}] Skipped — no active match window`)
    return new Response(JSON.stringify({ skipped: true, reason: 'no active match window' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }

  // Pre-fetch all DB matches so we can detect stale live-status matches from previous days
  const { data: dbMatches, error: dbError } = await supabase.from('matches').select('id, api_id, home_team_id, away_team_id, date, status')
  if (dbError) {
    console.error(`[${today}] dbMatches fetch failed:`, dbError.message)
    return new Response(JSON.stringify({ error: 'db_fetch_failed', detail: dbError.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }
  const linkedByApiId = new Map((dbMatches ?? []).filter((m: any) => m.api_id).map((m: any) => [m.api_id, m]))
  const unlinked      = (dbMatches ?? []).filter((m: any) => !m.api_id)

  // Collect all dates to fetch: today + any previous days with stale live statuses
  const datesToFetch = new Set<string>([today])
  for (const m of (dbMatches ?? [])) {
    const ms = (m as any).status
    const mdate = (m as any).date?.slice(0, 10)
    // Stale live/NS/UPCOMING match from a previous UTC date
    if (([...LIVE_STATUSES, 'NS', 'UPCOMING'].includes(ms)) && mdate < today) {
      datesToFetch.add(mdate)
    }
    // UPCOMING/NS whose scheduled time has passed — API may index under local venue date
    // (e.g. 18:00 Los Angeles = 01:00 UTC next day, so API stores it under the earlier date)
    if (['NS', 'UPCOMING'].includes(ms)) {
      const matchTime = new Date((m as any).date)
      if (!isNaN(matchTime.getTime()) && matchTime < now) {
        const prevDate = new Date(matchTime.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        if (prevDate !== mdate) datesToFetch.add(prevDate)
      }
    }
  }
  if (datesToFetch.size > 1) {
    console.log(`[${today}] Stale live matches detected — also fetching: ${[...datesToFetch].filter(d => d !== today).join(', ')}`)
  }

  // Fetch fixtures for all needed dates (usually just today; adds a date only when a match
  // got stuck in a live status overnight and needs catching up)
  const allFixtures: any[] = []
  for (const date of datesToFetch) {
    const res  = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${date}&league=1&season=2026`,
      { headers: { 'x-apisports-key': API_KEY } }
    )
    if (!res.ok) {
      console.error(`  API HTTP error ${res.status} for date ${date}`)
      continue
    }
    const data = await res.json()
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error(`  API returned errors for ${date}:`, JSON.stringify(data.errors))
      continue
    }
    if (data.response?.length) allFixtures.push(...data.response)
  }

  if (!allFixtures.length) {
    console.log(`[${today}] No fixtures returned from API`)
    return new Response(JSON.stringify({ ok: true, updated: 0, reason: 'no api response' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    })
  }

  console.log(`[${today}] Fetched ${allFixtures.length} fixtures — ${linkedByApiId.size} linked, ${unlinked.length} unlinked in DB`)

  // Log any live/in-progress matches so we can see what the API is returning
  allFixtures
    .filter((i: any) => ['1H','HT','2H','ET','P','BT','LIVE'].includes(i.fixture?.status?.short))
    .forEach((i: any) => console.log(`  LIVE: ${i.teams.home.name} ${i.goals.home ?? '-'}:${i.goals.away ?? '-'} ${i.teams.away.name} [${i.fixture.status.short} ${i.fixture.status.elapsed ?? '?'}']`))

  let updated = 0
  let errors  = 0
  const eventsQueue: Array<{ apiId: string; matchId: string }> = []

  for (const item of allFixtures) {
    const { fixture, goals, teams } = item
    const apiId    = fixture.id.toString()
    const status   = fixture.status.short
    const isLocked    = LOCKED_STATUSES.includes(status)
    const minute      = fixture.status.elapsed ?? null

    const homeId = TEAM_NAME_TO_ID[teams.home.name]
    const awayId = TEAM_NAME_TO_ID[teams.away.name]

    const payload: Record<string, unknown> = {
      status,
      home_score:   goals.home ?? null,
      away_score:   goals.away ?? null,
      is_locked:    isLocked,
      minute,
      ...(fixture.date && { date: fixture.date }),
    }

    if (homeId) payload.home_team_id = homeId
    if (awayId) payload.away_team_id = awayId

    // Penalty: force a 1-goal gap so scoring engine can determine winner
    if (status === 'PEN') {
      if (teams.home.winner === true) {
        payload.home_score = (goals.away ?? 0) + 1
        payload.away_score = goals.away ?? 0
      } else if (teams.away.winner === true) {
        payload.home_score = goals.home ?? 0
        payload.away_score = (goals.home ?? 0) + 1
      } else {
        const ph = item.score?.penalty?.home, pa = item.score?.penalty?.away
        if (ph != null && pa != null && ph !== pa) {
          const base = goals.away ?? 0
          payload.home_score = ph > pa ? base + 1 : base
          payload.away_score = ph > pa ? base      : base + 1
        }
      }
    }

    let matchId: string | null = null

    if (linkedByApiId.has(apiId)) {
      const { error } = await supabase.from('matches').update(payload).eq('api_id', apiId)
      if (!error) {
        matchId = (linkedByApiId.get(apiId) as any).id
        updated++
      } else {
        console.error(`  ✗ ${teams.home.name} vs ${teams.away.name} [${status}]: ${error.message}`)
        errors++
      }
    } else if (homeId && awayId) {
      const apiDate = fixture.date?.slice(0, 10)
      const match   = unlinked.find((m: any) =>
        m.home_team_id?.toUpperCase() === homeId &&
        m.away_team_id?.toUpperCase() === awayId &&
        m.date?.slice(0, 10) === apiDate
      )
      if (match) {
        const { error } = await supabase.from('matches').update({ ...payload, api_id: apiId }).eq('id', (match as any).id)
        if (!error) {
          matchId = (match as any).id
          linkedByApiId.set(apiId, match)
          updated++
          console.log(`  Auto-linked: ${homeId} vs ${awayId} → api_id=${apiId}`)
        } else {
          console.error(`  ✗ Auto-link ${homeId} vs ${awayId}: ${error.message}`)
          errors++
        }
      }
    }

    if (matchId && EVENTS_STATUSES.includes(status)) {
      eventsQueue.push({ apiId, matchId })
    }
  }

  console.log(`  Matches: updated=${updated}, errors=${errors}`)

  // Fetch goal events for each started match (1 API call per match)
  let eventsUpserted = 0
  for (const { apiId, matchId } of eventsQueue) {
    const eventsRes  = await fetch(
      `https://v3.football.api-sports.io/fixtures/events?fixture=${apiId}`,
      { headers: { 'x-apisports-key': API_KEY } }
    )
    const eventsData = await eventsRes.json()
    if (!eventsData.response?.length) continue

    // For this match, find the fixture item so we can compare numeric API team IDs directly.
    // This is the most reliable method — API team names vary by endpoint, numeric IDs never do.
    const fixtureItem = allFixtures.find((f: any) => String(f.fixture.id) === apiId)
    const dbMatch     = linkedByApiId.get(apiId) as any
    const homeApiId   = fixtureItem?.teams?.home?.id ? String(fixtureItem.teams.home.id) : null
    const awayApiId   = fixtureItem?.teams?.away?.id ? String(fixtureItem.teams.away.id) : null
    const homeCode    = dbMatch?.home_team_id ?? null
    const awayCode    = dbMatch?.away_team_id ?? null

    // Delete stale null-team records so they get re-inserted with correct attribution
    await supabase.from('match_events').delete().eq('match_id', matchId).is('team_id', null)

    for (const event of eventsData.response) {
      const eventApiTeamId = event.team?.id ? String(event.team.id) : null

      // Primary: numeric ID match (reliable across all API endpoints)
      let teamId: string | null = null
      if (eventApiTeamId && homeApiId && eventApiTeamId === homeApiId)      teamId = homeCode
      else if (eventApiTeamId && awayApiId && eventApiTeamId === awayApiId) teamId = awayCode
      else teamId = TEAM_NAME_TO_ID[event.team?.name] ?? null  // fallback: name lookup

      // Stable dedup key: match + team + minute + extra + type + detail
      const normPlayer = (event.player?.name ?? '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[^a-z]/g, '_')
      const apiEventId = `${matchId}_${teamId ?? ''}_${event.time?.elapsed ?? 0}_${event.time?.extra ?? 0}_${event.type}_${(event.detail ?? '').replace(/\s/g, '_')}_${normPlayer}`

      const { error } = await supabase.from('match_events').upsert({
        match_id:     matchId,
        api_event_id: apiEventId,
        minute:       event.time?.elapsed ?? null,
        minute_extra: event.time?.extra   ?? null,
        type:         event.type,
        detail:       event.detail        ?? null,
        team_id:      teamId,
        player:       event.player?.name  ?? null,
        assist:       event.assist?.name  ?? null,
      }, { onConflict: 'match_id,api_event_id', ignoreDuplicates: true })

      if (error) {
        console.error(`  ✗ Event upsert (match ${matchId}, ${event.time?.elapsed}'):`, error.message)
      } else {
        eventsUpserted++
      }
    }
  }

  if (eventsQueue.length) {
    console.log(`  Events: synced ${eventsUpserted} across ${eventsQueue.length} match(es)`)
  }

  // Lineup sync: fetch starting XIs at 55/45/30/15 min before kickoff (±1 min tolerance)
  const LINEUP_OFFSETS = [55, 45, 30, 15]
  const lineupTargets: Array<{ apiId: string; matchId: string }> = []
  for (const m of (dbMatches ?? [])) {
    if (!['NS', 'UPCOMING'].includes((m as any).status) || !(m as any).api_id) continue
    const minsUntil = (new Date((m as any).date).getTime() - now.getTime()) / 60_000
    if (LINEUP_OFFSETS.some(o => Math.abs(minsUntil - o) <= 1)) {
      lineupTargets.push({ apiId: (m as any).api_id, matchId: (m as any).id })
    }
  }

  let lineupsUpserted = 0
  for (const { apiId, matchId } of lineupTargets) {
    const lineupRes = await fetch(
      `https://v3.football.api-sports.io/fixtures/lineups?fixture=${apiId}`,
      { headers: { 'x-apisports-key': API_KEY } }
    )
    if (!lineupRes.ok) {
      console.error(`  Lineups HTTP ${lineupRes.status} for fixture ${apiId}`)
      continue
    }
    const lineupData = await lineupRes.json()
    if (!lineupData.response?.length) {
      console.log(`  Lineups: no data yet for fixture ${apiId}`)
      continue
    }

    const fixtureItem = allFixtures.find((f: any) => String(f.fixture.id) === apiId)
    const dbM = linkedByApiId.get(apiId) as any
    const rows: any[] = []

    for (const teamData of lineupData.response) {
      const apiTeamId = String(teamData.team?.id)
      const isHome = fixtureItem && String(fixtureItem.teams.home.id) === apiTeamId
      const teamId = isHome ? dbM?.home_team_id : dbM?.away_team_id
      if (!teamId) continue
      const formation = teamData.formation ?? null
      const rawColors = teamData.team?.colors?.player
      const kitBg   = rawColors?.primary ? `#${rawColors.primary}` : null
      const kitText  = rawColors?.number  ? `#${rawColors.number}`  : null

      for (const { player: p } of (teamData.startXI ?? [])) {
        rows.push({ match_id: matchId, team_id: teamId, player_name: p.name, player_number: p.number ?? null, position: p.pos ?? null, grid: p.grid ?? null, is_starting: true, formation, kit_bg: kitBg, kit_text: kitText })
      }
      for (const { player: p } of (teamData.substitutes ?? [])) {
        rows.push({ match_id: matchId, team_id: teamId, player_name: p.name, player_number: p.number ?? null, position: p.pos ?? null, grid: null, is_starting: false, formation: null, kit_bg: kitBg, kit_text: kitText })
      }
    }

    if (rows.length) {
      const { error } = await supabase.from('match_lineups').upsert(rows, { onConflict: 'match_id,team_id,player_name', ignoreDuplicates: false })
      if (error) {
        console.error(`  ✗ Lineup upsert fixture ${apiId}:`, error.message)
      } else {
        lineupsUpserted += rows.length
        console.log(`  Lineups: ${rows.length} rows upserted for fixture ${apiId}`)
      }
    }
  }

  return new Response(
    JSON.stringify({ ok: true, updated, errors, liveMatches: eventsQueue.length, eventsUpserted, lineupsUpserted }),
    { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  )
})
