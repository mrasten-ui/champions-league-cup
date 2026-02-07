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
      en: { title: "ON AIR: SKY STUDIO", lines: ["Broadcast Live", "Turn on Sound 🎧"] },
      'en-US': { title: "ON AIR: ESPN RADIO", lines: ["Hot Takes Live", "Volume UP 🎧"] },
      no: { title: "DIREKTE: TV2 STUDIO", lines: ["Vi er på lufta", "Skru på lyd 🎧"] },
      sco: { title: "ON AIR: SPORTSCENE", lines: ["Live fae Glasgow", "Sound on 🎧"] },
    },
    audioScript: {
      en: { 
        host: "Good evening and welcome to The Rasten Cup coverage. I'm Sarah, and joining me is Premier League veteran, Gaz.", 
        pundit: "Cheers Sarah. Look, let's cut the chat. Does this manager have a clue, or are they gonna bottle it like usual?" 
      },
      'en-US': { 
        host: "We are LIVE! Jessica here with the legend, Chuck 'The Tank'. Chuck, is the stadium ready?", 
        pundit: "The field looks good, Jess, but I'm looking at this rookie manager and I gotta ask... ARE YOU KIDDING ME?" 
      },
      no: { 
        host: "Velkommen til studio! Jeg er Silje, og med meg har jeg legenden Nils Arne.", 
        pundit: "Ah, for en kveld! Det minner meg om Marseille i '98! Alt handler om samhandling. Er du klar til å spille de andre gode?" 
      },
      sco: { 
        host: "Welcome tae the show. Shona here, and unfortunately, Rab is here too.", 
        pundit: "Aye, barely. Let's see if this new manager knows their fitba or if they're talkin' absolute mince." 
      }
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
      en: { title: "PREDICTION TIME", lines: ["Predict the score", "Don't sit on the fence"] },
      'en-US': { title: "PICK 'EM", lines: ["Pick a Winner", "No Ties Allowed!"] },
      no: { title: "TIPP RESULTATET", lines: ["Hjemme vs Borte", "Bruk spion-knappen"] },
      sco: { title: "PICK THE SCORE", lines: ["Home and Away", "Watch the 0-0"] },
    },
    audioScript: {
      en: { 
        host: "Your job is simple: Predict the score for every match using the arrows.", 
        pundit: "And don't give me any of that 'low block' tactical nonsense. Just pick a winner! Use the Spy button if you need to copy someone better than you." 
      },
      'en-US': { 
        host: "This is the main event. Use the arrows to pick the final score.", 
        pundit: "And listen to me: NO TIES. In this sport you play to win! If you're scared, click that Spy eye to cheat off your neighbor." 
      },
      no: { 
        host: "Dette er oppgaven din. Tipp resultatet i hver eneste kamp.", 
        pundit: "Ser du øye-ikonet? Det er Spion-knappen. Men husk, du må stole på dine egne ferdigheter! Godfoten starter med deg!" 
      },
      sco: { 
        host: "Just use the arrows tae pick the scores. It's not rocket science.", 
        pundit: "Here, see that wee eye? That's the Spy button. Use it if yer struggling. And don't be afraid of a 0-0 draw, that's proper football." 
      }
    }
  },

  // STOP 3: GROUP NAVIGATION
  {
    id: 'groups_nav',
    targets: ['nav-groups', 'subnav-groups'], 
    position: 'bottom',
    overlayType: 'swipe-hand',
    audioFiles: { 
        en: '/audio/tour_pre_en_03.mp3', 'en-US': '/audio/tour_pre_us_03.mp3',
        no: '/audio/tour_pre_no_03.mp3', sco: '/audio/tour_pre_sco_03.mp3' 
    },
    display: {
      en: { title: "12 GROUPS", lines: ["Group A to L", "Swipe to navigate"] },
      'en-US': { title: "THE BRACKET", lines: ["12 Groups total", "Don't be lazy"] },
      no: { title: "12 GRUPPER", lines: ["Gruppe A til L", "Sveip videre"] },
      sco: { title: "THE GROUPS", lines: ["12 of them", "Keep scrolling"] },
    },
    audioScript: {
      en: { 
        host: "There are 12 groups in total. Please ensure you navigate through all of them.", 
        pundit: "Yeah, don't just do Group A and go to the pub. That's a Sunday League mentality. 12 groups, get moving!" 
      },
      'en-US': { 
        host: "We have 12 groups to get through. Swipe to find them all.", 
        pundit: "12 groups! That's a lot of games. Don't quit on me halfway through, rookie! I GUARANTEE you lose if you leave them blank." 
      },
      no: { 
        host: "Det er 12 grupper totalt. Bruk menyen for å finne alle.", 
        pundit: "Du må se hele banen! 12 grupper. Det er som et vakkert orkester, alle må spille sammen." 
      },
      sco: { 
        host: "There's 12 groups tae get through. Don't stop at just the first one.", 
        pundit: "Aye, keep swiping right. Don't be lazy. You've got 12 groups to do before ye get a pie." 
      }
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
      en: { title: "MAGIC WAND", lines: ["Auto-fill predictions", "Based on Data"] },
      'en-US': { title: "CHEAT CODE", lines: ["Auto-Pick", "For lazy people"] },
      no: { title: "TRYLLESTAV", lines: ["Fyll ut automatisk", "Basert på Godfoten"] },
      sco: { title: "MAGIC WAND", lines: ["Auto-fill", "Pure laziness"] },
    },
    audioScript: {
      en: { 
        host: "Running late? The Magic Wand will use statistics to auto-fill your remaining games.", 
        pundit: "It's for people who don't know the game, Sarah. Press it if you want, but don't come crying to me when you lose." 
      },
      'en-US': { 
        host: "In a rush? The Magic Wand analyzes the stats and picks for you.", 
        pundit: "Stats? Percentages? It's a cheat code for people who don't watch tape! Use it if you're scared." 
      },
      no: { 
        host: "Dårlig tid? Tryllestaven analyserer tallene og fyller ut for deg.", 
        pundit: "Det er teknologisk samhandling! Den bruker statistikk til å spille deg god. Et fantastisk verktøy!" 
      },
      sco: { 
        host: "Short o' time? The Magic Wand will fill it out for ye.", 
        pundit: "It's pure laziness is what it is. In my day we used a pen and paper. But aye, go ahead press it." 
      }
    }
  },

  // STOP 5: KNOCKOUTS
  {
    id: 'knockout_tab',
    targets: ['nav-knockout', 'subnav-knockout'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: { 
        en: '/audio/tour_pre_en_05.mp3', 'en-US': '/audio/tour_pre_us_05.mp3',
        no: '/audio/tour_pre_no_05.mp3', sco: '/audio/tour_pre_sco_05.mp3' 
    },
    display: {
      en: { title: "KNOCKOUTS", lines: ["Pick WINNERS", "No Scores Needed"] },
      'en-US': { title: "THE PLAYOFFS", lines: ["Who advances?", "Pick a Champ"] },
      no: { title: "SLUTTSPILLET", lines: ["Velg vinner", "Kår en mester"] },
      sco: { title: "THE BIG ONE", lines: ["Who goes through?", "Pick a winner"] },
    },
    audioScript: {
      en: { 
        host: "Finally, head to the Knockout tab. Here, you simply tap the team you think will advance.", 
        pundit: "No sitting on the fence here! You have to pick a winner. If you don't pick a Champion, what are you even doing here?" 
      },
      'en-US': { 
        host: "Head to the Bracket tab. Just pick who moves on, no scores needed.", 
        pundit: "This is the Playoffs! Win or go home! Pick a Champion or get out of the studio!" 
      },
      no: { 
        host: "Gå til Sluttspill-fanen. Her velger du hvem som går videre.", 
        pundit: "Det er her helter skapes! Som i '98! Du må velge hvem som har best flyt. Kår din mester!" 
      },
      sco: { 
        host: "Last up, the Knockouts. Just pick who wins, nae scores needed.", 
        pundit: "None of your 0-0 draws here. Someone has tae win. Get it filled in or yer talkin' mince." 
      }
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
      en: { title: "GOOD LUCK", lines: ["Replay anytime", "Game On!"] },
      'en-US': { title: "GAME TIME", lines: ["Replay in Menu", "Let's Go!"] },
      no: { title: "LYKKE TIL", lines: ["Se igjen i menyen", "Heia!"] },
      sco: { title: "GOOD LUCK", lines: ["Replay in menu", "Mon then!"] },
    },
    audioScript: {
      en: { 
        host: "That concludes our briefing. You can replay this tour from your Profile menu.", 
        pundit: "Right, stop listening to us and get your predictions in. Good luck, you'll need it!" 
      },
      'en-US': { 
        host: "That's it! You can replay this anytime from the Profile menu.", 
        pundit: "Showtime baby! Lock in those picks. I GUARANTEE this is gonna be wild!" 
      },
      no: { 
        host: "Det var alt! Du kan se dette igjen via Profil-menyen.", 
        pundit: "Da er det opp til deg. Bruk hodet, bruk hjertet, bruk Godfoten! Lykke til!" 
      },
      sco: { 
        host: "That's yer lot. Need told again? Find the tour in yer Profile menu.", 
        pundit: "Right, get cracking. And don't make a mess of it. We'll be watching." 
      }
    }
  }
];