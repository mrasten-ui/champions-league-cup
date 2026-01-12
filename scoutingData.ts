
import { ScoutingData, LanguageCode } from './types';

// 1. THE BASELINE (English Data for EVERY team)
// This ensures no field is ever empty, even if a specific translation is missing.
const BASE_ENGLISH_DATA: Record<string, Partial<ScoutingData>> = {
  ARG: { team_name: "Argentina", strengths: "Chameleon-like tactical flexibility. Messi factor.", weaknesses: "High defensive line vulnerable to counters. Aging core.", star_player: "Lionel Messi" },
  FRA: { team_name: "France", strengths: "Lethal transition attack. Incredible squad depth.", weaknesses: "Complacency against weaker teams.", star_player: "Kylian Mbappé" },
  USA: { team_name: "USA", strengths: "High-intensity pressing. Athletic midfield. Home advantage.", weaknesses: "Struggles to break down low blocks.", star_player: "Christian Pulisic" },
  ENG: { team_name: "England", strengths: "Dynamic midfield engine. Tactical flexibility.", weaknesses: "Weight of expectation. Conservative in big moments.", star_player: "Jude Bellingham" },
  BRA: { team_name: "Brazil", strengths: "Fluid attacking play. Individual brilliance.", weaknesses: "Full-backs leave gaps behind.", star_player: "Vinicius Jr" },
  SCO: { team_name: "Scotland", strengths: "High energy 'McTomadona' factor. Robertson's delivery.", weaknesses: "Lack of recovery pace in defense.", star_player: "Scott McTominay" },
  NOR: { team_name: "Norway", strengths: "Physical powerhouse front line (Haaland/Sørloth).", weaknesses: "Defensive depth is thin. Naive in transition.", star_player: "Erling Haaland" },
  GER: { team_name: "Germany", strengths: "Technical midfield dominance. Home soil history.", weaknesses: "Transition defense is fragile. Lack of a pure #9.", star_player: "Jamal Musiala" },
  ESP: { team_name: "Spain", strengths: "Elite possession and wing play (Yamal/Williams).", weaknesses: "Physicality in midfield battles. Vulnerable to counters.", star_player: "Lamine Yamal" },
  POR: { team_name: "Portugal", strengths: "Technically gifted squad. Bruno/Bernardo creativity.", weaknesses: "Balancing Ronaldo's role. Defensive transitions.", star_player: "Bruno Fernandes" },
  NED: { team_name: "Netherlands", strengths: "Solid defensive organization (Van Dijk). Tactical discipline.", weaknesses: "Lack of a world-class finisher. Predictable attack.", star_player: "Virgil van Dijk" },
  BEL: { team_name: "Belgium", strengths: "De Bruyne's vision. Doku's dribbling.", weaknesses: "Aging defense. Vulnerable to pace.", star_player: "Kevin De Bruyne" },
  ITA: { team_name: "Italy", strengths: "Tactical rigidity. Defensive shape.", weaknesses: "Lack of goalscorers. Rebuilding phase.", star_player: "Nicolo Barella" }, // Note: Italy might not be in 2026 config but good to have
  CRO: { team_name: "Croatia", strengths: "Midfield control (Modric). Tournament experience.", weaknesses: "Aging squad. Lack of speed.", star_player: "Luka Modric" },
  URU: { team_name: "Uruguay", strengths: "Bielsa's high intensity. Nunez's chaos.", weaknesses: "Defensive discipline. Burnout late in games.", star_player: "Darwin Nunez" },
  COL: { team_name: "Colombia", strengths: "Diaz's 1v1 ability. Set-piece threats.", weaknesses: "Inconsistency away from home.", star_player: "Luis Diaz" },
  JPN: { team_name: "Japan", strengths: "Technical, coordinated pressing. Wingers.", weaknesses: "Physicality in the box. Aerial duels.", star_player: "Kaoru Mitoma" },
  KOR: { team_name: "South Korea", strengths: "Son/Hwang counter-attack pace.", weaknesses: "Defensive errors. Over-reliance on stars.", star_player: "Son Heung-min" },
  AUS: { team_name: "Australia", strengths: "Physicality and aerial threat. Organization.", weaknesses: "Lack of technical creativity.", star_player: "Harry Souttar" },
  IRN: { team_name: "Iran", strengths: "Compact low block. Taremi/Azmoun partnership.", weaknesses: "Possession under pressure.", star_player: "Mehdi Taremi" },
  KSA: { team_name: "Saudi Arabia", strengths: "Fearless high line. Technical wingers.", weaknesses: "High line is high risk. Physical mismatch.", star_player: "Salem Al-Dawsari" },
  QAT: { team_name: "Qatar", strengths: "Afif/Ali chemistry. Home region comfort.", weaknesses: "Physical size. Defensive naivety.", star_player: "Akram Afif" },
  MAR: { team_name: "Morocco", strengths: "Elite fullback pairing. Defensive shape.", weaknesses: "Breaking down deep blocks.", star_player: "Achraf Hakimi" },
  SEN: { team_name: "Senegal", strengths: "Physical power spine. Vertical speed.", weaknesses: "Creativity against low blocks.", star_player: "Sadio Mané" },
  EGY: { team_name: "Egypt", strengths: "Salah isolation. Defensive solidity.", weaknesses: "Over-reliance on Salah.", star_player: "Mohamed Salah" },
  NGA: { team_name: "Nigeria", strengths: "Osimhen's power. Attacking depth.", weaknesses: "Goalkeeping. Tactical discipline.", star_player: "Victor Osimhen" },
  CIV: { team_name: "Ivory Coast", strengths: "Midfield dominance. Haller hold-up play.", weaknesses: "Tactical focus.", star_player: "Sébastien Haller" },
  GHA: { team_name: "Ghana", strengths: "Kudus individual brilliance. Athleticism.", weaknesses: "Defensive organization.", star_player: "Mohammed Kudus" },
  MEX: { team_name: "Mexico", strengths: "Azteca advantage. Technical midfield.", weaknesses: "Lack of a clinical striker. Set-piece defense.", star_player: "Edson Alvarez" },
  CAN: { team_name: "Canada", strengths: "Davies/David speed. Counter-attacks.", weaknesses: "Defensive depth. Concacaf transition.", star_player: "Alphonso Davies" },
  PAN: { team_name: "Panama", strengths: "Physical disruption. Wing-back play.", weaknesses: "Finishing consistency.", star_player: "Adalberto Carrasquilla" },
  CRC: { team_name: "Costa Rica", strengths: "Defensive low block. Counter-attacks.", weaknesses: "Aging core. Lack of firepower.", star_player: "Manfred Ugalde" },
  PAR: { team_name: "Paraguay", strengths: "Low block defense. Aerial strength.", weaknesses: "Possession play. Chasing games.", star_player: "Miguel Almirón" },
  ECU: { team_name: "Ecuador", strengths: "Caicedo midfield engine. Physicality.", weaknesses: "Finishing. Discipline.", star_player: "Moisés Caicedo" },
  CHI: { team_name: "Chile", strengths: "High press legacy. Aggression.", weaknesses: "Aging golden generation.", star_player: "Alexis Sanchez" },
  PER: { team_name: "Peru", strengths: "Technical passing. Team spirit.", weaknesses: "Lack of goal scorers.", star_player: "Gianluca Lapadula" },
  VEN: { team_name: "Venezuela", strengths: "Physicality. Soteldo's dribbling.", weaknesses: "Defensive consistency.", star_player: "Yeferson Soteldo" },
  BOL: { team_name: "Bolivia", strengths: "Altitude advantage. Long shots.", weaknesses: "Away form. Defense.", star_player: "Ramiro Vaca" },
  NZL: { team_name: "New Zealand", strengths: "Aerial dominance. Chris Wood.", weaknesses: "One-dimensional attack.", star_player: "Chris Wood" },
  UZB: { team_name: "Uzbekistan", strengths: "Physical strength. Organization.", weaknesses: "Pace in wide areas.", star_player: "Eldor Shomurodov" },
  JOR: { team_name: "Jordan", strengths: "Al-Taamari dribbling. Energy.", weaknesses: "Defensive discipline.", star_player: "Mousa Al-Taamari" },
  UAE: { team_name: "UAE", strengths: "Technical ability. Home climate.", weaknesses: "Physicality.", star_player: "Fabio Lima" },
  IRQ: { team_name: "Iraq", strengths: "Fighting spirit. Aerial threat.", weaknesses: "Emotional control.", star_player: "Aymen Hussein" },
  OMA: { team_name: "Oman", strengths: "Defensive organization.", weaknesses: "Goal scoring.", star_player: "Salaah Al-Yahyaei" },
  ALB: { team_name: "Albania", strengths: "Tactical discipline. Broja outlet.", weaknesses: "Creativity.", star_player: "Armando Broja" },
  CZE: { team_name: "Czechia", strengths: "Physicality. Set-pieces.", weaknesses: "Speed.", star_player: "Tomas Soucek" },
  AUT: { team_name: "Austria", strengths: "Rangnick's high press.", weaknesses: "Plan B against low block.", star_player: "David Alaba" },
  HUN: { team_name: "Hungary", strengths: "Szoboszlai set-pieces. Chemistry.", weaknesses: "Defensive depth.", star_player: "Dominik Szoboszlai" },
  SRB: { team_name: "Serbia", strengths: "Aerial power (Mitrovic/Vlahovic).", weaknesses: "Defensive mobility.", star_player: "Aleksandar Mitrovic" },
  SUI: { team_name: "Switzerland", strengths: "Tournament consistency. Xhaka control.", weaknesses: "Explosiveness.", star_player: "Granit Xhaka" },
  DEN: { team_name: "Denmark", strengths: "Team cohesion. Hojlund pace.", weaknesses: "Creativity against deep blocks.", star_player: "Rasmus Hojlund" },
  UKR: { team_name: "Ukraine", strengths: "Emotional drive. Mudryk pace.", weaknesses: "Consistency.", star_player: "Artem Dovbyk" },
  POL: { team_name: "Poland", strengths: "Lewandowski finishing.", weaknesses: "Reliance on one man.", star_player: "Robert Lewandowski" },
  SWE: { team_name: "Sweden", strengths: "Isak/Gyokeres attack.", weaknesses: "Defensive transition.", star_player: "Alexander Isak" },
  TUR: { team_name: "Turkey", strengths: "Güler/Yildiz flair. Passion.", weaknesses: "Emotional volatility.", star_player: "Arda Güler" },
  WAL: { team_name: "Wales", strengths: "Johnson pace. Team spirit.", weaknesses: "Lack of stars.", star_player: "Brennan Johnson" },
  SVK: { team_name: "Slovakia", strengths: "Lobotka midfield control.", weaknesses: "Goal scoring.", star_player: "Stanislav Lobotka" },
  ROU: { team_name: "Romania", strengths: "Defensive unity.", weaknesses: "Star power.", star_player: "Radu Dragusin" },
  SVN: { team_name: "Slovenia", strengths: "Oblak in goal. Sesko potential.", weaknesses: "Depth.", star_player: "Benjamin Sesko" },
  GEO: { team_name: "Georgia", strengths: "Kvaratskhelia magic.", weaknesses: "Defense.", star_player: "Khvicha Kvaratskhelia" },
  RSA: { team_name: "South Africa", strengths: "Sundowns chemistry. Passing.", weaknesses: "Finishing.", star_player: "Ronwen Williams" },
  TUN: { team_name: "Tunisia", strengths: "Defensive block.", weaknesses: "Attack.", star_player: "Ellyes Skhiri" },
  ALG: { team_name: "Algeria", strengths: "Technical quality.", weaknesses: "Mentality.", star_player: "Riyad Mahrez" },
  CMR: { team_name: "Cameroon", strengths: "Onana distribution. Physicality.", weaknesses: "Chaos.", star_player: "Andre Onana" },
  MLI: { team_name: "Mali", strengths: "Midfield power (Bissouma).", weaknesses: "Strikers.", star_player: "Yves Bissouma" },
  BFA: { team_name: "Burkina Faso", strengths: "Physicality. Tapsoba defense.", weaknesses: "Depth.", star_player: "Edmond Tapsoba" },
  HAI: { team_name: "Haiti", strengths: "Chaos factor. Aerials.", weaknesses: "Tactics.", star_player: "Frantzdy Pierrot" },
  JAM: { team_name: "Jamaica", strengths: "Antonio/Bailey pace.", weaknesses: "Organization.", star_player: "Leon Bailey" },
  HON: { team_name: "Honduras", strengths: "Aggression.", weaknesses: "Quality.", star_player: "Luis Palma" },
  SLV: { team_name: "El Salvador", strengths: "Defensive grit.", weaknesses: "Goals.", star_player: "Alex Roldan" },
  GUA: { team_name: "Guatemala", strengths: "Team work.", weaknesses: "Size.", star_player: "Nathaniel Mendez-Laing" },
  TRI: { team_name: "Trinidad & Tobago", strengths: "Physicality.", weaknesses: "Technical level.", star_player: "Levi Garcia" },
  CUW: { team_name: "Curacao", strengths: "Dutch technical school.", weaknesses: "Defense.", star_player: "Juninho Bacuna" },
  SUR: { team_name: "Suriname", strengths: "Becker speed.", weaknesses: "Chemistry.", star_player: "Sheraldo Becker" },
  NCL: { team_name: "New Caledonia", strengths: "Low block.", weaknesses: "Amateur fitness.", star_player: "Emmanuel Richard" },
  FIJ: { team_name: "Fiji", strengths: "Krishna leadership.", weaknesses: "Experience.", star_player: "Roy Krishna" },
  TAH: { team_name: "Tahiti", strengths: "Tehau family.", weaknesses: "Pro level.", star_player: "Teaonui Tehau" },
  SOL: { team_name: "Solomon Islands", strengths: "Futsal skills.", weaknesses: "Tactics.", star_player: "Raphael Lea'i" },
  PNG: { team_name: "Papua New Guinea", strengths: "Speed.", weaknesses: "Structure.", star_player: "Tommy Semmy" },
  TBD: { team_name: "TBD", strengths: "Unknown", weaknesses: "Unknown", star_player: "Unknown" }
};

