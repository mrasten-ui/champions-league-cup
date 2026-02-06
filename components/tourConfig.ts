import { TourStep } from '../types';

export const PRE_SEASON_TOUR: TourStep[] = [
  // STOP 1: THE WELCOME (Modal Center)
  {
    id: 'welcome',
    position: 'center',
    audioFiles: {
      en: '/audio/tour_pre_en_01.mp3',
      'en-US': '/audio/tour_pre_us_01.mp3',
      no: '/audio/tour_pre_no_01.mp3',
      sco: '/audio/tour_pre_sco_01.mp3'
    },
    script: {
      en: { 
        host: "Welcome to The Rasten Cup! The stadium is ready. Are you?", 
        pundit: "Let's see if you know your football, or if you're just guessing." 
      },
      'en-US': { 
        host: "Welcome to The Rasten Cup! The field is perfect. It's game time.", 
        pundit: "Do you know soccer, or are you just here for the snacks?" 
      },
      no: { 
        host: "Velkommen til Rasten Cup! Stadionet er klart. Er du?", 
        pundit: "Nå skal vi se om du har peiling, eller om du bare tipper i blinde." 
      },
      sco: { 
        host: "Welcome tae The Rasten Cup! The atmosphere is building nicely.", 
        pundit: "Aye, let's see if ye ken yer fitba or if yer just chancing it." 
      }
    }
  },

  // STOP 2: THE MATCH CARD (Predict + Spy)
  {
    id: 'match_card',
    targetId: 'tour-first-match', // We added this ID to MatchCard.tsx
    position: 'top',
    audioFiles: { 
        en: '/audio/tour_pre_en_02.mp3', 
        'en-US': '/audio/tour_pre_us_02.mp3',
        no: '/audio/tour_pre_no_02.mp3', 
        sco: '/audio/tour_pre_sco_02.mp3' 
    },
    script: {
      en: { 
        host: "This is your main job. Predict the score for every single match.", 
        pundit: "See that Eye icon? That's the Spy button. Use it to steal your rival's tactics!" 
      },
      'en-US': { 
        host: "This is the game. Pick a score for every matchup in the bracket.", 
        pundit: "That Eye icon is the Spy button. Peek at your opponent's picks if you're nervous." 
      },
      no: { 
        host: "Dette er jobben din. Tipp resultatet i hver eneste kamp.", 
        pundit: "Ser du øye-ikonet? Det er Spion-knappen. Bruk den til å snoke på konkurrentene!" 
      },
      sco: { 
        host: "This is what ye do. Pick a score for every game.", 
        pundit: "That wee eye is the Spy button. Have a keek at what the others are picking." 
      }
    }
  },

  // STOP 3: GROUP NAVIGATION (Scope)
  {
    id: 'groups_nav',
    targetId: 'nav-groups',
    position: 'bottom',
    audioFiles: { 
        en: '/audio/tour_pre_en_03.mp3', 
        'en-US': '/audio/tour_pre_us_03.mp3',
        no: '/audio/tour_pre_no_03.mp3', 
        sco: '/audio/tour_pre_sco_03.mp3' 
    },
    script: {
      en: { 
        host: "There are 12 groups to complete. Use the navigation to find them all.", 
        pundit: "Don't just fill in Group A and quit. That's a rookie mistake." 
      },
      'en-US': { 
        host: "There are 12 groups in total. Swipe or click to move between them.", 
        pundit: "Don't stop after the first page. You can't win if you don't play." 
      },
      no: { 
        host: "Det er 12 grupper totalt. Bruk menyen for å finne alle.", 
        pundit: "Ikke bare fyll ut Gruppe A og tro at du er ferdig. Det er amatørmessig." 
      },
      sco: { 
        host: "There's 12 groups tae get through. Keep swiping til yer done.", 
        pundit: "Dinnae just do the first one and stop. Ye'll look like a numpty." 
      }
    }
  },

  // STOP 4: MAGIC WAND (The Cheat)
  {
    id: 'magic_wand',
    targetId: 'btn-magic-wand',
    position: 'top',
    audioFiles: { 
        en: '/audio/tour_pre_en_04.mp3', 
        'en-US': '/audio/tour_pre_us_04.mp3',
        no: '/audio/tour_pre_no_04.mp3', 
        sco: '/audio/tour_pre_sco_04.mp3' 
    },
    script: {
      en: { 
        host: "Short on time? The Magic Wand will analyze stats and auto-fill your predictions.", 
        pundit: "It's for lazy managers, basically. But it might save your skin." 
      },
      'en-US': { 
        host: "In a rush? The Magic Wand analyzes the data and picks the winners for you.", 
        pundit: "It's basically a cheat code. Use it if you're stuck." 
      },
      no: { 
        host: "Dårlig tid? Tryllestaven analyserer stats og fyller ut tipsene for deg.", 
        pundit: "Det er juks for latsabber. Men det er bedre enn å levere blankt." 
      },
      sco: { 
        host: "Short o' time? The Magic Wand will look at the stats and fill it in for ye.", 
        pundit: "It's cheating if ye ask me, but use it if yer desperate." 
      }
    }
  },

  // STOP 5: KNOCKOUTS (The End Goal)
  {
    id: 'knockout_tab',
    targetId: 'nav-knockout',
    position: 'bottom',
    audioFiles: { 
        en: '/audio/tour_pre_en_05.mp3', 
        'en-US': '/audio/tour_pre_us_05.mp3',
        no: '/audio/tour_pre_no_05.mp3', 
        sco: '/audio/tour_pre_sco_05.mp3' 
    },
    script: {
      en: { 
        host: "Finally, go to the Knockout tab. You must pick a Champion to complete your entry.", 
        pundit: "You can use the Magic Wand there too. Just get it done!" 
      },
      'en-US': { 
        host: "Head to the Bracket tab next. You have to pick a Champion to win the game.", 
        pundit: "The Magic Wand works there too. Just make sure you pick a winner." 
      },
      no: { 
        host: "Til slutt, gå til Sluttspill-fanen. Du må kåre en mester for å delta.", 
        pundit: "Tryllestaven virker der også. Bare sørg for at du har en vinner!" 
      },
      sco: { 
        host: "Last thing, go tae the Knockouts. Ye need tae pick a winner to play.", 
        pundit: "The Wand works there too. Just dinnae leave it blank!" 
      }
    }
  }
];