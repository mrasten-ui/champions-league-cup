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

  // STOP 1: WELCOME
  {
    id: 'live_welcome',
    position: 'center',
    overlayType: 'none',
    audioFiles: {},
    display: {
      en:      { title: "We're Live",  lines: ["The tournament has kicked off.", "Here's a quick guide to what's changed."] },
      'en-US': { title: "It's Live!",  lines: ["The tournament has officially tipped off.", "Let's walk you through the new setup."] },
      no:      { title: "Vi Er Live",  lines: ["Turneringen er i gang.", "Her er en rask guide til hva som er nytt."] },
      sco:     { title: "We're Live",  lines: ["The tournament's kicked aff.", "Here's whit's changed — pay attention."] },
    },
    audioScript: {
      en:      { host: "We are live! The Rasten Cup has begun. The predictions are locked — but the game is very much on.", pundit: "Forget the group stage. What matters now is what's on the pitch. Let me show you around the new setup." },
      'en-US': { host: "IT IS HAPPENING! We are live! The tournament has officially tipped off!", pundit: "The picks are locked, and now we watch it unfold. Let me walk you through the new screens." },
      no:      { host: "Vi er live! Turneringen er i gang. Tipsene er låst — men kampen er ikke over.", pundit: "Glem gruppespillet. Det som teller er banen. La meg vise deg det nye oppsettet." },
      sco:     { host: "Right, we're aff! The Rasten Cup is live. Predictions locked — but dinnae touch that dial.", pundit: "Forget what ye tipped. What matters now is actual fitba. Wee tour of the new stuff." },
    }
  },

  // STOP 2: LEADERBOARD NAV  →  setActiveTab('leaderboard')
  {
    id: 'live_leaderboard_nav',
    targets: ['nav-leaderboard', 'nav-leaderboard-desk'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {},
    display: {
      en:      { title: "Live Leaderboard", lines: ["This is your home during the tournament.", "Points update in real time after every match."] },
      'en-US': { title: "Live Leaderboard", lines: ["Your new home base for the tournament.", "Points drop the moment a final whistle blows."] },
      no:      { title: "Direkte Tabell",   lines: ["Dette er hjemmet ditt under turneringen.", "Poeng oppdateres i sanntid etter hver kamp."] },
      sco:     { title: "Live Table",       lines: ["This is yer home for the tournament.", "Points update live after every result."] },
    },
    audioScript: {
      en:      { host: "First stop: the Leaderboard tab. This is where you'll spend most of your time.", pundit: "Every correct prediction earns you points in real time. Watch that table move after every result. It's ruthless." },
      'en-US': { host: "First stop: the Leaderboard. This is your new home base.", pundit: "Points drop the moment a final whistle blows. Is your name climbing or sinking?" },
      no:      { host: "Første stopp: Poengtabellen. Her vil du tilbringe mesteparten av tiden din.", pundit: "Hvert riktige tips gir deg poeng i sanntid. Tabellen beveger seg etter hvert resultat." },
      sco:     { host: "First up: the Leaderboard tab. This is where ye'll spend maist of yer time.", pundit: "Every right result nets ye points live. Is yer name going up or doon?" },
    }
  },

  // STOP 3: LEADERBOARD CONTENT  (stays on leaderboard)
  {
    id: 'live_leaderboard_content',
    targets: ['tour-leaderboard-top'],
    position: 'bottom',
    overlayType: 'sparkles',
    audioFiles: {},
    display: {
      en:      { title: "Your Rankings",    lines: ["See exactly where you stand in your league.", "Filter by Live points or Banked points using the toggle."] },
      'en-US': { title: "Your Rankings",    lines: ["Track your standing against everyone in your league.", "Toggle between Live and Banked points at the top."] },
      no:      { title: "Din Plassering",   lines: ["Se nøyaktig hvor du står i ligaen din.", "Bytt mellom Live og Bankede poeng med bryteren."] },
      sco:     { title: "Yer Standings",    lines: ["See exactly where ye stand in yer league.", "Toggle between Live and Banked points up top."] },
    },
    audioScript: {
      en:      { host: "Right here you can see exactly where you stand against everyone in your league.", pundit: "This is where reputations are made and destroyed. Every result shifts it. Keep watching." },
      'en-US': { host: "Here's where you track your standing against everyone in your league.", pundit: "Every result moves the needle. Some weeks you're the hero, some weeks you're not. That's the game." },
      no:      { host: "Her kan du se nøyaktig hvor du står mot alle i ligaen din.", pundit: "Her skapes og ødelegges rykter. Hvert resultat endrer det. Hold øye med det." },
      sco:     { host: "Right here ye can see exactly where ye stand against everyone in yer league.", pundit: "This is where the banter starts. Every result moves it. Keep watching." },
    }
  },

  // STOP 4: TOURNAMENT NAV  →  setActiveTab('tournament') + setTournamentSubTab('schedule')
  {
    id: 'live_tournament',
    targets: ['nav-tournament', 'nav-tournament-desk'],
    position: 'bottom',
    overlayType: 'swipe-hand',
    audioFiles: {},
    display: {
      en:      { title: "Tournament Hub",      lines: ["Follow all the live action here.", "Schedule, group tables, and the knockout bracket — one tab."] },
      'en-US': { title: "Tournament Hub",      lines: ["Everything happening live, right here.", "Schedule, standings, and the playoff bracket — all in one."] },
      no:      { title: "Turneringsoversikt",  lines: ["Følg all live-action her.", "Kampplan, gruppetabeller og sluttspillbraketten — én fane."] },
      sco:     { title: "Tournament Hub",      lines: ["All the live action is in here.", "Schedule, group tables, and the knockout draw — wan tab."] },
    },
    audioScript: {
      en:      { host: "Next up: the Tournament tab. This is your live match centre for the whole competition.", pundit: "Schedule, Tables, Bracket — all in here. This is where you follow the actual football." },
      'en-US': { host: "Next: the Tournament tab. Live scores, standings, and the playoff bracket all in one place.", pundit: "This is where you follow the actual games. Schedule, Tables, Bracket — everything's here." },
      no:      { host: "Neste: Turnering-fanen. Dette er din live-kampsentral for hele turneringen.", pundit: "Kampplan, Tabeller, Braketten — alt her inne. Her følger du den faktiske fotballen." },
      sco:     { host: "Next: the Tournament tab. Yer live match centre for the whole competition.", pundit: "Schedule, Tables, Bracket — it's aw in here. This is where ye follow the actual fitba." },
    }
  },

  // STOP 5: TOURNAMENT SUB-TABS  (stays on tournament)
  {
    id: 'live_tournament_subtabs',
    targets: ['tour-subnav-schedule', 'tour-subnav-tables', 'tour-subnav-bracket'],
    position: 'bottom',
    overlayType: 'swipe-hand',
    audioFiles: {},
    display: {
      en:      { title: "Three Views",  lines: ["Schedule: live match times and results.", "Tables: group standings. Bracket: the knockout path."] },
      'en-US': { title: "Three Views",  lines: ["Schedule for live scores and match times.", "Tables for group standings, Bracket for the playoff picture."] },
      no:      { title: "Tre Visninger", lines: ["Kampplan: live-kamptider og resultater.", "Tabeller: gruppestillinger. Braketten: sluttspillveien."] },
      sco:     { title: "Three Views",  lines: ["Schedule: live match times and results.", "Tables: group standings. Bracket: the knockout draw."] },
    },
    audioScript: {
      en:      { host: "Three views inside this tab. Schedule shows you every match and result live. Tables tracks the group standings. And Bracket — that's the one to watch.", pundit: "Keep an eye on the Bracket. That's where your predictions either shine or fall apart spectacularly." },
      'en-US': { host: "Three views here: Schedule for live scores, Tables for group standings, and Bracket for the full playoff picture.", pundit: "The bracket is everything. If your champion loses in the quarters, it's a long walk home." },
      no:      { host: "Tre visninger i denne fanen. Kampplan viser alle kamper live. Tabeller følger gruppestillinger. Og Braketten — den er verdt å holde øye med.", pundit: "Hold øye med braketten. Der skinner dine tips — eller faller fra hverandre spektakulært." },
      sco:     { host: "Three views in here. Schedule shows every match and result live. Tables tracks the groups. And Bracket — that's the wan tae watch.", pundit: "Keep an eye on the Bracket. That's where yer predictions either shine or fall apart." },
    }
  },

  // STOP 6: BRACKET  →  setTournamentSubTab('bracket')
  {
    id: 'live_bracket',
    targets: ['tour-subnav-bracket'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {},
    display: {
      en:      { title: "The Bracket",  lines: ["The full knockout path from R32 to the Final.", "See which of your predictions are still alive."] },
      'en-US': { title: "The Bracket",  lines: ["Full playoff bracket from Round of 32 to the Final.", "Find out which of your picks are still standing."] },
      no:      { title: "Braketten",    lines: ["Den fullstendige sluttspillveien fra R32 til finalen.", "Se hvilke av tipsene dine som fortsatt er i live."] },
      sco:     { title: "The Bracket",  lines: ["Full knockout draw from R32 tae the Final.", "See which of yer picks are still breathin'."] },
    },
    audioScript: {
      en:      { host: "Here's the bracket — every knockout match from the last 32 right through to the Final.", pundit: "Your champion pick is either still standing or it's not. There's no hiding in a bracket." },
      'en-US': { host: "The bracket — every playoff matchup from the Round of 32 to the Final.", pundit: "Is your bracket intact? Every upset costs someone points. Brutal, but that's the game." },
      no:      { host: "Her er braketten — alle sluttspillkamper fra R32 til finalen.", pundit: "Ditt mesterlagsvalg lever enten eller ikke. Det finnes ingen gjemmeplasser i en brakett." },
      sco:     { host: "Here's the bracket — every knockout tie from the last 32 tae the Final.", pundit: "Yer champion's either in or oot. No hiding here." },
    }
  },

  // STOP 7: MANAGER NAV  →  setActiveTab('manager')
  {
    id: 'live_manager_nav',
    targets: ['nav-manager', 'nav-manager-desk'],
    position: 'bottom',
    overlayType: 'tap-target',
    audioFiles: {},
    display: {
      en:      { title: "Manager Hub",  lines: ["You're still in the game as a manager.", "Use substitutions to change locked predictions."] },
      'en-US': { title: "Manager Hub",  lines: ["You're still playing — as a manager.", "Substitutions let you update locked picks."] },
      no:      { title: "Manager-hub",  lines: ["Du er fortsatt med som manager.", "Bruk bytter for å endre innlåste tips."] },
      sco:     { title: "Manager Hub",  lines: ["Ye're still in the game as a manager.", "Subs let ye change locked predictions."] },
    },
    audioScript: {
      en:      { host: "The Manager tab — because the game doesn't stop just because predictions are locked.", pundit: "You've still got tools. Substitutions let you swap out predictions that have already locked in." },
      'en-US': { host: "Manager — because being locked in doesn't mean you're out of options.", pundit: "Substitutions let you change locked picks. Use them on the games that still matter." },
      no:      { host: "Manager-fanen — fordi spillet ikke stopper selv om tipsene er låst.", pundit: "Du har fortsatt verktøy. Bytter lar deg bytte ut tips som allerede er låst." },
      sco:     { host: "The Manager tab — because the game disnae stop when predictions lock.", pundit: "Ye've still got tools. Subs let ye swap oot locked predictions." },
    }
  },

  // STOP 8: MANAGER CONTENT  (stays on manager)
  {
    id: 'live_manager_content',
    targets: ['tour-manager-viewmode'],
    position: 'bottom',
    overlayType: 'swipe-hand',
    audioFiles: {},
    display: {
      en:      { title: "Find Your Match",  lines: ["Switch between Group Stage and Knockout to browse your predictions.", "Tap a match to use a substitution on it."] },
      'en-US': { title: "Find Your Match",  lines: ["Browse Group Stage or Knockout predictions here.", "Tap a match to spend a substitution on it."] },
      no:      { title: "Finn Din Kamp",    lines: ["Bytt mellom Gruppespill og Sluttspill for å bla gjennom tipsene dine.", "Trykk på en kamp for å bruke et bytte på den."] },
      sco:     { title: "Find Yer Match",   lines: ["Switch between Group Stage and Knockout tae browse yer predictions.", "Tap a match tae use a sub on it."] },
    },
    audioScript: {
      en:      { host: "Switch between Group Stage and Knockout to find the prediction you want to change, then tap the match to use a substitution.", pundit: "Limited subs. Don't waste them on a dead rubber. Use them surgically on matches that can still move you up the table." },
      'en-US': { host: "Toggle between Group Stage and Knockout to find your target match, then tap to spend a substitution.", pundit: "You only get so many. Save them for the crunch games that can shift the leaderboard." },
      no:      { host: "Bytt mellom Gruppespill og Sluttspill for å finne tipset du vil endre, og trykk deretter på kampen for å bruke et bytte.", pundit: "Begrenset antall bytter. Ikke sløs dem på avgjorte kamper." },
      sco:     { host: "Switch between Group Stage and Knockout tae find yer prediction, then tap the match tae use a sub.", pundit: "Limited subs. Dinnae waste them on deid rubbers. Use them on games that can shift the table." },
    }
  },

  // STOP 9: PROFILE / WRAP-UP  (returns to leaderboard on complete)
  {
    id: 'live_profile',
    targetId: 'btn-profile-menu',
    position: 'bottom',
    overlayType: 'none',
    audioFiles: {},
    display: {
      en:      { title: "You're Ready",  lines: ["The season is live — enjoy the ride.", "Replay this tour anytime from your Profile menu."] },
      'en-US': { title: "You're Ready",  lines: ["It's live — may your bracket survive the upsets.", "Replay this tour from your Profile menu any time."] },
      no:      { title: "Du Er Klar",    lines: ["Sesongen er live — nyt turen.", "Se denne omvisningen igjen fra Profil-menyen."] },
      sco:     { title: "Yer Set",       lines: ["The season's live — enjoy the madness.", "Replay this tour from yer Profile menu any time."] },
    },
    audioScript: {
      en:      { host: "That's the full live season briefing. Good luck — may your predictions hold up under pressure.", pundit: "Right, enough chat. Get watching the matches and check that leaderboard obsessively. That's what I do." },
      'en-US': { host: "That's a wrap! Good luck — may your bracket survive.", pundit: "Time to watch the games and refresh that leaderboard. That's the only sport that matters now." },
      no:      { host: "Det var den fullstendige live-sesong-briefingen. Lykke til — håper tipsene holder seg.", pundit: "Nok snakk. Se kampene og sjekk tabellen manisk. Det er det jeg gjør." },
      sco:     { host: "That's yer live season briefing done. Good luck — hope yer predictions dinnae crumble.", pundit: "Right, stop listening tae us and watch the actual fitba. Check that leaderboard. Every five minutes." },
    }
  },
];