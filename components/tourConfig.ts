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
      en:      { host: "Magic Wand auto-fills your remaining picks using stats.", pundit: "Still your fault when it's wrong." },
      'en-US': { host: "One tap fills the rest with stats-based picks.", pundit: "Analytics. The game's gone soft." },
      no:      { host: "Tryllestaven fyller inn resten basert på statistikk.", pundit: "Statistikkbasert. Fremdeles din feil." },
      sco:     { host: "Magic Wand fills yer remaining picks wi' stats.", pundit: "Stats-based. Still yer fault, aye." }
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

  // STOP 6: SCORING GUIDE
  {
    id: 'scoring_guide',
    targetId: 'nav-rules',
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {
      en: '/audio/tour_pre_en_06.mp3', 'en-US': '/audio/tour_pre_us_06.mp3',
      no: '/audio/tour_pre_no_06.mp3', sco: '/audio/tour_pre_sco_06.mp3'
    },
    display: {
      en:      { title: "Scoring",  lines: ["Exact score = 5 pts. Correct result = 3 pts.", "Tap this button any time to see the full breakdown."] },
      'en-US': { title: "Scoring",  lines: ["Exact score = 5 pts. Right result = 3 pts.", "Tap this button anytime for the full points guide."] },
      sco:     { title: "Scoring",  lines: ["Exact score = 5 pts. Right result = 3 pts.", "Tap this button any time for the full breakdown."] },
      no:      { title: "Poeng",    lines: ["Eksakt resultat = 5 pt. Riktig utfall = 3 pt.", "Trykk på denne knappen når som helst for full oversikt."] }
    },
    audioScript: {
      en:      { host: "Tap this button any time to see exactly how scores are calculated.", pundit: "Exact score bags 5. Correct result gets 3. Knockouts scale up from there." },
      'en-US': { host: "Tap this button anytime to see the full points breakdown.", pundit: "Exact score? Five points. Right result? Three. Knockouts go up from 8 all the way to 40." },
      no:      { host: "Trykk på denne knappen når som helst for å se poengsystemet.", pundit: "Eksakt resultat? 5 poeng. Riktig utfall? 3. Sluttspillet skalerer fra 8 til 40." },
      sco:     { host: "Tap this button any time tae see how the scoring works.", pundit: "Exact score gets ye 5. Right result? Three. Knockouts scale right up. Simples." }
    }
  },

  // STOP 7: PROFILE
  {
    id: 'profile_menu',
    targetId: 'btn-profile-menu',
    position: 'bottom',
    overlayType: 'none',
    audioFiles: {
      en: '/audio/tour_pre_en_07.mp3', 'en-US': '/audio/tour_pre_us_07.mp3',
      no: '/audio/tour_pre_no_07.mp3', sco: '/audio/tour_pre_sco_07.mp3'
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
      en:      { host: "Leaderboard is your home tab now — updates after every match.", pundit: "Up or down after every result." },
      'en-US': { host: "Leaderboard — live standings update every match.", pundit: "Is your name climbing or sinking?" },
      no:      { host: "Poengtabellen er din hjem-fane nå.", pundit: "Opp eller ned etter hvert resultat." },
      sco:     { host: "Leaderboard is yer home tab — live points each match.", pundit: "Up or doon. That's the game." },
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
      en:      { host: "See your rank and toggle Live vs Banked points.", pundit: "This is where reputations get built or buried." },
      'en-US': { host: "Track your standing — toggle Live vs Banked at the top.", pundit: "Every result moves the needle." },
      no:      { host: "Se din plassering — bytt mellom Live og Bankede poeng.", pundit: "Her bygges og ødelegges ryktene." },
      sco:     { host: "See yer rank — toggle Live vs Banked points up top.", pundit: "This is where the banter starts." },
    }
  },

  // STOP 4: SCORING REMINDER
  {
    id: 'live_scoring_reminder',
    targetId: 'nav-rules',
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {},
    display: {
      en:      { title: "Points Guide", lines: ["This button is always here.", "Tap it any time to check how scoring works."] },
      'en-US': { title: "Points Guide", lines: ["This button is always here.", "Tap it anytime to check the full scoring breakdown."] },
      no:      { title: "Poengguide",   lines: ["Denne knappen er alltid her.", "Trykk når som helst for å sjekke poengsystemet."] },
      sco:     { title: "Points Guide", lines: ["This button's aye here.", "Tap it any time tae check how the scoring works."] },
    },
    audioScript: {
      en:      { host: "This button is always here — tap it any time to check how scoring works.", pundit: "Knowing the breakdown helps. Use it." },
      'en-US': { host: "This button lives here permanently — tap it for the full points guide.", pundit: "Points don't lie. Know how they're counted." },
      no:      { host: "Denne knappen er alltid her — trykk når som helst for poengsystemet.", pundit: "Det hjelper å kjenne reglene. Bruk den." },
      sco:     { host: "This button's aye here — tap it any time tae see how scoring works.", pundit: "Knowing the system helps. Use it." },
    }
  },

  // STOP 5: TOURNAMENT NAV
  {
    id: 'live_tournament',
    targets: ['nav-tournament', 'nav-tournament-desk'],
    position: 'bottom',
    overlayType: 'swipe-hand',
    audioFiles: {},
    display: {
      en:      { title: "Tournament",  lines: ["Live match centre — all the action here.", "Schedule, tables, and bracket — one tab."] },
      'en-US': { title: "Tournament",  lines: ["Everything live, right here.", "Schedule, standings, and bracket — all in one."] },
      no:      { title: "Turnering",   lines: ["Live-kampsentral — all action her.", "Kampplan, tabeller og brakett — én fane."] },
      sco:     { title: "Tournament",  lines: ["All the live action is right here.", "Schedule, tables, and bracket — wan tab."] },
    },
    audioScript: {
      en:      { host: "Tournament tab — live scores, tables, and bracket.", pundit: "Schedule, Tables, Bracket — all here." },
      'en-US': { host: "Tournament tab — everything live in one place.", pundit: "Scores, standings, bracket. All of it." },
      no:      { host: "Turnering-fanen — live scorer, tabeller og brakett.", pundit: "Alt du trenger, ett sted." },
      sco:     { host: "Tournament tab — live scores, tables, bracket.", pundit: "Everything's in here. Have a look." },
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
      en:      { host: "Schedule, Tables, Bracket — three views, one tab.", pundit: "The Bracket is where your picks live or die." },
      'en-US': { host: "Three views: Schedule, Standings, Bracket.", pundit: "Bracket's everything. Don't ignore it." },
      no:      { host: "Kampplan, Tabeller, Brakett — tre visninger.", pundit: "Braketten er der det avgjøres." },
      sco:     { host: "Schedule, Tables, Bracket — three views in wan tab.", pundit: "The Bracket — that's where it all falls apart." },
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
      en:      { host: "Full knockout bracket — Round of 32 to the Final.", pundit: "Is your champion still standing?" },
      'en-US': { host: "Every playoff matchup from R32 to the Final.", pundit: "Your champion lose in the quarters? Long walk." },
      no:      { host: "Full brakett — R32 til finalen.", pundit: "Lever ditt mesterlags-valg fortsatt?" },
      sco:     { host: "Full bracket — R32 tae the Final, right here.", pundit: "Is yer champion still breathing?" },
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
      en:      { host: "Manager tab — locked predictions aren't the end.", pundit: "Substitutions let you fix your worst calls." },
      'en-US': { host: "Manager tab — locked in doesn't mean stuck.", pundit: "Use subs on games that still matter." },
      no:      { host: "Manager-fanen — låste tips er ikke slutten.", pundit: "Bytter lar deg fikse dine verste valg." },
      sco:     { host: "Manager tab — locked predictions arenae final.", pundit: "Subs let ye fix the disasters." },
    }
  },

  // STOP 8: ANALYSIS NAV
  {
    id: 'live_analysis_nav',
    targets: ['nav-analysis', 'nav-analysis-desk'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {},
    display: {
      en:      { title: "Analysis",  lines: ["Deep dive into your rival battles.", "Swing matches and AI insights live here."] },
      'en-US': { title: "Analysis",  lines: ["Your edge over rivals lives here.", "Swing matches, AI intel — all in one."] },
      no:      { title: "Analyse",   lines: ["Dyk ned i rivaloppgjørene.", "Swing-kamper og AI-innsikt her."] },
      sco:     { title: "Analysis",  lines: ["Yer tactical edge is right here.", "Swing matches and pundit insight."] },
    },
    audioScript: {
      en:      { host: "Analysis — where you find your edge over rivals.", pundit: "Swing matches. That's where titles are won." },
      'en-US': { host: "Analysis tab — rival breakdowns and AI intel.", pundit: "Ignore this and you're flying blind." },
      no:      { host: "Analyse — finn din fordel over rivalene.", pundit: "Swing-kamper. Der titler vinnes." },
      sco:     { host: "Analysis tab — find yer edge over the competition.", pundit: "Swing matches. Won or lost right here." },
    }
  },

  // STOP 9: MANAGER CONTENT / WRAP-UP
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
      en:      { host: "Browse predictions and tap a match to use a sub.", pundit: "Save subs for games that shift the board." },
      'en-US': { host: "Find a match, tap it, spend a sub. That's it.", pundit: "Don't waste them on dead rubbers." },
      no:      { host: "Finn en kamp, trykk på den, bruk et bytte.", pundit: "Ikke sløs bytter på avgjorte kamper." },
      sco:     { host: "Find a match, tap it, use yer sub. Simple.", pundit: "Save subs for the crunch games." },
    }
  },

  // STOP 10: PROFILE / WRAP-UP
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
