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
      en:      { title: "Predictions", lines: ["Predict the exact score for every match.", "Eye icon = spy on a rival's picks."] },
      'en-US': { title: "Predictions", lines: ["Pick the exact final score with the arrows.", "Eye icon = peek at a rival's picks."] },
      sco:     { title: "Predictions", lines: ["Pick the exact score wi' the arrows.", "Wee eye = spy on a rival's picks."] },
      no:      { title: "Tips",        lines: ["Tipp nøyaktig sluttresultat med pilene.", "Øye-ikonet = se en rivals tips."] }
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
    targetId: 'btn-magic-wand',
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
      en:      { host: "The Rules tab has the full scoring breakdown — always available.", pundit: "Check it before you complain about your score." },
      'en-US': { host: "Full points breakdown is always in the Rules tab.", pundit: "No excuses for not knowing the system." },
      no:      { host: "Regler-fanen har full poengoversikt — alltid tilgjengelig.", pundit: "Les den. Ingen unnskyldninger." },
      sco:     { host: "The Rules tab has the full breakdown — aye available.", pundit: "Nae excuses. It's right there." },
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
      en:      { host: "And below — the full rules. Six of them. Everything you need to know before you play.", pundit: "Read them. All six. Not just the first one." },
      'en-US': { host: "Below the scoring — six rules covering everything you need to play.", pundit: "All six. Not just the first two." },
      no:      { host: "Under poengsystemet — de seks reglene. Alt du trenger å vite.", pundit: "Les dem. Alle seks. Ingen unnskyldninger." },
      sco:     { host: "And below — the full rules. Six of them. Everything ye need.", pundit: "Read them. Aye, all of them." },
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
      en:      { title: "We're Live",  lines: ["The tournament is live!", "Predictions locked — here's what's new."] },
      'en-US': { title: "It's Live!",  lines: ["The tournament has tipped off!", "Picks are locked — let's walk you through."] },
      no:      { title: "Vi Er Live",  lines: ["Turneringen er i gang!", "Tipsene er låst — her er hva som er nytt."] },
      sco:     { title: "We're Live",  lines: ["We're aff! Tournament is live!", "Picks locked — here's whit's changed."] },
    },
    audioScript: {
      en:      { host: "The tournament is live. Predictions locked.", pundit: "Forget the group stage — it's real football now." },
      'en-US': { host: "It's live! Picks are locked in.", pundit: "Now we watch it all unfold." },
      no:      { host: "Turneringen er i gang. Tipsene er låst.", pundit: "Glem gruppespillet. Ekte fotball nå." },
      sco:     { host: "We're live. Predictions are locked.", pundit: "Actual fitba. Pay attention." },
    }
  },

  // STOP 2: LEADERBOARD
  {
    id: 'live_leaderboard',
    targets: ['tour-leaderboard-top'],
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {},
    display: {
      en:      { title: "Leaderboard",    lines: ["Your rank — live after every result.", "Toggle Live vs Banked at the top."] },
      'en-US': { title: "Leaderboard",    lines: ["Live ranking — updates every result.", "Toggle Live vs Banked at the top."] },
      no:      { title: "Tabell",         lines: ["Din plassering — live etter hvert resultat.", "Bytt Live vs Banket øverst."] },
      sco:     { title: "Live Table",     lines: ["Yer rank — live after every result.", "Toggle Live vs Banked up top."] },
    },
    audioScript: {
      en:      { host: "Leaderboard is home. Rank updates after every match — toggle Live and Banked to see where you stand.", pundit: "Up or down after every result. This is where it hurts." },
      'en-US': { host: "Live rankings — update every result. Toggle Live vs Banked at the top.", pundit: "Is your name climbing or sinking?" },
      no:      { host: "Poengtabellen — plassering oppdateres etter hvert resultat. Bytt mellom Live og Banket.", pundit: "Opp eller ned. Her gjør det vondt." },
      sco:     { host: "Leaderboard is home. Rank updates every result — toggle Live vs Banked.", pundit: "Up or doon. This is where the banter starts." },
    }
  },

  // STOP 3: RULES & TOOLS
  {
    id: 'live_rules',
    targetId: 'rules-scoring-section',
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {},
    display: {
      en:      { title: "Rules & Tools",    lines: ["Exact: 5 · Result: 3 · Champion: 40.", "Subs · Spy · Second Chance — scroll down."] },
      'en-US': { title: "Rules & Tools",    lines: ["Exact: 5 · Result: 3 · Champion: 40.", "Live tools: Subs · Spy · Second Chance below."] },
      no:      { title: "Regler & Verktøy", lines: ["Eksakt: 5 · Utfall: 3 · Mester: 40.", "Bytter · Spion · Andre Sjanse — scroll ned."] },
      sco:     { title: "Rules & Tools",    lines: ["Exact: 5 · Result: 3 · Champion: 40.", "Subs · Spy · Second Chance — scroll doon."] },
    },
    audioScript: {
      en:      { host: "Full scoring at the top. Scroll down for your three live tools — subs, spy, and second chance.", pundit: "Know the system. Use the tools." },
      'en-US': { host: "Scoring at the top. Subs, spy, second chance below.", pundit: "Know the points. Use the tools." },
      no:      { host: "Poengsystem øverst. Scroll ned for bytter, spion og andre sjanse.", pundit: "Kjenn systemet. Bruk verktøyene." },
      sco:     { host: "Full scoring at the top. Scroll doon for subs, spy, and second chance.", pundit: "Know the system. Use the tools." },
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
      en:      { title: "Tournament",  lines: ["Schedule · Tables · Bracket.", "Bracket is where your picks live or die."] },
      'en-US': { title: "Tournament",  lines: ["Schedule · Standings · Bracket.", "Bracket is everything — check it."] },
      no:      { title: "Turnering",   lines: ["Kampplan · Tabeller · Brakett.", "Braketten er der alt avgjøres."] },
      sco:     { title: "Tournament",  lines: ["Schedule · Tables · Bracket.", "The Bracket — that's where it all falls apart."] },
    },
    audioScript: {
      en:      { host: "Tournament tab — live schedule, group tables, and the full knockout bracket.", pundit: "The Bracket. Is your champion still standing?" },
      'en-US': { host: "Schedule, standings, and the full bracket — all here.", pundit: "Bracket. Check it. Often." },
      no:      { host: "Turnering-fanen — kampplan, tabeller og brakett.", pundit: "Braketten. Lever ditt mesterlags-valg?" },
      sco:     { host: "Tournament tab — schedule, tables, and the full bracket.", pundit: "The Bracket. Is yer champion still breathing?" },
    }
  },

  // STOP 5: MANAGER
  {
    id: 'live_manager',
    targets: ['tour-manager-viewmode'],
    position: 'bottom',
    overlayType: 'swipe-hand',
    audioFiles: {},
    display: {
      en:      { title: "Manager",  lines: ["Locked picks aren't final.", "Find the match — tap it — use a sub."] },
      'en-US': { title: "Manager",  lines: ["Locked doesn't mean stuck.", "Find the match — tap it — spend a sub."] },
      no:      { title: "Manager",  lines: ["Låste tips er ikke endelige.", "Finn kampen — trykk — bruk et bytte."] },
      sco:     { title: "Manager",  lines: ["Locked picks arenae final.", "Find the match — tap it — use a sub."] },
    },
    audioScript: {
      en:      { host: "Manager tab — substitutions let you change locked predictions. Find a match, tap it, spend a sub.", pundit: "Save them for the games that still matter." },
      'en-US': { host: "Locked picks can be changed. Find the match, tap it, use a sub.", pundit: "Don't waste subs on dead rubbers." },
      no:      { host: "Manager-fanen — bytter lar deg endre låste tips. Finn kampen, trykk på den, bruk et bytte.", pundit: "Spar bytter til kamper som fortsatt betyr noe." },
      sco:     { host: "Manager tab — subs let ye change locked picks. Find the match, tap it, use yer sub.", pundit: "Save subs for the games that still matter." },
    }
  },

  // STOP 6: ANALYSIS
  {
    id: 'live_analysis',
    targets: ['nav-analysis', 'nav-analysis-desk'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {},
    display: {
      en:      { title: "Analysis",  lines: ["AI insights + rival breakdowns.", "Swing matches — that's where the title's won."] },
      'en-US': { title: "Analysis",  lines: ["AI intel + rival battle breakdowns.", "Swing matches — that's where you gain ground."] },
      no:      { title: "Analyse",   lines: ["AI-innsikt + rivaloppgjør.", "Swing-kamper avgjør titler."] },
      sco:     { title: "Analysis",  lines: ["AI insights + rival breakdowns.", "Swing matches — that's where it's won."] },
    },
    audioScript: {
      en:      { host: "Analysis tab — AI insights and rival breakdowns. Swing matches show exactly where the tournament is won.", pundit: "Ignore this tab and you're flying blind." },
      'en-US': { host: "Analysis — AI intel and rival battle breakdowns. Swing matches are everything.", pundit: "This is your edge. Use it." },
      no:      { host: "Analyse-fanen — AI-innsikt og rivaloppgjør. Swing-kamper viser deg nøyaktig hva som avgjør.", pundit: "Ignorer denne fanen og du flyr i blinde." },
      sco:     { host: "Analysis tab — AI insights and rival breakdowns. Swing matches tell ye where it's won.", pundit: "Ignore this and yer flying blind." },
    }
  },

  // STOP 7: PROFILE / WRAP-UP
  {
    id: 'live_profile',
    targetId: 'btn-profile-menu',
    position: 'bottom',
    overlayType: 'none',
    audioFiles: {},
    display: {
      en:      { title: "You're Ready", lines: ["Live tour done — now enjoy the ride.", "Replay from your Profile menu anytime."] },
      'en-US': { title: "You're Ready", lines: ["Tour done — may your bracket survive.", "Replay from your Profile menu anytime."] },
      no:      { title: "Du Er Klar",   lines: ["Liveomvisning ferdig — nyt turen.", "Gjennomspill via Profil-menyen."] },
      sco:     { title: "Yer Set",      lines: ["Live tour done — enjoy the madness.", "Replay from yer Profile menu anytime."] },
    },
    audioScript: {
      en:      { host: "That's the live briefing done.", pundit: "Watch the matches and obsess over the leaderboard." },
      'en-US': { host: "That's a wrap! Good luck out there.", pundit: "Refresh the leaderboard. That's all that matters now." },
      no:      { host: "Det var live-briefingen. Lykke til.", pundit: "Se kampene og sjekk tabellen manisk." },
      sco:     { host: "That's yer live briefing done. Good luck.", pundit: "Watch the fitba and check that leaderboard. Every five minutes." },
    }
  },
];
