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
    audioFiles: {
      en: '/audio/tour_live_en_01.mp3', 'en-US': '/audio/tour_live_us_01.mp3',
      no: '/audio/tour_live_no_01.mp3', sco: '/audio/tour_live_sco_01.mp3'
    },
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
    targets: ['tour-leaderboard-top'],
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {
      en: '/audio/tour_live_en_02.mp3', 'en-US': '/audio/tour_live_us_02.mp3',
      no: '/audio/tour_live_no_02.mp3', sco: '/audio/tour_live_sco_02.mp3'
    },
    display: {
      en:      { title: "Your Command Card",    lines: ["This card is your personal command centre.", "At the top: your daily brief from Tuchel — his AI-powered take on your rank, your closest rivals, and how your specific picks are holding up.", "Below it: your gap to the leader, who you're chasing, and your 3-day rank trend.", "Tap Tuchel's circular image in the card to get the full written commentary."] },
      'en-US': { title: "Your Command Card",    lines: ["This card is your personal command center.", "Top: your daily brief from Pochettino — his AI-powered take on your rank, rivals, and how your picks are performing.", "Below: your gap to the leader, who you're chasing, and your 3-day trend.", "Tap Pochettino's circular image in the card for the full written breakdown."] },
      no:      { title: "Kommandokortet",        lines: ["Dette kortet er ditt personlige kommandosenter.", "Øverst: din daglige brief fra Solbakken — hans AI-drevne vurdering av din plassering, dine rivaler og hvordan tipsene dine holder.", "Under: avstand til lederen, hvem du jager og 3-dagers utvikling.", "Trykk på Solbakkens bilde i kortet for full skriftlig kommentar."] },
      sco:     { title: "Yer Command Card",     lines: ["That card is yer personal command centre.", "Top: yer daily brief fae Clarke — his AI-powered take on yer rank, yer rivals, and how yer picks are haudin' up.", "Below: yer gap tae the leader, who ye're chasin', and yer 3-day trend.", "Tap Clarke's circular image in the card for the full written rundown."] },
    },
    audioScript: {
      en:      { host: "This card is your daily command centre — Tuchel's AI brief at the top, your rank gap and rivals below. Updated every day.", pundit: "Tuchel's studied your predictions. He has thoughts." },
      'en-US': { host: "Your command card — Pochettino's daily AI brief on top, rank gap and rivals below. Refreshed every day.", pundit: "Pochettino's reviewed your picks. He's cautiously optimistic." },
      no:      { host: "Dette kortet er ditt daglige kommandosenter — Solbakkens AI-brief øverst, plassering og rivaler under. Oppdateres daglig.", pundit: "Solbakken har gransket tipsene dine. Han er... bekymret." },
      sco:     { host: "That card — yer daily command centre. Clarke's AI brief on top, rank gap and rivals below. Every day.", pundit: "Clarke's read yer picks. He's keepin' his thoughts tae himsel'. For now." },
    }
  },

  // STOP 3: LEADERBOARD — USER'S ROW EXPANDED
  {
    id: 'live_leaderboard',
    targets: ['tour-my-row', 'tour-my-row-expanded'],
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {
      en: '/audio/tour_live_en_03.mp3', 'en-US': '/audio/tour_live_us_03.mp3',
      no: '/audio/tour_live_no_03.mp3', sco: '/audio/tour_live_sco_03.mp3'
    },
    display: {
      en:      { title: "Your Points",  lines: ["This is your row — tapped open so you can see the full breakdown.", "Green = exact score correct (5 pts each). Blue = right winner or draw, wrong exact score (3 pts each).", "Indigo = total group stage points. Purple = knockout stage points, including your tournament winner.", "Toggle LIVE / BANKED at the top of the table. LIVE includes points from matches still in play; BANKED is confirmed points only."] },
      'en-US': { title: "Your Points",  lines: ["This is your row — opened up so you can see the full breakdown.", "Green = nailed the exact score (5 pts each). Blue = right winner or draw, wrong exact score (3 pts each).", "Indigo = group stage points. Purple = knockout points, including your tournament winner pick.", "Toggle LIVE / BANKED at the top. LIVE includes points from games still in play; BANKED is confirmed points only."] },
      no:      { title: "Dine Poeng",   lines: ["Dette er din rad — åpnet slik at du kan se den fulle oversikten.", "Grønn = eksakt resultat (5 poeng hver). Blå = riktig vinner eller uavgjort, feil eksakt poengsum (3 poeng hver).", "Indigo = totale gruppespillpoeng. Lilla = sluttspillpoeng, inkludert turneringsvinnertippen din.", "Bytt LIVE / BANKET øverst. LIVE inkluderer poeng fra kamper som pågår; BANKET viser kun bekreftede poeng."] },
      sco:     { title: "Yer Points",   lines: ["This is yer row — tapped open so ye can see the full breakdown.", "Green = exact score correct (5 pts each). Blue = right winner or draw, wrong exact score (3 pts each).", "Indigo = group stage points. Purple = knockout points, includin' yer tournament winner pick.", "Toggle LIVE / BANKED at the top. LIVE includes points fae matches still in play; BANKED is confirmed points only."] },
    },
    audioScript: {
      en:      { host: "Your row is open. Green is exact scores, blue is correct outcomes — right winner or draw with the wrong score. Indigo is group points, purple is knockout. Toggle Live and Banked at the top.", pundit: "The purple number is where tournaments are won or lost." },
      'en-US': { host: "Your row is open. Green for exact scores, blue for correct outcomes — right winner, wrong score. Indigo group points, purple knockout. Toggle Live vs Banked at the top.", pundit: "That purple knockout number is everything." },
      no:      { host: "Din rad er åpen. Grønn for eksakte, blå for riktig utfall — riktig vinner eller uavgjort med feil poengsum. Indigo for gruppespill, lilla for sluttspill. Bytt Live og Banket øverst.", pundit: "Det lilla tallet er der turneringen vinnes eller tapes." },
      sco:     { host: "Yer row's open. Green for exact scores, blue for correct outcomes — right winner or draw with the wrong score. Indigo group points, purple knockout. Toggle Live and Banked at the top.", pundit: "That purple number — that's where it's decided." },
    }
  },

  // STOP 4: TOURNAMENT — SCHEDULE / MATCH CARD
  {
    id: 'live_tournament',
    targets: ['tour-schedule-hero', 'nav-tournament', 'nav-tournament-desk'],
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {
      en: '/audio/tour_live_en_04.mp3', 'en-US': '/audio/tour_live_us_04.mp3',
      no: '/audio/tour_live_no_04.mp3', sco: '/audio/tour_live_sco_04.mp3'
    },
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
    targets: ['tour-manager-hub', 'tour-manager-first-group', 'nav-manager', 'nav-manager-desk'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {
      en: '/audio/tour_live_en_05.mp3', 'en-US': '/audio/tour_live_us_05.mp3',
      no: '/audio/tour_live_no_05.mp3', sco: '/audio/tour_live_sco_05.mp3'
    },
    display: {
      en:      { title: "Manager — Substitutions",  lines: ["These are your match cards — each one shows your locked prediction for that game.", "See the substitution icon on a card? Tap it and you'll be asked to spend one of your Substitution tokens.", "A Sub works like a football substitution — you swap your old prediction for a new one before the match kicks off.", "The number of tokens you have left is shown in the header at the top. They don't refill, so pick your moments."] },
      'en-US': { title: "Manager — Substitutions",  lines: ["These are your match cards — each shows your locked pick for that game.", "See the sub icon on a card? Tap it and spend one of your Substitution tokens to change your pick.", "A Sub is a football-style substitution — swap your old prediction for a new one before kick-off.", "Your remaining tokens are shown in the header. They don't come back, so use them wisely."] },
      no:      { title: "Manager — Bytter",          lines: ["Dette er kampkortene dine — hvert viser ditt låste tips for den kampen.", "Ser du bytte-ikonet på et kort? Trykk på det og bruk ett av Byttetokenene dine.", "Et Bytte fungerer som i fotball — du bytter ut det gamle tipset med et nytt før kampen starter.", "Antall token du har igjen vises i toppen. De fylles ikke opp, så velg øyeblikkene med omhu."] },
      sco:     { title: "Manager — Substitutions",  lines: ["These are yer match cards — each shows yer locked pick for that game.", "See the sub icon on a card? Tap it and spend one o' yer Substitution tokens tae change yer pick.", "A Sub's like a fitba substitution — swap yer old pick for a new one before the match kicks aff.", "Yer remaining tokens are shown in the header up top. They dinnae refill, so pick yer moments."] },
    },
    audioScript: {
      en:      { host: "These are your match cards with your locked predictions. Tap the sub icon on any upcoming match and spend a token to swap your pick before it kicks off.", pundit: "Like a real manager. Use the sub at the right moment, not in a panic." },
      'en-US': { host: "Your match cards, your locked picks. Tap the sub icon and spend a token to change any prediction before kick-off.", pundit: "Use the sub at the right moment. Not out of desperation." },
      no:      { host: "Her er kampkortene med låste tips. Trykk på bytte-ikonet og bruk et token for å endre tipset ditt før kampen.", pundit: "Som en ekte manager. Bytt på riktig tidspunkt, ikke i panikk." },
      sco:     { host: "Yer match cards, yer locked picks. Tap the sub icon and spend a token tae change any pick before it kicks aff.", pundit: "Like a real manager. Use the sub at the right time. No' in a panic." },
    }
  },

  // STOP 6: SECOND CHANCE (Knockouts view of Manager)
  {
    id: 'live_second_chance',
    targets: ['tour-second-chance-promo', 'tour-knockout-btn', 'nav-manager', 'nav-manager-desk'],
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {
      en: '/audio/tour_live_en_06.mp3', 'en-US': '/audio/tour_live_us_06.mp3',
      no: '/audio/tour_live_no_06.mp3', sco: '/audio/tour_live_sco_06.mp3'
    },
    display: {
      en:      { title: "Second Chance",  lines: ["You're now in the Knockouts view of the Manager tab — tap the Knockouts button at the top to get here any time.", "Second Chance is a one-off lifeline: if the team you predicted to win the whole tournament gets knocked out, you can activate this to pick a new winner from whoever's still in it.", "You only get one. Activate it here when — and if — you need it."] },
      'en-US': { title: "Second Chance",  lines: ["You're now in the Knockouts view of the Manager tab — tap the Knockouts button to get here any time.", "Second Chance is a one-time lifeline: if your predicted tournament winner gets eliminated, activate this to pick a new winner from the remaining teams.", "One shot. Use it when you need it, not before."] },
      no:      { title: "Andre Sjanse",   lines: ["Du er nå i Sluttspill-visningen i Manager-fanen — trykk på Sluttspill-knappen øverst for å komme hit.", "Andre Sjanse er en engangsredning: hvis laget du tippet til å vinne turneringen ryker ut, kan du aktivere dette for å velge en ny vinner blant de som fortsatt er med.", "Du får bare én. Aktiver den her når — og hvis — du trenger det."] },
      sco:     { title: "Second Chance",  lines: ["Ye're now in the Knockouts view o' the Manager tab — tap the Knockouts button tae get here any time.", "Second Chance is a one-off lifeline: if the team ye tipped tae win the whole tournament gets knocked oot, activate this tae pick a new winner fae whoever's left.", "One shot. Use it when ye need it, no' before."] },
    },
    audioScript: {
      en:      { host: "Knockouts view of the Manager tab. Second Chance is right here — if your tournament winner gets knocked out, activate it to pick a new one from whoever's left.", pundit: "A lifeline. Don't waste it on sentiment." },
      'en-US': { host: "Knockouts view. Second Chance is here — if your winner goes out, activate it to pick a new one.", pundit: "A lifeline. Pick smart, not emotional." },
      no:      { host: "Sluttspill-visning i Manager. Andre Sjanse er her — hvis din turneringsvinner ryker ut, aktiver den for å velge en ny.", pundit: "En livline. Ikke kast den bort på nostalgi." },
      sco:     { host: "Knockouts view. Second Chance is right here — if yer winner gets knocked oot, activate it tae pick a new wan.", pundit: "A lifeline. Dinnae waste it on sentiment." },
    }
  },

  // STOP 7: ANALYSIS — SIMULATION WIDGET + FIRST MATCH
  {
    id: 'live_analysis',
    targets: ['tour-analysis-simleaderboard', 'tour-analysis-first-simrow', 'nav-analysis', 'nav-analysis-desk'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {
      en: '/audio/tour_live_en_07.mp3', 'en-US': '/audio/tour_live_us_07.mp3',
      no: '/audio/tour_live_no_07.mp3', sco: '/audio/tour_live_sco_07.mp3'
    },
    display: {
      en:      { title: "Analysis — Play Out Scenarios",  lines: ["The sticky bar at the top shows your simulated rank — updating live as you adjust scores below.", "Each match card has score adjusters. Change the result and watch your leaderboard position react in real time.", "Play out 'what if' scenarios — if these matches go my way, where do I end up?", "Your simulated rank resets when you leave, so nothing here affects your real score."] },
      'en-US': { title: "Analysis — Run Your Scenarios",  lines: ["The bar at the top shows your simulated rank — it updates as you adjust scores below.", "Tap the score adjusters on each match card and watch your leaderboard position change in real time.", "Run 'what if' scenarios — if these results go my way, where do I finish?", "Your simulated rank resets when you leave. Nothing here touches your real score."] },
      no:      { title: "Analyse — Spill ut scenarioer",   lines: ["Feltet øverst viser din simulerte rangering — oppdateres i sanntid når du justerer resultater.", "Hvert kampkort har poengvippere. Endre resultatet og se rangeringen din reagere umiddelbart.", "Spill ut 'hva om'-scenarioer — hvis disse kampene går min vei, hvor havner jeg?", "Simulert rangering nullstilles når du forlater siden — ingenting her påvirker poengsummen din."] },
      sco:     { title: "Analysis — Play Out Scenarios",  lines: ["The bar at the top shows yer simulated rank — updating as ye change scores below.", "Each match card has score adjusters. Shift a result and watch yer leaderboard move in real time.", "Play out 'what if' scenarios — if these go yer way, where dae ye end up?", "Yer simulated rank resets when ye leave. Nothing here touches yer real score."] },
    },
    audioScript: {
      en:      { host: "The Analysis tab lets you play out scenarios. Change match scores with the adjusters and your simulated rank updates live at the top. None of it affects your real score.", pundit: "The optimist's tab. Everyone ends up winning in the simulation." },
      'en-US': { host: "Analysis — adjust match scores and watch your simulated rank react in real time. Your actual score is untouched.", pundit: "Everyone's a genius in the sim. Real life's the hard part." },
      no:      { host: "Analyse-fanen lar deg spille ut scenarioer. Juster resultater og se simulert rangering oppdateres i sanntid. Påvirker ikke poengsummen din.", pundit: "Optimistenes fane. Alle vinner i simuleringen." },
      sco:     { host: "Analysis tab — adjust match scores and yer simulated rank updates live at the top. Disnae touch yer real score.", pundit: "The optimist's tab. Everyone wins in the sim." },
    }
  },

  // STOP 8: RULES & POINTS
  {
    id: 'live_rules',
    targets: ['rules-scoring-section', 'nav-rules', 'nav-rules-desk'],
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {
      en: '/audio/tour_live_en_08.mp3', 'en-US': '/audio/tour_live_us_08.mp3',
      no: '/audio/tour_live_no_08.mp3', sco: '/audio/tour_live_sco_08.mp3'
    },
    display: {
      en:      { title: "Points System",  lines: ["Exact score: 5 points. Correct outcome (right winner or draw, wrong score): 3 points. Tournament winner: 40 points.", "Spy Scouts let you peek at a rival's locked picks — useful for judging whether to burn a sub.", "The full breakdown is right here — substitutions, scouts, second chance, all of it.", "Read it once. No excuses after."] },
      'en-US': { title: "Points System",  lines: ["Exact score: 5 pts. Correct outcome (right winner or draw, wrong score): 3 pts. Tournament winner: 40 pts.", "Spy Scouts let you check a rival's locked picks — handy for deciding whether to use a sub.", "Full breakdown right here — subs, scouts, second chance, all of it.", "Know the system. No excuses."] },
      no:      { title: "Poengsystem",    lines: ["Eksakt resultat: 5 poeng. Riktig utfall (riktig vinner/uavgjort, feil poengsum): 3 poeng. Turneringsvinner: 40 poeng.", "Speider lar deg se en rivals låste tips — nyttig for å vurdere om du bør bruke et bytte.", "Full oversikt er rett her — bytter, speider og andre sjanse.", "Les det én gang. Ingen unnskyldninger etter det."] },
      sco:     { title: "Points System",  lines: ["Exact score: 5 points. Correct outcome (right winner or draw, wrong score): 3 points. Tournament winner: 40 points.", "Spy Scouts let ye peek at a rival's locked picks — handy for decidin' whether tae burn a sub.", "Full breakdown right here — subs, scouts, second chance, all o' it.", "Read it once. Nae excuses after."] },
    },
    audioScript: {
      en:      { host: "Exact score: 5 points. Correct outcome — right winner or draw, wrong score — 3 points. Tournament winner: 40 points. The full breakdown is right here.", pundit: "Know the system. No excuses for not reading it." },
      'en-US': { host: "5 for exact, 3 for the right outcome, 40 for the winner. Full breakdown here.", pundit: "No excuses for not knowing the scoring." },
      no:      { host: "Eksakt: 5 poeng. Riktig utfall: 3 poeng. Turneringsvinner: 40 poeng. Full oversikt er her.", pundit: "Les den. Ingen unnskyldninger." },
      sco:     { host: "Exact score: 5 points. Correct outcome — right winner or draw, wrong score — 3 points. Tournament winner: 40. Full breakdown right here.", pundit: "Nae excuses. It's all there." },
    }
  },

  // STOP 9: PROFILE / WRAP-UP
  {
    id: 'live_profile',
    targetId: 'btn-profile-menu',
    position: 'bottom',
    overlayType: 'none',
    audioFiles: {
      en: '/audio/tour_live_en_09.mp3', 'en-US': '/audio/tour_live_us_09.mp3',
      no: '/audio/tour_live_no_09.mp3', sco: '/audio/tour_live_sco_09.mp3'
    },
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
