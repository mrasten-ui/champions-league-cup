import { LanguageCode } from './types';

export interface ScoutingReport {
    confederation: string;
    fifa_rank: number;
    star_player: string;
    strengths: string;
    weaknesses: string;
    scout_notes: string;
    recent_form: string;
    last_5_matches: string;
}

// Fallback data structure. 
// You can leave this empty if you rely 100% on Supabase, 
// or fill it with defaults to prevent crashes.
const SCOUTING_DB: Record<string, Record<LanguageCode, ScoutingReport>> = {
    // Example format:
    // 'BRA': {
    //     'EN': { confederation: 'CONMEBOL', fifa_rank: 5, star_player: 'Vini Jr', ... }
    // }
};

export const getScoutingReport = (teamId: string, lang: LanguageCode): ScoutingReport | null => {
    if (SCOUTING_DB[teamId] && SCOUTING_DB[teamId][lang]) {
        return SCOUTING_DB[teamId][lang];
    }
    return null;
};