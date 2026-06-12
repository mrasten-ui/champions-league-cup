import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const TEAM_NAME_TO_ID: Record<string, string> = {
  "Mexico": "MEX", "South Africa": "RSA", "Korea Republic": "KOR",
  "South Korea": "KOR", "Czech Republic": "CZE", "Czechia": "CZE",
  "Canada": "CAN", "Bosnia and Herzegovina": "BIH", "Bosnia": "BIH",
  "Qatar": "QAT", "Switzerland": "SUI",
  "Brazil": "BRA", "Morocco": "MAR", "Haiti": "HAI", "Scotland": "SCO",
  "United States": "USA", "USA": "USA", "Paraguay": "PAR",
  "Australia": "AUS", "Turkey": "TUR", "Türkiye": "TUR",
  "Germany": "GER", "Curacao": "CUW", "Curaçao": "CUW",
  "Ivory Coast": "CIV", "Cote d'Ivoire": "CIV", "Ecuador": "ECU",
  "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
  "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "IR Iran": "IRN",
  "New Zealand": "NZL",
  "Spain": "ESP", "Cabo Verde": "CPV", "Cape Verde": "CPV",
  "Saudi Arabia": "KSA", "Uruguay": "URU",
  "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
  "Argentina": "ARG", "Algeria": "ALG", "Austria": "AUT", "Jordan": "JOR",
  "Portugal": "POR", "DR Congo": "COD", "Congo DR": "COD",
  "Uzbekistan": "UZB", "Colombia": "COL",
  "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
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

  // Guard: skip API call entirely on days with no matches (saves quota)
  const { data: todayCheck } = await supabase
    .from('matches')
    .select('id')
    .gte('date', `${today}T00:00:00Z`)
    .lte('date', `${today}T23:59:59Z`)

  if (!todayCheck?.length) {
    return new Response(JSON.stringify({ skipped: true, reason: 'no matches today' }), {
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
      minute_extra: minuteExtra,
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

    for (const event of eventsData.response) {
      const teamId     = TEAM_NAME_TO_ID[event.team?.name] ?? null
      // Stable dedup key: match + team + minute + extra + type + detail (no player name — API returns same event with different name formats)
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
