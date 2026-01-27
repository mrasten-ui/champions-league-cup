import { Match, Team } from '../types';

// --- CONSTANTS ---

// Hardcoded R32 Source Map (Standard FIFA Structure Pattern)
const R32_SOURCES: Record<number, { home: string, away: string }> = {
    1:  { home: '2A', away: '2B' },
    2:  { home: '1E', away: '3rd Place' },
    3:  { home: '1F', away: '2C' },
    4:  { home: '1C', away: '2F' },
    5:  { home: '1I', away: '3rd Place' },
    6:  { home: '2E', away: '2I' },
    7:  { home: '1A', away: '3rd Place' },
    8:  { home: '1L', away: '3rd Place' },
    9:  { home: '1D', away: '3rd Place' },
    10: { home: '1G', away: '3rd Place' },
    11: { home: '2K', away: '2L' },
    12: { home: '1H', away: '2J' },
    13: { home: '1B', away: '3rd Place' },
    14: { home: '1J', away: '2H' },
    15: { home: '1K', away: '3rd Place' },
    16: { home: '2D', away: '2G' }
};

// --- TYPES ---

export type SlotSource = 
    | { type: 'GROUP_RANK'; label: string; groupId: string; rank: number }
    | { type: '3RD_PLACE'; label: string }
    | { type: 'MATCH_WINNER'; matchId: string; label: string }
    | { type: 'MATCH_LOSER'; matchId: string; label: string }
    | { type: 'UNKNOWN'; label: string };

// --- HELPERS ---

/**
 * Determines where a specific slot (Home/Away) in a match comes from.
 */
export const getSlotSource = (matchId: string, side: 'home' | 'away'): SlotSource => {
    // 1. Parse ID (e.g., "R32_1" -> round="R32", index=1)
    const parts = matchId.split('_');
    if (parts.length !== 2) return { type: 'UNKNOWN', label: 'TBD' };
    
    const round = parts[0];
    const index = parseInt(parts[1], 10);

    // --- CASE A: Round of 32 (Group Sources) ---
    if (round === 'R32') {
        const sourceCode = R32_SOURCES[index]?.[side];
        
        if (!sourceCode) return { type: 'UNKNOWN', label: 'TBD' };
        if (sourceCode === '3rd Place') return { type: '3RD_PLACE', label: '3rd Place' };
        
        // Parse "1A", "2B" etc.
        const rank = parseInt(sourceCode.charAt(0));
        const groupId = sourceCode.substring(1);
        
        return { 
            type: 'GROUP_RANK', 
            label: `${getOrdinal(rank)} Grp ${groupId}`, 
            groupId, 
            rank 
        };
    }

    // --- CASE B: Knockout Rounds (Match Feeders) ---
    // Calculate Previous Match Index
    const prevIndex = side === 'home' ? (index * 2) - 1 : (index * 2);
    
    let prevRound = '';
    if (round === 'R16') prevRound = 'R32';
    else if (round === 'QF') prevRound = 'R16';
    else if (round === 'SF') prevRound = 'QF';
    else if (round === 'FIN') prevRound = 'SF';
    else if (round === '3RD') prevRound = 'SF'; // Special case

    // Handle 3rd Place Match (Losers of SF)
    if (round === '3RD') {
        const sfMatchId = `SF_${side === 'home' ? 1 : 2}`;
        return { type: 'MATCH_LOSER', matchId: sfMatchId, label: `Loser SF${side === 'home' ? 1 : 2}` };
    }

    const prevMatchId = `${prevRound}_${prevIndex}`;
    return { type: 'MATCH_WINNER', matchId: prevMatchId, label: `Winner ${prevMatchId}` };
};

/**
 * Gets the potential teams for a feeder match.
 * Returns an array of 2 teams (if match is known) or null.
 */
export const getPotentialTeams = (
    source: SlotSource, 
    allMatches: Match[], 
    teams: Record<string, Team>
): Team[] | null => {
    if (source.type !== 'MATCH_WINNER' && source.type !== 'MATCH_LOSER') return null;
    
    const feederMatch = allMatches.find(m => m.id === source.matchId);
    if (!feederMatch) return null;

    // If the feeder match itself has TBD teams, we can't show specific flags yet
    if (feederMatch.homeTeamId === 'TBD' || feederMatch.awayTeamId === 'TBD') return null;

    const home = teams[feederMatch.homeTeamId];
    const away = teams[feederMatch.awayTeamId];

    if (home && away) return [home, away];
    return null;
};

// Simple helper for "1st", "2nd"
const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};