import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { INITIAL_MATCHES, MOCK_PREDICTIONS, TEAMS, MAX_SUBSTITUTIONS } from '../constants';
import { Match, Team, Prediction, UserProfile, MatchEvent, MatchLineup, MatchStats, PlayerMatchStat } from '../types';
import { fetchAllTeamRanks } from '../services/engine';
import { fetchAllTeamTactics } from '../services/analyst';

// ── localStorage cache — cuts repeated Supabase egress on page refresh/re-mount ──
// RC_VERSION is baked into the storage key: bump it whenever seed data changes
// underneath the app (team/match reseeds, schema changes) so every client
// picks up fresh data on next load instead of serving stale cached rows for
// up to an hour. Old-versioned keys are simply orphaned, not read.
const RC_VERSION = 2;
const RC_TTL = {
  predictions: 3 * 60 * 1000,
  profiles:    5 * 60 * 1000,
  lineups:    10 * 60 * 1000,
  events:      2 * 60 * 1000,
  stats:       2 * 60 * 1000,
  teams:      60 * 60 * 1000,
  avatars:    24 * 60 * 60 * 1000,
  playerStats: 60 * 60 * 1000,
} as const;

const rcGet = <T>(key: keyof typeof RC_TTL): T | null => {
  try {
    const raw = localStorage.getItem(`RC_v${RC_VERSION}_${key}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: T; ts: number };
    return Date.now() - ts < RC_TTL[key] ? data : null;
  } catch { return null; }
};

const rcSet = (key: keyof typeof RC_TTL, data: unknown): void => {
  try { localStorage.setItem(`RC_v${RC_VERSION}_${key}`, JSON.stringify({ data, ts: Date.now() })); }
  catch { /* ignore localStorage quota */ }
};

export const bustPredictionsCache = (): void => {
  try { localStorage.removeItem(`RC_v${RC_VERSION}_predictions`); } catch { /* ignore */ }
};

// ── DEV-ONLY LOGIN BYPASS ──────────────────────────────────────────────────
// Set VITE_DEV_SKIP_LOGIN=true in .env to skip LoginScreen during local
// testing. LoginScreen itself is untouched — flip this back to false (or
// delete the line) to restore normal auth. This is a client-side mock user
// with NO real Supabase auth session, so writes that depend on RLS matching
// auth.uid() (predictions, profile updates, etc.) may be rejected — this is
// for browsing/UI testing, not for testing persistence. Say the word if you
// want a real auto-login (against an actual test account) instead.
const DEV_SKIP_LOGIN = (import.meta as any).env?.VITE_DEV_SKIP_LOGIN === 'true';
const DEV_MOCK_USER: UserProfile = {
  email: 'dev@local.test',
  name: 'Dev Tester',
  avatar: '',
  tokens: 5,
  substitutions: 5,
  leagues: [],
  favorites: [],
  spiedMatches: [],
  unlockedMatches: [],
  hasTakenSecondChance: false,
  secondChanceStatus: 'NONE',
};

export const useAppData = () => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [teamsData, setTeamsData] = useState<Record<string, Team>>({});
  const [allPredictions, setAllPredictions] = useState<Prediction[]>(MOCK_PREDICTIONS);
  const [usersDb, setUsersDb] = useState<Record<string, UserProfile>>({});
  
  const [menPresets, setMenPresets] = useState<string[]>([]);
  const [womenPresets, setWomenPresets] = useState<string[]>([]);
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([]);
  const [matchLineups, setMatchLineups] = useState<MatchLineup[]>([]);
  const [matchStats, setMatchStats] = useState<MatchStats[]>([]);
  const [playerMatchStats, setPlayerMatchStats] = useState<PlayerMatchStat[]>([]);

  const fetchingProfileRef = useRef(false);

  // --- SECOND CHANCE TIMERS ---
  const [groupStageEndTime, setGroupStageEndTime] = useState<number>(0);
  const [knockoutStartTime, setKnockoutStartTime] = useState<number>(0);
  const [firstMatchTime, setFirstMatchTime] = useState<number>(0);
  const [lockTimePassed, setLockTimePassed] = useState<boolean>(false);
  const kickoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPresetAvatars = async () => {
    if (!supabase) return;
    const getSafeUrl = (path: string) => supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    const cached = rcGet<{ men: string[]; women: string[] }>('avatars');
    if (cached) { setMenPresets(cached.men); setWomenPresets(cached.women); return; }
    try {
        const { data: menData } = await supabase.storage.from('avatars').list('men');
        const men = menData ? menData.filter(f => !f.name.startsWith('.')).map(f => getSafeUrl(`men/${f.name}`)) : [];
        if (men.length) setMenPresets(men);

        const { data: womenData } = await supabase.storage.from('avatars').list('women');
        const women = womenData ? womenData.filter(f => !f.name.startsWith('.')).map(f => getSafeUrl(`women/${f.name}`)) : [];
        if (women.length) setWomenPresets(women);

        if (men.length || women.length) rcSet('avatars', { men, women });
    } catch (e) { console.error("Avatar fetch error", e); }
  };

  const loadGameData = async () => {
      if (!isSupabaseConfigured || !supabase) return;
      try {
          const { data: dbMatches } = await supabase.from('matches').select('*').order('id', { ascending: true });

          if (dbMatches && dbMatches.length > 0) {
            let mappedMatches: Match[] = dbMatches.map(m => ({
              id: m.id, date: m.date || 'TBD', venue: m.venue || 'TBD',
              homeTeamId: m.home_team_id ? m.home_team_id.toUpperCase() : 'TBD',
              awayTeamId: m.away_team_id ? m.away_team_id.toUpperCase() : 'TBD',
              homeScore: m.home_score, awayScore: m.away_score, status: (m.status as any) || 'UPCOMING',
              isLocked: !!m.is_locked, groupId: m.group_id || undefined, round: (m.round as any) || undefined,
              matchday: m.matchday ?? undefined,
              channels: m.channels as any, nextMatchId: m.next_match_id || undefined,
              minute: m.minute ?? undefined, minuteExtra: m.minute_extra ?? undefined
            }));

            // --- CALCULATE TIMERS ---
            const validMatches = mappedMatches.filter(m => m.date && m.date !== 'TBD');
            
            const groupMatches = validMatches.filter(m => m.groupId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (groupMatches.length > 0) {
                setGroupStageEndTime(new Date(groupMatches[0].date).getTime() + (120 * 60 * 1000));
            }

            const koMatches = validMatches.filter(m => m.round === 'R32').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            if (koMatches.length > 0) {
                const deadlineMatch = koMatches.length > 1 ? koMatches[1] : koMatches[0];
                setKnockoutStartTime(new Date(deadlineMatch.date).getTime());
            }

            // First group match kickoff — drives automatic PRE_LIVE→LIVE transition.
            // The lock time equals kickoff exactly, so the phase flips at the moment
            // the first match starts.
            const firstGroupMatch = [...validMatches]
                .filter(m => m.groupId)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
            if (firstGroupMatch) {
                const t0 = new Date(firstGroupMatch.date).getTime();
                const lockTime = t0;
                setFirstMatchTime(t0);
                setLockTimePassed(Date.now() >= lockTime);
                if (Date.now() < lockTime) {
                    if (kickoffTimerRef.current) clearTimeout(kickoffTimerRef.current);
                    const delay = Math.min(lockTime - Date.now(), 2_147_483_647);
                    // Only flips the tournamentPhase signal (lockTimePassed) once the first match
                    // kicks off — does NOT mass-lock every match. Per-match locking is a rolling
                    // 1-hour-before-kickoff window now (see utils/date.ts's isMatchLocked), computed
                    // live wherever a match is rendered, not baked into stored state here. Mass-locking
                    // every match the moment the first one starts would defeat that entirely.
                    kickoffTimerRef.current = setTimeout(() => {
                        setLockTimePassed(true);
                    }, delay);
                }
            }

            setMatches(mappedMatches);
          }

          const fetchPredictions = async () => {
            const cachedPreds = rcGet<Prediction[]>('predictions');
            if (cachedPreds) { setAllPredictions(cachedPreds); return; }
            const PAGE = 1000;
            let allPredRows: any[] = [];
            let from = 0;
            let keepGoing = true;
            while (keepGoing) {
              const { data: page, error: pageErr } = await supabase.from('predictions').select('*').range(from, from + PAGE - 1);
              if (pageErr) { console.error('Predictions fetch error (page', from, '):', pageErr); break; }
              if (page && page.length > 0) { allPredRows.push(...page); keepGoing = page.length === PAGE; from += PAGE; }
              else { keepGoing = false; }
            }
            const mappedPreds = allPredRows.map(p => ({ userId: p.user_id || '', matchId: p.match_id || '', home: p.home ?? 0, away: p.away ?? 0, predictedWinnerId: p.predicted_winner_id ?? undefined }));
            rcSet('predictions', mappedPreds);
            setAllPredictions(mappedPreds);
          };

          const fetchEvents = async () => {
            const cachedEvents = rcGet<MatchEvent[]>('events');
            if (cachedEvents) { setMatchEvents(cachedEvents); return; }
            const PAGE = 1000;
            let allEventRows: any[] = [];
            let from = 0;
            let keepGoing = true;
            while (keepGoing) {
              const { data: page, error: pageErr } = await supabase.from('match_events').select('*').order('minute', { ascending: true }).range(from, from + PAGE - 1);
              if (pageErr) { console.error('Events fetch error (page', from, '):', pageErr); break; }
              if (page && page.length > 0) { allEventRows.push(...page); keepGoing = page.length === PAGE; from += PAGE; }
              else { keepGoing = false; }
            }
            if (allEventRows.length > 0) {
              const mappedEvents: MatchEvent[] = allEventRows.map(e => ({
                id: e.id, matchId: String(e.match_id || ''), minute: e.minute ?? 0, minuteExtra: e.minute_extra ?? undefined,
                type: e.type || '', detail: e.detail ?? undefined, teamId: e.team_id ?? undefined,
                player: e.player ?? undefined, playerId: e.player_id ?? null, assist: e.assist ?? undefined,
                createdAt: e.created_at ?? undefined,
              }));
              rcSet('events', mappedEvents);
              setMatchEvents(mappedEvents);
            }
          };

          const fetchLineups = async () => {
            const cachedLineups = rcGet<MatchLineup[]>('lineups');
            if (cachedLineups) { setMatchLineups(cachedLineups); return; }
            const PAGE = 1000;
            let allLineupRows: any[] = [];
            let from = 0;
            let keepGoing = true;
            while (keepGoing) {
              const { data: page, error: pageErr } = await supabase.from('match_lineups').select('*').range(from, from + PAGE - 1);
              if (pageErr) { console.error('Lineups fetch error (page', from, '):', pageErr); break; }
              if (page && page.length > 0) { allLineupRows.push(...page); keepGoing = page.length === PAGE; from += PAGE; }
              else { keepGoing = false; }
            }
            const mappedLineups: MatchLineup[] = allLineupRows.map((l: any) => ({
              id: l.id, matchId: l.match_id, teamId: l.team_id,
              playerName: l.player_name, playerId: l.player_id ?? null,
              playerNumber: l.player_number ?? null,
              position: l.position ?? null, grid: l.grid ?? null,
              isStarting: l.is_starting, formation: l.formation ?? null,
              kitBg: l.kit_bg ?? null, kitText: l.kit_text ?? null,
            }));
            rcSet('lineups', mappedLineups);
            setMatchLineups(mappedLineups);
          };

          const fetchStats = async () => {
            const cachedStats = rcGet<MatchStats[]>('stats');
            if (cachedStats) { setMatchStats(cachedStats); return; }
            const { data: stats } = await supabase.from('match_stats').select('*').limit(10000);
            if (stats) {
              const mappedStats: MatchStats[] = stats.map((s: any) => ({
                matchId: String(s.match_id),
                homeXg: s.home_xg ?? null, awayXg: s.away_xg ?? null,
                homeShots: s.home_shots ?? null, awayShots: s.away_shots ?? null,
                homeShotsOnTarget: s.home_shots_on_target ?? null, awayShotsOnTarget: s.away_shots_on_target ?? null,
                homePossession: s.home_possession ?? null, awayPossession: s.away_possession ?? null,
                homeCorners: s.home_corners ?? null, awayCorners: s.away_corners ?? null,
                homeFouls: s.home_fouls ?? null, awayFouls: s.away_fouls ?? null,
                homeYellow: s.home_yellow ?? null, awayYellow: s.away_yellow ?? null,
                homeRed: s.home_red ?? null, awayRed: s.away_red ?? null,
                homeOffsides: s.home_offsides ?? null, awayOffsides: s.away_offsides ?? null,
              }));
              rcSet('stats', mappedStats);
              setMatchStats(mappedStats);
            }
          };

          const fetchPlayerStats = async () => {
            const cachedPlayerStats = rcGet<PlayerMatchStat[]>('playerStats');
            if (cachedPlayerStats) { setPlayerMatchStats(cachedPlayerStats); return; }
            const PAGE = 1000;
            let allPsRows: any[] = [];
            let from = 0;
            let keepGoing = true;
            while (keepGoing) {
              const { data: page, error: pageErr } = await supabase.from('player_match_stats').select('*').range(from, from + PAGE - 1);
              if (pageErr) { console.error('Player stats fetch error:', pageErr); break; }
              if (page && page.length > 0) { allPsRows.push(...page); keepGoing = page.length === PAGE; from += PAGE; }
              else { keepGoing = false; }
            }
            if (allPsRows.length) {
              const mapped: PlayerMatchStat[] = allPsRows.map(r => ({
                matchId: String(r.match_id),
                playerId: r.player_id,
                playerName: r.player_name ?? null,
                teamId: r.team_id ?? null,
                minutes: r.minutes ?? null,
                rating: r.rating != null ? parseFloat(r.rating) : null,
                goals: r.goals ?? 0,
                assists: r.assists ?? 0,
                shotsTotal: r.shots_total ?? null,
                shotsOn: r.shots_on ?? null,
                passesTotal: r.passes_total ?? null,
                passesKey: r.passes_key ?? null,
                passAccuracy: r.pass_accuracy ?? null,
                tackles: r.tackles ?? null,
                dribblesSuccess: r.dribbles_success ?? null,
                dribblesAttempts: r.dribbles_attempts ?? null,
                foulsCommitted: r.fouls_committed ?? null,
                foulsDrawn: r.fouls_drawn ?? null,
                yellowCards: r.yellow_cards ?? 0,
                redCards: r.red_cards ?? 0,
              }));
              rcSet('playerStats', mapped);
              setPlayerMatchStats(mapped);
            }
          };

          await Promise.all([fetchPredictions(), fetchEvents(), fetchLineups(), fetchStats(), fetchPlayerStats()]);

          {
            const cachedProfiles = rcGet<Record<string, UserProfile>>('profiles');
            if (cachedProfiles) {
              setUsersDb(cachedProfiles);
            } else {
              const { data: profiles } = await supabase.from('profiles').select('*');
              if (profiles) {
                  const pMap: Record<string, UserProfile> = {};
                  profiles.forEach(p => {
                      pMap[p.email] = {
                          name: p.name || '', email: p.email, tokens: p.tokens ?? 0, substitutions: p.substitutions ?? 0,
                          avatar: p.avatar || '', hasTakenSecondChance: !!p.has_taken_second_chance, secondChanceStatus: (p.second_chance_status as any) || 'NONE',
                          leagues: p.leagues || [], favorites: p.favorites || [], spiedMatches: p.spied_matches || [], unlockedMatches: p.unlocked_matches || [],
                          bracketPredictions: (p as any).bracket_predictions ?? undefined,
                          scDraft: (p as any).sc_draft ?? undefined,
                      };
                  });
                  rcSet('profiles', pMap);
                  setUsersDb(pMap);
              }
            }
          }

          {
            const cachedTeams = rcGet<Record<string, Team>>('teams');
            if (cachedTeams) {
              setTeamsData(cachedTeams);
            } else {
              const [teamsResponse, rankMap, tacticsMap, scoutingData] = await Promise.all([
                  supabase.from('teams').select('*'),
                  fetchAllTeamRanks(), fetchAllTeamTactics(),
                  supabase.from('scouting_overview').select('team_id, recent_form')
              ]);

              const baseTeamsMap: Record<string, Team> = { 'TBD': { id: 'TBD', name: 'TBD', flag: '', rank: 99, rating: 50, att: 50, mid: 50, def: 50, overview: '', starPlayer: '', form: [] } };

              if (teamsResponse.data) {
                  teamsResponse.data.forEach(t => {
                      const safeId = t.id.toUpperCase();
                      const existingTeam = baseTeamsMap[safeId];

                      // BULLETPROOF FLAG FIX: Prevents empty ghost rows from overwriting valid flags
                      if (!existingTeam || !existingTeam.flag || t.flag) {
                          baseTeamsMap[safeId] = {
                              id: safeId,
                              name: t.name || safeId,
                              flag: TEAMS[safeId]?.flag || t.flag || '',
                              rank: (t.rank && t.rank !== 50) ? t.rank : (TEAMS[safeId]?.rank ?? 50),
                              rating: t.rating || TEAMS[safeId]?.rating || 50,
                              att: t.att || TEAMS[safeId]?.att || 50,
                              mid: t.mid || TEAMS[safeId]?.mid || 50,
                              def: t.def || TEAMS[safeId]?.def || 50,
                              overview: t.overview || '',
                              starPlayer: 'TBD',
                              strengths: '',
                              weaknesses: '',
                              form: [],
                              eloRating: t.elo_rating || undefined,
                          };
                      }
                  });
              }

              const next = { ...baseTeamsMap };
              const formMap: Record<string, string[]> = {};
              if (scoutingData.data) {
                  scoutingData.data.forEach(row => { if (row.recent_form && row.team_id) formMap[row.team_id.toUpperCase()] = row.recent_form.replace(/[^WDL-]/g, '').split('-').filter((c: string) => c); });
              }
              Object.keys(next).forEach(tid => {
                  if (next[tid] && tid !== 'TBD') {
                      const updates: Partial<typeof next[string]> = {};
                      if (rankMap[tid] != null) updates.rank = rankMap[tid];
                      if (tacticsMap[tid]) { const tc = tacticsMap[tid]; updates.att = tc.att; updates.mid = tc.mid; updates.def = tc.def; updates.rating = Math.round((tc.att + tc.mid + tc.def) / 3); }
                      if (formMap[tid]) updates.form = formMap[tid];
                      if (Object.keys(updates).length > 0) next[tid] = { ...next[tid], ...updates };
                  }
              });
              rcSet('teams', next);
              setTeamsData(next);
            }
          }

      } catch (e) { console.error("Data Load Error", e); }
  };

  const fetchUserProfile = async (email: string) => {
      if (fetchingProfileRef.current) return;
      fetchingProfileRef.current = true;
      if (!isSupabaseConfigured || !supabase) { fetchingProfileRef.current = false; return; }
      try {
          const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
          if (data) {
              setUser({
                  name: data.name || '', email: data.email, tokens: data.tokens ?? 0, substitutions: data.substitutions ?? 0,
                  unlockedMatches: data.unlocked_matches || [], hasTakenSecondChance: !!data.has_taken_second_chance, secondChanceStatus: (data.second_chance_status as any) || 'NONE',
                  spiedMatches: data.spied_matches || [], favorites: data.favorites || [], avatar: data.avatar || '', leagues: data.leagues || [],
                  toursCompleted: data.tours_completed || { preSeason: false, liveSeason: false },
                  isAdmin: !!data.is_admin,
                  bracketPredictions: (data as any).bracket_predictions ?? undefined,
                  scDraft: (data as any).sc_draft ?? undefined,
                  riskResult: data.risk_result ?? undefined,
                  riskScoring: data.risk_scoring ?? undefined,
              });
              // Carry through AI-generated avatar from signup if the profile was pre-created before this session
              const pendingAvatar = sessionStorage.getItem('pending_avatar');
              if (pendingAvatar) {
                  sessionStorage.removeItem('pending_avatar');
                  supabase.from('profiles').update({ avatar: pendingAvatar }).eq('email', email)
                      .then(() => setUser(prev => prev ? { ...prev, avatar: pendingAvatar } : null));
              }
          } else {
              const { data: { user: authUser } } = await supabase.auth.getUser();
              if (authUser) {
                  const pendingAvatar = sessionStorage.getItem('pending_avatar') || '';
                  sessionStorage.removeItem('pending_avatar');
                  // Risk profile set during the signup flow's second step (LoginScreen.tsx) —
                  // defaults to balanced (0.5/0.5) for any path that skips it (e.g. pre-feature
                  // sign-ins that somehow hit this branch).
                  const pendingRiskResult = parseFloat(sessionStorage.getItem('pending_risk_result') ?? '0.5');
                  const pendingRiskScoring = parseFloat(sessionStorage.getItem('pending_risk_scoring') ?? '0.5');
                  sessionStorage.removeItem('pending_risk_result');
                  sessionStorage.removeItem('pending_risk_scoring');
                  // Clear stale localStorage tour flags so the tour always fires for a fresh profile
                  localStorage.removeItem(`rasten_cup_tour_done_v1_${email}`);
                  localStorage.removeItem(`rasten_cup_tour_done_v1_${email}_live`);
                  const dbRow = { id: authUser.id, email, name: authUser.user_metadata?.full_name || email.split('@')[0], avatar: pendingAvatar, tokens: MAX_SUBSTITUTIONS, substitutions: MAX_SUBSTITUTIONS, second_chance_status: 'NONE', risk_result: pendingRiskResult, risk_scoring: pendingRiskScoring };
                  await supabase.from('profiles').upsert(dbRow);
                  setUser({
                      email,
                      name: dbRow.name,
                      avatar: pendingAvatar,
                      tokens: MAX_SUBSTITUTIONS,
                      substitutions: MAX_SUBSTITUTIONS,
                      leagues: [],
                      favorites: [],
                      spiedMatches: [],
                      unlockedMatches: [],
                      hasTakenSecondChance: false,
                      secondChanceStatus: 'NONE',
                      riskResult: pendingRiskResult,
                      riskScoring: pendingRiskScoring,
                  });
              }
          }
      } catch (err) { console.error("Profile Error", err); }
      finally { fetchingProfileRef.current = false; setLoading(false); loadGameData(); }
  };

  useEffect(() => {
      if (DEV_SKIP_LOGIN) {
          setSession({ user: { email: DEV_MOCK_USER.email } });
          setUser(DEV_MOCK_USER);
          setLoading(false);
          if (isSupabaseConfigured && supabase) { fetchPresetAvatars(); loadGameData(); }
          return;
      }
      if (isSupabaseConfigured && supabase) {
          fetchPresetAvatars();
          supabase.auth.getSession().then(({ data: { session } }) => {
              setSession(session);
              if (session?.user?.email) fetchUserProfile(session.user.email);
              else { setLoading(false); loadGameData(); }
          });
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
              setSession(session);
              if (session?.user?.email) fetchUserProfile(session.user.email);
              else { setUser(null); setLoading(false); loadGameData(); }
          });

          // ── Realtime: push score/status/minute updates to all connected clients ──
          const channel = supabase
              .channel('live-scores')
              .on(
                  'postgres_changes',
                  { event: 'UPDATE', schema: 'public', table: 'matches' },
                  (payload) => {
                      const m = payload.new as any;
                      setMatches(prev => prev.map(existing =>
                          existing.id === m.id
                              ? {
                                  ...existing,
                                  homeScore:   m.home_score,
                                  awayScore:   m.away_score,
                                  status:      m.status || existing.status,
                                  isLocked:    !!m.is_locked,
                                  homeTeamId:  m.home_team_id?.toUpperCase() || existing.homeTeamId,
                                  awayTeamId:  m.away_team_id?.toUpperCase() || existing.awayTeamId,
                                  minute:      m.minute ?? existing.minute,
                                  minuteExtra: m.minute_extra ?? existing.minuteExtra,
                              }
                              : existing
                      ));
                  }
              )
              .on(
                  'postgres_changes',
                  { event: 'INSERT', schema: 'public', table: 'match_events' },
                  (payload) => {
                      const e = payload.new as any;
                      const event: MatchEvent = {
                          id: e.id, matchId: e.match_id || '', minute: e.minute ?? 0,
                          minuteExtra: e.minute_extra ?? undefined, type: e.type || '',
                          detail: e.detail ?? undefined, teamId: e.team_id ?? undefined,
                          player: e.player ?? undefined, playerId: e.player_id ?? null,
                          assist: e.assist ?? undefined, createdAt: e.created_at ?? undefined,
                      };
                      setMatchEvents(prev => prev.some(ev => ev.id === event.id) ? prev : [...prev, event]);
                  }
              )
              .on(
                  'postgres_changes',
                  { event: 'INSERT', schema: 'public', table: 'match_lineups' },
                  (payload: any) => {
                      const l = payload.new as any;
                      const lineup: MatchLineup = {
                          id: l.id, matchId: l.match_id, teamId: l.team_id,
                          playerName: l.player_name, playerId: l.player_id ?? null,
                          playerNumber: l.player_number ?? null,
                          position: l.position ?? null, grid: l.grid ?? null,
                          isStarting: l.is_starting, formation: l.formation ?? null,
                          kitBg: l.kit_bg ?? null, kitText: l.kit_text ?? null,
                      };
                      setMatchLineups(prev => prev.some(x => x.id === lineup.id) ? prev : [...prev, lineup]);
                  }
              )
              .on(
                  'postgres_changes',
                  { event: '*', schema: 'public', table: 'match_stats' },
                  (payload: any) => {
                      const s = payload.new as any;
                      const stat: MatchStats = {
                          matchId: String(s.match_id),
                          homeXg: s.home_xg ?? null, awayXg: s.away_xg ?? null,
                          homeShots: s.home_shots ?? null, awayShots: s.away_shots ?? null,
                          homeShotsOnTarget: s.home_shots_on_target ?? null, awayShotsOnTarget: s.away_shots_on_target ?? null,
                          homePossession: s.home_possession ?? null, awayPossession: s.away_possession ?? null,
                          homeCorners: s.home_corners ?? null, awayCorners: s.away_corners ?? null,
                          homeFouls: s.home_fouls ?? null, awayFouls: s.away_fouls ?? null,
                          homeYellow: s.home_yellow ?? null, awayYellow: s.away_yellow ?? null,
                          homeRed: s.home_red ?? null, awayRed: s.away_red ?? null,
                          homeOffsides: s.home_offsides ?? null, awayOffsides: s.away_offsides ?? null,
                      };
                      setMatchStats(prev => {
                          const idx = prev.findIndex(x => x.matchId === stat.matchId);
                          return idx >= 0 ? prev.map((x, i) => i === idx ? stat : x) : [...prev, stat];
                      });
                  }
              )
              .subscribe((status, err) => {
                  if (err) console.error('[Realtime] live-scores channel error:', err);
              });

          return () => {
              subscription.unsubscribe();
              supabase.removeChannel(channel);
              if (kickoffTimerRef.current) clearTimeout(kickoffTimerRef.current);
          };
      } else { setLoading(false); }
  }, []);

  return {
    session, user, setUser, loading, matches, setMatches, teamsData, setTeamsData,
    allPredictions, setAllPredictions, usersDb, setUsersDb, menPresets, womenPresets,
    groupStageEndTime, knockoutStartTime, firstMatchTime, lockTimePassed,
    matchEvents, matchLineups, matchStats, playerMatchStats,
  };
};