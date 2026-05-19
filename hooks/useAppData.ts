import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { INITIAL_MATCHES, MOCK_PREDICTIONS, TEAMS, MAX_SUBSTITUTIONS } from '../constants';
import { Match, Team, Prediction, UserProfile, MatchEvent } from '../types';
import { fetchAllTeamRanks } from '../services/engine';
import { fetchAllTeamTactics } from '../services/analyst';

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
  // TODO: remove MOCK_EVENTS once real API events are wired up
  // matchId uses HOME_AWAY team-combo so DB numeric IDs don't matter
  const MOCK_EVENTS: MatchEvent[] = [
    // Group A: MEX vs RSA (June 11)
    { id: 9001, matchId: 'MEX_RSA', minute: 17, type: 'Goal', detail: 'Normal Goal', teamId: 'MEX', player: 'H. Lozano' },
    { id: 9002, matchId: 'MEX_RSA', minute: 34, type: 'Card', detail: 'Yellow Card', teamId: 'RSA', player: 'S. Tau' },
    { id: 9003, matchId: 'MEX_RSA', minute: 55, type: 'Goal', detail: 'Normal Goal', teamId: 'MEX', player: 'R. Jiménez' },
    { id: 9004, matchId: 'MEX_RSA', minute: 71, type: 'Goal', detail: 'Penalty', teamId: 'RSA', player: 'P. Zwane' },
    { id: 9005, matchId: 'MEX_RSA', minute: 88, type: 'Card', detail: 'Red Card', teamId: 'RSA', player: 'T. Hlatshwayo' },
    // Group B: CAN vs BIH (June 12)
    { id: 9032, matchId: 'CAN_BIH', minute: 11, type: 'Goal', detail: 'Normal Goal', teamId: 'CAN', player: 'A. Davies' },
    { id: 9033, matchId: 'CAN_BIH', minute: 29, type: 'Card', detail: 'Yellow Card', teamId: 'BIH', player: 'E. Džeko' },
    { id: 9034, matchId: 'CAN_BIH', minute: 45, minuteExtra: 2, type: 'Goal', detail: 'Normal Goal', teamId: 'BIH', player: 'E. Džeko' },
    { id: 9035, matchId: 'CAN_BIH', minute: 58, type: 'Goal', detail: 'Normal Goal', teamId: 'CAN', player: 'J. David' },
    { id: 9036, matchId: 'CAN_BIH', minute: 72, type: 'Card', detail: 'Yellow Card', teamId: 'CAN', player: 'S. Larin' },
    { id: 9037, matchId: 'CAN_BIH', minute: 84, type: 'Card', detail: 'Red Card', teamId: 'BIH', player: 'S. Kolasinac' },
    // Group A: KOR vs CZE (June 12)
    { id: 9006, matchId: 'KOR_CZE', minute: 23, type: 'Goal', detail: 'Normal Goal', teamId: 'KOR', player: 'Son Heung-min' },
    { id: 9007, matchId: 'KOR_CZE', minute: 38, type: 'Card', detail: 'Yellow Card', teamId: 'CZE', player: 'T. Souček' },
    { id: 9008, matchId: 'KOR_CZE', minute: 44, type: 'Goal', detail: 'Normal Goal', teamId: 'CZE', player: 'P. Schick' },
    { id: 9009, matchId: 'KOR_CZE', minute: 67, type: 'Goal', detail: 'Own Goal', teamId: 'CZE', player: 'V. Coufal' },
    { id: 9010, matchId: 'KOR_CZE', minute: 81, type: 'Card', detail: 'Yellow Card', teamId: 'KOR', player: 'H. Hwang' },
    // Group C: SCO vs MAR (June 13)
    { id: 9011, matchId: 'SCO_MAR', minute: 14, type: 'Goal', detail: 'Normal Goal', teamId: 'SCO', player: 'S. McTominay' },
    { id: 9012, matchId: 'SCO_MAR', minute: 41, type: 'Card', detail: 'Yellow Card', teamId: 'SCO', player: 'K. Tierney' },
    { id: 9013, matchId: 'SCO_MAR', minute: 59, type: 'Goal', detail: 'Normal Goal', teamId: 'MAR', player: 'Y. En-Nesyri' },
    { id: 9014, matchId: 'SCO_MAR', minute: 74, type: 'Card', detail: 'Yellow Card', teamId: 'MAR', player: 'S. Amallah' },
    { id: 9015, matchId: 'SCO_MAR', minute: 88, type: 'Goal', detail: 'Normal Goal', teamId: 'MAR', player: 'H. Ziyech' },
    // Group D: USA vs NGA (June 13)
    { id: 9016, matchId: 'USA_NGA', minute: 23, type: 'Goal', detail: 'Normal Goal', teamId: 'USA', player: 'C. Pulisic' },
    { id: 9017, matchId: 'USA_NGA', minute: 38, type: 'Card', detail: 'Yellow Card', teamId: 'USA', player: 'W. McKennie' },
    { id: 9018, matchId: 'USA_NGA', minute: 45, minuteExtra: 1, type: 'Goal', detail: 'Penalty', teamId: 'NGA', player: 'V. Osimhen' },
    { id: 9019, matchId: 'USA_NGA', minute: 67, type: 'Goal', detail: 'Normal Goal', teamId: 'USA', player: 'T. Weah' },
    { id: 9020, matchId: 'USA_NGA', minute: 82, type: 'Card', detail: 'Red Card', teamId: 'NGA', player: 'S. Chukwueze' },
    // Group D: PAR vs AUS (June 13)
    { id: 9021, matchId: 'PAR_AUS', minute: 31, type: 'Goal', detail: 'Normal Goal', teamId: 'PAR', player: 'A. Sanabria' },
    { id: 9022, matchId: 'PAR_AUS', minute: 52, type: 'Card', detail: 'Yellow Card', teamId: 'AUS', player: 'A. Behich' },
    { id: 9023, matchId: 'PAR_AUS', minute: 64, type: 'Goal', detail: 'Normal Goal', teamId: 'PAR', player: 'A. Sanabria' },
    { id: 9024, matchId: 'PAR_AUS', minute: 79, type: 'Goal', detail: 'Normal Goal', teamId: 'AUS', player: 'A. Hrustic' },
    { id: 9025, matchId: 'PAR_AUS', minute: 88, type: 'Card', detail: 'Yellow Card', teamId: 'PAR', player: 'G. Gómez' },
  ];
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>(MOCK_EVENTS);

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
    try {
        const { data: menData } = await supabase.storage.from('avatars').list('men');
        if (menData) setMenPresets(menData.filter(f => !f.name.startsWith('.')).map(f => getSafeUrl(`men/${f.name}`)));
        
        const { data: womenData } = await supabase.storage.from('avatars').list('women');
        if (womenData) setWomenPresets(womenData.filter(f => !f.name.startsWith('.')).map(f => getSafeUrl(`women/${f.name}`)));
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
              channels: m.channels as any, nextMatchId: m.next_match_id || undefined
            }));

            // --- CALCULATE TIMERS ---
            const validMatches = mappedMatches.filter(m => m.date && m.date !== 'TBD');
            
            const groupMatches = validMatches.filter(m => m.groupId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            if (groupMatches.length > 0) {
                setGroupStageEndTime(new Date(groupMatches[0].date).getTime() + (120 * 60 * 1000));
            }

            const koMatches = validMatches.filter(m => m.round === 'R32').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            if (koMatches.length > 0) {
                setKnockoutStartTime(new Date(koMatches[0].date).getTime());
            }

            // First group match kickoff — drives automatic PRE_LIVE→LIVE transition.
            // The lock time (kickoff - 15 min) matches the prediction-lock countdown,
            // so the phase flips at exactly the same moment the countdown reaches zero.
            const firstGroupMatch = [...validMatches]
                .filter(m => m.groupId)
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
            if (firstGroupMatch) {
                const t0 = new Date(firstGroupMatch.date).getTime();
                const lockTime = t0 - 15 * 60 * 1000;
                setFirstMatchTime(t0);
                setLockTimePassed(Date.now() >= lockTime);
                if (Date.now() < lockTime) {
                    if (kickoffTimerRef.current) clearTimeout(kickoffTimerRef.current);
                    const delay = Math.min(lockTime - Date.now(), 2_147_483_647);
                    kickoffTimerRef.current = setTimeout(() => {
                        setLockTimePassed(true);
                        setMatches(prev => prev.map(m => ({ ...m, isLocked: true })));
                    }, delay);
                }
            }

            // --- CORE GLOBAL LOCK CHECK ---
            const sortedByDate = [...validMatches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const firstMatch = sortedByDate[0];
            if (firstMatch) {
                const firstKickoff = new Date(firstMatch.date).getTime();
                const globalLockTime = firstKickoff - (15 * 60 * 1000); 
                
                if (Date.now() >= globalLockTime) {
                    mappedMatches = mappedMatches.map(m => ({ ...m, isLocked: true }));
                }
            }
            setMatches(mappedMatches);
          }

          const { data: preds } = await supabase.from('predictions').select('*');
          if (preds) {
            setAllPredictions(preds.map(p => ({ userId: p.user_id || '', matchId: p.match_id || '', home: p.home ?? 0, away: p.away ?? 0 })));
          }

          const { data: events } = await supabase.from('match_events').select('*').order('minute', { ascending: true });
          if (events) {
            const realEvents = events.map(e => ({
              id: e.id, matchId: String(e.match_id || ''), minute: e.minute ?? 0, minuteExtra: e.minute_extra ?? undefined,
              type: e.type || '', detail: e.detail ?? undefined, teamId: e.team_id ?? undefined,
              player: e.player ?? undefined, assist: e.assist ?? undefined,
            }));
            setMatchEvents(prev => {
              const mockOnly = prev.filter(e => e.id >= 9000);
              return [...mockOnly, ...realEvents];
            });
          }

          const { data: profiles } = await supabase.from('profiles').select('*');
          if (profiles) {
              const pMap: Record<string, UserProfile> = {};
              profiles.forEach(p => {
                  pMap[p.email] = {
                      name: p.name || '', email: p.email, tokens: p.tokens ?? 0, substitutions: p.substitutions ?? 0, 
                      avatar: p.avatar || '', hasTakenSecondChance: !!p.has_taken_second_chance, secondChanceStatus: (p.second_chance_status as any) || 'NONE',
                      leagues: p.leagues || [], favorites: p.favorites || [], spiedMatches: p.spied_matches || [], unlockedMatches: p.unlocked_matches || []
                  };
              });
              setUsersDb(pMap);
          }

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

          setTeamsData(() => {
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
              return next;
          });

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
                  // Clear stale localStorage tour flags so the tour always fires for a fresh profile
                  localStorage.removeItem(`rasten_cup_tour_done_v1_${email}`);
                  localStorage.removeItem(`rasten_cup_tour_done_v1_${email}_live`);
                  const dbRow = { id: authUser.id, email, name: authUser.user_metadata?.full_name || email.split('@')[0], avatar: pendingAvatar, tokens: MAX_SUBSTITUTIONS, substitutions: MAX_SUBSTITUTIONS, second_chance_status: 'NONE' };
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
                  });
              }
          }
      } catch (err) { console.error("Profile Error", err); }
      finally { fetchingProfileRef.current = false; setLoading(false); loadGameData(); }
  };

  useEffect(() => {
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
                          player: e.player ?? undefined, assist: e.assist ?? undefined,
                      };
                      setMatchEvents(prev => prev.some(ev => ev.id === event.id) ? prev : [...prev, event]);
                  }
              )
              .subscribe();

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
    matchEvents,
  };
};