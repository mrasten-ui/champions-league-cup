import { supabase } from '../supabase';
import { Match, Team, Prediction, GroupStandings, MatchHistoryItem, ScoutingData, LanguageCode } from '../types';
import { GROUP_CONFIG } from '../constants';
import { SCOUTING_DATA, getScoutingReport } from '../scoutingData';

// --- TYPES ---

export interface SimulationResult {
  matches: Match[];
  standings: Record<string, GroupStandings[]>;
}

// --- GROUP STAGE LOGIC ---

export const calculateGroupStandings = (groupId: string, matches: Match[], teams: Record<string, Team>): GroupStandings[] => {
  const groupMatches = matches.filter(m => m.groupId === groupId && m.homeScore !== null && m.awayScore !== null);
  const groupTeams = GROUP_CONFIG.find(g => g.id === groupId)?.teams || [];
  
  const standings: Record<string, GroupStandings> = {};
  
  // Initialize
  groupTeams.forEach(teamId => {
    standings[teamId] = {
      teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
      form: []
    };
  });

  // Process Matches
  groupMatches.forEach(m => {
    if (!standings[m.homeTeamId] || !standings[m.awayTeamId]) return;
    
    const home = standings[m.homeTeamId];
    const away = standings[m.awayTeamId];
    
    home.played++;
    away.played++;
    home.gf += m.homeScore!;
    away.gf += m.awayScore!;
    home.ga += m.awayScore!;
    away.ga += m.homeScore!;
    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;

    if (m.homeScore! > m.awayScore!) {
      home.won++;
      home.points += 3;
      home.form.push('W');
      away.lost++;
      away.form.push('L');
    } else if (m.homeScore! < m.awayScore!) {
      away.won++;
      away.points += 3;
      away.form.push('W');
      home.lost++;
      home.form.push('L');
    } else {
      home.drawn++;
      home.points += 1;
      home.form.push('D');
      away.drawn++;
      away.points += 1;
      away.form.push('D');
    }
  });

  // Sort: Points -> GD -> GF
  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
};

export const getAllGroupStandings = (matches: Match[], teams: Record<string, Team>) => {
    const all: Record<string, GroupStandings[]> = {};
    GROUP_CONFIG.forEach(g => {
        all[g.id] = calculateGroupStandings(g.id, matches, teams);
    });
    return all;
};

export const getThirdPlaceStandings = (allStandings: Record<string, GroupStandings[]>) => {
    const thirds: Array<GroupStandings & { group: string }> = [];
    Object.entries(allStandings).forEach(([grp, list]) => {
        if (list.length >= 3) {
            thirds.push({ ...list[2], group: grp });
        }
    });
    // Sort logic for 3rd place table
    return thirds.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
    });
};

// --- SIMULATION ENGINE (Monte Carlo Lite) ---

export const simulateFullTournament = (
    currentMatches: Match[], 
    teams: Record<string, Team>, 
    favorites: string[] = [],
    scope: 'GROUPS' | 'KNOCKOUT' = 'GROUPS'
): Match[] => {
    const simulated = currentMatches.map(m => {
        // Skip if out of scope or already played
        if (scope === 'GROUPS' && !m.groupId) return m;
        if (scope === 'KNOCKOUT' && m.groupId) return m;
        if (m.homeScore !== null && m.awayScore !== null) return m;

        const home = teams[m.homeTeamId];
        const away = teams[m.awayTeamId];
        if (!home || !away) return m;

        // Base Strength
        let hStr = home.rating;
        let aStr = away.rating;

        // Favorites Boost
        if (favorites.includes(home.id)) hStr += 5;
        if (favorites.includes(away.id)) aStr += 5;

        // Random Factor (The "Ball is Round" Factor)
        const hRand = Math.random() * 20;
        const aRand = Math.random() * 20;

        const hTotal = hStr + hRand;
        const aTotal = aStr + aRand;

        // Determine Score
        let hScore = 0;
        let aScore = 0;
        
        const diff = Math.abs(hTotal - aTotal);
        
        // Closer matches have lower scores typically
        if (diff < 10) {
            hScore = Math.floor(Math.random() * 3); // 0-2
            aScore = Math.floor(Math.random() * 3); // 0-2
        } else if (hTotal > aTotal) {
            hScore = Math.floor(Math.random() * 4) + 1; // 1-4
            aScore = Math.floor(Math.random() * 2); // 0-1
        } else {
            hScore = Math.floor(Math.random() * 2); 
            aScore = Math.floor(Math.random() * 4) + 1; 
        }

        // Avoid draws in Knockouts (simple logic, real engine would do pens)
        if (scope === 'KNOCKOUT' && hScore === aScore) {
            if (hTotal > aTotal) hScore++; else aScore++;
        }

        return { ...m, homeScore: hScore, awayScore: aScore };
    });

    return simulated;
};

