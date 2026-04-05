import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { INITIAL_MATCHES, MOCK_PREDICTIONS, TEAMS } from '../constants';
import { Match, Team, Prediction, UserProfile } from '../types';
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

  // --- SECOND CHANCE TIMERS ---
  const [groupStageEndTime, setGroupStageEndTime] = useState<number>(0);
  const [knockoutStartTime, setKnockoutStartTime] = useState<number>(0);

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
                          flag: t.flag || TEAMS[safeId]?.flag || '',
                          rank: t.rank || 50,
                          rating: t.rating || 50,
                          att: t.att || 50,
                          mid: t.mid || 50,
                          def: t.def || 50,
                          overview: t.overview || '',
                          starPlayer: 'TBD',
                          strengths: '',
                          weaknesses: '',
                          form: []
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
                  const dbId = tid.toLowerCase();
                  if (next[tid] && tid !== 'TBD') {
                      const updates: Partial<typeof next[string]> = {};
                      if (rankMap[dbId]) updates.rank = rankMap[dbId];
                      if (tacticsMap[dbId]) { const tc = tacticsMap[dbId]; updates.att = tc.att; updates.mid = tc.mid; updates.def = tc.def; updates.rating = Math.round((tc.att + tc.mid + tc.def) / 3); }
                      if (formMap[tid]) updates.form = formMap[tid];
                      if (Object.keys(updates).length > 0) next[tid] = { ...next[tid], ...updates };
                  }
              });
              return next;
          });

      } catch (e) { console.error("Data Load Error", e); }
  };

  const fetchUserProfile = async (email: string) => {
      if (!isSupabaseConfigured || !supabase) return;
      try {
          const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
          if (data) {
              setUser({
                  name: data.name || '', email: data.email, tokens: data.tokens ?? 0, substitutions: data.substitutions ?? 0,
                  unlockedMatches: data.unlocked_matches || [], hasTakenSecondChance: !!data.has_taken_second_chance, secondChanceStatus: (data.second_chance_status as any) || 'NONE',
                  spiedMatches: data.spied_matches || [], favorites: data.favorites || [], avatar: data.avatar || '', leagues: data.leagues || []
              });
          } else {
              const { data: { user: authUser } } = await supabase.auth.getUser();
              if (authUser) {
                  const dbRow = { id: authUser.id, email, name: email.split('@')[0], avatar: "", tokens: 5, substitutions: 5, second_chance_status: 'NONE' };
                  await supabase.from('profiles').upsert(dbRow);
                  setUser({
                      email,
                      name: dbRow.name,
                      avatar: '',
                      tokens: 5,
                      substitutions: 5,
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
      finally { setLoading(false); loadGameData(); }
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
          return () => subscription.unsubscribe();
      } else { setLoading(false); }
  }, []);

  return {
    session, user, setUser, loading, matches, setMatches, teamsData, setTeamsData,
    allPredictions, setAllPredictions, usersDb, setUsersDb, menPresets, womenPresets,
    groupStageEndTime, knockoutStartTime // <--- RE-ADDED: Fixes the Vercel crash!
  };
};