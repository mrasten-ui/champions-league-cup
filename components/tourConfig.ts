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

  // STOP 2: DAILY AI COACH BRIEF + STATS CARD
  {
    id: 'live_coach_brief',
    targets: ['tour-leaderboard-top', 'nav-leaderboard', 'nav-leaderboard-desk'],
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {},
    display: {
      en:      { title: "Your Command Card",    lines: ["This card is your personal command centre.", "At the top: your AI coach report — a daily briefing on your rank, your closest rivals, and how your specific picks are holding up.", "Below it: your gap to the leader, who you're chasing, and your 3-day rank trend.", "Tap the coach portrait to get the full commentary."] },
      'en-US': { title: "Your Command Card",    lines: ["This card is your personal command center.", "Top: AI coach report — daily briefing on your rank, rivals, and how your picks are performing.", "Below: your gap to the leader, who you're chasing, and your 3-day trend.", "Tap the coach portrait for the full breakdown."] },
      no:      { title: "Kommandokortet",        lines: ["Dette kortet er ditt personlige kommandosenter.", "Øverst: AI-trenerrapporten — daglig briefing om din plassering, dine rivaler og hvordan tipsene dine holder.", "Under: avstand til lederen, hvem du jager og 3-dagers utvikling.", "Trykk på trenerportrettet for full kommentar."] },
      sco:     { title: "Yer Command Card",     lines: ["That card is yer personal command centre.", "Top: AI coach report — daily briefing on yer rank, yer rivals, and how yer picks are haudin' up.", "Below: yer gap tae the leader, who ye're chasin', and yer 3-day trend.", "Tap the coach portrait for the full rundown."] },
    },
    audioScript: {
      en:      { host: "This card is your daily command centre — AI coach brief at the top, your rank gap and rivals below. Updated every day.", pundit: "The AI has studied your predictions. It has opinions." },
      'en-US': { host: "Your command card — daily AI brief on top, rank gap and rivals below. Refreshed every day.", pundit: "Pochettino's reviewed your picks. He's cautiously optimistic." },
      no:      { host: "Dette kortet er ditt daglige kommandosenter — AI-brief øverst, plassering og rivaler under. Oppdateres daglig.", pundit: "Assistenttreneren har gransket tipsene dine. Han er... bekymret." },
      sco:     { host: "That card — yer daily command centre. AI brief on top, rank gap and rivals below. Every day.", pundit: "Clarke's read yer picks. He's keepin' his thoughts tae himsel'. For now." },
    }
  },

  // STOP 3: LEADERBOARD — USER'S ROW EXPANDED
  {
    id: 'live_leaderboard',
    targets: ['tour-my-row', 'tour-my-row-expanded', 'nav-leaderboard', 'nav-leaderboard-desk'],
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {},
    display: {
      en:      { title: "Your Points",  lines: ["This is your row — tapped open so you can see the full breakdown.", "Green = exact scores (5 pts each). Blue = correct results (3 pts each).", "Indigo = total group stage points. Purple = knockout stage points.", "Toggle LIVE / BANKED at the top of the table to switch between confirmed and running totals."] },
      'en-US': { title: "Your Points",  lines: ["This is your row — opened up so you can see the full breakdown.", "Green = exact scores (5 pts each). Blue = correct results (3 pts each).", "Indigo = group stage points. Purple = knockout stage points.", "Toggle LIVE / BANKED at the top of the table to switch views."] },
      no:      { title: "Dine Poeng",   lines: ["Dette er din rad — åpnet slik at du kan se den fulle oversikten.", "Grønn = eksakte resultater (5 poeng hver). Blå = riktig utfall (3 poeng hver).", "Indigo = totale gruppespillpoeng. Lilla = sluttspillpoeng.", "Bytt LIVE / BANKET øverst i tabellen for å veksle mellom visningene."] },
      sco:     { title: "Yer Points",   lines: ["This is yer row — tapped open so ye can see the full breakdown.", "Green = exact scores (5 pts each). Blue = right results (3 pts each).", "Indigo = group stage points. Purple = knockout points.", "Toggle LIVE / BANKED at the top o' the table tae switch views."] },
    },
    audioScript: {
      en:      { host: "Your row is open. Green is exact scores, blue is correct results, indigo is group points, purple is knockout. Toggle Live and Banked at the top to switch views.", pundit: "The purple number is where tournaments are won or lost." },
      'en-US': { host: "Your row is open. Green for exact scores, blue for correct results, indigo group points, purple knockout. Toggle Live vs Banked at the top.", pundit: "That purple knockout number is everything." },
      no:      { host: "Din rad er åpen. Grønn for eksakte, blå for riktig utfall, indigo for gruppespill, lilla for sluttspill. Bytt Live og Banket øverst.", pundit: "Det lilla tallet er der turneringen vinnes eller tapes." },
      sco:     { host: "Yer row's open. Green for exact scores, blue for right results, indigo group points, purple knockout. Toggle Live and Banked at the top.", pundit: "That purple number — that's where it's decided." },
    }
  },

  // STOP 4: TOURNAMENT — SCHEDULE / MATCH CARD
  {
    id: 'live_tournament',
    targets: ['tour-schedule-hero', 'tour-subnav-schedule', 'nav-tournament', 'nav-tournament-desk'],
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {},
    display: {
      en:      { title: "Tournament",   lines: ["You're looking at the Schedule — today's featured match.", "Each card shows the kick-off time, your prediction, and your rivals' picks.", "When a match is live the score updates in real time, along with goal scorers and the current minute.", "Switch to Tables for group standings, or Bracket to see how your knockout picks are holding up."] },
      'en-US': { title: "Tournament",   lines: ["You're on the Schedule — today's featured match.", "Each card shows kick-off, your pick, and what your rivals are predicting.", "When a game is live you'll see the live score, goal scorers, and the clock in real time.", "Switch to Standings for group tables, or Bracket to track your playoff picks."] },
      no:      { title: "Turneringen",  lines: ["Du ser på Terminlisten — dagens kamphøjdepunkt.", "Hvert kort viser avspark, ditt tips og hva rivalene dine tror.", "Når en kamp er i gang vises livescoren, målscorere og minutt i sanntid.", "Bytt til Tabeller for gruppestillinger, eller Treet for å se hvordan sluttspilltipsene dine holder."] },
      sco:     { title: "The Cup",      lines: ["Ye're on the Fixtures — today's featured match.", "Each card shows kick-off, yer pick, and what yer rivals are callin'.", "When a game's live ye'll see the score, scorers, and the minute — updated in real time.", "Switch tae Leagues for group standings, or Tree tae see how yer knockout picks are haudin' up."] },
    },
    audioScript: {
      en:      { host: "The Schedule shows today's featured match — kick-off, your prediction, and rivals' picks. Live matches update in real time. Switch to Tables or Bracket from the buttons above.", pundit: "The Bracket. Is your champion still standing?" },
      'en-US': { host: "Schedule shows the featured match — your pick and rivals' calls. Live games update in real time. Standings and Bracket are up top.", pundit: "Bracket. Check it. Often." },
      no:      { host: "Terminlisten viser dagens kamphøjdepunkt — ditt tips og rivalenes. Livekamper oppdateres i sanntid. Bytt til Tabeller eller Treet øverst.", pundit: "Treet. Lever din mester fortsatt?" },
      sco:     { host: "Fixtures shows the featured match — yer pick and rivals' calls. Live games update in real time. Switch tae Leagues or Tree up top.", pundit: "The Tree. Is yer champion still breathin'?" },
    }
  },

  // STOP 5: MANAGER — SUBSTITUTIONS
  {
    id: 'live_manager',
    targets: ['tour-manager-hub', 'tour-manager-viewmode', 'nav-manager', 'nav-manager-desk'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {},
    display: {
      en:      { title: "Manager",  lines: ["You're on the Manager tab — this is where you control your predictions during the live tournament.", "All your picks locked at kick-off, but you were given Substitution tokens at the start.", "A Substitution works just like in football — you swap out one prediction for a new one.", "Find any upcoming match in the list, tap it, and spend a token to change your pick before that match kicks off.", "Tokens are limited and don't refill, so use them on matches that really matter."] },
      'en-US': { title: "Manager",  lines: ["You're on the Manager tab — your live prediction control room.", "All picks locked at kick-off, but you were given Substitution tokens at the start.", "A Sub works like a football substitution — you swap one prediction for a new one.", "Find any upcoming match, tap it, and spend a token to update your pick before it kicks off.", "Tokens are limited and don't come back, so use them wisely."] },
      no:      { title: "Manager",  lines: ["Du er på Manager-fanen — her styrer du tipsene dine under turneringen.", "Alle tips ble låst ved kampstart, men du fikk Byttetoken ved starten.", "Et Bytte fungerer som i fotball — du bytter ut ett tips med et nytt.", "Finn en kommende kamp i listen, trykk på den, og bruk et token for å endre tipset ditt før kampen starter.", "Token er begrenset og fylles ikke opp igjen, så bruk dem på kamper som virkelig teller."] },
      sco:     { title: "Manager",  lines: ["Ye're on the Manager tab — this is where ye control yer picks durin' the live tournament.", "Aw yer picks locked at kick-off, but ye were given Substitution tokens at the start.", "A Sub is like a fitba substitution — ye swap oot one pick for a new one.", "Find any comin' match in the list, tap it, and spend a token tae change yer pick before it kicks aff.", "Tokens are limited and dinnae refill, so use them on games that actually matter."] },
    },
    audioScript: {
      en:      { host: "Manager tab. Your picks are locked, but you have substitution tokens — spend one to swap a prediction on any upcoming match before it kicks off.", pundit: "Like a real manager. Use the sub at the right moment, not in a panic." },
      'en-US': { host: "Manager tab. Picks are locked, but your sub tokens let you swap a prediction on any upcoming game before kick-off.", pundit: "Use the sub at the right moment. Not out of desperation." },
      no:      { host: "Manager-fanen. Tipsene er låst, men byttetokenene lar deg bytte ett tips på en kommende kamp før den starter.", pundit: "Som en ekte manager. Bytt på riktig tidspunkt, ikke i panikk." },
      sco:     { host: "Manager tab. Picks are locked, but yer sub tokens let ye swap a pick on any comin' match before it kicks aff.", pundit: "Like a real manager. Use the sub at the right time. No' in a panic." },
    }
  },

  // STOP 6: SECOND CHANCE
  {
    id: 'live_second_chance',
    targets: ['tour-second-chance-promo', 'nav-manager', 'nav-manager-desk'],
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

  // STOP 7: ANALYSIS — TAB + CONTENT
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
    targets: ['rules-scoring-section', 'nav-rules', 'nav-rules-desk'],
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
