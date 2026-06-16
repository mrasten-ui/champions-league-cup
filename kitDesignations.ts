import { TEAMS } from './constants';
import { KIT_COLORS } from './kitColors';

type KitType = 'home' | 'away' | 'third';

// FIFA World Cup 2026 Group Stage kit designations
// Key: "${homeTeamId}-${awayTeamId}" — team_a is the home team in the fixture
// Values: actual kit type each team is wearing (independent of their fixture role)
// TBC colour = type confirmed but colour unknown; omitted = fall through to clash detection
const MATCH_KITS: Record<string, Partial<Record<string, KitType>>> = {

  // ── GROUP A — Mexico, South Africa, South Korea, Czechia ────────────────────
  'MEX-RSA': { MEX: 'home', RSA: 'home' },          // M1:  both home (green vs gold)
  'KOR-CZE': { KOR: 'home', CZE: 'away' },          // M2:  CZE pushed to away (crystal white)
  'MEX-KOR': { MEX: 'home', KOR: 'away' },          // M13: KOR in white away
  'RSA-CZE': { RSA: 'home', CZE: 'home' },          // M14: both home (gold vs red)
  'MEX-CZE': { MEX: 'home', CZE: 'away' },          // M33: CZE in white away
  'RSA-KOR': { RSA: 'away', KOR: 'home' },          // M34: RSA home is home, but wears away

  // ── GROUP B — Canada, Bosnia & Herzegovina, Qatar, Switzerland ───────────────
  'CAN-BIH': { CAN: 'home', BIH: 'away' },          // M3:  BIH in white away
  'QAT-SUI': { QAT: 'home', SUI: 'away' },          // M4:  SUI notably in green away
  'CAN-QAT': { CAN: 'home', QAT: 'away' },          // M15: QAT in white away
  'BIH-SUI': { BIH: 'home', SUI: 'home' },          // M16: both home (blue vs red)
  'CAN-SUI': { CAN: 'home', SUI: 'away' },          // M35
  'BIH-QAT': { BIH: 'home', QAT: 'away' },          // M36

  // ── GROUP C — Brazil, Morocco, Haiti, Scotland ───────────────────────────────
  'BRA-MAR': { BRA: 'home', MAR: 'home' },          // M5:  both home (yellow vs red)
  'HAI-SCO': { HAI: 'home', SCO: 'away' },          // M6:  SCO pushed off navy by HAI white → red away
  'BRA-HAI': { BRA: 'home', HAI: 'away' },          // M11
  'MAR-SCO': { MAR: 'home', SCO: 'away' },          // M12
  'BRA-SCO': { BRA: 'home', SCO: 'home' },          // M37: SCO in home navy; BRA drops blue shorts
  'MAR-HAI': { MAR: 'home', HAI: 'away' },          // M38

  // ── GROUP D — USA, Paraguay, Australia, Türkiye ──────────────────────────────
  'USA-PAR': { USA: 'home', PAR: 'away' },          // M7:  PAR in navy storm away
  'AUS-TUR': { AUS: 'home', TUR: 'home' },          // M8:  both home (gold vs red)
  'USA-AUS': { USA: 'home', AUS: 'away' },          // M17
  'PAR-TUR': { PAR: 'home', TUR: 'away' },          // M18
  'USA-TUR': { USA: 'home', TUR: 'away' },          // M39
  'PAR-AUS': { PAR: 'home', AUS: 'away' },          // M40

  // ── GROUP E — Germany, Curaçao, Ivory Coast, Ecuador ────────────────────────
  'GER-CUW': { GER: 'home', CUW: 'home' },          // M9:  both home (white vs royal blue)
  'CUW-ECU': { CUW: 'away', ECU: 'home' },          // M20: CUW is fixture home team but wears away
  'GER-CIV': { GER: 'home', CIV: 'away' },          // M19
  'GER-ECU': { GER: 'home', ECU: 'away' },          // M41
  'CIV-CUW': { CIV: 'home' },                       // M42: CUW TBC

  // ── GROUP F — Netherlands, Japan, Sweden, Tunisia ────────────────────────────
  'NED-JPN': { NED: 'home', JPN: 'home' },          // M10: both home (orange vs blue)
  'SWE-TUN': { SWE: 'home', TUN: 'away' },          // M21: TUN in white away
  'JPN-TUN': { JPN: 'home', TUN: 'away' },          // M22
  'NED-TUN': { NED: 'home', TUN: 'away' },          // M43
  'JPN-SWE': { JPN: 'home', SWE: 'away' },          // M44

  // ── GROUP G — Belgium, Egypt, Iran, New Zealand ──────────────────────────────
  'BEL-EGY': { BEL: 'home', EGY: 'away' },          // M45: key — both red home kits
  'IRN-NZL': { IRN: 'home', NZL: 'away' },          // M46: both white home kits → NZL in away
  'BEL-IRN': { BEL: 'home', IRN: 'away' },          // M47: IRN in away despite no colour clash
  'EGY-NZL': { NZL: 'away' },                       // M48: EGY home TBC
  'BEL-NZL': { BEL: 'home', NZL: 'away' },          // M49
  'EGY-IRN': { IRN: 'away' },                       // M50: EGY home TBC; IRN in away

  // ── GROUP H — Spain, Cabo Verde, Saudi Arabia, Uruguay ───────────────────────
  'ESP-CPV': { ESP: 'home', CPV: 'away' },          // M23: CPV debut in all white
  'KSA-URU': { KSA: 'home', URU: 'home' },          // M24: KSA wore green home kit, no clash with URU sky blue
  'ESP-KSA': { ESP: 'home', KSA: 'away' },          // M51
  'URU-CPV': { URU: 'home', CPV: 'away' },          // M52: CPV in white away

  // ── GROUP I — France, Senegal, Norway, Iraq ──────────────────────────────────
  'FRA-SEN': { FRA: 'home', SEN: 'away' },          // M25
  'NOR-IRQ': { NOR: 'home', IRQ: 'away' },          // M26: IRQ in white away
  'FRA-NOR': { FRA: 'home', NOR: 'away' },          // M55
  'SEN-IRQ': { IRQ: 'away' },                       // M56: SEN TBC; IRQ in away
  'NOR-SEN': { NOR: 'home', SEN: 'away' },          // M58

  // ── GROUP J — Argentina, Algeria, Austria, Jordan ────────────────────────────
  'ARG-ALG': { ARG: 'home', ALG: 'home' },          // M27: both home (light blue vs white — no clash)
  'AUT-JOR': { AUT: 'home', JOR: 'away' },          // M28: JOR debut in white away
  'ARG-AUT': { ARG: 'home', AUT: 'away' },          // M59
  'ALG-JOR': { ALG: 'home', JOR: 'away' },          // M60

  // ── GROUP K — Portugal, Congo DR, Uzbekistan, Colombia ───────────────────────
  'POR-COD': { POR: 'home', COD: 'away' },          // M29
  'UZB-COL': { UZB: 'away', COL: 'home' },          // M30: UZB is fixture home but wears all-white away
  'POR-UZB': { POR: 'home', UZB: 'away' },          // M63: UZB away confirmed (all white)
  'COL-COD': { COL: 'home', COD: 'away' },          // M64
  'COD-UZB': { UZB: 'away' },                       // M66: UZB away confirmed; COD TBC

  // ── GROUP L — England, Croatia, Ghana, Panama ────────────────────────────────
  'ENG-CRO': { ENG: 'home', CRO: 'home' },          // M31: both home (all white vs red-white checks)
  'GHA-PAN': { GHA: 'away', PAN: 'away' },          // M32: GHA fixture home but wears yellow away; PAN also away
  'ENG-GHA': { ENG: 'home', GHA: 'away' },          // M67: GHA yellow away confirmed
  'CRO-PAN': { CRO: 'home', PAN: 'away' },          // M68
  'ENG-PAN': { ENG: 'home', PAN: 'away' },          // M69
  'CRO-GHA': { GHA: 'away' },                       // M70: GHA yellow away; CRO TBC
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
 * Returns the explicit FIFA kit designation for a team in a specific match,
 * or undefined if the match isn't in the table. Use this when the API has
 * provided a kit color but you want to override it with the known designation.
 */
export function lookupKitDesignation(
  homeTeamId: string,
  awayTeamId: string,
  teamId: string,
): KitType | undefined {
  return MATCH_KITS[`${homeTeamId}-${awayTeamId}`]?.[teamId];
}

/**
 * When the API hasn't provided kit colors yet, determine what kit a team
 * is likely wearing. Checks the FIFA designation table first, then falls
 * back to home-kit hue clash detection for unlisted matches.
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

/**
 * The actual color a team's kit shows for a given kit type — the team's
 * static (home) jerseyBg for 'home', or the extracted away/third kit color
 * (sampled from the kit PNG, see scripts/extract-kit-colors.mjs) when available,
 * falling back to jerseyBg if no away/third sample exists for that team.
 */
export function resolveKitColor(teamId: string, kitType: KitType): string | undefined {
  if (kitType !== 'home') {
    const sampled = KIT_COLORS[teamId]?.[kitType];
    if (sampled) return sampled;
  }
  return TEAMS[teamId]?.jerseyBg;
}
