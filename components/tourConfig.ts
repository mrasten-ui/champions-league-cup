import { TourStep } from '../types';

export const PRE_SEASON_TOUR: TourStep[] = [
  // STOP 1: THE WELCOME
  {
    id: 'welcome',
    position: 'center',
    audioFiles: {
      en: '/audio/tour_pre_en_01.mp3',
      'en-US': '/audio/tour_pre_us_01.mp3',
      no: '/audio/tour_pre_no_01.mp3',
      sco: '/audio/tour_pre_sco_01.mp3'
    },
    display: {
      en: { title: "WELCOME MANAGER", lines: ["The Stadium is Open", "Turn on Sound 🎧"] },
      'en-US': { title: "WELCOME MANAGER", lines: ["The Field is Ready", "Turn on Sound 🎧"] },
      no: { title: "VELKOMMEN", lines: ["Stadion er åpen", "Skru på lyd 🎧"] },
      sco: { title: "WELCOME", lines: ["Yer in the team", "Turn yer sound on 🎧"] },
    },
    audioScript: {
      en: { host: "Welcome to The Rasten Cup! The stadium is ready. Are you?", pundit: "Let's see if you know your football, or if you're just guessing." },
      'en-US': { host: "Welcome to Rasten Cup Stadium! The field is perfect. It's game time.", pundit: "Do you know soccer, or are you just here for the snacks?" },
      no: { host: "Velkommen til Rasten Cup! Stadionet er klart. Er du?", pundit: "Nå skal vi se om du har peiling, eller om du bare tipper i blinde." },
      sco: { host: "Welcome tae The Rasten Cup! The atmosphere is building nicely.", pundit: "Aye, let's see if ye ken yer fitba or if yer just chancing it." }
    }
  },

  // STOP 2: THE MATCH CARD (Multiple Targets)
  {
    id: 'match_card',
    // Targets: Card, Up Buttons, Down Buttons
    targets: ['tour-first-match', 'tour-up-home', 'tour-down-home', 'tour-up-away', 'tour-down-away'], 
    position: 'top',
    audioFiles: { 
        en: '/audio/tour_pre_en_02.mp3', 'en-US': '/audio/tour_pre_us_02.mp3',
        no: '/audio/tour_pre_no_02.mp3', sco: '/audio/tour_pre_sco_02.mp3' 
    },
    display: {
      en: { title: "YOUR JOB", lines: ["Predict every score", "Use 👁️ SPY to peek at rivals"] },
      'en-US': { title: "THE MISSION", lines: ["Pick every winner", "Use 👁️ SPY to see rival picks"] },
      no: { title: "DIN JOBB", lines: ["Tipp alle resultater", "Bruk 👁️ SPION for å snoke"] },
      sco: { title: "YER JOB", lines: ["Pick the scores", "Use the 👁️ SPY button"] },
    },
    audioScript: {
      en: { host: "This is your main job. Predict the score for every single match.", pundit: "See that Eye icon? That's the Spy button. Use it to steal your rival's tactics!" },
      'en-US': { host: "This is the game. Pick a score for every matchup in the bracket.", pundit: "That Eye icon is the Spy button. Peek at your opponent's picks if you're nervous." },
      no: { host: "Dette er jobben din. Tipp resultatet i hver eneste kamp.", pundit: "Ser du øye-ikonet? Det er Spion-knappen. Bruk den til å snoke på konkurrentene!" },
      sco: { host: "This is what ye do. Pick a score for every game.", pundit: "That wee eye is the Spy button. Have a keek at what the others are picking." }
    }
  },

  // STOP 3: GROUP NAVIGATION (Seq Targets)
  {
    id: 'groups_nav',
    targets: ['nav-groups', 'subnav-groups'], // Main then Sub
    position: 'bottom',
    audioFiles: { 
        en: '/audio/tour_pre_en_03.mp3', 'en-US': '/audio/tour_pre_us_03.mp3',
        no: '/audio/tour_pre_no_03.mp3', sco: '/audio/tour_pre_sco_03.mp3' 
    },
    display: {
      en: { title: "12 GROUPS", lines: ["Don't stop at Group A", "Swipe/Click to navigate"] },
      'en-US': { title: "THE BRACKET", lines: ["There are 12 groups", "Don't miss the rest"] },
      no: { title: "12 GRUPPER", lines: ["Ikke stopp på Gruppe A", "Sveip for å se mer"] },
      sco: { title: "THE TEAMS", lines: ["12 Groups tae dae", "Keep swiping right"] },
    },
    audioScript: {
      en: { host: "There are 12 groups to complete. Use the navigation to find them all.", pundit: "Don't just fill in Group A and quit. That's a rookie mistake." },
      'en-US': { host: "There are 12 groups in total. Swipe or click to move between them.", pundit: "Don't stop after the first page. You can't win if you don't play." },
      no: { host: "Det er 12 grupper totalt. Bruk menyen for å finne alle.", pundit: "Ikke bare fyll ut Gruppe A og tro at du er ferdig. Det er amatørmessig." },
      sco: { host: "There's 12 groups tae get through. Keep swiping til yer done.", pundit: "Dinnae just do the first one and stop. Ye'll look like a numpty." }
    }
  },

  // STOP 4: MAGIC WAND
  {
    id: 'magic_wand',
    targetId: 'btn-magic-wand',
    position: 'top',
    audioFiles: { 
        en: '/audio/tour_pre_en_04.mp3', 'en-US': '/audio/tour_pre_us_04.mp3',
        no: '/audio/tour_pre_no_04.mp3', sco: '/audio/tour_pre_sco_04.mp3' 
    },
    display: {
      en: { title: "THE CHEAT CODE", lines: ["Auto-fill your bracket", "Based on Stats"] },
      'en-US': { title: "MAGIC WAND", lines: ["Auto-pick winners", "Lazy Mode: ON"] },
      no: { title: "TRYLLESTAV", lines: ["Fyll ut automatisk", "Basert på statistikk"] },
      sco: { title: "MAGIC WAND", lines: ["Fill it oot for ye", "For the lazy ones"] },
    },
    audioScript: {
      en: { host: "Short on time? The Magic Wand will analyze stats and auto-fill your predictions.", pundit: "It's for lazy managers, basically. But it might save your skin." },
      'en-US': { host: "In a rush? The Magic Wand analyzes the data and picks the winners for you.", pundit: "It's basically a cheat code. Use it if you're stuck." },
      no: { host: "Dårlig tid? Tryllestaven analyserer stats og fyller ut tipsene for deg.", pundit: "Det er juks for latsabber. Men det er bedre enn å levere blankt." },
      sco: { host: "Short o' time? The Magic Wand will look at the stats and fill it in for ye.", pundit: "It's cheating if ye ask me, but use it if yer desperate." }
    }
  },

  // STOP 5: KNOCKOUTS
  {
    id: 'knockout_tab',
    targets: ['nav-knockout', 'subnav-knockout'], // Main then Sub
    position: 'bottom',
    audioFiles: { 
        en: '/audio/tour_pre_en_05.mp3', 'en-US': '/audio/tour_pre_us_05.mp3',
        no: '/audio/tour_pre_no_05.mp3', sco: '/audio/tour_pre_sco_05.mp3' 
    },
    display: {
      en: { title: "KNOCKOUTS", lines: ["Pick WINNERS, not scores", "Don't leave it blank!"] },
      'en-US': { title: "THE BRACKET", lines: ["Pick who advances", "Pick a Champion"] },
      no: { title: "SLUTTSPILLET", lines: ["Velg vinner, ikke resultat", "Kår en mester!"] },
      sco: { title: "THE BIG ONE", lines: ["Who goes through?", "Pick a winner!"] },
    },
    audioScript: {
      en: { host: "Finally, go to the Knockout tab. Here you just pick who advances, you don't need to guess the score.", pundit: "If you don't pick a Champion, you can't win the league. Get it done!" },
      'en-US': { host: "Head to the Bracket tab next. Just pick the winners here, no scores needed.", pundit: "You gotta pick a Champion to win. Don't leave this empty!" },
      no: { host: "Til slutt, gå til Sluttspill-fanen. Her velger du bare hvem som går videre, ikke resultatet.", pundit: "Du må kåre en mester for å vinne. Få det gjort!" },
      sco: { host: "Last thing, go tae the Knockouts. Just pick who wins, nae scores needed.", pundit: "Ye cannae win if ye don't pick a winner. Get it filled in!" }
    }
  },

  // STOP 6: PROFILE
  {
    id: 'profile_menu',
    targetId: 'btn-profile-menu',
    position: 'bottom',
    audioFiles: { 
        en: '/audio/tour_pre_en_06.mp3', 'en-US': '/audio/tour_pre_us_06.mp3',
        no: '/audio/tour_pre_no_06.mp3', sco: '/audio/tour_pre_sco_06.mp3' 
    },
    display: {
      en: { title: "NEED HELP?", lines: ["Replay Tour anytime", "Good Luck!"] },
      'en-US': { title: "REPLAY", lines: ["Watch this again here", "Good Luck!"] },
      no: { title: "TRENGER DU HJELP?", lines: ["Se guiden igjen her", "Lykke til!"] },
      sco: { title: "STUCK?", lines: ["Play this again here", "Good Luck!"] },
    },
    audioScript: {
      en: { host: "That's the tour! If you need a refresher, you can replay this guide from your Profile menu.", pundit: "Now stop listening to us and get your predictions in. Good luck!" },
      'en-US': { host: "That's it! You can always replay this tour from your Profile menu if you get lost.", pundit: "Showtime. Lock in those picks and don't embarrass yourself." },
      no: { host: "Det var alt! Du kan spille av denne guiden igjen fra Profil-menyen hvis du glemmer noe.", pundit: "Da er det bare å sette i gang. Lykke til, du trenger det!" },
      sco: { host: "That's yer lot. If ye need told again, find the tour in yer Profile menu.", pundit: "Right, get cracking. We'll be watching." }
    }
  }
];