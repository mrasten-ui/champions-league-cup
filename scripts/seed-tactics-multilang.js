import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load Env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
else dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// THE MASTER TACTICS LIST (48 Teams x 4 Languages)
const TACTICS = [
  // --- GROUP A ---
  { 
    team_id: 'MEX', style: 'Possession', att: 82, mid: 84, def: 78, pace: 80, phys: 76, tech: 85, key_player_role: 'El Mago', 
    narrative: {
      EN: "Technical, rapid passing. Can lose focus at the back.",
      NO: "Teknisk og hurtig pasningsspill. Kan miste fokus bakover.",
      SCO: "Tipy tappy fitbaw. Bonny tae watch, but can they defend?",
      US: "Tiki-taka style. High possession, questionable defense."
    }
  },
  { 
    team_id: 'RSA', style: 'Counter Attack', att: 76, mid: 75, def: 74, pace: 88, phys: 78, tech: 79, key_player_role: 'Speedster', 
    narrative: {
      EN: "Chaotic energy and blistering pace on the break.",
      NO: "Kaotisk energi og lynhurtige kontringer.",
      SCO: "Pure chaos man. Fast as lightning on the break.",
      US: "Fast break offense. They thrive in transition."
    }
  },
  { 
    team_id: 'KOR', style: 'High Press', att: 83, mid: 80, def: 78, pace: 86, phys: 82, tech: 80, key_player_role: 'The Captain', 
    narrative: {
      EN: "Relentless running. They never stop chasing.",
      NO: "Utrettelig løping. De stopper aldri å jage.",
      SCO: "They run aboot like madmen. Never gie ye a minute's peace.",
      US: "High motor team. Relentless full-court press."
    }
  },
  { 
    team_id: 'CZE', style: 'Physical', att: 78, mid: 79, def: 81, pace: 74, phys: 88, tech: 76, key_player_role: 'Target Man', 
    narrative: {
      EN: "Aerial dominance. Dangerous on set pieces.",
      NO: "Luftstyrke. Farlige på dødballer.",
      SCO: "Big lads at the back. Dinnae gie away a corner.",
      US: "Size advantage. They dominate the aerial matchups."
    }
  },

  // --- GROUP B ---
  { 
    team_id: 'CAN', style: 'Direct', att: 81, mid: 78, def: 76, pace: 92, phys: 84, tech: 75, key_player_role: 'The Phenom', 
    narrative: {
      EN: "Use the wings and run at them. Pure speed.",
      NO: "Bruker kantene og kjører på. Ren fart.",
      SCO: "Pace abuse via the wings. Catch them if ye can.",
      US: "Speed kills. They stretch the field vertically."
    }
  },
  { 
    team_id: 'BIH', style: 'Balanced', att: 77, mid: 78, def: 75, pace: 72, phys: 84, tech: 78, key_player_role: 'Veteran', 
    narrative: {
      EN: "Experience through the middle, but slow.",
      NO: "Erfaring sentralt, men mangler fart.",
      SCO: "Old heids in the middle. A bit slow on the turn.",
      US: "Veteran leadership. High IQ, low speed."
    }
  },
  { 
    team_id: 'QAT', style: 'Possession', att: 74, mid: 76, def: 70, pace: 78, phys: 68, tech: 75, key_player_role: 'Playmaker', 
    narrative: {
      EN: "Disciplined shape but lacks physical bite.",
      NO: "Disiplinert struktur, men mangler fysikk.",
      SCO: "Neat passing, but they get bullied aff the baw.",
      US: "Technical team, but they get pushed around in the trenches."
    }
  },
  { 
    team_id: 'SUI', style: 'Low Block', att: 79, mid: 83, def: 86, pace: 75, phys: 82, tech: 80, key_player_role: 'The Wall', 
    narrative: {
      EN: "Hardest team to beat. Organized and frustrating.",
      NO: "Vanskelige å slå. Organiserte og frustrerende.",
      SCO: "Absolute nightmare tae break doon. Boring but effective.",
      US: "Elite defense. They park the bus and execute."
    }
  },

  // --- GROUP C ---
  { 
    team_id: 'HAI', style: 'Counter Attack', att: 72, mid: 70, def: 68, pace: 85, phys: 78, tech: 74, key_player_role: 'Underdog', 
    narrative: {
      EN: "Looking for a miracle counter. Fearless.",
      NO: "Jager en mirakelkontring. Fryktløse.",
      SCO: "Hoping for a lucky break. Gie it a lash, son.",
      US: "Cinderella story. Looking for that one highlight play."
    }
  },
  { 
    team_id: 'SCO', style: 'Low Block', att: 76, mid: 82, def: 80, pace: 72, phys: 90, tech: 74, key_player_role: 'The Enforcer', 
    narrative: {
      EN: "Park the bus and pray for a set piece goal.",
      NO: "Parkerer bussen og ber om mål på dødball.",
      SCO: "Get stuck in! 11 men behind the baw. Pure pashun.",
      US: "Grind it out. Defense and set plays."
    }
  },
  { 
    team_id: 'BRA', style: 'Possession', att: 94, mid: 88, def: 82, pace: 86, phys: 78, tech: 96, key_player_role: 'Samba King', 
    narrative: {
      EN: "Flair, tricks, and goals. They want to walk it in.",
      NO: "Sambafotball. De vil danse ballen i mål.",
      SCO: "Pure samba magic man. They dinnae walk, they dance.",
      US: "Joga Bonito. Highlight reel plays all day."
    }
  },
  { 
    team_id: 'MAR', style: 'Low Block', att: 84, mid: 85, def: 90, pace: 82, phys: 80, tech: 86, key_player_role: 'Fullback', 
    narrative: {
      EN: "Defensive masters who can kill you with skill.",
      NO: "Defensive mestere som kan straffe deg med teknikk.",
      SCO: "Solid at the back, deadly on the wings.",
      US: "Lockdown defense with elite wing play."
    }
  },

  // --- GROUP D ---
  { 
    team_id: 'USA', style: 'High Press', att: 82, mid: 84, def: 79, pace: 90, phys: 86, tech: 78, key_player_role: 'Captain America', 
    narrative: {
      EN: "Athletic, aggressive, and chaotic. Pressing machines.",
      NO: "Atletiske, aggressive og kaotiske. Pressmaskiner.",
      SCO: "Run run run. They never stop, pure energy.",
      US: "Defense wins championships. High intensity, 110% effort."
    }
  },
  { 
    team_id: 'PAR', style: 'Physical', att: 75, mid: 76, def: 80, pace: 74, phys: 92, tech: 72, key_player_role: 'Fighter', 
    narrative: {
      EN: "Tough tackling. They make it a fight.",
      NO: "Harde taklinger. De lager krig utpå der.",
      SCO: "Dirty Leeds style. They kick lumps oot ye.",
      US: "Physical defense. They bring the pain."
    }
  },
  { 
    team_id: 'AUS', style: 'Direct', att: 76, mid: 78, def: 80, pace: 80, phys: 88, tech: 72, key_player_role: 'Winger', 
    narrative: {
      EN: "Hard working and physical. Will cross it all day.",
      NO: "Hardtarbeidende og fysiske. Innlegg hele dagen.",
      SCO: "Big lads, get it in the mixer!",
      US: "Blue collar team. Grind it out on the boards."
    }
  },
  { 
    team_id: 'KOS', style: 'Balanced', att: 72, mid: 74, def: 70, pace: 76, phys: 78, tech: 74, key_player_role: 'Newcomer', 
    narrative: {
      EN: "Technically sound but inexperienced.",
      NO: "Teknisk gode, men uerfarne.",
      SCO: "No bad wi the ball, but a bit green.",
      US: "Young roster. Good fundamentals, lack experience."
    }
  },

  // --- GROUP E ---
  { 
    team_id: 'GER', style: 'High Press', att: 88, mid: 90, def: 84, pace: 82, phys: 86, tech: 88, key_player_role: 'The Machine', 
    narrative: {
      EN: "Efficient, organized, and ruthless. A tournament team.",
      NO: "Effektive, organiserte og nådeløse. Et turneringslag.",
      SCO: "Typical Germans. Efficient machine. Aye, they'll win.",
      US: "Fundamental excellence. They execute the game plan perfectly."
    }
  },
  { 
    team_id: 'CUW', style: 'Counter Attack', att: 70, mid: 68, def: 65, pace: 80, phys: 74, tech: 72, key_player_role: 'Wildcard', 
    narrative: {
      EN: "Complete unknowns. Will rely on individual moments.",
      NO: "Helt ukjente. Stoler på enkeltprestasjoner.",
      SCO: "Who? Never heard of them. Watch them score a screamer.",
      US: "Wildcard team. Relying on hero ball."
    }
  },
  { 
    team_id: 'CIV', style: 'Physical', att: 82, mid: 84, def: 80, pace: 86, phys: 94, tech: 82, key_player_role: 'Powerhouse', 
    narrative: {
      EN: "Too strong for most teams. Pace and power.",
      NO: "For sterke for de fleste. Fart og kraft.",
      SCO: "Absolute units. Ye bounce aff them.",
      US: "Physical mismatch. Too big, too strong, too fast."
    }
  },
  { 
    team_id: 'ECU', style: 'High Press', att: 78, mid: 80, def: 78, pace: 88, phys: 84, tech: 76, key_player_role: 'Engine', 
    narrative: {
      EN: "High altitude lungs. They run for 90 minutes.",
      NO: "Høydehus-lunger. De løper i 90 minutter.",
      SCO: "Fitness levels are aff the charts. Never tire.",
      US: "Conditioning is elite. They outwork everyone."
    }
  },

  // --- GROUP F ---
  { 
    team_id: 'NED', style: 'Possession', att: 86, mid: 88, def: 88, pace: 84, phys: 84, tech: 88, key_player_role: 'Total Footballer', 
    narrative: {
      EN: "Tactical flexibility. Risky high line.",
      NO: "Taktisk fleksibilitet. Risikabel høy linje.",
      SCO: "Total Football? Total chaos at the back sometimes.",
      US: "System offense. High risk, high reward."
    }
  },
  { 
    team_id: 'JPN', style: 'Counter Attack', att: 82, mid: 84, def: 80, pace: 88, phys: 70, tech: 88, key_player_role: 'Samurai', 
    narrative: {
      EN: "Technical precision and lethal counters.",
      NO: "Teknisk presisjon og dødelige kontringer.",
      SCO: "Sharp as a tack. Do not blink or they'll score.",
      US: "Surgical execution. Fast break specialists."
    }
  },
  { 
    team_id: 'ALB', style: 'Low Block', att: 70, mid: 72, def: 78, pace: 74, phys: 82, tech: 68, key_player_role: 'Defender', 
    narrative: {
      EN: "Sit deep, frustrate, and clear the lines.",
      NO: "Ligger dypt, frustrerer og klarerer.",
      SCO: "Anti-fitbaw. They're here for a 0-0.",
      US: "Parking the bus. Playing for the draw."
    }
  },
  { 
    team_id: 'TUN', style: 'Low Block', att: 72, mid: 76, def: 78, pace: 72, phys: 80, tech: 74, key_player_role: 'Grinder', 
    narrative: {
      EN: "Slow the game down. Hard to break down.",
      NO: "Senker tempoet. Vanskelig å bryte ned.",
      SCO: "Scrappy game. Lots of fouls and wasting time.",
      US: "Grind it out. Ugly wins count too."
    }
  },

  // --- GROUP G ---
  { 
    team_id: 'BEL', style: 'Possession', att: 88, mid: 92, def: 78, pace: 80, phys: 82, tech: 90, key_player_role: 'The King', 
    narrative: {
      EN: "Golden generation aging, but still elite passers.",
      NO: "Den gylne generasjonen eldes, men passer fortsatt bra.",
      SCO: "Getting a bit auld noo. Still got the tekkers though.",
      US: "Veteran squad. Window is closing, but talent is there."
    }
  },
  { 
    team_id: 'EGY', style: 'Counter Attack', att: 82, mid: 74, def: 72, pace: 90, phys: 78, tech: 82, key_player_role: 'The Pharaoh', 
    narrative: {
      EN: "Give it to the star man and let him cook.",
      NO: "Gi ballen til stjerna og la ham herje.",
      SCO: "Pass it tae Salah. That's the hale tactic.",
      US: "Hero ball. Give it to the MVP and get out of the way."
    }
  },
  { 
    team_id: 'IRN', style: 'Low Block', att: 78, mid: 76, def: 82, pace: 78, phys: 84, tech: 74, key_player_role: 'Striker', 
    narrative: {
      EN: "Defensively solid, dangerous on the break.",
      NO: "Defensivt solide, farlige på overganger.",
      SCO: "Tough nut tae crack. Dinnae underestimate them.",
      US: "Solid D, opportunistic offense."
    }
  },
  { 
    team_id: 'NZL', style: 'Physical', att: 72, mid: 70, def: 74, pace: 76, phys: 86, tech: 68, key_player_role: 'Aerial Threat', 
    narrative: {
      EN: "Physical and direct. Strong in the air.",
      NO: "Fysiske og direkte. Sterke i lufta.",
      SCO: "Rugby players playing fitbaw. Big lads.",
      US: "Physical playstyle. They dominate the boards."
    }
  },

  // --- GROUP H ---
  { 
    team_id: 'ESP', style: 'Possession', att: 86, mid: 94, def: 84, pace: 82, phys: 74, tech: 95, key_player_role: 'Pass Master', 
    narrative: {
      EN: "Death by 1000 passes. Can they finish?",
      NO: "Død ved 1000 pasninger. Kan de avslutte?",
      SCO: "Pass pass pass. Just shoot the baw man!",
      US: "Ball control clinic. But can they put it in the net?"
    }
  },
  { 
    team_id: 'CPV', style: 'Counter Attack', att: 74, mid: 72, def: 70, pace: 84, phys: 76, tech: 78, key_player_role: 'Winger', 
    narrative: {
      EN: "Fast, fun, and fearless. Chaos potential.",
      NO: "Raske, morsomme og fryktløse. Kaospotensial.",
      SCO: "Wee islanders wi big hearts and fast feet.",
      US: "Fun team to watch. High tempo, high energy."
    }
  },
  { 
    team_id: 'KSA', style: 'High Press', att: 78, mid: 76, def: 72, pace: 80, phys: 74, tech: 78, key_player_role: 'Energy', 
    narrative: {
      EN: "Fearless high line. Upsets happen here.",
      NO: "Fryktløs høy linje. Sjokkresultater skjer her.",
      SCO: "Suicide high line. Brave or stupid? We'll see.",
      US: "Aggressive defense. They gamble for steals."
    }
  },
  { 
    team_id: 'URU', style: 'Direct', att: 84, mid: 85, def: 86, pace: 82, phys: 92, tech: 82, key_player_role: 'Garra', 
    narrative: {
      EN: "Aggressive, passionate, and relentless.",
      NO: "Aggressive, lidenskapelige og utrettelige.",
      SCO: "Proper fighters. They'd tackle their ain granny.",
      US: "High intensity. They play with a chip on their shoulder."
    }
  },

  // --- GROUP I ---
  { 
    team_id: 'FRA', style: 'Balanced', att: 94, mid: 88, def: 88, pace: 95, phys: 90, tech: 90, key_player_role: 'Superstar', 
    narrative: {
      EN: "The ultimate team. No weaknesses.",
      NO: "Det ultimate laget. Ingen svakheter.",
      SCO: "Best in the world. Annoyingly good.",
      US: "Loaded roster. Superteam status."
    }
  },
  { 
    team_id: 'SEN', style: 'Physical', att: 82, mid: 80, def: 84, pace: 90, phys: 90, tech: 80, key_player_role: 'Lion', 
    narrative: {
      EN: "Strong spine and rapid wingers.",
      NO: "Sterk sentrallinje og raske vinger.",
      SCO: "Power and pace. A proper handful.",
      US: "Strong core, fast edges. Athletic mismatch."
    }
  },
  { 
    team_id: 'BOL', style: 'Low Block', att: 70, mid: 68, def: 72, pace: 68, phys: 76, tech: 70, key_player_role: 'Fighter', 
    narrative: {
      EN: "Away from home altitude, they struggle.",
      NO: "Uten høydefordelen sliter de.",
      SCO: "Nae mountains here lads. Ye might struggle.",
      US: "Home field advantage is gone. Tough road game."
    }
  },
  { 
    team_id: 'NOR', style: 'Direct', att: 86, mid: 78, def: 74, pace: 84, phys: 90, tech: 76, key_player_role: 'The Viking', 
    narrative: {
      EN: "Get the ball to the Robot up top. Goal guaranteed.",
      NO: "Få ballen til Brauten på topp. Målgaranti.",
      SCO: "Just hoof it tae the big man up front. Easy.",
      US: "Feed the beast. He scores when he wants."
    }
  },

  // --- GROUP J ---
  { 
    team_id: 'ARG', style: 'Possession', att: 92, mid: 88, def: 84, pace: 78, phys: 86, tech: 92, key_player_role: 'The GOAT', 
    narrative: {
      EN: "Controlled aggression. They fight for every inch.",
      NO: "Kontrollert aggresjon. De kjemper for hver meter.",
      SCO: "Nasty wee players. But pure magic wi the ball.",
      US: "Gritty playmakers. They got that dawg in them."
    }
  },
  { 
    team_id: 'ALG', style: 'Technical', att: 80, mid: 82, def: 76, pace: 80, phys: 78, tech: 86, key_player_role: 'Dribbler', 
    narrative: {
      EN: "Skillful and tricky, but can lose discipline.",
      NO: "Ferdighetsrike og tekniske, men kan miste hodet.",
      SCO: "Silky skills, but they lose the heid easily.",
      US: "Flashy handles, but prone to technical fouls."
    }
  },
  { 
    team_id: 'AUT', style: 'High Press', att: 78, mid: 82, def: 80, pace: 82, phys: 84, tech: 78, key_player_role: 'System Player', 
    narrative: {
      EN: "Organized chaos. Relentless pressing.",
      NO: "Organisert kaos. Utrettelig pressing.",
      SCO: "Like watching Red Bull on a pitch. Fast and furious.",
      US: "Full court press. High energy system."
    }
  },
  { 
    team_id: 'JOR', style: 'Counter Attack', att: 74, mid: 70, def: 72, pace: 80, phys: 74, tech: 76, key_player_role: 'Playmaker', 
    narrative: {
      EN: "Capable of shocking big teams on the break.",
      NO: "Kan sjokkere store lag på overganger.",
      SCO: "Banana skin team. Watch oot.",
      US: "Trap game opponent. Do not sleep on them."
    }
  },

  // --- GROUP K ---
  { 
    team_id: 'POR', style: 'Possession', att: 90, mid: 92, def: 86, pace: 84, phys: 80, tech: 94, key_player_role: 'Icon', 
    narrative: {
      EN: "Stacked with talent. Ego management is key.",
      NO: "Proppfull av talent. Ego-håndtering er nøkkelen.",
      SCO: "Too many superstars, not enough baw.",
      US: "Stacked roster. Championship or bust."
    }
  },
  { 
    team_id: 'COD', style: 'Physical', att: 78, mid: 76, def: 74, pace: 88, phys: 90, tech: 78, key_player_role: 'Power', 
    narrative: {
      EN: "Strong, fast, and unpredictable.",
      NO: "Sterke, raske og uforutsigbare.",
      SCO: "Athletic monsters. Good luck stopping them.",
      US: "Freak athletes. Highlight reel potential."
    }
  },
  { 
    team_id: 'UZB', style: 'Balanced', att: 72, mid: 74, def: 72, pace: 74, phys: 78, tech: 72, key_player_role: 'Worker', 
    narrative: {
      EN: "Hard working unit. Will not give up easily.",
      NO: "Hardtarbeidende enhet. Gir seg ikke lett.",
      SCO: "Grafters. They'll run all day for ye.",
      US: "Blue collar squad. High effort plays."
    }
  },
  { 
    team_id: 'COL', style: 'Counter Attack', att: 84, mid: 80, def: 78, pace: 88, phys: 82, tech: 86, key_player_role: 'Flair', 
    narrative: {
      EN: "Electric wingers and flair. Fun to watch.",
      NO: "Elektriske vinger og teknikk. Morsomme å se på.",
      SCO: "Bags of flair. Great tae watch, dodgy at the back.",
      US: "Showtime offense. High scoring potential."
    }
  },

  // --- GROUP L ---
  { 
    team_id: 'ENG', style: 'Balanced', att: 90, mid: 90, def: 86, pace: 84, phys: 84, tech: 88, key_player_role: 'Playmaker', 
    narrative: {
      EN: "High expectations. Methodical build up.",
      NO: "Høye forventninger. Metodisk oppbygging.",
      SCO: "It's comin hame? Aye right. Bottlers.",
      US: "Perennial contenders. Is this finally their year?"
    }
  },
  { 
    team_id: 'CRO', style: 'Possession', att: 80, mid: 88, def: 84, pace: 72, phys: 80, tech: 88, key_player_role: 'Maestro', 
    narrative: {
      EN: "Masters of the midfield. Hard to get the ball from.",
      NO: "Midtbanemestere. Vanskelig å ta ballen fra dem.",
      SCO: "Keep the baw for fun. Never give it away.",
      US: "Midfield clinic. They control the tempo."
    }
  },
  { 
    team_id: 'GHA', style: 'Counter Attack', att: 78, mid: 80, def: 74, pace: 88, phys: 82, tech: 80, key_player_role: 'Star', 
    narrative: {
      EN: "Individual brilliance and pace.",
      NO: "Individuell briljanse og fart.",
      SCO: "Fast and skillful. Watch the solo runs.",
      US: "Iso scorers. Give them space and they score."
    }
  },
  { 
    team_id: 'PAN', style: 'Physical', att: 72, mid: 70, def: 74, pace: 78, phys: 86, tech: 70, key_player_role: 'Defender', 
    narrative: {
      EN: "Tough, gritty, and defensive.",
      NO: "Tøffe, harde og defensive.",
      SCO: "Scrappy. Not pretty tae watch.",
      US: "Defensive minded. Ugly game specialists."
    }
  },
];

async function seedTactics() {
  console.log('🧠 Seeding Localized Tactical DNA...');
  
  const { error } = await supabase
    .from('team_tactics')
    .upsert(TACTICS, { onConflict: 'team_id' });

  if (error) {
    console.error('❌ Error uploading tactics:', error);
  } else {
    console.log('✅ Success! The Analyst Desk is now multilingual.');
  }
}

seedTactics();