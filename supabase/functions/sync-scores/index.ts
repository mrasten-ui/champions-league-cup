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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-sync-secret, content-type' } })
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
  const ftStart = new Date(now.getTime() - 210 * 60 * 1000).toISOString() // 3.5h ago

  const { data: windowCheck } = await supabase
    .from('matches')
    .select('id')
    .or(
      `status.in.(1H,HT,2H,ET,P,BT,LIVE,INT),` +
      `and(status.in.(FT,AET,PEN),date.gte.${ftStart}),` +
      `and(status.eq.NS,date.gte.${nsStart},date.lte.${nsEnd})`
    )
    .limit(1)

  if (!windowCheck?.length) {
    return new Response(JSON.stringify({ skipped: true, reason: 'no active match window' }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Fetch today's fixtures from API-Football (1 API call)
  const fixturesRes = await fetch(
    `https://v3.football.api-sports.io/fixtures?date=${today}&league=1&season=2026`,
    { headers: { 'x-apisports-key': API_KEY } }
  )
  const fixturesData = await fixturesRes.json()

  if (!fixturesData.response?.length) {
    return new Response(JSON.stringify({ ok: true, updated: 0, reason: 'no api response' }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Pre-fetch all DB matches for linking
  const { data: dbMatches } = await supabase.from('matches').select('id, api_id, home_team_id, away_team_id, date')
  const linkedByApiId = new Map((dbMatches ?? []).filter((m: any) => m.api_id).map((m: any) => [m.api_id, m]))
  const unlinked      = (dbMatches ?? []).filter((m: any) => !m.api_id)

  let updated = 0
  const eventsQueue: Array<{ apiId: string; matchId: string }> = []

  for (const item of fixturesData.response) {
    const { fixture, goals, teams } = item
    const apiId    = fixture.id.toString()
    const status   = fixture.status.short
    const isLocked    = LOCKED_STATUSES.includes(status)
    const minute      = fixture.status.elapsed ?? null
    const minuteExtra = fixture.status.extra   ?? null

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
      if (!error) { matchId = (linkedByApiId.get(apiId) as any).id; updated++ }
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
        }
      }
    }

    if (matchId && EVENTS_STATUSES.includes(status)) {
      eventsQueue.push({ apiId, matchId })
    }
  }

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
    const fixtureItem = fixturesData.response.find((f: any) => String(f.fixture.id) === apiId)
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
      const apiEventId = `${matchId}_${teamId ?? ''}_${event.time?.elapsed ?? 0}_${event.time?.extra ?? 0}_${event.type}_${(event.detail ?? '').replace(/\s/g, '_')}`

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

      if (!error) eventsUpserted++
    }
  }

  return new Response(
    JSON.stringify({ ok: true, updated, liveMatches: eventsQueue.length, eventsUpserted }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
