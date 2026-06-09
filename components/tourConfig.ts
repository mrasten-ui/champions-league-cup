import { TourStep } from '../types';

export const PRE_SEASON_TOUR: TourStep[] = [
  // STOP 1: THE WELCOME
  {
    id: 'welcome',
    position: 'center',
    overlayType: 'none',
    audioFiles: {
      en: '/audio/tour_pre_en_01.mp3',
      'en-US': '/audio/tour_pre_us_01.mp3',
      no: '/audio/tour_pre_no_01.mp3',
      sco: '/audio/tour_pre_sco_01.mp3'
    },
    display: {
      en:      { title: "Welcome",    lines: ["Welcome to The Rasten Cup.", "Follow this tour to learn how to play."] },
      'en-US': { title: "Welcome",    lines: ["Welcome to The Rasten Cup.", "Follow this tour to learn how to play."] },
      sco:     { title: "Welcome",    lines: ["Welcome tae The Rasten Cup.", "Follow this tour tae learn the game."] },
      no:      { title: "Velkommen", lines: ["Velkommen til The Rasten Cup.", "Følg omvisningen for å lære spillet."] }
    },
    audioScript: {
      en:      { host: "I'm Sarah, and this is Gaz. Quick briefing.", pundit: "Can they predict a score? We're about to find out." },
      'en-US': { host: "I'm Jessica. Chuck's here. Let's make this fast.", pundit: "Rookie in the building. Let's see what you've got." },
      no:      { host: "Silje her, med Nils Arne. Vi gjør det kort.", pundit: "Klarer du å tippe et resultat? Vi finner snart ut." },
      sco:     { host: "Shona here wi' Rab. Quick briefing, then we're off.", pundit: "New manager. We'll see if they know their fitba." }
    }
  },

  // STOP 2: THE MATCH CARD
  {
    id: 'match_card',
    targets: ['tour-first-match', 'tour-up-home', 'tour-down-home', 'tour-up-away', 'tour-down-away', 'tour-spy-btn'],
    position: 'top',
    overlayType: 'score-arrows',
    audioFiles: {
      en: '/audio/tour_pre_en_02.mp3', 'en-US': '/audio/tour_pre_us_02.mp3',
      no: '/audio/tour_pre_no_02.mp3', sco: '/audio/tour_pre_sco_02.mp3'
    },
    display: {
      en:      { title: "Predictions", lines: ["Predict the exact score for every match.", "Scouts button = spy on a rival's picks."] },
      'en-US': { title: "Predictions", lines: ["Pick the exact final score with the arrows.", "Scouts button = peek at a rival's picks."] },
      sco:     { title: "Predictions", lines: ["Pick the exact score wi' the arrows.", "Scouts button = spy on a rival's picks."] },
      no:      { title: "Tips",        lines: ["Tipp nøyaktig sluttresultat med pilene.", "Speiderne-knappen = se en rivals tips."] }
    },
    audioScript: {
      en:      { host: "Use the arrows to predict every score.", pundit: "Picking 0-0 for everything? Brave. Or lazy." },
      'en-US': { host: "Arrows up and down — pick every final score.", pundit: "Wrong score, zero points. The math is simple." },
      no:      { host: "Bruk pilene til å tippe resultater.", pundit: "0-0 på alt? Modig. Eller lat." },
      sco:     { host: "Use the arrows tae pick every score.", pundit: "Wrang scores dinnae score. Simple enough." }
    }
  },

  // STOP 3: GROUP NAVIGATION
  {
    id: 'groups_nav',
    targets: ['nav-groups', 'nav-groups-desk', 'subnav-groups'],
    position: 'bottom',
    overlayType: 'swipe-hand',
    audioFiles: {
      en: '/audio/tour_pre_en_03.mp3', 'en-US': '/audio/tour_pre_us_03.mp3',
      no: '/audio/tour_pre_no_03.mp3', sco: '/audio/tour_pre_sco_03.mp3'
    },
    display: {
      en:      { title: "Groups",  lines: ["12 groups — complete them all.", "Don't just do Group A and stop."] },
      'en-US': { title: "Groups",  lines: ["12 groups — swipe through every one.", "Blank picks = zero points. Simple."] },
      sco:     { title: "Groups",  lines: ["12 groups — every single one.", "Dinnae stop at Group A. Keep going."] },
      no:      { title: "Grupper", lines: ["12 grupper — fullfør alle.", "Ikke bare gruppe A. Alle 12."] }
    },
    audioScript: {
      en:      { host: "Swipe through all 12 groups — don't stop at A.", pundit: "12 groups. No excuses." },
      'en-US': { host: "Hit all 12 groups — every blank is a zero.", pundit: "You skipped Group F, didn't you." },
      no:      { host: "Gå gjennom alle 12 grupper.", pundit: "Alle 12. Ikke bare gruppe A." },
      sco:     { host: "Get through all 12 groups — every single wan.", pundit: "Blank picks dinnae score. Keep swiping." }
    }
  },

  // STOP 4: MAGIC WAND
  {
    id: 'magic_wand',
    targetId: 'tour-magic-wand-panel',
    position: 'top',
    overlayType: 'sparkles',
    audioFiles: {
      en: '/audio/tour_pre_en_04.mp3', 'en-US': '/audio/tour_pre_us_04.mp3',
      no: '/audio/tour_pre_no_04.mp3', sco: '/audio/tour_pre_sco_04.mp3'
    },
    display: {
      en:      { title: "Magic Wand", lines: ["One tap auto-fills your remaining picks.", "Stats-based. Not a guarantee."] },
      'en-US': { title: "Auto-Pick",  lines: ["One tap fills all remaining picks.", "Stats-based — not a sure thing."] },
      sco:     { title: "Magic Wand", lines: ["One tap fills yer remaining picks.", "Based on stats. Pure laziness, but aye."] },
      no:      { title: "Tryllestav", lines: ["Én trykk fyller inn alle gjenværende tips.", "Basert på statistikk. Ingen garanti."] }
    },
    audioScript: {
      en:      { host: "Magic Wand auto-fills your remaining picks using stats.", pundit: "When it goes wrong — and it will — that's all you." },
      'en-US': { host: "One tap fills the rest with stats-based picks.", pundit: "Analytics. The game's gone soft." },
      no:      { host: "Tryllestaven fyller inn resten basert på statistikk.", pundit: "Statistikkbasert. Fremdeles din feil." },
      sco:     { host: "Magic Wand fills yer remaining picks wi' stats.", pundit: "Stats-based. Still yer fault, aye." }
    }
  },

  // STOP 5: KNOCKOUTS
  {
    id: 'knockout_tab',
    targetId: 'tour-first-knockout',
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {
      en: '/audio/tour_pre_en_05.mp3', 'en-US': '/audio/tour_pre_us_05.mp3',
      no: '/audio/tour_pre_no_05.mp3', sco: '/audio/tour_pre_sco_05.mp3'
    },
    display: {
      en:      { title: "Knockouts",  lines: ["No scores — just tap who advances.", "Pick your champion or you're wasting time."] },
      'en-US': { title: "Playoffs",   lines: ["No scores — just pick who advances.", "Pick a champion. That's why you're here."] },
      sco:     { title: "Knockouts",  lines: ["Nae scores — just pick who goes through.", "Pick a champion or yer talkin' mince."] },
      no:      { title: "Sluttspill", lines: ["Ingen resultat — velg hvem som går videre.", "Velg din mester. Det er derfor du er her."] }
    },
    audioScript: {
      en:      { host: "Knockouts: tap who advances — no scores needed.", pundit: "Pick a Champion. That's the whole point." },
      'en-US': { host: "Tap who advances — no score predictions in knockouts.", pundit: "Someone has to win. Pick them." },
      no:      { host: "Sluttspill: trykk på laget som går videre.", pundit: "Velg en mester. Det er jobben din." },
      sco:     { host: "Knockouts: tap who goes through — nae scores.", pundit: "Pick a champion. Get it done." }
    }
  },

  // STOP 6: RULES TAB — navigates to Rules page, highlights scoring section
  {
    id: 'rules_tab',
    targetId: 'rules-scoring-section',
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {
      en: '/audio/tour_pre_en_06.mp3', 'en-US': '/audio/tour_pre_us_06.mp3',
      no: '/audio/tour_pre_no_06.mp3', sco: '/audio/tour_pre_sco_06.mp3'
    },
    display: {
      en:      { title: "Points System", lines: ["The full scoring breakdown — right here.", "Exact: 5 · Result: 3 · Champion: 40."] },
      'en-US': { title: "Points System", lines: ["Full points breakdown — right here.", "Exact: 5 · Result: 3 · Champion: 40."] },
      sco:     { title: "The Points",    lines: ["Full scoring breakdown — right here.", "Exact: 5 · Result: 3 · Champion: 40."] },
      no:      { title: "Poengsystem",   lines: ["Full poengoversikt — rett her.", "Eksakt: 5 · Utfall: 3 · Mester: 40."] },
    },
    audioScript: {
      en:      { host: "Exact score: 5 points. Right result: 3. The full breakdown is right here — check it.", pundit: "Check it before you complain about your score." },
      'en-US': { host: "Nail the score: 5 points. Right winner: 3. Full points breakdown right here.", pundit: "No excuses for not knowing the system." },
      no:      { host: "Eksakt resultat: 5 poeng. Riktig utfall: 3. Full oversikt er rett her.", pundit: "Les den. Ingen unnskyldninger." },
      sco:     { host: "Exact score: 5 points. Right result: 3. Full breakdown's right here — check it.", pundit: "Nae excuses. It's all there." },
    }
  },

  // STOP 7: HOW TO PLAY — stays on Rules page, highlights the rules grid
  {
    id: 'rules_howtoplay',
    targetId: 'rules-howtoplay-section',
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {
      en: '/audio/tour_pre_en_07.mp3', 'en-US': '/audio/tour_pre_us_07.mp3',
      no: '/audio/tour_pre_no_07.mp3', sco: '/audio/tour_pre_sco_07.mp3'
    },
    display: {
      en:      { title: "The Rules", lines: ["Six rules — everything you need to know.", "Read them once. No excuses after."] },
      'en-US': { title: "The Rules", lines: ["Six rules — everything you need.", "Read before you play."] },
      sco:     { title: "The Rules", lines: ["Six rules — that's all ye need.", "Read them. Nae excuses."] },
      no:      { title: "Reglene",   lines: ["Seks regler — alt du trenger å vite.", "Les dem. Ingen unnskyldninger."] },
    },
    audioScript: {
      en:      { host: "Six rules — everything that governs this competition. Read them now.", pundit: "No VAR here to bail you out. The rulebook doesn't care if you didn't read it." },
      'en-US': { host: "Six rules — everything you need to know. Read them now.", pundit: "No instant replay to save you. The rulebook doesn't care if you skipped it." },
      no:      { host: "Seks regler — alt som gjelder for konkurransen. Les dem nå.", pundit: "Ingen VAR her. Reglene bryr seg ikke om du ikke leste dem." },
      sco:     { host: "Six rules — everything that governs this game. Read them now.", pundit: "Nae VAR tae save ye. The rulebook disnae care if ye didnae read it." },
    }
  },

  // STOP 8: PROFILE
  {
    id: 'profile_menu',
    targetId: 'btn-profile-menu',
    position: 'bottom',
    overlayType: 'none',
    audioFiles: {
      en: '/audio/tour_pre_en_08.mp3', 'en-US': '/audio/tour_pre_us_08.mp3',
      no: '/audio/tour_pre_no_08.mp3', sco: '/audio/tour_pre_sco_08.mp3'
    },
    display: {
      en:      { title: "Ready",  lines: ["Briefing done — now get your picks in.", "Replay this tour from your Profile anytime."] },
      'en-US': { title: "Ready",  lines: ["Briefing done — lock in those picks.", "Replay this tour from your Profile anytime."] },
      sco:     { title: "Ready",  lines: ["Briefing done — get cracking.", "Replay this tour from yer Profile anytime."] },
      no:      { title: "Klar",   lines: ["Briefing ferdig — legg inn tipsene dine.", "Gjennomspill via Profil-menyen når som helst."] }
    },
    audioScript: {
      en:      { host: "Done. Replay this tour from your Profile anytime.", pundit: "Stop listening. Get your picks in." },
      'en-US': { host: "That's it. Find the tour again in your Profile.", pundit: "Lock in those picks. Let's go." },
      no:      { host: "Ferdig. Finn omvisningen i Profil-menyen.", pundit: "Slutt å lytte. Legg inn tipsene." },
      sco:     { host: "That's yer lot. Replay from yer Profile anytime.", pundit: "Right. Get cracking." }
    }
  }
];