// --- BRACKET LOGIC ---

export const updateBracket = (matches: Match[], teams: Record<string, Team>): Match[] => {
    // This is a placeholder. In a full app, this would recalculate 
    // R16 matchups based on group standings.
    // For now, we assume the schedule is static or pre-seeded.
    return matches; 
};

export const applyPredictionsToBracket = (matches: Match[], teams: Record<string, Team>, predictions: Prediction[]): Match[] => {
    return matches.map(m => {
        const pred = predictions.find(p => p.matchId === m.id);
        // Only apply prediction if match isn't locked (real result happened)
        if (pred && !m.isLocked) {
            return { ...m, homeScore: pred.home, awayScore: pred.away };
        }
        return m;
    });
};

export const simulateTournamentAtDate = (matches: Match[], teams: Record<string, Team>, timestamp: number): Match[] => {
    return matches.map(m => {
        const mTime = new Date(m.date).getTime();
        // If match happened before timestamp, give it a result if it lacks one
        if (mTime <= timestamp && m.homeScore === null) {
             // Simple random result for "Time Travel" simulation
             return { 
                 ...m, 
                 homeScore: Math.floor(Math.random() * 3), 
                 awayScore: Math.floor(Math.random() * 3),
                 status: 'FT',
                 isLocked: true 
             };
        }
        return m;
    });
};

export const generateMagicScores = (matches: Match[], teams: Record<string, Team>, favorites: string[]) => {
    // Helper to generate a batch of predictions based on favorites
    return matches
        .filter(m => !m.isLocked)
        .map(m => {
            const homeFav = favorites.includes(m.homeTeamId);
            const awayFav = favorites.includes(m.awayTeamId);
            
            let h = 1, a = 1;
            if (homeFav && !awayFav) { h = 2; a = 0; }
            else if (!homeFav && awayFav) { h = 0; a = 2; }
            else { h = 1; a = 1; } // Draw if both or neither

            return { matchId: m.id, home: h, away: a };
        });
};

// --- DATA FETCHING & SUPABASE ---

export const fetchTeamHistory = async (teamId: string): Promise<MatchHistoryItem[]> => {
    if (!supabase) return [];
    try {
        const { data, error } = await supabase
            .from('head_to_head')
            .select('*')
            .or(`team_a.eq.${teamId},team_b.eq.${teamId}`)
            .order('year', { ascending: false })
            .limit(5);

        if (error) throw error;
        
        // FIX: Cast data to 'any[]' to prevent TS "Property does not exist on type 'never'"
        return (data as any[] || []).map((row: any) => ({
            date: row.year.toString(),
            opponent: row.team_a === teamId ? row.team_b : row.team_a,
            result: (row.team_a === teamId && row.score_a > row.score_b) || (row.team_b === teamId && row.score_b > row.score_a) ? 'W' : 
                    row.score_a === row.score_b ? 'D' : 'L',
            score: `${row.score_a}-${row.score_b}`,
            competition: row.competition || 'International'
        }));
    } catch (e) {
        console.error("Fetch History Error", e);
        return [];
    }
};