// 2. THE OVERRIDES (Localized fun descriptions)
// Only define these if they differ significantly or offer a fun translation.
const LOCALIZED_OVERRIDES: Record<string, Partial<Record<LanguageCode, Partial<ScoutingData>>>> = {
  ARG: {
    NO: { strengths: "Taktisk fleksibilitet i verdensklasse. Messi styrer showet.", weaknesses: "Høyt press etterlater rom bak forsvaret." },
    SCO: { strengths: "Changes tactics mair than I change socks. Messi's pure magic.", weaknesses: "Defense pushes up higher than a Glasgow rent price." },
    US: { strengths: "Elite roster versatility. Messi is the GOAT.", weaknesses: "Defense susceptible to the deep ball." }
  },
  FRA: {
    NO: { strengths: "Verdens raskeste kontringsspill. Enorm bredde.", weaknesses: "Kan undervurdere svakere motstand." },
    SCO: { strengths: "Fast as lightning. Bench is better than our starters.", weaknesses: "Think they've won it before kickoff." },
    US: { strengths: "Explosive offense. Deepest bench in the tourney.", weaknesses: "Mental game can be shaky." }
  },
  SCO: {
    NO: { strengths: "Innsats og McTominay sine løp.", weaknesses: "Tregt forsvar. Sårbare for bakrom." },
    SCO: { strengths: "McTomadona is the goat. Pure passion man.", weaknesses: "We'll find a way tae mess it up. Guarantee it." },
    US: { strengths: "Gritty underdog spirit. Midfield scoring threat.", weaknesses: "Defense lacks speed. Get burned deep." }
  },
  NOR: {
    NO: { strengths: "Verdens beste spiss. Fysisk monster-angrep.", weaknesses: "Tynt forsvar. Slipper inn enkle mål." },
    SCO: { strengths: "Big Haaland is a robot. Scary stuff.", weaknesses: "Back line is pure mince. Easy to score on." },
    US: { strengths: "Haaland is a cheat code. Power offense.", weaknesses: "Defense is leaky. No depth." }
  },
  PAR: {
    SCO: { strengths: "Defend like their lives depend on it. Pure dour stuff.", weaknesses: "Cannae string two passes together." }
  },
  USA: {
    SCO: { strengths: "Run aboot like madmen. Home crowd goes wild.", weaknesses: "Nae idea how to score if ye park the bus." }
  },
  // Add more overrides here as needed without fearing for missing data in other teams
};

