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
      en:      { host: "Good evening — I'm Sarah, and this is Gaz.", pundit: "Does this manager have a clue, or will they bottle it?" },
      'en-US': { host: "We are LIVE! I'm Jessica, alongside legend Chuck.", pundit: "Let's see if this rookie has what it takes!" },
      no:      { host: "Velkommen til studio! Jeg er Silje, og dette er Nils Arne.", pundit: "Er du klar til å spille de andre gode?" },
      sco:     { host: "Welcome tae the show. Shona here, and Rab is also here.", pundit: "Let's see if this manager knows their fitba." }
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
      en:      { host: "Pick the score for every match using the arrows.", pundit: "Use the Spy button if you need to copy someone better." },
      'en-US': { host: "Use the arrows to predict every final score.", pundit: "A DRAW?! What kind of sport allows draws?!" },
      no:      { host: "Tipp resultatet i hver kamp med pilene.", pundit: "Spion-knappen kopierer rivalens tips. Nyttig." },
      sco:     { host: "Use the arrows tae pick every score.", pundit: "See the wee eye? Spy on someone better than ye." }
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
      en:      { host: "Navigate through all 12 groups — don't stop early.", pundit: "12 groups. Get moving. Pub's closed till you're done." },
      'en-US': { host: "Swipe through all twelve groups.", pundit: "Blanks score zero. Don't get benched." },
      no:      { host: "Naviger gjennom alle 12 grupper.", pundit: "Alle 12. Ikke bare gruppe A. Videre!" },
      sco:     { host: "Get through all 12 groups — dinnae stop early.", pundit: "12 groups. Keep swiping. No pie till ye're done." }
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
      en:      { host: "Short on time? The Magic Wand auto-fills everything.", pundit: "It's for people who don't know the game. But go ahead." },
      'en-US': { host: "The Magic Wand fills the rest using stats.", pundit: "Analytics calling your plays? The game's gone soft." },
      no:      { host: "Dårlig tid? Tryllestaven fyller ut alt.", pundit: "For de som ikke kan fotball. Men greit nok." },
      sco:     { host: "Short o' time? The Magic Wand fills it out.", pundit: "Pure laziness. But aye, go ahead." }
    }
  },

  // STOP 5: KNOCKOUTS
  {
    id: 'knockout_tab',
    targets: ['nav-knockout', 'nav-knockout-desk', 'subnav-knockout', 'tour-first-knockout'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {
      en: '/audio/tour_pre_en_05.mp3', 'en-US': '/audio/tour_pre_us_05.mp3',
      no: '/audio/tour_pre_no_05.mp3', sco: '/audio/tour_pre_sco_05.mp3'
    },
    display: {
      en:      { title: "Knockouts", lines: ["No scores — just tap who advances.", "Pick your champion or you're wasting time."] },
      'en-US': { title: "Playoffs",  lines: ["No scores — just pick who advances.", "Pick a champion. That's why you're here."] },
      sco:     { title: "Knockouts", lines: ["Nae scores — just pick who goes through.", "Pick a champion or yer talkin' mince."] },
      no:      { title: "Sluttspill", lines: ["Ingen resultat — velg hvem som går videre.", "Velg din mester. Det er derfor du er her."] }
    },
    audioScript: {
      en:      { host: "Knockouts: just tap who you think advances.", pundit: "Pick a Champion or what are you even doing here?" },
      'en-US': { host: "Tap who advances — no scores needed.", pundit: "Pick a Champion or go home!" },
      no:      { host: "Sluttspill: trykk på laget som går videre.", pundit: "Velg en mester. Det er derfor du er her." },
      sco:     { host: "Knockouts: pick who wins — nae scores needed.", pundit: "Someone has tae win. Get it done." }
    }
  },

  // STOP 6: PROFILE
  {
    id: 'profile_menu',
    targetId: 'btn-profile-menu',
    position: 'bottom',
    overlayType: 'none',
    audioFiles: {
      en: '/audio/tour_pre_en_06.mp3', 'en-US': '/audio/tour_pre_us_06.mp3',
      no: '/audio/tour_pre_no_06.mp3', sco: '/audio/tour_pre_sco_06.mp3'
    },
    display: {
      en:      { title: "Ready",  lines: ["Briefing done — now get your picks in.", "Replay this tour from your Profile anytime."] },
      'en-US': { title: "Ready",  lines: ["Briefing done — lock in those picks.", "Replay this tour from your Profile anytime."] },
      sco:     { title: "Ready",  lines: ["Briefing done — get cracking.", "Replay this tour from yer Profile anytime."] },
      no:      { title: "Klar",   lines: ["Briefing ferdig — legg inn tipsene dine.", "Gjennomspill via Profil-menyen når som helst."] }
    },
    audioScript: {
      en:      { host: "That's the briefing. Replay it anytime from your Profile.", pundit: "Stop listening to us and get your predictions in." },
      'en-US': { host: "That wraps it. Find the tour again in your Profile.", pundit: "Helmet on. Lock in those picks. Let's go." },
      no:      { host: "Det var alt. Finn omvisningen igjen i Profil-menyen.", pundit: "Slutt å lytte. Legg inn tipsene dine." },
      sco:     { host: "That's yer lot. Find the tour again in yer Profile.", pundit: "Right. Get cracking. We'll be watching." }
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
      en:      { host: "The Rasten Cup is live. Predictions locked — but the game's very much on.", pundit: "Forget group stage. What matters now is the pitch." },
      'en-US': { host: "IT IS HAPPENING! Tournament is live!", pundit: "Picks locked. Now we watch it unfold." },
      no:      { host: "Turneringen er i gang. Tipsene er låst — men kampen er ikke over.", pundit: "Glem gruppespillet. Det som teller er banen nå." },
      sco:     { host: "The Rasten Cup is live. Predictions locked.", pundit: "Forget what ye tipped. Actual fitba is on." },
    }
  },

  // STOP 2: LEADERBOARD NAV
  {
    id: 'live_leaderboard_nav',
    targets: ['nav-leaderboard', 'nav-leaderboard-desk'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {},
    display: {
      en:      { title: "Leaderboard",      lines: ["Your live leaderboard — your new home tab.", "Points update after every result."] },
      'en-US': { title: "Leaderboard",      lines: ["Live leaderboard — your new home base.", "Points drop the moment the whistle blows."] },
      no:      { title: "Direkte Tabell",   lines: ["Direkte tabell — din nye hjem-fane.", "Poeng oppdateres etter hvert resultat."] },
      sco:     { title: "Live Table",       lines: ["Live table — yer new home for the tournament.", "Points update after every result."] },
    },
    audioScript: {
      en:      { host: "The Leaderboard is your home tab from now on.", pundit: "Every result moves it. Watch that table." },
      'en-US': { host: "Leaderboard tab — your home base for the tournament.", pundit: "Is your name climbing or sinking?" },
      no:      { host: "Poengtabellen er din hjem-fane nå.", pundit: "Hvert resultat beveger den. Hold øye." },
      sco:     { host: "The Leaderboard tab is yer home now.", pundit: "Every right result nets points. Up or doon?" },
    }
  },

  // STOP 3: LEADERBOARD CONTENT
  {
    id: 'live_leaderboard_content',
    targets: ['tour-leaderboard-top'],
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {},
    display: {
      en:      { title: "Your Rank",      lines: ["See exactly where you stand.", "Toggle: Live vs Banked points."] },
      'en-US': { title: "Your Rank",      lines: ["Track your exact standing.", "Toggle Live vs Banked points at the top."] },
      no:      { title: "Din Plassering", lines: ["Se nøyaktig hvor du står.", "Bytt: Live vs Bankede poeng."] },
      sco:     { title: "Yer Standing",   lines: ["See exactly where ye stand.", "Toggle: Live vs Banked points up top."] },
    },
    audioScript: {
      en:      { host: "See exactly where you stand against your league.", pundit: "This is where reputations are made and destroyed." },
      'en-US': { host: "Track your standing vs everyone in your league.", pundit: "Every result moves the needle. Hero or not." },
      no:      { host: "Her ser du nøyaktig hvor du står i ligaen.", pundit: "Her skapes og ødelegges rykter. Hold øye." },
      sco:     { host: "See exactly where ye stand in yer league.", pundit: "This is where the banter starts. Keep watching." },
    }
  },

  // STOP 4: TOURNAMENT NAV
  {
    id: 'live_tournament',
    targets: ['nav-tournament', 'nav-tournament-desk'],
    position: 'bottom',
    overlayType: 'swipe-hand',
    audioFiles: {},
    display: {
      en:      { title: "Tournament",         lines: ["Live match centre — all the action here.", "Schedule, tables, and bracket — one tab."] },
      'en-US': { title: "Tournament",         lines: ["Everything live, right here.", "Schedule, standings, and bracket — all in one."] },
      no:      { title: "Turnering",          lines: ["Live-kampsentral — all action her.", "Kampplan, tabeller og brakett — én fane."] },
      sco:     { title: "Tournament",         lines: ["All the live action is right here.", "Schedule, tables, and bracket — wan tab."] },
    },
    audioScript: {
      en:      { host: "Tournament tab — live match centre for the whole competition.", pundit: "Schedule, Tables, Bracket — all here." },
      'en-US': { host: "Tournament tab — live scores, standings, and bracket.", pundit: "This is where you follow the actual games." },
      no:      { host: "Turnering-fanen — live-kampsentral for hele turneringen.", pundit: "Kampplan, Tabeller, Brakett — alt her." },
      sco:     { host: "Tournament tab — yer live match centre.", pundit: "Schedule, Tables, Bracket — aw in here." },
    }
  },

  // STOP 5: TOURNAMENT SUB-TABS
  {
    id: 'live_tournament_subtabs',
    targets: ['tour-subnav-schedule', 'tour-subnav-tables', 'tour-subnav-bracket'],
    position: 'bottom',
    overlayType: 'swipe-hand',
    audioFiles: {},
    display: {
      en:      { title: "Three Views",   lines: ["Schedule · Tables · Bracket", "Bracket is where your picks live or die."] },
      'en-US': { title: "Three Views",   lines: ["Schedule · Tables · Bracket", "Bracket is everything. Check it."] },
      no:      { title: "Tre Visninger", lines: ["Kampplan · Tabeller · Brakett", "Braketten er der alt avgjøres."] },
      sco:     { title: "Three Views",   lines: ["Schedule · Tables · Bracket", "The Bracket is where yer picks live or dae."] },
    },
    audioScript: {
      en:      { host: "Three views: Schedule for scores, Tables for groups, Bracket for the drama.", pundit: "Keep an eye on the Bracket. That's where it all falls apart." },
      'en-US': { host: "Schedule, Tables, Bracket — all three views in this tab.", pundit: "Your champion loses in the quarters? Long walk home." },
      no:      { host: "Kampplan, Tabeller, Brakett — tre visninger i én fane.", pundit: "Hold øye med braketten. Der skinner eller faller dine tips." },
      sco:     { host: "Three views: Schedule, Tables, and Bracket.", pundit: "The Bracket — that's where yer predictions shine or fall apart." },
    }
  },

  // STOP 6: BRACKET
  {
    id: 'live_bracket',
    targets: ['tour-subnav-bracket'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {},
    display: {
      en:      { title: "The Bracket",  lines: ["Full knockout path — R32 to the Final.", "Is your champion still standing?"] },
      'en-US': { title: "The Bracket",  lines: ["Full playoff bracket — R32 to the Final.", "Is your champion still in it?"] },
      no:      { title: "Braketten",    lines: ["Full sluttspillvei — R32 til finalen.", "Lever ditt mesterlags-valg fortsatt?"] },
      sco:     { title: "The Bracket",  lines: ["Full knockout draw — R32 tae the Final.", "Is yer champion still breathin'?"] },
    },
    audioScript: {
      en:      { host: "The bracket — every knockout match from R32 to the Final.", pundit: "Your champion's either still in or it's not. No hiding." },
      'en-US': { host: "Every playoff matchup from Round of 32 to the Final.", pundit: "Every upset costs someone points. Brutal." },
      no:      { host: "Braketten — alle sluttspillkamper fra R32 til finalen.", pundit: "Ditt mesterlags-valg lever eller ikke. Ingen gjemmeplasser." },
      sco:     { host: "The bracket — every knockout tie tae the Final.", pundit: "Yer champion's either in or oot. No hiding." },
    }
  },

  // STOP 7: MANAGER NAV
  {
    id: 'live_manager_nav',
    targets: ['nav-manager', 'nav-manager-desk'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {},
    display: {
      en:      { title: "Manager",  lines: ["Still in control — as manager.", "Substitutions let you change locked picks."] },
      'en-US': { title: "Manager",  lines: ["Still playing — as manager.", "Subs let you update locked picks."] },
      no:      { title: "Manager",  lines: ["Fortsatt i kontroll — som manager.", "Bytter lar deg endre låste tips."] },
      sco:     { title: "Manager",  lines: ["Still in the game — as manager.", "Subs let ye change locked predictions."] },
    },
    audioScript: {
      en:      { host: "Manager tab — because locked predictions aren't the end.", pundit: "Substitutions let you swap out your worst calls." },
      'en-US': { host: "Manager tab — locked in doesn't mean out of options.", pundit: "Use subs on the games that still matter." },
      no:      { host: "Manager-fanen — fordi låste tips ikke er slutten.", pundit: "Bytter lar deg fikse dine verste valg." },
      sco:     { host: "Manager tab — because predictions locking disnae stop the game.", pundit: "Subs let ye fix yer worst calls." },
    }
  },

  // STOP 8: MANAGER CONTENT
  {
    id: 'live_manager_content',
    targets: ['tour-manager-viewmode'],
    position: 'bottom',
    overlayType: 'swipe-hand',
    audioFiles: {},
    display: {
      en:      { title: "Use a Sub",      lines: ["Find the match. Spend a substitution.", "Save subs for the crunch games."] },
      'en-US': { title: "Use a Sub",      lines: ["Find the match. Spend a substitution.", "Save them for games that shift the board."] },
      no:      { title: "Bruk et Bytte", lines: ["Finn kampen. Bruk et bytte.", "Spar byttene til de viktige kampene."] },
      sco:     { title: "Use a Sub",      lines: ["Find the match. Spend a sub.", "Save subs for the games that matter."] },
    },
    audioScript: {
      en:      { host: "Browse Group or Knockout — tap a match to spend a sub.", pundit: "Don't waste subs on dead rubbers." },
      'en-US': { host: "Browse predictions and tap to spend a substitution.", pundit: "Save them for crunch games that shift the board." },
      no:      { host: "Bla i tips og trykk på en kamp for å bruke et bytte.", pundit: "Ikke sløs bytter på avgjorte kamper." },
      sco:     { host: "Browse predictions and tap a match tae use a sub.", pundit: "Dinnae waste subs on deid rubbers." },
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