// ─────────────────────────────────────────────────────────
//  LIVE SEASON TOUR  (text-only by default — no audio yet)
// ─────────────────────────────────────────────────────────
export const LIVE_SEASON_TOUR: TourStep[] = [

  // STOP 1: WELCOME
  {
    id: 'live_welcome',
    position: 'center',
    overlayType: 'none',
    audioFiles: {},
    display: {
      en:      { title: "We're Live!",  lines: ["The tournament has kicked off.", "Your predictions are locked — let's show you around."] },
      'en-US': { title: "It's Live!",   lines: ["The tournament has kicked off.", "Picks are locked — let's walk you through what's new."] },
      no:      { title: "Vi Er Live!",  lines: ["Turneringen er i gang.", "Tipsene er låst — la oss vise deg rundt."] },
      sco:     { title: "We're Live!",  lines: ["The tournament's kicked aff.", "Picks are locked — here's whit ye need tae know."] },
    },
    audioScript: {
      en:      { host: "The tournament is live. Predictions are locked.", pundit: "Forget the group stage. This is real football now." },
      'en-US': { host: "It's live! Picks are locked in.", pundit: "Now we find out who actually knows their football." },
      no:      { host: "Turneringen er i gang. Tipsene er låst.", pundit: "Glem planleggingen. Nå er det ekte fotball." },
      sco:     { host: "We're live. Predictions are locked.", pundit: "Actual fitba. Pay attention." },
    }
  },

  // STOP 2: DAILY AI COACH BRIEF
  {
    id: 'live_coach_brief',
    targetId: 'tour-ai-coach-brief',
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {},
    display: {
      en:      { title: "Your Daily Brief",  lines: ["That card is your personal AI coach report.", "Your current rank, your closest rivals, and how your specific picks are performing — updated every day.", "Tap the portrait to get the full commentary."] },
      'en-US': { title: "Your Daily Brief",  lines: ["That card is your personal AI coach report.", "Your rank, your rivals, and how your picks stack up — refreshed daily.", "Tap the portrait for the full breakdown."] },
      no:      { title: "Din Daglige Rapport", lines: ["Det kortet er din personlige AI-trenerrapport.", "Din plassering, dine nærmeste rivaler og hvordan tipsene dine holder — oppdateres daglig.", "Trykk på portrettet for full kommentar."] },
      sco:     { title: "Yer Daily Brief",   lines: ["That card is yer personal AI coach report.", "Yer rank, yer rivals, and how yer picks are haudin' up — updated every day.", "Tap the portrait for the full rundown."] },
    },
    audioScript: {
      en:      { host: "That card is your daily brief from your Assistant Coach — your rank, your rivals, your picks. Updated every day.", pundit: "The AI has studied your predictions. It has concerns." },
      'en-US': { host: "Your daily brief — rank, rivals, and how your picks are performing. Refreshed every day.", pundit: "Pochettino's reviewed your picks. He believes in you. Barely." },
      no:      { host: "Det kortet er din daglige rapport — plassering, rivaler og tipsene dine. Oppdateres daglig.", pundit: "Assistenttrener har gransket tipsene dine. Han er bekymret." },
      sco:     { host: "That card — yer daily brief. Rank, rivals, picks. Every day.", pundit: "Clarke's read yer picks. He's keepin' his thoughts tae himsel'. For now." },
    }
  },

  // STOP 3: LEADERBOARD
  {
    id: 'live_leaderboard',
    targets: ['tour-leaderboard-top'],
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {},
    display: {
      en:      { title: "Leaderboard",  lines: ["This is home base.", "Your rank updates live after every result.", "Banked = confirmed points from finished matches only.", "Live = your total including matches still being played.", "Toggle between them at the top to see where you really stand."] },
      'en-US': { title: "Leaderboard",  lines: ["This is home base.", "Your rank updates live after every result.", "Banked = points from completed matches only.", "Live = total including games in progress.", "Toggle at the top to see both views."] },
      no:      { title: "Tabell",       lines: ["Her er hjemmebasen din.", "Plasseringen oppdateres live etter hvert resultat.", "Banket = bekreftede poeng fra fullspilte kamper.", "Live = totalt inkludert kamper som pågår.", "Bytt mellom dem øverst for å se begge visningene."] },
      sco:     { title: "Live Table",   lines: ["This is hame base.", "Yer rank updates live after every result.", "Banked = confirmed points fae finished matches.", "Live = total includin' games still bein' played.", "Toggle up top tae see where ye actually stand."] },
    },
    audioScript: {
      en:      { host: "The leaderboard updates after every match. Banked is confirmed points — Live includes games still in play. Toggle between them at the top.", pundit: "Up or down after every result. This is where it hurts." },
      'en-US': { host: "Rankings update every result. Banked is locked-in points, Live includes games in progress.", pundit: "Is your name climbing or sinking? Check often." },
      no:      { host: "Tabellen oppdateres etter hver kamp. Banket er bekreftede poeng — Live inkluderer pågående kamper.", pundit: "Opp eller ned. Det er her det gjør vondt." },
      sco:     { host: "Leaderboard updates every result. Banked is confirmed points — Live's got the games still gaun.", pundit: "Up or doon. This is where the banter starts." },
    }
  },

  // STOP 4: TOURNAMENT
  {
    id: 'live_tournament',
    targets: ['tour-subnav-schedule', 'tour-subnav-tables', 'tour-subnav-bracket'],
    position: 'bottom',
    overlayType: 'swipe-hand',
    audioFiles: {},
    display: {
      en:      { title: "Tournament",  lines: ["Three views — Schedule, Tables, and Bracket.", "Schedule shows live scores as they happen, plus links to watch every game.", "Tables tracks the group standings.", "Bracket is where your knockout picks live or die."] },
      'en-US': { title: "Tournament",  lines: ["Three views — Schedule, Standings, and Bracket.", "Schedule shows live scores and links to watch the games.", "Standings tracks how groups are shaking out.", "Bracket is where your playoff picks succeed or collapse."] },
      no:      { title: "Turnering",   lines: ["Tre visninger — Kampplan, Tabeller og Brakett.", "Kampplanen viser livescorer og lenker til å se kampene.", "Tabeller følger gruppestillingene.", "Braketten er der dine sluttspilltips lever eller dør."] },
      sco:     { title: "Tournament",  lines: ["Three views — Schedule, Tables, and Bracket.", "Schedule has live scores and links tae watch every game.", "Tables tracks how the groups are shapin' up.", "The Bracket — that's where yer picks live or die."] },
    },
    audioScript: {
      en:      { host: "Tournament tab — live schedule with game links, group tables, and the full knockout bracket.", pundit: "The Bracket. Is your champion still standing?" },
      'en-US': { host: "Schedule with live scores and watch links, standings, and the full bracket — all here.", pundit: "Bracket. Check it. Often." },
      no:      { host: "Turnering-fanen — kampplan med lenker, grupptabeller og hele sluttspillbraketten.", pundit: "Braketten. Lever din mester fortsatt?" },
      sco:     { host: "Tournament tab — live schedule wi' game links, tables, and the full bracket.", pundit: "The Bracket. Is yer champion still breathin'?" },
    }
  },

  // STOP 5: MANAGER — SUBSTITUTIONS
  {
    id: 'live_manager',
    targets: ['tour-manager-hub', 'tour-manager-viewmode'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {},
    display: {
      en:      { title: "Substitutions",  lines: ["Locked predictions aren't final.", "You have a set number of substitutions — find any locked match in the Manager tab, tap it, and spend a sub to change your prediction.", "Use them wisely. They don't refill."] },
      'en-US': { title: "Substitutions",  lines: ["Locked doesn't mean stuck.", "You have a set number of subs — find a locked match in the Manager tab, tap it, spend a sub to change your pick.", "Use them carefully. You won't get more."] },
      no:      { title: "Bytter",          lines: ["Låste tips er ikke endelige.", "Du har et sett antall bytter — finn en låst kamp i Manager-fanen, trykk på den og bruk et bytte for å endre tipset.", "Bruk dem klokt. De fylles ikke opp igjen."] },
      sco:     { title: "Substitutions",  lines: ["Locked picks arnae final.", "Ye've got a set number of subs — find any locked match in the Manager tab, tap it, spend a sub tae change yer pick.", "Use them wisely. They dinnae refill."] },
    },
    audioScript: {
      en:      { host: "Manager tab — substitutions let you change locked predictions. Find the match, tap it, spend a sub.", pundit: "Save them for the games that still matter. Don't waste them early." },
      'en-US': { host: "Locked picks can still be changed. Find the match in the Manager tab, tap it, use a sub.", pundit: "Don't waste subs on dead rubbers. Save them." },
      no:      { host: "Manager-fanen — bytter lar deg endre låste tips. Finn kampen, trykk på den, bruk et bytte.", pundit: "Spar bytter til kamper som fortsatt betyr noe." },
      sco:     { host: "Manager tab — subs let ye change locked picks. Find the match, tap it, use yer sub.", pundit: "Save subs for games that still matter. Dinnae throw them awa'." },
    }
  },

  // STOP 6: SECOND CHANCE
  {
    id: 'live_second_chance',
    targetId: 'tour-second-chance-promo',
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {},
    display: {
      en:      { title: "Second Chance",  lines: ["If the team you predicted to win the tournament gets knocked out — you get a Second Chance.", "Activate it to pick a new tournament winner from the teams still competing.", "One shot. Make it count."] },
      'en-US': { title: "Second Chance",  lines: ["If your predicted tournament winner gets eliminated — you get a Second Chance.", "Activate it to pick a new winner from the teams still in it.", "One shot. Don't waste it."] },
      no:      { title: "Andre Sjanse",   lines: ["Hvis laget du tippet til å vinne turneringen ryker ut — får du en Andre Sjanse.", "Aktiver den for å velge en ny turnerings-vinner blant de gjenværende lagene.", "Én sjanse. Bruk den klokt."] },
      sco:     { title: "Second Chance",  lines: ["If the team ye tipped tae win the tournament gets knocked oot — ye get a Second Chance.", "Activate it tae pick a new winner fae the teams still in it.", "One shot. Make it count."] },
    },
    audioScript: {
      en:      { host: "Second Chance — if your tournament winner gets knocked out, you can pick a new one from whoever's still in it.", pundit: "A lifeline. Try not to waste it on sentiment." },
      'en-US': { host: "If your winner goes out, Second Chance lets you pick a new one from the remaining teams.", pundit: "A lifeline. Pick smart, not emotional." },
      no:      { host: "Andre Sjanse — hvis din turneringsmester ryker ut, kan du velge en ny blant de gjenværende lagene.", pundit: "En livline. Ikke kast den bort på nostalgi." },
      sco:     { host: "Second Chance — if yer winner gets knocked oot, ye can pick a new wan fae whoever's left.", pundit: "A lifeline. Dinnae waste it on sentiment." },
    }
  },

  // STOP 7: ANALYSIS
  {
    id: 'live_analysis',
    targets: ['nav-analysis', 'nav-analysis-desk'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {},
    display: {
      en:      { title: "Analysis",  lines: ["The Analysis tab shows you exactly what needs to happen for you to climb the table.", "Head-to-head breakdowns against your rivals, swing matches that could flip the standings, and AI-powered insights on every game.", "This is where you find your edge."] },
      'en-US': { title: "Analysis",  lines: ["The Analysis tab shows exactly what you need to move up.", "Head-to-head with your rivals, swing matches that change everything, and AI intel on every game.", "This is your competitive edge."] },
      no:      { title: "Analyse",   lines: ["Analyse-fanen viser deg nøyaktig hva som må til for å klatre på tabellen.", "Direkte oppgjør mot rivalene dine, avgjørende kamper som kan snu tabellen, og AI-innsikt om hver kamp.", "Her finner du forspranget ditt."] },
      sco:     { title: "Analysis",  lines: ["The Analysis tab shows ye exactly whit needs tae happen for ye tae climb the table.", "Head-to-head wi' yer rivals, swing matches that can flip everything, and AI insights on every game.", "This is where ye find yer edge."] },
    },
    audioScript: {
      en:      { host: "Analysis tab — what you need to climb, head-to-head rival breakdowns, and swing matches that decide the title.", pundit: "Ignore this tab and you're flying blind." },
      'en-US': { host: "Analysis — what you need to move up, rival breakdowns, and swing matches. All here.", pundit: "This is your edge. Use it or lose." },
      no:      { host: "Analyse-fanen — hva du trenger, rivaloppgjør og avgjørende kamper.", pundit: "Ignorer denne fanen og du er blind." },
      sco:     { host: "Analysis tab — whit ye need, rival breakdowns, swing matches. All there.", pundit: "Ignore this and yer flying blind." },
    }
  },

  // STOP 8: RULES & POINTS
  {
    id: 'live_rules',
    targetId: 'rules-scoring-section',
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {},
    display: {
      en:      { title: "Points System",  lines: ["Exact score: 5 points. Correct result: 3 points. Tournament winner: 40 points.", "The full breakdown is right here — including how substitutions, spy scouts, and second chance work.", "Read it once. No excuses after."] },
      'en-US': { title: "Points System",  lines: ["Exact score: 5 pts. Right result: 3 pts. Tournament winner: 40 pts.", "Full breakdown here — including subs, scouts, and second chance.", "Know the system. No excuses."] },
      no:      { title: "Poengsystem",    lines: ["Eksakt resultat: 5 poeng. Riktig utfall: 3 poeng. Turneringsvinner: 40 poeng.", "Full oversikt er rett her — inkludert bytter, speider og andre sjanse.", "Les det én gang. Ingen unnskyldninger etter det."] },
      sco:     { title: "Points System",  lines: ["Exact score: 5 points. Right result: 3 points. Tournament winner: 40 points.", "Full breakdown right here — subs, scouts, and second chance included.", "Read it once. Nae excuses after."] },
    },
    audioScript: {
      en:      { host: "Exact score: 5 points. Correct result: 3 points. Tournament winner: 40 points. The full breakdown is right here.", pundit: "Know the system. No excuses for not reading it." },
      'en-US': { host: "5 for exact, 3 for the result, 40 for the winner. Full breakdown here.", pundit: "No excuses for not knowing the scoring." },
      no:      { host: "Eksakt: 5 poeng. Riktig utfall: 3 poeng. Turneringsvinner: 40 poeng. Full oversikt er her.", pundit: "Les den. Ingen unnskyldninger." },
      sco:     { host: "Exact score: 5 points. Right result: 3. Tournament winner: 40. Full breakdown right here.", pundit: "Nae excuses. It's all there." },
    }
  },

  // STOP 9: PROFILE / WRAP-UP
  {
    id: 'live_profile',
    targetId: 'btn-profile-menu',
    position: 'bottom',
    overlayType: 'none',
    audioFiles: {},
    display: {
      en:      { title: "You're Set",   lines: ["That's the full live tour.", "You can replay this tour any time from your Profile menu.", "Good luck — may your picks hold up."] },
      'en-US': { title: "You're Set",   lines: ["That's the full live tour.", "You can replay from your Profile menu any time.", "Good luck — may your bracket survive."] },
      no:      { title: "Du Er Klar",   lines: ["Det var hele live-omvisningen.", "Du kan gjennomspille den når som helst fra Profil-menyen.", "Lykke til — håper tipsene dine holder."] },
      sco:     { title: "Yer Set",      lines: ["That's the full live tour.", "Replay it any time fae yer Profile menu.", "Good luck — may yer picks hauld up."] },
    },
    audioScript: {
      en:      { host: "That's the live tour done. Replay any time from your Profile menu.", pundit: "Now watch the matches and obsess over the leaderboard. Good luck." },
      'en-US': { host: "Tour's done. Find it again in your Profile menu any time.", pundit: "Refresh the leaderboard. That's all that matters now." },
      no:      { host: "Live-omvisningen er ferdig. Finn den igjen i Profil-menyen.", pundit: "Se kampene og sjekk tabellen manisk. Lykke til." },
      sco:     { host: "That's yer live tour done. Replay fae yer Profile menu any time.", pundit: "Watch the fitba and check that leaderboard. Every five minutes." },
    }
  },
];