// Helper generator to safely fallback if even English is missing (shouldn't happen with BASE_ENGLISH_DATA)
const generateFallback = (code: string, lang: LanguageCode) => {
    const templates = {
        EN: { s: "Competitive spirit.", w: "Inconsistency." },
        NO: { s: "Konkurranseinstinkt.", w: "Ustabile prestasjoner." },
        SCO: { s: "Got a bit of fight.", w: "Pure inconsistent." },
        US: { s: "High motor.", w: "Inconsistent." }
    };
    return {
        team_name: code,
        strengths: templates[lang].s,
        weaknesses: templates[lang].w,
        star_player: "Key Player"
    };
};

export const getScoutingReport = (teamId: string, lang: LanguageCode): Partial<ScoutingData> => {
    // 1. Get Base English Data
    const base = BASE_ENGLISH_DATA[teamId] || generateFallback(teamId, 'EN');

    // 2. Check for Override
    const overrides = LOCALIZED_OVERRIDES[teamId]?.[lang];

    // 3. Merge: Override takes precedence, Base fills gaps
    return {
        ...base,
        ...overrides,
        id: 0, 
        team_id: teamId,
        confederation: 'FIFA',
        fifa_rank: 50
    };
};

export const SCOUTING_REPORTS: Record<string, Partial<ScoutingData>> = {};
