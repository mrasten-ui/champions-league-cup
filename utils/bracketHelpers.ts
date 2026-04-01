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

// --- OFFICIAL FIFA KNOCKOUT PROGRESSION MAPPINGS ---
// Maps the Match Index of the current round to the Match Indices of the previous round
const KNOCKOUT_SOURCES: Record<string, Record<number, { home: number, away: number }>> = {
    'R16': {
        1: { home: 2, away: 5 },   // M89: Winner M74 (R32_2) vs Winner M77 (R32_5)
        2: { home: 1, away: 3 },   // M90: Winner M73 (R32_1) vs Winner M75 (R32_3)
        3: { home: 4, away: 6 },   // M91: Winner M76 (R32_4) vs Winner M78 (R32_6)
        4: { home: 7, away: 8 },   // M92: Winner M79 (R32_7) vs Winner M80 (R32_8)
        5: { home: 11, away: 12 }, // M93: Winner M83 (R32_11) vs Winner M84 (R32_12)
        6: { home: 9, away: 10 },  // M94: Winner M81 (R32_9) vs Winner M82 (R32_10)
        7: { home: 14, away: 16 }, // M95: Winner M86 (R32_14) vs Winner M88 (R32_16)
        8: { home: 13, away: 15 }  // M96: Winner M85 (R32_13) vs Winner M87 (R32_15)
    },
    'QF': {
        1: { home: 1, away: 2 },   // M97: Winner M89 (R16_1) vs Winner M90 (R16_2)
        2: { home: 5, away: 6 },   // M98: Winner M93 (R16_5) vs Winner M94 (R16_6)
        3: { home: 3, away: 4 },   // M99: Winner M91 (R16_3) vs Winner M92 (R16_4)
        4: { home: 7, away: 8 }    // M100: Winner M95 (R16_7) vs Winner M96 (R16_8)
    },
    'SF': {
        1: { home: 1, away: 2 },   // M101: Winner M97 (QF_1) vs Winner M98 (QF_2)
        2: { home: 3, away: 4 }    // M102: Winner M99 (QF_3) vs Winner M100 (QF_4)
    },
    'FIN': {
        1: { home: 1, away: 2 }    // M104: Winner M101 (SF_1) vs Winner M102 (SF_2)
    }
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
    const parts = matchId.split('_');
    if (parts.length !== 2) return { type: 'UNKNOWN', label: 'TBD' };
    
    const round = parts[0];
    const index = parseInt(parts[1], 10);

    // --- CASE A: Round of 32 (Group Sources) ---
    if (round === 'R32') {
        const sourceCode = R32_SOURCES[index]?.[side];
        
        if (!sourceCode) return { type: 'UNKNOWN', label: 'TBD' };
        if (sourceCode === '3rd Place') return { type: '3RD_PLACE', label: '3rd Place' };
        
        const rank = parseInt(sourceCode.charAt(0));
        const groupId = sourceCode.substring(1);
        
        return { 
            type: 'GROUP_RANK', 
            label: `${getOrdinal(rank)} Grp ${groupId}`, 
            groupId, 
            rank 
        };
    }

    // --- CASE B: Third Place Play-off ---
    if (round === '3RD') {
        const sfMatchId = `SF_${side === 'home' ? 1 : 2}`;
        return { type: 'MATCH_LOSER', matchId: sfMatchId, label: `Loser SF${side === 'home' ? 1 : 2}` };
    }

    // --- CASE C: Knockout Rounds (Match Feeders) ---
    let prevRound = '';
    if (round === 'R16') prevRound = 'R32';
    else if (round === 'QF') prevRound = 'R16';
    else if (round === 'SF') prevRound = 'QF';
    else if (round === 'FIN') prevRound = 'SF';

    const prevIndex = KNOCKOUT_SOURCES[round]?.[index]?.[side];
    
    if (!prevIndex) return { type: 'UNKNOWN', label: 'TBD' };

    const prevMatchId = `${prevRound}_${prevIndex}`;
    return { type: 'MATCH_WINNER', matchId: prevMatchId, label: `Winner ${prevMatchId}` };
};

export const getPotentialTeams = (
    source: SlotSource, 
    allMatches: Match[], 
    teams: Record<string, Team>
): Team[] | null => {
    if (source.type !== 'MATCH_WINNER' && source.type !== 'MATCH_LOSER') return null;
    
    const feederMatch = allMatches?.find(m => m.id === source.matchId);
    if (!feederMatch) return null;

    if (feederMatch.homeTeamId === 'TBD' || feederMatch.awayTeamId === 'TBD') return null;

    const home = teams[feederMatch.homeTeamId];
    const away = teams[feederMatch.awayTeamId];

    if (home && away) return [home, away];
    return null;
};

/**
 * Gets all teams in a specific group for the cluster display
 */
export const getGroupTeams = (groupId: string, allMatches: Match[], teams: Record<string, Team>): Team[] => {
    if (!allMatches || !teams) return [];
    
    // Find all matches in this group
    const groupMatches = allMatches.filter(m => m.groupId === groupId);
    
    // Extract unique team IDs
    const teamIds = new Set<string>();
    groupMatches.forEach(m => {
        if (m.homeTeamId !== 'TBD') teamIds.add(m.homeTeamId);
        if (m.awayTeamId !== 'TBD') teamIds.add(m.awayTeamId);
    });

    // Map to Team objects and sort by Name or Rank to be consistent
    return Array.from(teamIds)
        .map(id => teams[id])
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));
};

const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};