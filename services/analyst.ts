import { supabase } from '../supabase';
import { Team } from '../types';

export type TacticalStyle = 'Possession' | 'Counter Attack' | 'High Press' | 'Low Block' | 'Direct' | 'Balanced';

export interface TeamDNA {
  style: TacticalStyle;
  attributes: {
    attack: number;
    midfield: number;
    defense: number;
    pace: number;
    physical: number;
    technique: number;
  };
  keyPlayerRole: string;
  narrative: string;
}

const DEFAULT_DNA: TeamDNA = {
  style: 'Balanced',
  attributes: { attack: 75, midfield: 75, defense: 75, pace: 75, physical: 75, technique: 75 },
  keyPlayerRole: 'Captain',
  narrative: 'A balanced tactical setup.'
};

/**
 * Fetches the specific tactical data for a ONE team.
 */
export const fetchTeamTactics = async (teamId: string, lang: string = 'EN'): Promise<TeamDNA> => {
    if (!supabase) return DEFAULT_DNA;
    
    const { data } = await supabase
        .from('team_tactics')
        .select('*')
        .eq('team_id', teamId)
        .maybeSingle();

    if (data) {
        const narrativeMap = data.narrative || {};
        const localizedNarrative = narrativeMap[lang] || narrativeMap['EN'] || "Tactical profile available.";

        return {
            style: data.style as TacticalStyle,
            attributes: {
                attack: data.att,
                midfield: data.mid,
                defense: data.def,
                pace: data.pace,
                physical: data.phys,
                technique: data.tech
            },
            keyPlayerRole: data.key_player_role,
            narrative: localizedNarrative
        };
    }
    return DEFAULT_DNA;
};

/**
 * NEW: Fetches stats for ALL teams at once to populate the main app state.
 * This fixes the "Rubbish Content" issue by overwriting the default 75s.
 */
export const fetchAllTeamTactics = async () => {
    if (!supabase) return {};
    
    try {
        const { data } = await supabase.from('team_tactics').select('*');
        const map: Record<string, any> = {};
        if (data) {
            data.forEach(row => {
                map[row.team_id] = row;
            });
        }
        return map;
    } catch (e) {
        console.error("Error fetching all tactics:", e);
        return {};
    }
};

/**
 * Compares two teams and their DNA to generate a predictive story.
 */
export const analyzeMatchup = (home: Team, hDNA: TeamDNA, away: Team, rDNA: TeamDNA, lang: string = 'EN') => {
  let story = "";
  let keyFactor = "";

  const t = (en: string, no: string, sco: string, us: string) => {
      if (lang === 'NO') return no;
      if (lang === 'SCO') return sco;
      if (lang === 'US') return us;
      return en;
  };

  // 1. Narrative Engine
  if (hDNA.style === 'Possession' && rDNA.style === 'Low Block') {
    story = t(
        `${home.name} will dominate the ball, but ${away.name} is built to frustrate.`,
        `${home.name} vil dominere banespillet, men ${away.name} er bygd for å frustrere.`,
        `${home.name} will keep the baw, but ${away.name} will park the bus.`,
        `${home.name} controls the clock, but ${away.name} plays lockdown defense.`
    );
    keyFactor = t("Patience vs Discipline", "Tålmodighet vs Disiplin", "Patience vs Parkin the Bus", "Patience vs Grinding");
  } 
  else if (hDNA.style === 'High Press' && rDNA.style === 'Possession') {
    story = t(
        `High energy clash! ${home.name} will try to suffocate ${away.name}.`,
        `Høyenergi-oppgjør! ${home.name} vil prøve å kvele ${away.name}.`,
        `Mental game! ${home.name} will be all over ${away.name} like a rash.`,
        `High octane matchup! ${home.name} bringing the full court press.`
    );
    keyFactor = t("Turnovers", "Brudd på midten", "Silly Mistakes", "Turnovers");
  }
  else if (hDNA.attributes.pace > rDNA.attributes.defense + 10) {
    story = t(
        `${home.name}'s speed is a massive problem for ${away.name}.`,
        `${home.name} sin fart er et stort problem for ${away.name}.`,
        `${home.name} are rapid. ${away.name} cannae catch them.`,
        `${home.name} has the speed advantage. Mismatch on the wings.`
    );
    keyFactor = t("Pace in behind", "Bakromstrussel", "Pace abuse", "Vertical Speed");
  }
  else if (hDNA.attributes.physical > rDNA.attributes.physical + 10) {
      story = t(
          `${home.name} will try to bully ${away.name} off the park.`,
          `${home.name} vil prøve å krige ${away.name} i senk.`,
          `${home.name} are big lads. ${away.name} better toughen up.`,
          `${home.name} brings the physicality. It's gonna be a bruise fest.`
      );
      keyFactor = t("Physicality", "Fysikk", "Big Tackles", "Physicality");
  }
  else {
    story = t(
        `A balanced tactical battle between two strong sides.`,
        `En balansert taktisk kamp mellom to sterke lag.`,
        `This one's tight. Could go either way.`,
        `Even matchup. Down to the wire.`
    );
    keyFactor = t("Midfield Control", "Midtbanekontroll", "The Engine Room", "Midfield Play");
  }

  // 2. Win Probability
  const calculatePower = (dna: TeamDNA) => 
    (dna.attributes.attack * 0.3) + (dna.attributes.defense * 0.3) + (dna.attributes.midfield * 0.2) + (dna.attributes.technique * 0.2);

  const hPower = calculatePower(hDNA);
  const rPower = calculatePower(rDNA);
  const total = hPower + rPower;
  
  const winProb = Math.round((hPower / total) * 100);

  return { home: hDNA, away: rDNA, story, keyFactor, winProb };
};