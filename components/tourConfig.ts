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
      en: { title: "Welcome", lines: ["Welcome to the pre-season briefing.", "Follow this tour to learn how to play."] },
      'en-US': { title: "Welcome", lines: ["Welcome to the pre-season briefing.", "Follow this tour to learn how to play."] },
      sco: { title: "Welcome", lines: ["Welcome to the pre-season briefing.", "Follow this tour to learn how to play."] },
      no: { title: "Velkommen", lines: ["Velkommen til før-sesong briefingen.", "Følg denne omvisningen for å lære spillet."] }
    },
    audioScript: {
      en: { 
        host: "Good evening and welcome to The Rasten Cup coverage. I'm Sarah, and joining me is Premier League veteran, Gaz.", 
        pundit: "Cheers Sarah. Look, let's cut the chat. Does this manager have a clue, or are they gonna bottle it like usual?" 
      },
      'en-US': { 
        host: "We are LIVE! Jessica here, alongside gridiron legend, Chuck. Are you ready for the World Series of Soccer?", 
        pundit: "I am fired up, Jess! Let's see if this rookie manager has what it takes to get to the Super Bowl!" 
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
      en: { title: "Predictions", lines: ["Use the arrows to predict the exact final score.", "Click the Eye icon to peek at a rival's picks."] },
      'en-US': { title: "Predictions", lines: ["Use the arrows to predict the exact final score.", "Click the Eye icon to peek at a rival's picks."] },
      sco: { title: "Predictions", lines: ["Use the arrows to predict the exact final score.", "Click the Eye icon to peek at a rival's picks."] },
      no: { title: "Tips", lines: ["Bruk pilene for å tippe nøyaktig sluttresultat.", "Klikk på Øye-ikonet for å se rivalens tips."] }
    },
    audioScript: {
      en: { 
        host: "Your job is simple: Predict the score for every match using the arrows.", 
        pundit: "And don't give me any of that 'low block' tactical nonsense. Just pick a winner! Use the Spy button if you need to copy someone better than you." 
      },
      'en-US': { 
        host: "First up, the Group Stage. Use the arrows to pick the final score.", 
        pundit: "A DRAW?! What do you mean you can draw?! What kind of sport is this?!" 
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
    targets: ['nav-groups', 'nav-groups-desk', 'subnav-groups'],
    position: 'bottom',
    overlayType: 'swipe-hand',
    audioFiles: { 
        en: '/audio/tour_pre_en_03.mp3', 'en-US': '/audio/tour_pre_us_03.mp3',
        no: '/audio/tour_pre_no_03.mp3', sco: '/audio/tour_pre_sco_03.mp3' 
    },
    display: {
      en: { title: "Groups", lines: ["There are 12 groups in total.", "Swipe or click through all the tabs to complete your predictions."] },
      'en-US': { title: "Groups", lines: ["There are 12 groups in total.", "Swipe or click through all the tabs to complete your predictions."] },
      sco: { title: "Groups", lines: ["There are 12 groups in total.", "Swipe or click through all the tabs to complete your predictions."] },
      no: { title: "Grupper", lines: ["Det er 12 grupper totalt.", "Sveip eller klikk deg gjennom alle fanene for å fullføre tipsene dine."] }
    },
    audioScript: {
      en: { 
        host: "There are 12 groups in total. Please ensure you navigate through all of them.", 
        pundit: "Yeah, don't just do Group A and go to the pub. That's a Sunday League mentality. 12 groups, get moving!" 
      },
      'en-US': { 
        host: "Moving on... there are twelve groups in total. Make sure you swipe through all of them.", 
        pundit: "Twelve divisions?! That's a massive schedule! Don't leave any blanks, rookie, or you're getting benched!" 
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
      en: { title: "Magic Wand", lines: ["Short on time?", "Use the Magic Wand to automatically fill remaining group scores based on stats."] },
      'en-US': { title: "Auto-Pick", lines: ["Short on time?", "Use the Magic Wand to automatically fill remaining group scores based on stats."] },
      sco: { title: "Magic Wand", lines: ["Short on time?", "Use the Magic Wand to automatically fill remaining group scores based on stats."] },
      no: { title: "Tryllestav", lines: ["Dårlig tid?", "Bruk Tryllestaven for å automatisk fylle inn resten av resultatene basert på statistikk."] }
    },
    audioScript: {
      en: { 
        host: "Running late? The Magic Wand will use statistics to auto-fill your remaining games.", 
        pundit: "It's for people who don't know the game, Sarah. Press it if you want, but don't come crying to me when you lose." 
      },
      'en-US': { 
        host: "Short on time? The Magic Wand uses stats to auto-fill the rest of your bracket.", 
        pundit: "Analytics?! A computer calling your plays?! Man, the game has gone completely soft." 
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
    targets: ['nav-knockout', 'nav-knockout-desk', 'subnav-knockout', 'tour-first-knockout'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: { 
        en: '/audio/tour_pre_en_05.mp3', 'en-US': '/audio/tour_pre_us_05.mp3',
        no: '/audio/tour_pre_no_05.mp3', sco: '/audio/tour_pre_sco_05.mp3' 
    },
    display: {
      en: { title: "Knockouts", lines: ["In the knockout stage, no exact scores are needed.", "Simply tap the team you predict will advance to the next round."] },
      'en-US': { title: "Playoffs", lines: ["In the playoff stage, no exact scores are needed.", "Simply tap the team you predict will advance to the next round."] },
      sco: { title: "Knockouts", lines: ["In the knockout stage, no exact scores are needed.", "Simply tap the team you predict will advance to the next round."] },
      no: { title: "Sluttspill", lines: ["I sluttspillet trenger du ikke tippe resultat.", "Bare trykk på det laget du tror går videre til neste runde."] }
    },
    audioScript: {
      en: { 
        host: "Finally, head to the Knockout tab. Here, you simply tap the team you think will advance.", 
        pundit: "No sitting on the fence here! You have to pick a winner. If you don't pick a Champion, what are you even doing here?" 
      },
      'en-US': { 
        host: "Finally, the Knockout stage. No scores here, just tap who advances.", 
        pundit: "Now we're talking! The Playoffs! Sudden death! Pick a Champion or go home!" 
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
      en: { title: "Ready", lines: ["The briefing is complete.", "You can replay this tour anytime from your Profile menu."] },
      'en-US': { title: "Ready", lines: ["The briefing is complete.", "You can replay this tour anytime from your Profile menu."] },
      sco: { title: "Ready", lines: ["The briefing is complete.", "You can replay this tour anytime from your Profile menu."] },
      no: { title: "Klar", lines: ["Briefingen er ferdig.", "Du kan se denne omvisningen på nytt når som helst fra Profil-menyen."] }
    },
    audioScript: {
      en: { 
        host: "That concludes our briefing. You can replay this tour from your Profile menu.", 
        pundit: "Right, stop listening to us and get your predictions in. Good luck, you'll need it!" 
      },
      'en-US': { 
        host: "That wraps our briefing. You can replay this tour anytime from your Profile.", 
        pundit: "Put your helmet on, strap up, and lock in those picks! Let's GO!" 
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

// ─────────────────────────────────────────────────────────
//  LIVE SEASON TOUR  (text-only by default — no audio yet)
// ─────────────────────────────────────────────────────────
export const LIVE_SEASON_TOUR: TourStep[] = [

  // STOP 1: LIVE WELCOME
  {
    id: 'live_welcome',
    position: 'center',
    overlayType: 'none',
    audioFiles: {},
    display: {
      en: {
        title: "We're Live",
        lines: [
          "The tournament has kicked off.",
          "Here's a quick guide to what's changed."
        ]
      },
      'en-US': {
        title: "It's Live!",
        lines: [
          "The tournament has officially tipped off.",
          "Let's walk you through the new setup."
        ]
      },
      no: {
        title: "Vi Er Live",
        lines: [
          "Turneringen er i gang.",
          "Her er en rask guide til hva som er nytt."
        ]
      },
      sco: {
        title: "We're Live",
        lines: [
          "The tournament's kicked aff.",
          "Here's whit's changed — pay attention."
        ]
      }
    },
    audioScript: {
      en: {
        host: "We are live! The Rasten Cup has begun. I'm Sarah, and the predictions are locked — but the game is very much on.",
        pundit: "Right, forget about the group stage now. What matters is what's happening on the pitch. Let me show you around the new setup."
      },
      'en-US': {
        host: "IT IS HAPPENING! We are live! The tournament has officially tipped off!",
        pundit: "The picks are locked, and now we watch it unfold. Let me walk you through the new screens."
      },
      no: {
        host: "Vi er live! Turneringen er i gang. Tipsene er låst — men kampen er absolutt ikke over.",
        pundit: "Glem gruppespillet nå. Det som teller er det som skjer på banen. La meg vise deg det nye oppsettet."
      },
      sco: {
        host: "Right, we're aff! The Rasten Cup is live. The predictions are locked — but dinnae touch that dial.",
        pundit: "Forget what ye tipped. What matters now is actual fitba. Let's have a wee tour of the new stuff."
      }
    }
  },

  // STOP 2: LIVE LEADERBOARD
  {
    id: 'live_leaderboard',
    targets: ['nav-leaderboard', 'nav-leaderboard-desk', 'tour-leaderboard-top'],
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {},
    display: {
      en: {
        title: "Live Leaderboard",
        lines: [
          "Points update in real time as matches finish.",
          "See how you rank against others in your league."
        ]
      },
      'en-US': {
        title: "Live Leaderboard",
        lines: [
          "Points drop the moment a final whistle blows.",
          "Watch your ranking climb — or sink."
        ]
      },
      no: {
        title: "Direkte Tabell",
        lines: [
          "Poeng oppdateres i sanntid etter kampene.",
          "Se hvordan du rangerer mot andre i ligaen din."
        ]
      },
      sco: {
        title: "Live Table",
        lines: [
          "Points update as the results come in.",
          "See where ye stand in yer league."
        ]
      }
    },
    audioScript: {
      en: {
        host: "First stop: the Leaderboard. Every correct prediction earns you points in real time.",
        pundit: "This is where reputations are made and destroyed. Watch that table move after every result. It's ruthless."
      },
      'en-US': {
        host: "Step one: check the Leaderboard. Points drop the moment a final whistle blows.",
        pundit: "Is your name climbing or sinking? Eyes on the prize, people."
      },
      no: {
        host: "Første stopp: Poengtabellen. Hvert riktige tips gir deg poeng i sanntid.",
        pundit: "Her skapes og ødelegges rykter. Se tabellen bevege seg etter hvert resultat."
      },
      sco: {
        host: "First up, the Leaderboard. Every right result nets ye points live.",
        pundit: "Is yer name going up or doon? Dinnae look away."
      }
    }
  },

  // STOP 3: TOURNAMENT HUB
  {
    id: 'live_tournament',
    targets: ['nav-tournament', 'nav-tournament-desk'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {},
    display: {
      en: {
        title: "Tournament Hub",
        lines: [
          "Track live results, group tables, and the knockout bracket.",
          "Three sub-tabs: Schedule, Tables, and Bracket."
        ]
      },
      'en-US': {
        title: "Tournament Hub",
        lines: [
          "Live scores, group standings, and the playoff bracket — all here.",
          "Three views: Schedule, Tables, Bracket."
        ]
      },
      no: {
        title: "Turneringsoversikt",
        lines: [
          "Følg live-resultater, gruppetabeller og sluttspillbraketten.",
          "Tre faner: Kampplan, Tabeller og Braketten."
        ]
      },
      sco: {
        title: "Tournament Hub",
        lines: [
          "Live results, group tables, and the knockout draw.",
          "Three tabs: Schedule, Tables, Bracket."
        ]
      }
    },
    audioScript: {
      en: {
        host: "The Tournament tab gives you three views: Schedule for live match updates, Tables for group standings, and Bracket for the knockout picture.",
        pundit: "Keep an eye on the Bracket. That's where your predictions either shine or fall apart spectacularly."
      },
      'en-US': {
        host: "Head to Tournament for live scores, group standings, and the playoff bracket all in one place.",
        pundit: "The bracket is everything in this format. If your champion pick loses in the quarters, it's a long walk home."
      },
      no: {
        host: "Turnering-fanen gir deg tre visninger: Kampplan for live-oppdateringer, Tabeller for gruppestillinger, og Braketten for sluttspillet.",
        pundit: "Hold øye med braketten. Der skinner dine tips — eller faller fra hverandre spektakulært."
      },
      sco: {
        host: "The Tournament tab has yer schedule, group tables, and the knockout bracket — all in one place.",
        pundit: "The bracket's the only thing that matters now. If yer champion's already oot, that's on you."
      }
    }
  },

  // STOP 4: MANAGER HUB
  {
    id: 'live_manager',
    targets: ['nav-manager', 'nav-manager-desk', 'tour-manager-hub'],
    position: 'bottom',
    overlayType: 'swipe-hand',
    audioFiles: {},
    display: {
      en: {
        title: "Manager Hub",
        lines: [
          "Use substitutions to update locked-in predictions.",
          "Second Chance and your resources live here too."
        ]
      },
      'en-US': {
        title: "Manager Hub",
        lines: [
          "Spend substitutions to change locked picks — use them wisely.",
          "Second Chance and resources are here too."
        ]
      },
      no: {
        title: "Manager-hub",
        lines: [
          "Bruk bytter for å oppdatere innlåste tips.",
          "Andre sjanse og ressurser er tilgjengelig her."
        ]
      },
      sco: {
        title: "Manager Hub",
        lines: [
          "Spend yer substitutions tae update locked predictions.",
          "Second Chance and resources live here too."
        ]
      }
    },
    audioScript: {
      en: {
        host: "The Manager tab is your control room. Substitutions let you swap out predictions that have already locked in.",
        pundit: "You've got a limited number of subs — don't waste them on a dead rubber. Use them surgically on matches that can still move you up the table."
      },
      'en-US': {
        host: "Manager is your control room. Substitutions let you change locked-in picks — use them wisely.",
        pundit: "You only get so many subs. Don't burn them on a blowout. Save them for the crunch games."
      },
      no: {
        host: "Manager-fanen er kontrollrommet ditt. Bytter lar deg bytte ut tips som allerede er låst.",
        pundit: "Du har begrenset antall bytter — ikke sløs dem på en avgjort kamp. Bruk dem kirurgisk."
      },
      sco: {
        host: "The Manager tab's yer dugout. Substitutions let ye swap oot predictions that are already locked.",
        pundit: "Ye've got limited subs — dinnae waste them on a deid rubber. Save them for the big games."
      }
    }
  },

  // STOP 5: PROFILE / WRAP-UP
  {
    id: 'live_profile',
    targetId: 'btn-profile-menu',
    position: 'bottom',
    overlayType: 'none',
    audioFiles: {},
    display: {
      en: {
        title: "You're Ready",
        lines: [
          "The season is live — enjoy the ride.",
          "Replay this tour anytime from your Profile menu."
        ]
      },
      'en-US': {
        title: "You're Ready",
        lines: [
          "It's live — may your bracket survive the upsets.",
          "Replay this tour from your Profile menu any time."
        ]
      },
      no: {
        title: "Du Er Klar",
        lines: [
          "Sesongen er live — nyt turen.",
          "Se denne omvisningen igjen fra Profil-menyen."
        ]
      },
      sco: {
        title: "Yer Set",
        lines: [
          "The season's live — enjoy the madness.",
          "Replay this tour from yer Profile menu any time."
        ]
      }
    },
    audioScript: {
      en: {
        host: "That's the full live season briefing. Good luck — may your predictions hold up under pressure.",
        pundit: "Right, enough chat. Get watching the matches and check that leaderboard obsessively. That's what I do."
      },
      'en-US': {
        host: "That's a wrap on the live season briefing! Good luck out there — may your bracket survive.",
        pundit: "Time to sit back, watch the games, and refresh that leaderboard. That's the only sport that matters now."
      },
      no: {
        host: "Det var den fullstendige live-sesong-briefingen. Lykke til — håper tipsene dine holder seg.",
        pundit: "Nok snakk. Se kampene og sjekk tabellen manisk. Det er det jeg gjør."
      },
      sco: {
        host: "That's yer live season briefing done. Good luck — hope yer predictions dinnae crumble.",
        pundit: "Right, stop listening tae us and watch the actual fitba. And check that leaderboard. Every five minutes."
      }
    }
  }
];