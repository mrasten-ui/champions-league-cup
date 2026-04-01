import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { 
  TEAMS as INITIAL_TEAMS, 
  INITIAL_MATCHES, 
  MOCK_PREDICTIONS 
} from '../constants';
import { Match, Team, Prediction, UserProfile } from '../types';
import { fetchAllTeamRanks } from '../services/engine';
import { fetchAllTeamTactics } from '../services/analyst';

export const useAppData = () => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  
  const [teamsData, setTeamsData] = useState<Record<string, Team>>(INITIAL_TEAMS);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>(MOCK_PREDICTIONS);
  const [usersDb, setUsersDb] = useState<Record<string, UserProfile>>({});
  
  const [menPresets, setMenPresets] = useState<string[]>([]);
  const [womenPresets, setWomenPresets] = useState<string[]>([]);

  // 1. Fetch Avatars
  const fetchPresetAvatars = async () => {
    if (!supabase) return;
    const getSafeUrl = (path: string) => {
        const { data } = supabase.storage.from('avatars').getPublicUrl(path);
        return data.publicUrl;
    };
    try {
        const { data: menData } = await supabase.storage.from('avatars').list('men');
        if (menData) {
            const valid = menData.filter(f => !f.name.startsWith('.'));
            setMenPresets(valid.map(f => getSafeUrl(`men/${f.name}`)));
        }
        const { data: womenData } = await supabase.storage.from('avatars').list('women');
        if (womenData) {
            const valid = womenData.filter(f => !f.name.startsWith('.'));
            setWomenPresets(valid.map(f => getSafeUrl(`women/${f.name}`)));
        }
    } catch (e) { console.error("Avatar fetch error", e); }
  };

  // 2. Load Game Data
  const loadGameData = async () => {
      if (!isSupabaseConfigured || !supabase) return;
      try {
          // A. Fetch Matches from Supabase
          const { data: dbMatches } = await supabase
            .from('matches')
            .select('*')
            .order('id', { ascending: true });

          if (dbMatches && dbMatches.length > 0) {
            let mappedMatches: Match[] = dbMatches.map(m => ({
              id: m.id,
              date: m.date || 'TBD',
              venue: m.venue || 'TBD',
              homeTeamId: m.home_team_id ? m.home_team_id.toUpperCase() : 'TBD',
              awayTeamId: m.away_team_id ? m.away_team_id.toUpperCase() : 'TBD',
              homeScore: m.home_score,
              awayScore: m.away_score,
              status: (m.status as any) || 'UPCOMING',
              isLocked: !!m.is_locked,
              groupId: m.group_id || undefined,
              round: (m.round as any) || undefined,
              channels: m.channels as Record<string, string> | undefined,
              nextMatchId: m.next_match_id || undefined
            }));

            // --- 1. GLOBAL TOURNAMENT LOCK CHECK ---
            const sortedByDate = [...mappedMatches]
                .filter(m => m.date && m.date !== 'TBD')
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
            const firstMatch = sortedByDate[0];

            if (firstMatch) {
                const firstKickoff = new Date(firstMatch.date).getTime();
                const lockMargin = 15 * 60 * 1000; 
                const globalLockTime = firstKickoff - lockMargin;
                const now = Date.now();

                if (now >= globalLockTime) {
                    mappedMatches = mappedMatches.map(m => ({
                        ...m,
                        isLocked: true
                    }));
                }
            }
            setMatches(mappedMatches);
          }

          // B. Fetch Predictions
          const { data: preds } = await supabase.from('predictions').select('*');
          if (preds) {
            setAllPredictions(preds.map(p => ({ 
              userId: p.user_id || '', 
              matchId: p.match_id || '', 
              home: p.home ?? 0, 
              away: p.away ?? 0 
            })));
          }

          // C. Fetch Profiles
          const { data: profiles } = await supabase.from('profiles').select('*');
          if (profiles) {
              const pMap: Record<string, UserProfile> = {};
              profiles.forEach(p => {
                  pMap[p.email] = {
                      name: p.name || '', 
                      email: p.email, 
                      tokens: p.tokens ?? 0, 
                      substitutions: p.substitutions ?? 0, 
                      avatar: p.avatar || '', 
                      hasTakenSecondChance: !!p.has_taken_second_chance, 
                      leagues: p.leagues || [], 
                      favorites: p.favorites || [], 
                      spiedMatches: p.spied_matches || [], 
                      unlockedMatches: p.unlocked_matches || []
                  };
              });
              setUsersDb(pMap);
          }

          // D. Fetch Team Data
          // FIXED: Now querying 'scouting_overview' instead of 'scouting_reports' for 'recent_form'
          const [rankMap, tacticsMap, scoutingData] = await Promise.all([
              fetchAllTeamRanks(),
              fetchAllTeamTactics(),
              supabase.from('scouting_overview').select('team_id, recent_form')
          ]);

          setTeamsData(prev => {
              const next = { ...prev };
              
              const formMap: Record<string, string[]> = {};
              if (scoutingData.data) {
                  scoutingData.data.forEach(row => {
                      if (row.recent_form && row.team_id) {
                          formMap[row.team_id.toUpperCase()] = row.recent_form.replace(/[^WDL-]/g, '').split('-').filter((c: string) => c);
                      }
                  });
              }

              Object.keys(next).forEach(tid => {
                  const dbId = tid.toLowerCase();

                  if (next[tid]) {
                      if (rankMap[dbId]) {
                          next[tid].rank = rankMap[dbId];
                      }
                      if (tacticsMap[dbId]) {
                          const t = tacticsMap[dbId];
                          next[tid].att = t.att;
                          next[tid].mid = t.mid;
                          next[tid].def = t.def;
                          next[tid].rating = Math.round((t.att + t.mid + t.def) / 3);
                      }
                      if (formMap[tid]) {
                          next[tid].form = formMap[tid];
                      }
                  }
              });
              return next;
          });

      } catch (e) { console.error("Data Load Error", e); }
  };

  // 3. Fetch User Profile
  const fetchUserProfile = async (email: string) => {
      if (!isSupabaseConfigured || !supabase) return;
      try {
          const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
          if (data) {
              const profile: UserProfile = {
                  name: data.name || '', 
                  email: data.email, 
                  tokens: data.tokens ?? 0, 
                  substitutions: data.substitutions ?? 0,
                  unlockedMatches: data.unlocked_matches || [], 
                  hasTakenSecondChance: !!data.has_taken_second_chance,
                  spiedMatches: data.spied_matches || [], 
                  favorites: data.favorites || [], 
                  avatar: data.avatar || '', 
                  leagues: data.leagues || []
              };
              setUser(profile);
          } else {
              const { data: { user: authUser } } = await supabase.auth.getUser();
              if (authUser) {
                  const fallback = { id: authUser.id, email, name: email.split('@')[0], avatar: "", tokens: 5, substitutions: 5 };
                  await supabase.from('profiles').upsert(fallback);
                  setUser(fallback as any);
              }
          }
      } catch (err) { console.error("Profile Error", err); } 
      finally { setLoading(false); loadGameData(); }
  };

  // 4. Initial Setup Effect
  useEffect(() => {
      if (isSupabaseConfigured && supabase) {
          fetchPresetAvatars();
          
          supabase.auth.getSession().then(({ data: { session } }) => {
              setSession(session);
              if (session?.user?.email) fetchUserProfile(session.user.email);
              else {
                  setLoading(false);
                  loadGameData();
              }
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
    allPredictions, setAllPredictions, usersDb, menPresets, womenPresets
  };
};