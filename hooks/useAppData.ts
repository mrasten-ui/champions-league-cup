import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { 
  TEAMS as INITIAL_TEAMS, 
  INITIAL_MATCHES, 
  MOCK_PREDICTIONS 
} from '../constants';
import { Match, Team, Prediction, UserProfile } from '../types';
import { fetchAllTeamRanks } from '../services/engine';

export const useAppData = () => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [teamsData, setTeamsData] = useState<Record<string, Team>>(INITIAL_TEAMS);
  const [allPredictions, setAllPredictions] = useState<Prediction[]>(MOCK_PREDICTIONS);
  const [usersDb, setUsersDb] = useState<Record<string, UserProfile>>({});
  
  // Avatar Presets
  const [menPresets, setMenPresets] = useState<string[]>([]);
  const [womenPresets, setWomenPresets] = useState<string[]>([]);

  // 1. GENERATE LOCAL AVATARS (Auto-detect logic)
  const fetchPresetAvatars = async () => {
    // AUTOMATIC GENERATION:
    // This creates a list of paths from man1.png to man50.png.
    // As long as you drop a file with the matching name into 'public/avatars/', it will show up.
    
    const men = Array.from({ length: 50 }, (_, i) => `/avatars/man${i + 1}.png`);
    // Handle the specific case we found earlier where one file was capitalized
    if (!men.includes('/avatars/Man2.png')) men.splice(1, 1, '/avatars/Man2.png');

    const women = Array.from({ length: 50 }, (_, i) => `/avatars/woman${i + 1}.png`);

    setMenPresets(men);
    setWomenPresets(women);
  };

  // 2. Load Game Data
  const loadGameData = async () => {
      if (!isSupabaseConfigured || !supabase) return;
      try {
          const { data: preds } = await supabase.from('predictions').select('*');
          if (preds) setAllPredictions(preds.map((p: any) => ({ userId: p.user_id, matchId: p.match_id, home: p.home, away: p.away })));

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
          const rankMap = await fetchAllTeamRanks();
          if (Object.keys(rankMap).length > 0) {
              setTeamsData(prev => {
                  const next = { ...prev };
                  Object.keys(rankMap).forEach(tid => { if (next[tid]) next[tid] = { ...next[tid], rank: rankMap[tid] }; });
                  return next;
              });
          }
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
      fetchPresetAvatars();

      if (isSupabaseConfigured && supabase) {
          supabase.auth.getSession().then(({ data: { session } }) => {
              setSession(session);
              if (session?.user?.email) fetchUserProfile(session.user.email);
              else setLoading(false);
          });
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
              setSession(session);
              if (session?.user?.email) fetchUserProfile(session.user.email);
              else { setUser(null); setLoading(false); }
          });
          return () => subscription.unsubscribe();
      } else { setLoading(false); }
  }, []);

  return {
    session, user, setUser, loading, matches, setMatches, teamsData, setTeamsData,
    allPredictions, setAllPredictions, usersDb, menPresets, womenPresets
  };
};