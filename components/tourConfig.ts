import { TourStep } from './types';

export const PRE_SEASON_TOUR: TourStep[] = [
  {
    id: 'welcome',
    position: 'center',
    audioFiles: {
      en: '/audio/pre_en_01_welcome.mp3',
      'en-US': '/audio/pre_us_01_welcome.mp3',
      no: '/audio/pre_no_01_welcome.mp3',
      sco: '/audio/pre_sco_01_welcome.mp3'
    },
    script: {
      en: { 
        host: "Welcome to The Rasten Cup Stadium! The pitch is pristine, and the fans are gathering.", 
        pundit: "Let's see if you know your stuff, or if you're just here for the pies." 
      },
      'en-US': { 
        host: "Welcome to Rasten Cup Stadium! The field looks perfect and the crowd is pumped.", 
        pundit: "Time to step up. Do you know soccer, or are you just here for the hot dogs?" 
      },
      no: { 
        host: "Velkommen til Rasten Cup Stadion! Gresset er grønt og stemningen er elektrisk.", 
        pundit: "Nå får vi se om du har peiling, eller om du bare er her for vaflene." 
      },
      sco: { 
        host: "Welcome tae The Rasten Cup! The atmosphere is building nicely.", 
        pundit: "Aye, let's see if ye ken yer fitba or if yer just chancing it." 
      }
    }
  },
  {
    id: 'groups_tab',
    targetId: 'nav-groups', 
    position: 'bottom',
    audioFiles: { 
        en: '/audio/pre_en_02_groups.mp3', 
        'en-US': '/audio/pre_us_02_groups.mp3',
        no: '/audio/pre_no_02_groups.mp3', 
        sco: '/audio/pre_sco_02_groups.mp3' 
    },
    script: {
      en: { 
        host: "This is your workspace. Navigate through the groups and predict the score for every match.", 
        pundit: "Don't sit on the fence! 0-0 draws get you nowhere in this game." 
      },
      'en-US': { 
        host: "This is your dashboard. Go through the brackets and pick the score for every matchup.", 
        pundit: "Don't play it safe! 0-0 ties won't win you the championship." 
      },
      no: { 
        host: "Dette er arbeidsplassen din. Gå gjennom gruppene og tipp resultatet i alle kampene.", 
        pundit: "Ingen feige 0-0 tips nå! Vi må ha mål!" 
      },
      sco: { 
        host: "This is where ye do the work. Pick a score for every single game in the groups.", 
        pundit: "And dinnae be picking draws just to be safe. fortune favors the brave!" 
      }
    }
  },
  {
    id: 'magic_wand',
    targetId: 'btn-magic-wand', 
    position: 'top',
    audioFiles: { 
        en: '/audio/pre_en_03_wand.mp3', 
        'en-US': '/audio/pre_us_03_wand.mp3',
        no: '/audio/pre_no_03_wand.mp3', 
        sco: '/audio/pre_sco_03_wand.mp3' 
    },
    script: {
      en: { 
        host: "Stuck for ideas? The Magic Wand can analyze stats and auto-fill your bracket.", 
        pundit: "It's for the lazy managers, basically. But it might save your skin." 
      },
      'en-US': { 
        host: "Need a hand? The Magic Wand analyzes the stats and auto-fills your picks.", 
        pundit: "Basically a cheat code for lazy coaches. But hey, a win is a win." 
      },
      no: { 
        host: "Står du fast? Tryllestaven kan analysere stats og fylle ut tipsene for deg.", 
        pundit: "Juksemaker pipelort! Men det er lov å bruke hodet... eller staven." 
      },
      sco: { 
        host: "Stuck? The Magic Wand will look at the stats and fill the scores in for ye.", 
        pundit: "It's cheating if ye ask me, but use it if yer desperate." 
      }
    }
  },
  {
    id: 'leaderboard',
    targetId: 'nav-leaderboard', 
    position: 'bottom',
    audioFiles: { 
        en: '/audio/pre_en_04_signup.mp3', 
        'en-US': '/audio/pre_us_04_signup.mp3',
        no: '/audio/pre_no_04_signup.mp3', 
        sco: '/audio/pre_sco_04_signup.mp3' 
    },
    script: {
      en: { 
        host: "This is the Manager List. See who has signed up and who has completed their predictions.", 
        pundit: "Check who's slacking off! If your mates aren't here yet, get on their case!" 
      },
      'en-US': { 
        host: "Here is the Roster. See who has joined the league and locked in their picks.", 
        pundit: "See who's dragging their feet? Send them a text and tell them to wake up!" 
      },
      no: { 
        host: "Her er deltakerlisten. Se hvem som er påmeldt og hvem som har levert tipsene sine.", 
        pundit: "Sjekk hvem som somler! Hvis vennene dine ikke er her, må du mase på dem!" 
      },
      sco: { 
        host: "This is the Team Sheet. See who's turned up and who's filled in their slip.", 
        pundit: "See who's skiving! If yer pals aren't on the list, give them a shout!" 
      }
    }
  }
];