export const fetchScoutingOverview = async (teamId: string, lang: LanguageCode): Promise<ScoutingData | null> => {
    // 1. Try DB
    if (supabase) {
        try {
            const { data } = await supabase
                .from('scouting_reports')
                .select('*')
                .eq('team_id', teamId)
                .eq('lang', lang)
                .maybeSingle();
                
            // FIX: Cast to 'any'
            if (data) return data as any;
        } catch (e) {
            // fall through to local
        }
    }
    
    // 2. Fallback to Local Data
    const local = getScoutingReport(teamId, lang);
    if (local) {
        return {
            id: 0,
            team_id: teamId,
            team_name: local.team_name || teamId, 
            confederation: local.confederation || 'FIFA',
            fifa_rank: local.fifa_rank || 50,
            star_player: local.star_player || '',
            strengths: local.strengths || '',
            weaknesses: local.weaknesses || '',
            scout_notes: local.scout_notes || '',
            recent_form: local.recent_form || '',
            last_5_matches: local.last_5_matches || '',
            created_at: new Date().toISOString()
        };
    }
    return null;
};

export interface TeamFormData {
    fifaRank: number;
    history: MatchHistoryItem[];
}

export const fetchTeamExtendedStats = async (teamId: string): Promise<TeamFormData | null> => {
    if (!supabase) return null;
    try {
        const { data } = await supabase
            .from('team_form_data')
            .select('*')
            .eq('team_id', teamId)
            .limit(5);
            
        if (!data || data.length === 0) return null;
        
        // FIX: Cast to 'any[]'
        const history = (data as any[]).map((d: any) => ({
            date: d.match_date,
            opponent: d.opponent,
            result: d.result as 'W' | 'D' | 'L',
            score: d.score,
            competition: 'Recent Form'
        }));

        return {
            fifaRank: (data[0] as any).fifa_rank,
            history
        };
    } catch (e) {
        return null;
    }
};

export const fetchMatches = async (): Promise<Match[]> => {
    // In future, fetch from DB. For now static.
    // const { data } = await supabase.from('matches').select('*');
    // if (data) return mergeData(INITIAL_MATCHES, data);
    return []; // App.tsx handles the initial match load from constants
};

export const fetchTeams = async (): Promise<Record<string, Team>> => {
    return {}; // App.tsx handles initial team load
};

export const fetchAllPredictions = async (): Promise<Prediction[]> => {
    if (!supabase) return [];
    const { data } = await supabase.from('predictions').select('*');
    // FIX: Cast to 'any[]'
    if (data) return (data as any[]).map(p => ({ userId: p.user_id, matchId: p.match_id, home: p.home, away: p.away }));
    return [];
};

export const fetchRivals = async (): Promise<UserProfile[]> => {
    if (!supabase) return [];
    const { data } = await supabase.from('profiles').select('*');
    // FIX: Cast to 'any[]'
    if (data) return (data as any[]).map(p => ({
        name: p.name,
        email: p.email,
        tokens: p.tokens,
        substitutions: p.substitutions,
        avatar: p.avatar,
        hasTakenSecondChance: p.has_taken_second_chance,
        leagues: p.leagues || [],
        favorites: p.favorites || [],
        spiedMatches: p.spied_matches || [],
        unlockedMatches: p.unlocked_matches || []
    }));
    return [];
};

export const getUserProfile = async (email: string): Promise<UserProfile | null> => {
    if (!supabase) return null;
    const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
    // FIX: Cast to 'any'
    if (data) {
        const d = data as any;
        return {
            name: d.name,
            email: d.email,
            tokens: d.tokens,
            substitutions: d.substitutions,
            avatar: d.avatar,
            hasTakenSecondChance: d.has_taken_second_chance,
            leagues: d.leagues || [],
            favorites: d.favorites || [],
            spiedMatches: d.spied_matches || [],
            unlockedMatches: d.unlocked_matches || []
        };
    }
    return null;
};

export const submitPrediction = async (email: string, matchId: string, home: number, away: number) => {
    if (!supabase) return null;
    // FIX: Cast payload to 'any' to bypass strict TS check on insert
    await supabase.from('predictions').upsert({ user_id: email, match_id: matchId, home, away } as any);
    return { email }; 
};

export const fetchAllTeamRanks = async (): Promise<Record<string, number>> => {
    if (!supabase) return {};
    try {
        const { data } = await supabase.from('team_form_data').select('team_id, fifa_rank');
        if (data) {
            const ranks: Record<string, number> = {};
            // FIX: Cast to 'any[]'
            (data as any[]).forEach(r => {
                if (r.team_id) ranks[r.team_id] = r.fifa_rank;
            });
            return ranks;
        }
    } catch (e) {
        // ignore
    }
    return {};
};