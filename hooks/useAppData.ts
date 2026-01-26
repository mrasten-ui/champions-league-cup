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
  
  // Start with constants, but we will overwrite this immediately
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  
  const [teamsData, setTeamsData] = useState<Record<string, Team>>(INITIAL_TEAMS);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>(MOCK_PREDICTIONS);
  const [usersDb, setUsersDb] = useState<Record<string, UserProfile>>({});
  
  // Avatar Presets
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
            const mappedMatches: Match[] = dbMatches.map((m: any) => ({
              id: m.id,
              date: m.date,
              venue: m.venue,
              homeTeamId: m.home_team_id || 'TBD',
              awayTeamId: m.away_team_id || 'TBD',
              homeScore: m.home_score,
              awayScore: m.away_score,
              status: m.status,
              isLocked: m.is_locked,
              groupId: m.group_id,
              round: m.round,
              channels: m.channels,
              minute: m.minute,
              nextMatchId: m.next_match_id 
            }));
            setMatches(mappedMatches);
          }

          // B. Fetch Predictions
          const { data: preds } = await supabase.from('predictions').select('*');
          if (preds) setAllPredictions(preds.map((p: any) => ({ userId: p.user_id, matchId: p.match_id, home: p.home, away: p.away })));

          // C. Fetch Profiles
          const { data: profiles } = await supabase.from('profiles').select('*');
          if (profiles) {
              const pMap: Record<string, UserProfile> = {};
              profiles.forEach((p: any) => {
                  pMap[p.email] = {
                      name: p.name, email: p.email, tokens: p.tokens, substitutions: p.substitutions, 
                      avatar: p.avatar, hasTakenSecondChance: p.has_taken_second_chance, 
                      leagues: p.leagues || [], favorites: p.favorites || [], 
                      spiedMatches: p.spied_matches || [], unlockedMatches: p.unlocked_matches || []
                  };
              });
              setUsersDb(pMap);
          }

          // D. Fetch Team Data (Stats + Ranks + FORM)
          // We fetch Rankings, Tactics, AND Scouting Data (for Form)
          const [rankMap, tacticsMap, scoutingData] = await Promise.all([
              fetchAllTeamRanks(),
              fetchAllTeamTactics(),
              supabase.from('scouting_overview').select('team_id, recent_form')
          ]);

          setTeamsData(prev => {
              const next = { ...prev };
              
              // Helper to map form string "W-L-D" to array ['W','L','D']
              const formMap: Record<string, string[]> = {};
              if (scoutingData.data) {
                  scoutingData.data.forEach((row: any) => {
                      if (row.recent_form) {
                          // Clean up string and split
                          formMap[row.team_id] = row.recent_form.replace(/[^WDL-]/g, '').split('-').filter((c: string) => c);
                      }
                  });
              }

              Object.keys(next).forEach(tid => {
                  if (next[tid]) {
                      // 1. Update Rank
                      if (rankMap[tid]) {
                          next[tid].rank = rankMap[tid];
                      }
                      // 2. Update Stats from Tactics
                      if (tacticsMap[tid]) {
                          const t = tacticsMap[tid];
                          next[tid].att = t.att;
                          next[tid].mid = t.mid;
                          next[tid].def = t.def;
                          next[tid].rating = Math.round((t.att + t.mid + t.def) / 3);
                      }
                      // 3. Update Historical Form (Critical for Table)
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
                  name: data.name, email: data.email, tokens: data.tokens, substitutions: data.substitutions,
                  unlockedMatches: data.unlocked_matches || [], hasTakenSecondChance: data.has_taken_second_chance || false,
                  spiedMatches: data.spied_matches || [], favorites: data.favorites || [], avatar: data.avatar, leagues: data.leagues || []
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