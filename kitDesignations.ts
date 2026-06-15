import { TEAMS } from './constants';

type KitType = 'home' | 'away' | 'third';

// Kit designations for FIFA World Cup 2026 Group Stage
// Key: "${homeTeamId}-${awayTeamId}" — matches the fixture order (home listed first)
// Values: the actual kit type each team is wearing, which may differ from their match role
const MATCH_KITS: Record<string, Partial<Record<string, KitType>>> = {
  // GROUP A — Mexico, South Africa, South Korea, Czechia
  'MEX-RSA': { MEX: 'home', RSA: 'home' },
  'KOR-CZE': { KOR: 'home', CZE: 'away' },
  'MEX-KOR': { MEX: 'home', KOR: 'away' },
  'RSA-CZE': { RSA: 'home', CZE: 'home' },
  'MEX-CZE': { MEX: 'home', CZE: 'away' },
  'KOR-RSA': { KOR: 'home', RSA: 'away' },

  // GROUP B — Canada, Bosnia & Herzegovina, Qatar, Switzerland
  'CAN-BIH': { CAN: 'home', BIH: 'away' },
  'QAT-SUI': { QAT: 'home', SUI: 'away' }, // Switzerland in green away
  'CAN-QAT': { CAN: 'home', QAT: 'away' },
  'BIH-SUI': { BIH: 'home', SUI: 'home' },
  'CAN-SUI': { CAN: 'home', SUI: 'away' },
  'BIH-QAT': { BIH: 'home', QAT: 'away' },

  // GROUP C — Brazil, Morocco, Haiti, Scotland
  'BRA-MAR': { BRA: 'home', MAR: 'home' },
  'HAI-SCO': { HAI: 'home', SCO: 'away' }, // Scotland pushed off navy by Haiti white
  'BRA-HAI': { BRA: 'home', HAI: 'away' },
  'MAR-SCO': { MAR: 'home', SCO: 'away' },
  'BRA-SCO': { BRA: 'home', SCO: 'home' }, // Scotland wears navy HOME; Brazil drops blue shorts
  'MAR-HAI': { MAR: 'home', HAI: 'away' },

  // GROUP D — USA, Paraguay, Australia, Türkiye
  'USA-PAR': { USA: 'home', PAR: 'away' },
  'AUS-TUR': { AUS: 'home', TUR: 'home' },
  'USA-AUS': { USA: 'home', AUS: 'away' },
  'PAR-TUR': { PAR: 'home', TUR: 'away' },

  // GROUP E — Germany, Curaçao, Ivory Coast, Ecuador
  'GER-CUW': { GER: 'home', CUW: 'home' },
  'CIV-ECU': { CIV: 'home', ECU: 'home' },
  'GER-CIV': { GER: 'home', CIV: 'away' },
  'CUW-ECU': { CUW: 'away', ECU: 'home' },

  // GROUP F — Netherlands, Japan, Sweden, Tunisia
  'NED-JPN': { NED: 'home', JPN: 'home' },
  'SWE-TUN': { SWE: 'home', TUN: 'away' },
  'NED-SWE': { NED: 'home', SWE: 'away' },
  'JPN-TUN': { JPN: 'home', TUN: 'away' },

  // GROUP G — Belgium, Egypt, Iran, New Zealand
  // (full designations pending official PDF — hue-clash fallback handles these)

  // GROUP H — Spain, Cabo Verde, Saudi Arabia, Uruguay
  'ESP-CPV': { ESP: 'home', CPV: 'away' },
  'KSA-URU': { KSA: 'away', URU: 'home' }, // Saudi Arabia in white away
  'ESP-KSA': { ESP: 'home', KSA: 'away' },
  'URU-CPV': { URU: 'home', CPV: 'away' },

  // GROUP I — France, Senegal, Norway, Iraq
  'FRA-SEN': { FRA: 'home', SEN: 'away' },
  'NOR-IRQ': { NOR: 'home', IRQ: 'away' },

  // GROUP J — Argentina, Algeria, Austria, Jordan
  'ARG-ALG': { ARG: 'home', ALG: 'home' },
  'AUT-JOR': { AUT: 'home', JOR: 'away' },

  // GROUP K — Portugal, Congo DR, Uzbekistan, Colombia
  'POR-COD': { POR: 'home', COD: 'away' },
  'UZB-COL': { UZB: 'away', COL: 'home' }, // Uzbekistan wear all-white away throughout group stage

  // GROUP L — England, Croatia, Ghana, Panama
  'ENG-CRO': { ENG: 'home', CRO: 'home' },
  'GHA-PAN': { GHA: 'away', PAN: 'away' }, // Ghana wear yellow away in all group stage matches
};

function hexHue(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  const hue = max === r ? ((g - b) / d + (g < b ? 6 : 0))
            : max === g ? ((b - r) / d + 2)
            :             ((r - g) / d + 4);
  return hue * 60;
}

/**
 * When the API hasn't provided kit colors yet, determine what kit a team
 * is likely wearing. Checks the known FIFA designation table first, then
 * falls back to home-kit hue clash detection.
 */
export function resolveKitFallback(
  homeTeamId: string,
  awayTeamId: string,
  teamId: string,
): KitType {
  const designated = MATCH_KITS[`${homeTeamId}-${awayTeamId}`]?.[teamId];
  if (designated) return designated;

  if (teamId === homeTeamId) return 'home';

  const homeBg = TEAMS[homeTeamId]?.jerseyBg;
  const awayBg = TEAMS[awayTeamId]?.jerseyBg;
  if (!homeBg || !awayBg) return 'away';
  const diff = Math.abs(hexHue(homeBg) - hexHue(awayBg));
  return Math.min(diff, 360 - diff) <= 40 ? 'away' : 'home';
}
