import { Team, Match, Translation, LanguageCode, Prediction, BroadcastTeam } from './types';

// --- INTRO VIDEOS ---
export const INTRO_VIDEOS: Record<LanguageCode, string> = {
  EN: '/Video/intro_en.mp4',
  NO: '/Video/intro_no.mp4',
  SCO: '/Video/intro_sc.mp4',
  US: '/Video/intro_us.mp4'
};

export const LANGUAGES = [
  { code: 'EN' as LanguageCode, name: 'English', flag: 'https://flagcdn.com/w160/gb.png' },
  { code: 'NO' as LanguageCode, name: 'Norsk', flag: 'https://flagcdn.com/w160/no.png' },
  { code: 'SCO' as LanguageCode, name: 'Scots', flag: 'https://flagcdn.com/w160/gb-sct.png' },
  { code: 'US' as LanguageCode, name: 'English (US)', flag: 'https://flagcdn.com/w160/us.png' }
];

// --- BROADCAST TEAMS (LORE) ---
export const BROADCAST_TEAMS: Record<string, BroadcastTeam> = {
  'EN': {
    id: 'EN',
    region: 'United Kingdom',
    host: {
      name: 'Sarah',
      role: 'Host',
      style: 'Professional, Posh, Composed',
      backstory: 'A veteran sports presenter who tries desperately to keep the broadcast standard high despite her co-host.',
      quote: "Well, you heard it here first.",
      image: '/pundit/host-en.png'
    },
    pundit: {
      name: 'Gaz',
      role: 'Pundit',
      style: 'Scouse, Aggressive, Passionate',
      backstory: 'Ex-Premier League midfielder known for hard tackles, zero goals, and hating "fancy" tactics like false nines.',
      quote: "What are you on about?! Get stuck in!",
      image: '/pundit/pundit-en.png'
    }
  },
  'US': {
    id: 'US',
    region: 'USA',
    host: {
      name: 'Jessica',
      role: 'Host',
      style: 'High-Energy Anchor',
      backstory: 'Professional radio anchor who keeps the pacing fast and constantly apologizes for Chuck\'s outbursts.',
      quote: "We're live and the energy is electric!",
      image: '/pundit/host-us.png'
    },
    pundit: {
      name: 'Chuck',
      role: 'Pundit',
      style: 'Shock Jock, Ex-NFL',
      backstory: 'Former American Football player who thinks soccer needs more timeouts. He hates draws and guarantees wins that never happen.',
      quote: "Are you kidding me?! I GUARANTEE it!",
      image: '/pundit/pundit-us.png'
    }
  },
  'SCO': {
    id: 'SCO',
    region: 'Scotland',
    host: {
      name: 'Shona',
      role: 'Host',
      style: 'Professional but Grounded',
      backstory: 'The only sensible person in the studio. She manages Rab like a toddler.',
      quote: "Right, let's get back to the football.",
      image: '/pundit/host-sco.png'
    },
    pundit: {
      name: 'Rab',
      role: 'Pundit',
      style: 'Gritty, Blunt, Dialect-Heavy',
      backstory: 'Played in the lower leagues for 20 years. Hates favorites, loves a 0-0 draw on a rainy Tuesday.',
      quote: "That's absolute mince.",
      image: '/pundit/pundit-sco.png'
    }
  },
  'NO': {
    id: 'NO',
    region: 'Norway',
    host: {
      name: 'Silje',
      role: 'Host',
      style: 'Friendly, Efficient',
      backstory: 'The bridge between the casual viewer and the tactical philosopher sitting next to her.',
      quote: "La oss se på tallene.",
      image: '/pundit/host-no.png'
    },
    pundit: {
      name: 'Nils Arne',
      role: 'Pundit',
      style: 'Enthusiastic, Philosophical',
      backstory: 'Legendary tactical philosopher. Believes in "Godfoten" (making others good) and uses metaphors about salmon fishing.',
      quote: "Det handler om samhandling!",
      image: '/pundit/pundit-no.png'
    }
  }
};

// --- REALISTIC 2026 TEAM LIST ---
const BASE_TEAM_NAMES: Record<string, string> = {
  MEX: "Mexico", RSA: "South Africa", KOR: "Korea Republic", CZE: "Czechia",
  CAN: "Canada", BIH: "Bosnia & Herz.", QAT: "Qatar", SUI: "Switzerland",
  BRA: "Brazil", MAR: "Morocco", HAI: "Haiti", SCO: "Scotland",
  USA: "USA", PAR: "Paraguay", AUS: "Australia", TUR: "Türkiye",
  GER: "Germany", CUW: "Curaçao", CIV: "Ivory Coast", ECU: "Ecuador",
  NED: "Netherlands", JPN: "Japan", SWE: "Sweden", TUN: "Tunisia",
  BEL: "Belgium", EGY: "Egypt", IRN: "IR Iran", NZL: "New Zealand",
  ESP: "Spain", CPV: "Cabo Verde", KSA: "Saudi Arabia", URU: "Uruguay",
  FRA: "France", SEN: "Senegal", IRQ: "Iraq", NOR: "Norway",
  ARG: "Argentina", ALG: "Algeria", AUT: "Austria", JOR: "Jordan",
  POR: "Portugal", COD: "DR Congo", UZB: "Uzbekistan", COL: "Colombia",
  ENG: "England", CRO: "Croatia", GHA: "Ghana", PAN: "Panama",
  TBD: "TBD"
};

const TEAM_NAMES_NO: Record<string, string> = {
  MEX: "Mexico", RSA: "Sør-Afrika", KOR: "Sør-Korea", CZE: "Tsjekkia",
  CAN: "Canada", BIH: "Bosnia & Herz.", QAT: "Qatar", SUI: "Sveits",
  BRA: "Brasil", MAR: "Marokko", HAI: "Haiti", SCO: "Skottland",
  USA: "USA", PAR: "Paraguay", AUS: "Australia", TUR: "Tyrkia",
  GER: "Tyskland", CUW: "Curaçao", CIV: "Elfenbenskysten", ECU: "Ecuador",
  NED: "Nederland", JPN: "Japan", SWE: "Sverige", TUN: "Tunisia",
  BEL: "Belgia", EGY: "Egypt", IRN: "Iran", NZL: "New Zealand",
  ESP: "Spania", CPV: "Kapp Verde", KSA: "Saudi-Arabia", URU: "Uruguay",
  FRA: "Frankrike", SEN: "Senegal", IRQ: "Irak", NOR: "Norge",
  ARG: "Argentina", ALG: "Algerie", AUT: "Østerrike", JOR: "Jordan",
  POR: "Portugal", COD: "DR Kongo", UZB: "Usbekistan", COL: "Colombia",
  ENG: "England", CRO: "Kroatia", GHA: "Ghana", PAN: "Panama",
  TBD: "TBD"
};

// --- TRANSLATIONS ---

const EN_TRANSLATION: Translation = {
    genderMan: "Man", genderWoman: "Woman", genPlaceholder: "Describe appearance (e.g. beard, glasses, scarf)...", credits: "Credits",
    group: "Group", groups: "Groups", lineups: "Line-up", startingXi: "Starting XI", benchLabel: "Bench", knockout: "Knockout", myPredictions: "My Picks",
    
    competition: "The Competition", 
    leaderboard: "Leaderboard",     
    managersTab: "Managers",       

    match: "Match", standings: "Table", points: "PTS", goalDiff: "GD", goalsFor: "GF",
    magicWand: "Magic Wand", revealRival: "Peek Picks", qualified: "Qualified", draw: "Draw",
    welcome: "Welcome back", loginMode: "Log In", signupMode: "Sign Up", emailLabel: "E-mail Address",
    passwordLabel: "Password", nameLabel: "Manager Name", enterBtn: "Enter Stadium", subTitle: "The Ultimate Tournament",
    selectAvatar: "Choose Identity", treeView: "Tree", listView: "Rounds", createIdentity: "Create Your Identity",
    genAvatarBtn: "Create AI Persona", genAvatarTitle: "AI Identity Studio", genAvatarDesc: "Describe your manager persona. Our AI will paint it.", genAvatarPlaceholder: "e.g. Wearing a yellow jersey, face paint, sunglasses...", generate: "Generate", useAvatar: "Use Persona", orChoosePreset: "Or choose a preset style",
    secondChanceTab: "2nd Chance", secondChanceTitle: "Second Chance Mode", secondChanceDesc: "Your group picks didn't match the real results? Unlock the real teams for the knockout stage.", secondChanceBtn: "Unlock Real Knockout (-50% Pts)", secondChanceUnlockWarn: "Warning: Activating Second Chance will reduce all future points by 50%. This cannot be undone.",
    refreshTeams: "Refresh R32 Teams", refreshTeamsDesc: "Update the knockout tree with the latest qualified teams.",
    deadline: "Deadline:", deadlinePassed: "Deadline Passed", lockedState: "Locked", secondChanceActive: "Second Chance Active", pointsReduced: "Points reduced by 50%",
    progressGroups: "Group Stage", progressKnockout: "Knockout", managerReady: "Ready for Kickoff", managerIncomplete: "In Preparation",
    profile: "Manager Profile", logout: "Log Out", rulesBtn: "Game Rules", rulesTitle: "Tournament Rules",
    tabHowToPlay: "How to Play", tabScoring: "Points System",
    riskTitle: "How chaotic should the results be?", riskBanker: "Banker", riskBalanced: "Balanced", riskWildcard: "Wildcard", riskBankerDesc: "Top teams dominate", riskBalancedDesc: "The beautiful game", riskWildcardDesc: "Giant killers 🌪️",
    bracketAdjusted: "Bracket Updated", bracketAdjustedMsg: "Some knockout picks were cleared — bracket shifted.", undo: "Undo",
    nudgeTitle: "Missing predictions", nudgeMsg: "You're missing {n} predictions — fill them in before kickoff!", nudgeCta: "Fill them in",
    rulesPreSubtitle: "Build your predictions. Collect points. Compete for glory.",
    rulesLiveSubtitle: "The tournament is live. Here's what matters now.",
    rulesLiveScoringSection: "Scoring Right Now",
    rulesLiveToolsSection: "Your Tools",
    rulesLiveAnalysisTitle: "Analysis — Find Your Edge",
    rulesLiveAnalysisDesc: "The Analysis tab reveals swing matches where the leaderboard could shift. Use it to prioritise your substitutions and plan your final push.",
    rule1Title: "1. Predict the Group Stage", rule1Desc: "Set your exact score predictions for every group match. The standings and best 3rd-place rankings will calculate automatically as you build your scenarios.",
    rule2Title: "2. The Magic Wand", rule2Desc: "Short on time or lacking inspiration? Use the Magic Wand to auto-generate a realistic set of predictions based on global team rankings. Fill out your board quickly and tweak from there.",
    rule3Title: "3. Pick Your Knockout Stages", rule3Desc: "Based on your predicted group standings, the tournament bracket is generated. Plot the path to glory by selecting the advancing team for every matchup from the Round of 32 to the Final. No exact scores needed—just pick the winners.",
    deadlineTitle: "🚨 The Deadline", deadlineBodyPre: "Your entire board — both Group Stage scores and Knockout Stage picks — must be submitted before the tournament begins. All predictions lock permanently at", deadlineBodyPost: ", at the opening kick-off.",
    rule4Title: "4. Scout Your Rivals", rule4Desc: "You have a strict budget of 5 Scout Tokens for the entire tournament. Deploy a token to reveal exactly what a rival predicted for a specific match. Use them wisely — once they are gone, you are flying blind.",
    rule5Title: "5. Live Management & Substitutions", rule5Desc: "Track matches in real-time as the tournament unfolds. You have 5 Substitutions to unlock and alter a group stage prediction, provided that specific match hasn't kicked off yet.",
    rule6Title: "6. The Second Chance", rule6Desc: "Did your knockouts collapse after the real-world group stages? Activate your Second Chance for a clean bracket with the actual qualified teams — but all knockout points from that point are slashed by 50%.",
    scoreExact: "Exact Score (e.g. 2-1)", scoreResult: "Correct Outcome (Win/Draw)", scorePenalty: "Second Chance Penalty",
    scoreQualTitle: "R32 Qualifiers", scoreQualDesc: "3 pts per team correctly predicted to qualify for the Round of 32 from the group stage — up to 96 pts.",
    scoreKnockoutTitle: "Knockout Scoring", scoreKnockoutDesc: "Halves all knockout points from Round of 16 to the Final. Round of 32 is unaffected.",
    specialConditions: "Special Conditions", gotIt: "Got It",
    analysisTab: "Analysis", analysisTitle: "What If?", selectRival: "Compare vs", maxPotential: "Max Potential",
    swingMatches: "Swing Matches", pathVictory: "Path to Victory", noSwings: "No differences found in upcoming matches.",
    me: "Me", vs: "VS", risk: "Potential Gain/Loss", proTip: "Pro Tip:", aiInsight: "AI Insight:",
    swingExplainerTitle: "What is Swing Potential?", swingExplainerDesc: "Points you can gain relative to your rivals. If you predict correctly and they miss, you 'swing' the leaderboard in your favor. High swing matches are risky but rewarding.",
    simulationTitle: "Simulation", projectedStandings: "Projected Standings", resetBtn: "Reset",
    punditSays: "The Pundit Says:", tacticalAnalysisTitle: "Tactical Analysis", tacticalAnalysisDesc: "Adjust the matches below to see how specific results impact the title race.",
    criticalGames: "Critical Games", vsTool: "VS Tool", closeTool: "Close Tool", selectTeam: "Select Team",
    winChance: "Win Probability", tier1: "World Class (1-10)", tier2: "Challengers (11-25)", tier3: "Dark Horses (26-50)", tier4: "Underdogs (50+)",
    tierView: "Rank Tiers", allNations: "All Nations", compareBtn: "Compare", compareActive: "Comparing",
    addToCompare: "Add to VS", simulatedRank: "Simulated Rank", rivalWatch: "Rival Watch", whoAdvances: "Who Advances?",
    filterNext48: "48 Hrs", filterAll: "All", filterConfirmed: "Confirmed", resetSim: "Reset Simulation",
    analysisOpportunity: "Opportunity", analysisOpportunityDesc: "Best Case", analysisPitfall: "Pitfall", analysisPitfallDesc: "Worst Case",
    analysisRealistic: "Realistic", analysisRealisticDesc: "AI Prediction", analysisRoast: "The Pundit", analysisRoastDesc: "Roast Me",
    analysisCorrectWinner: "🔥 Correct Winner! Banking points.", analysisIncorrectWinner: "⚠️ Incorrect Winner. Turnaround needed.",
    analysisExact: "🎯 Bullseye! Exact score hit.", analysisResult: "🛡️ Correct Outcome. Points banked.", analysisWaiting: "Waiting for kickoff...",
    scoutingTab: "Scouting", scoutReport: "Scout Report", attack: "ATT", midfield: "MID", defense: "DEF", overall: "OVR",
    starPlayer: "Key Player", formGuide: "Recent Form", searchNation: "Search nation...", fifaRank: "FIFA Rank",
    tacticalAnalysis: "Tactical Analysis", closeReport: "Close Report", strengthsLabel: "Strengths", weaknessesLabel: "Weaknesses",
    trendLabel: "Trend", trendUp: "Heating Up", trendDown: "Cooling Off", trendFlat: "Inconsistent",
    lastMatches: "Match History", backToGroup: "Back to Group", backTo: "Back to", goToBracket: "Go to Knockouts",
    overviewBtn: "Overview", bracketBtn: "Knockout Stage", allBtn: "All",
    tablesBtn: "Tables", confirmClear: "Are you sure you want to clear your predictions?", finishGroupBtn: "Finish Group {0}",
    revealBtn: "Reveal", tokensLeft: "Intel", spyCost: "1 Intel", rivalLive: "Rival Live Status", rivalIntel: "Rival Intelligence",
    scenarioAnalysis: "Scenario Analysis", now: "Now", noPick: "No Pick", myPick: "My Pick", advanced: "Advanced",
    live: "LIVE", ft: "FT", substitutions: "Subs", makeSub: "Make Sub", subConfirm: "Use 1 Substitution to unlock?", spyConfirm: "Send out the scouts?", sendScouts: "Send out the scouts", subSuccess: "Match Unlocked!", unlocked: "UNLOCKED", saving: "Saving", saved: "Saved", pledgeLocked: "Pledge Locked", pledgeLockedDesc: "The group stage is still ongoing. Return when the timer hits zero to draft your knockout bracket.", knockoutNotYet: "Knockout Stage Not Yet Predicted", knockoutUnlockHint: "Predict all group stage matches first to unlock the bracket.", draftingWindowOpen: "Drafting Window Open", timeTolockIn: "Time to lock-in",
    tabTournament: "Tournament", tabManager: "Manager", subnavSchedule: "Schedule", subnavTables: "Tables", subnavBracket: "Bracket", mgrHint: "Here you can review all your predictions. Switch between Group Stage and Knockouts, or use a Substitution token to change a pick before a match kicks off.",
    rank: "Rank", manager: "Manager", status: "Status", total: "Total", liveStandings: "Live Standings", bankedOnly: "Banked", scoringRulesInfo: "Scoring Rules:",
    lbBreakdown: "Point Breakdown", lbAccuracy: "Accuracy", lbExact: "Exact Scores", lbCorrect: "Correct Outcomes", lbGroupPts: "Group Stage", lbKoPts: "Knockout",
    lbGlobal: "Global", lbLeague: "League", liveToggle: "LIVE", bankedToggle: "BANKED", lbQualified: "Qualified", lbQualifiedDesc: "Knockout Correct", lbGroupRes: "Group Results",
    journeyTitle: "Your Tournament Journey", journeyDesc: "Track your prediction progress.", picksMade: "Picks", completion: "Completion", searchPlaceholder: "Search teams...",
    noMatches: "No matches found", noMatchesHint: "Try adjusting your filters or search terms.", groupStagePoints: "Group Stage Points",
    filterUpcoming: "Upcoming", filterLive: "Live", filterFinished: "Finished", today: "Today",
    simKnockoutTitle: "Simulate Knockout Stage", simGroupTitle: "Simulate Group Stage",
    simKnockoutDesc: "Pick up to 3 favourites — they get a bias in the bracket. Tight games tip their way.",
    simGroupDesc: "Pick up to 3 favourites — they get a bias in the draw. Tight games tip their way.",
    simBoostNote: "Your picks get a statistical bias — in tight matches they're more likely to win. In a mismatch it barely shows. Not a guarantee, just weighted in their favour.",
    runSim: "Run Simulation", simulating: "Simulating...", selected: "Selected", clearAll: "Clear All", openHand: "Open Assistant",
    champion: "Champion", grandFinal: "Final", thirdPlacePlayoff: "Third Place Playoff", scrollHint: "Scroll horizontally to see full bracket →",
    nextRound: "Next Round", prevRound: "Previous Round", lockedBracketTitle: "Bracket Locked", lockedBracketDesc: "You must finish predicting all group stage matches before you can access the knockout bracket.",
    allGroupTables: "All Group Tables", bestThirdPlace: "Best 3rd Place Teams", top8Advance: "Top 8 advance to R32", eliminationLine: "Elimination Line",
    teamCol: "Team", grpCol: "Grp", headToHead: "Head-to-Head History", wins: "Wins", draws: "Draws", totalMeetings: "meetings",
    firstMeeting: "First Ever Meeting!", firstMeetingDesc: "We couldn't find any previous competitive matches between these two. History starts now!",
    showingLast5: "Showing last 5 of {0} meetings", noHistory: "No recorded history found.", loadingHistory: "Loading history...",
    days: "Days", hours: "Hrs", minutes: "Min", seconds: "Sec", myPickShort: "Pick", watchOn: "Watch on", deadlineLabel: "Until predictions lock",

    // --- NEW KEYS ---
    nameTaken: "Name already taken — try something else.",
    noSubsTitle: "No Subs Left",
    noSubsMsg: "All substitutions used.",
    loggedOutTitle: "Logged Out",
    loggedOutMsg: "See you next match day.",
    profileUpdated: "Profile Updated",
    profileMsg: "New avatar looks great!",
    predSaved: "Prediction Saved",
    predLocked: "Match re-locked.",
    rivalRevealed: "Rival Revealed",
    intelUsed: "-1 Intel used.",
    subRefunded: "Sub Refunded",
    subRefundedMsg: "Match started before save.",
    secondChanceConfirm: "Unlock Second Chance? This reduces future points by 50%.",
    prevGroup: "Prev Group",
    nextGroup: "Next Group",
    scoutBtn: "Start Scouting",
    saveBtn: "Save",
    stadiumTbd: "Stadium TBD",
    liveTag: "LIVE",
    ftTag: "FT",
    changeIdentity: "Change Identity",
    cancelBtn: "Cancel",
    noMatchesDate: "No matches on this date.",
    lockInConfirm: "Lock in this bracket? Your 50% points penalty is now permanent.",
    pledgeToastMsg: "Check the Knockout tab when the group stage ends to draft your bracket.",
    bracketLockedIn: "Bracket Locked In",
    bracketLockedInMsg: "Second Chance is now active. Good luck!",
    leagueJoined: "League Joined",
    predictionsCleared: "Cleared",
    predictionsClearedMsg: "Your predictions have been reset.",
    saveFailed: "Save Failed",
    saveFailedMsg: "Could not save your changes. Try again.",
    tooLate: "Too Late",
    tooLateMsg: "This match has already started.",
    magicApplied: "Magic Applied",
    noIntel: "No Intel",
    noIntelMsg: "You need tokens to spy on rivals.",

    // --- ROUND NAMES ---
    roundOf32: "Round of 32",
    roundOf16: "Round of 16",
    quarterFinal: "Quarter Final",
    semiFinal: "Semi Final",
    thirdPlace: "3rd Place Play-off",
    final: "Final",

    // --- STADIUM MODAL ---
    openingMatch: "Opening Match",
    stadiumFifaName: "FIFA Name",
    stadiumLocalName: "Local Name",
    stadiumCity: "City",
    stadiumCapacity: "Capacity",
    stadiumOpened: "Year Opened",
    stadiumSurface: "Surface",
    stadiumRoof: "Roof",
    stadiumWCMatches: "WC Matches",
    stadiumKeyMatches: "Key Matches",
    roofOpen: "Open Air",
    roofRetractable: "Retractable",
    roofFixed: "Fixed Roof",

    // --- PLAYER MODAL ---
    playerClose: "Close",
    playerRating: "Rating",
    playerAvgRating: "Avg Rating · World Cup 2026",
    playerMatchRatings: "Match Ratings",
    playerTournamentLabel: "World Cup 2026",
    playerGoals: "Goals",
    playerAssists: "Assists",
    playerApps: "Apps",
    playerYellow: "Yellow",
    playerRed: "Red",
    playerOwnGoal: "OG",
    playerRatedSuffix: "rated",
    playerNoStats: "Stats not yet available — check back after their next match.",

    // --- PSO & MATCH DISPLAY ---
    goingThrough: "Going Through",
    psoLabel: "PSO", pensTab: "Pens 🥅", statsTab: "Stats", aetLabel: "AET",
    psoLive: "Live — Penalties", psoNoData: "No shootout data yet",
    psoPreMatchPen: "match penalty scored before shootout",
    psoPreMatchPens: "match penalties scored before shootout",
    psoMissed: "Missed", psoSaved: "Saved", psoOffTarget: "Off Target", psoPost: "Post",

    teamNames: BASE_TEAM_NAMES,
    teamOverviews: {}
};

const SCO_TRANSLATION: Translation = {
    ...EN_TRANSLATION,
    isScotland: true,
    genderMan: "Lad", genderWoman: "Lass", genPlaceholder: "Whit dae ye look like? (e.g. ginger beard, kilt, scar)...", credits: "Goes",
    group: "Group", groups: "The Groups", lineups: "Team Sheet", startingXi: "The Startin' XI", benchLabel: "The Bench", knockout: "The Knockoots", myPredictions: "Ma Guesses",
    
    competition: "The Opposition",
    leaderboard: "Big Table",
    managersTab: "The Lads",

    match: "Fixture", standings: "The League", points: "Pts", goalDiff: "GD", goalsFor: "GF",
    magicWand: "Magic Stick", revealRival: "Spy on Pal", qualified: "Through", draw: "Draw",
    welcome: "Awryt, pal", loginMode: "Log In", signupMode: "Sign Up", emailLabel: "Yer Email",
    passwordLabel: "Password", nameLabel: "Yer Name", enterBtn: "Get Stuck In", subTitle: "Pure Dead Brilliant Cup",
    selectAvatar: "Pick Yer Face", treeView: "Tree", listView: "List", createIdentity: "Mak Yer Face",
    genAvatarBtn: "Mak a Face", genAvatarTitle: "Wysiwyg Studio", genAvatarDesc: "Tell us whit ye look like.", genAvatarPlaceholder: "e.g. Wearin' a Scotland strip, face paint, tartan scarf...", generate: "Mak It", useAvatar: "Use It", orChoosePreset: "Or pick a normal one",
    secondChanceTab: "2nd Go", secondChanceTitle: "Redemption Arc", secondChanceDesc: "Made a mess o' the groups? Fix yer tree noo.", secondChanceBtn: "Gie's a Second Go (-50%)", secondChanceUnlockWarn: "Watch it: This costs ye half yer points. Nae turnin' back.",
    refreshTeams: "Update Teams", refreshTeamsDesc: "Get the real teams in there.",
    deadline: "Time's up:", deadlinePassed: "Too Late Pal", lockedState: "Locked In", secondChanceActive: "2nd Go Live", pointsReduced: "Half Points Noo",
    progressGroups: "Groups", progressKnockout: "Knockoots", managerReady: "Sorted", managerIncomplete: "Slackin'",
    profile: "Ma Profile", logout: "Cheerio", rulesBtn: "The Rules", rulesTitle: "Hoo tae Play", tabHowToPlay: "The Basics", tabScoring: "Points",
    riskTitle: "How daft dae ye want the results tae be?", riskBanker: "Banker", riskBalanced: "Balanced", riskWildcard: "Dafty", riskBankerDesc: "The big teams win", riskBalancedDesc: "The beautiful game", riskWildcardDesc: "Giant killers ahoy",
    bracketAdjusted: "Bracket Updated", bracketAdjustedMsg: "Some knockout picks cleared — bracket shifted.", undo: "Undo",
    nudgeTitle: "Missing predictions", nudgeMsg: "Ye're missing {n} picks — get them in before the whistle!", nudgeCta: "Fill them in",
    rulesPreSubtitle: "Build yer picks. Score points. Take the glory.",
    rulesLiveSubtitle: "We're live. Here's whit matters noo.",
    rulesLiveScoringSection: "Scorin' Right Noo",
    rulesLiveToolsSection: "Yer Tools",
    rulesLiveAnalysisTitle: "Analysis — Find Yer Edge",
    rulesLiveAnalysisDesc: "The Analysis tab shows which games can shift the table. Use it tae spend yer subs wisely and close the gap.",
    rule1Title: "1. Tipp the Groups", rule1Desc: "Pick yer exact scores for every group game. The table sorts itself oot automatically — standings and best 3rd place an' aw.",
    rule2Title: "2. The Magic Stick", rule2Desc: "Canne be bothered? Hit the wand and let it fill yer board based on world rankings. Tweak it efter if ye like.",
    rule3Title: "3. Pick Yer Knockoots", rule3Desc: "Based on yer group picks, the bracket builds itself. Just pick who goes through each round all the way tae the final — nae scores needed.",
    deadlineTitle: "🚨 The Cutoff", deadlineBodyPre: "Yer entire board — groups and knockoots baith — must be in before the tournament kicks aff. Everything locks deid at", deadlineBodyPost: ", at the openin' whistle.",
    rule4Title: "4. Spy On Yer Pals", rule4Desc: "Ye get 5 Scout Tokens for the whole tournament. Spend one tae see exactly whit a rival picked for a specific match. Once they're gone, ye're in the dark.",
    rule5Title: "5. Live & Substitutions", rule5Desc: "Watch it live and use yer 5 Substitutions tae swap oot a group prediction before that match kicks aff. Dinnae waste them.",
    rule6Title: "6. The Second Chance", rule6Desc: "Yer knockouts went doon the drain after the group stage? Hit the panic button for a fresh bracket wi' the real teams — but ye'll only earn half points in the knockoots frae that point.",
    scoreExact: "Bang On (e.g. 2-1)", scoreResult: "Right Winner", scorePenalty: "Idiot Tax",
    scoreQualTitle: "Groups tae R32", scoreQualDesc: "3 pts per team ye correctly tipped tae qualify frae the groups — up tae 96 pts.",
    scoreKnockoutTitle: "Big Points", scoreKnockoutDesc: "Halves aw yer knockout points from R16 tae the Final. Round of 32 is unaffected.",
    specialConditions: "Small Print", gotIt: "Aye, nae bother", analysisTab: "The Patter", analysisTitle: "Whit If?", selectRival: "Pick a Pal",
    maxPotential: "Max Pts", swingMatches: "Big Swingers", pathVictory: "Road tae Glory", noSwings: "Nae drama here yet.",
    me: "Me", vs: "VS", risk: "Risk", proTip: "Wee Tip:", aiInsight: "Computer Says:",
    swingExplainerTitle: "Whit's a Swing?", swingExplainerDesc: "Points ye get that yer pal doesnae.",
    simulationTitle: "Sim It", projectedStandings: "Where ye'll end up", resetBtn: "Bin It", punditSays: "Listen tae this:",
    tacticalAnalysisTitle: "Tactics", tacticalAnalysisDesc: "Change the scores tae see if ye can catch up.",
    criticalGames: "Big Games", vsTool: "The Square Go", closeTool: "Pack it in", selectTeam: "Pick a Side", winChance: "Chance o' Winnin",
    tier1: "Top Lads (1-10)", tier2: "Chancers (11-25)", tier3: "Dark Horses (26-50)", tier4: "No Hopers (50+)", tierView: "The Pecking Order",
    allNations: "Aw the Teams", compareBtn: "Square Go", compareActive: "Fectin'", addToCompare: "Pick for Fight", simulatedRank: "Yer Rank Noo",
    rivalWatch: "Keepin' Tabs", whoAdvances: "Who's Winnin?", filterNext48: "48 Hrs", resetSim: "Start Over",
    analysisOpportunity: "Belter", analysisOpportunityDesc: "Best Case", analysisPitfall: "Disaster", analysisPitfallDesc: "Worst Case",
    analysisRealistic: "Real World", analysisRealisticDesc: "Computer Pick", analysisRoast: "The Bam", analysisRoastDesc: "Gie's It Laly",
    analysisCorrectWinner: "Aye, spot on!", analysisIncorrectWinner: "Naw, yer miles aff.", analysisExact: "Belter! Bang on.", analysisResult: "Aye, correct result.",
    analysisWaiting: "Waitin' on kickoff...", scoutingTab: "The Insight", scoutReport: "The Dossier", attack: "ATT", midfield: "MID", defense: "DEF", overall: "OVR",
    starPlayer: "Big Man", formGuide: "Form", searchNation: "Find a team...", fifaRank: "Rank", tacticalAnalysis: "The Tactics", closeReport: "Shut It",
    strengthsLabel: "Top Class", weaknessesLabel: "Pure Mince", trendLabel: "The Patter", trendUp: "On Fire", trendDown: "Boggin'", trendFlat: "Meh",
    lastMatches: "Last Scraps", backToGroup: "Back tae Groups", backTo: "Back tae", goToBracket: "Tae the Knockoots",
    prevGroup: "Prev", nextGroup: "Next", overviewBtn: "Overview", bracketBtn: "Knockout Stage", allBtn: "Aw", tablesBtn: "Tables",
    confirmClear: "Ye sure ye want tae bin yer picks?", finishGroupBtn: "Sort Group {0}", revealBtn: "Keek", tokensLeft: "Intel", spyCost: "1 Intel",
    rivalLive: "Pal's Picks", rivalIntel: "Intel", scenarioAnalysis: "Scenarios", now: "Noo", noPick: "Nae Pick", myPick: "Ma Pick", advanced: "Through",
    live: "LIVE", ft: "FT", substitutions: "Subs", makeSub: "Mak Sub", subConfirm: "Use 1 Sub?", spyConfirm: "Send the scouts oot?", sendScouts: "Send the scouts oot", subSuccess: "Sorted!", unlocked: "OPEN", saving: "Savin'", saved: "Sorted", pledgeLocked: "Pledge Locked In", pledgeLockedDesc: "The groups are still goin'. Come back when the clock hits zero tae pick yer knockouts.", knockoutNotYet: "Knockouts No' Predicted Yet", knockoutUnlockHint: "Finish yer group picks first tae unlock the tree.", draftingWindowOpen: "Drafting Window Open", timeTolockIn: "Time tae lock in",
    tabTournament: "The Cup", tabManager: "Manager", subnavSchedule: "Fixtures", subnavTables: "Leagues", subnavBracket: "Tree", mgrHint: "Here's aw yer picks. Swap between groups an' knockouts, an' use a sub token tae change a pick before the whistle.",
    rank: "No.", manager: "Lad/Lass", status: "Status", total: "Tot", liveStandings: "Live Table", bankedOnly: "Banked", scoringRulesInfo: "Rules:",
    lbBreakdown: "Breakdoon", lbAccuracy: "Accuracy", lbExact: "Bang On", lbCorrect: "Right Winner", lbGroupPts: "Groups", lbKoPts: "Knockoots",
    lbGlobal: "World", lbLeague: "League", liveToggle: "LIVE", bankedToggle: "BANKED", lbQualified: "Went Through", lbQualifiedDesc: "Right Winners", lbGroupRes: "Group Results",
    journeyTitle: "Yer Journey", journeyDesc: "Hoo yer daein'.", picksMade: "Picks", completion: "Done", searchPlaceholder: "Find team...",
    noMatches: "Nae games", noMatchesHint: "Try lookin' for somethin' else.", groupStagePoints: "Group Pts", filterAll: "Aw", filterConfirmed: "Confirmed", filterUpcoming: "Comin' Up",
    filterLive: "Noo", filterFinished: "Done", today: "T'Day", simKnockoutTitle: "Sim the Knockoots", simGroupTitle: "Sim the Groups",
    simKnockoutDesc: "Pick 3 teams — they get a wee bias in the bracket. Tight games'll tip their way.", simGroupDesc: "Pick 3 teams — they get a wee bias. Tight games'll tip their way.", simBoostNote: "Yer picks get a wee statistical nudge — in tight games they'll likely come oot on top. In a mismatch it barely shows. Nae guarantees, mind.", runSim: "Go", simulating: "Workin'...", selected: "Picked",
    clearAll: "Bin It", openHand: "Help Ma Boab", champion: "Winner", grandFinal: "The Final", thirdPlacePlayoff: "3rd Place", scrollHint: "Scroll it ->",
    nextRound: "Next", prevRound: "Back", lockedBracketTitle: "Nae Entry", lockedBracketDesc: "Finish yer groups first ya numpty.",
    allGroupTables: "All The Groups", bestThirdPlace: "Best 3rd Place", top8Advance: "Top 8 go through", eliminationLine: "Going Hame",
    teamCol: "Team", grpCol: "Grp", headToHead: "The Square Go", wins: "Wins", draws: "Draws", totalMeetings: "rammies",
    firstMeeting: "First Ever Square Go!", firstMeetingDesc: "Never focht afore. This is history!", showingLast5: "Last 5 of {0} scraps",
    noHistory: "No history found.", loadingHistory: "Diggin' it up...", days: "Days", hours: "Hrs", minutes: "Min", seconds: "Sec", myPickShort: "Pick", watchOn: "Watch on", deadlineLabel: "Time tae lock in",

    // --- NEW KEYS ---
    nameTaken: "That name's taken — try somethin' else, pal.",
    noSubsTitle: "Nae Subs Left",
    noSubsMsg: "Yer bench is empty, lad.",
    loggedOutTitle: "Away Ye Go",
    loggedOutMsg: "Haste ye back!",
    profileUpdated: "Lookin' Braw",
    profileMsg: "That's a belter of a photo.",
    predSaved: "Sorted",
    predLocked: "Locked in. Good luck.",
    rivalRevealed: "Rival Clocked",
    intelUsed: "-1 Intel. Don't waste it.",
    subRefunded: "Sub Back",
    subRefundedMsg: "Ye were too slow! Token returned.",
    secondChanceConfirm: "Ye sure? This slashes yer points by 50%.",
    lockInConfirm: "Lock in yer bracket? Half points fae here on. Nae goin' back.",
    pledgeToastMsg: "Check the Knockoots tab when groups end tae pick yer bracket.",
    bracketLockedIn: "Bracket Locked In",
    bracketLockedInMsg: "Yer second go is on! Pure gallus.",
    leagueJoined: "Joined a League",
    predictionsCleared: "Binned",
    predictionsClearedMsg: "Yer picks are gone.",
    saveFailed: "Didnae Save",
    saveFailedMsg: "Somethin' went wrang. Try again.",
    tooLate: "Too Late Pal",
    tooLateMsg: "That game's already kicked off.",
    magicApplied: "Done It",
    noIntel: "Nae Intel",
    noIntelMsg: "Ye need tokens tae spy on yer pals.",
    scoutBtn: "Spying Mission",
    saveBtn: "Lock In",
    stadiumTbd: "Park TBD",
    liveTag: "ON NOO",
    ftTag: "FT",
    changeIdentity: "Change Yer Mug",
    cancelBtn: "Wheesht",
    noMatchesDate: "Nae fitba today.",

    // --- ROUND NAMES ---
    roundOf32: "Roond o' 32",
    roundOf16: "Roond o' 16",
    quarterFinal: "Quarter Final",
    semiFinal: "Semi Final",
    thirdPlace: "3rd Place Play-off",
    final: "The Big Yin",

    openingMatch: "Openin' Match",
    stadiumWCMatches: "Cup Games",
    stadiumKeyMatches: "Big Games",

    playerClose: "Shut It",
    playerAvgRating: "Avg Rating · The Cup 2026",
    playerMatchRatings: "Match Ratins",
    playerTournamentLabel: "The Cup 2026",
    playerApps: "Games",
    playerNoStats: "Nae stats yet, pal — check back efter their next game.",

    // --- PSO & MATCH DISPLAY ---
    goingThrough: "Gaun Through",
    psoLabel: "PENS", pensTab: "Pens 🥅", statsTab: "Stats", aetLabel: "AET",
    psoLive: "Live — Pens!", psoNoData: "Nae shootout info yet",
    psoPreMatchPen: "penalty afore the shootout",
    psoPreMatchPens: "penalties afore the shootout",
    psoMissed: "Missed", psoSaved: "Saved", psoOffTarget: "Wide", psoPost: "Post",

    teamNames: BASE_TEAM_NAMES,
    teamOverviews: {}
};

const US_TRANSLATION: Translation = {
    ...EN_TRANSLATION,
    genderMan: "Male Coach", genderWoman: "Female Coach", genPlaceholder: "Describe the swagger (e.g. shades, headset, championship ring)...", credits: "Tokens",
    group: "Group", groups: "Group Play", lineups: "Lineup", startingXi: "Starting XI", benchLabel: "Bench", knockout: "The Playoffs", myPredictions: "My Picks",
    
    competition: "The Field",
    leaderboard: "Power Rankings",
    managersTab: "Roster",

    match: "Game", standings: "Standings", points: "Pts", goalDiff: "Diff", goalsFor: "GF",
    magicWand: "Auto-Pick", revealRival: "Peek Picks", qualified: "Clinched", draw: "Tie Game",
    welcome: "What's up, Coach", loginMode: "Log In", signupMode: "Register", emailLabel: "Email",
    passwordLabel: "Password", nameLabel: "Coach Name", enterBtn: "Let's Go!", subTitle: "The World Series of Soccer",
    selectAvatar: "Build Your Avatar", treeView: "Bracket", listView: "List", createIdentity: "Build Your Identity",
    genAvatarBtn: "AI Generator", genAvatarTitle: "Avatar Lab", genAvatarDesc: "Describe your look.", genAvatarPlaceholder: "e.g. Wearing a USMNT jersey, rally cap, face paint...", generate: "Create", useAvatar: "Select", orChoosePreset: "Or pick a preset",
    secondChanceTab: "Reset", secondChanceTitle: "Bracket Reset", secondChanceDesc: "Busted bracket? Buy back in for the playoffs.", secondChanceBtn: "Buy Back In (-50% Pts)", secondChanceUnlockWarn: "Warning: This costs 50% of future points. High risk!",
    refreshTeams: "Update Bracket", refreshTeamsDesc: "Load the real qualified teams.",
    deadline: "Kickoff in:", deadlinePassed: "Deadline Passed", lockedState: "Locked", secondChanceActive: "Reset Active", pointsReduced: "50% Point Reduction",
    progressGroups: "Regular Season", progressKnockout: "Post Season", managerReady: "Locked In", managerIncomplete: "Pending",
    profile: "Coach Profile", logout: "Sign Out", rulesBtn: "Rulebook", rulesTitle: "Official Rules", tabHowToPlay: "Basics", tabScoring: "Scoring",
    riskTitle: "How wild should the results get?", riskBanker: "Safe Pick", riskBalanced: "Balanced", riskWildcard: "Chaos", riskBankerDesc: "Favorites take it", riskBalancedDesc: "The beautiful game", riskWildcardDesc: "Upsets everywhere",
    bracketAdjusted: "Bracket Updated", bracketAdjustedMsg: "Some knockout picks were cleared — bracket shifted.", undo: "Undo",
    nudgeTitle: "Missing predictions", nudgeMsg: "You're missing {n} predictions — fill them in before kickoff!", nudgeCta: "Fill them in",
    rulesPreSubtitle: "Build your bracket. Score points. Win the cup.",
    rulesLiveSubtitle: "Tournament is live. Time to play smart.",
    rulesLiveScoringSection: "Live Scoring",
    rulesLiveToolsSection: "Available Tools",
    rulesLiveAnalysisTitle: "Analysis — Find Your Advantage",
    rulesLiveAnalysisDesc: "The Analysis tab shows swing games where standings can move. Use it to make smart substitutions and gain ground on rivals.",
    rule1Title: "1. Predict the Group Stage", rule1Desc: "Set exact score predictions for every group game. Standings and the wild card race update automatically as you build out your board.",
    rule2Title: "2. Auto-Pick Wand", rule2Desc: "Pressed for time? Use the wand to auto-fill your predictions based on global rankings. A solid starting point you can dial in from there.",
    rule3Title: "3. Fill Out Your Bracket", rule3Desc: "Your group picks generate the playoff bracket. Select the advancing team in every matchup from the Round of 32 to the Championship. No scores needed — just pick winners.",
    deadlineTitle: "🚨 The Deadline", deadlineBodyPre: "Your entire board — Group Stage scores and Bracket picks — must be locked in before the tournament starts. Everything freezes at", deadlineBodyPost: ", at opening kick-off.",
    rule4Title: "4. Scout the Competition", rule4Desc: "You get 5 Scout Tokens for the whole tournament. Spend one to see exactly what a rival picked for a specific game. Once they're gone, you're flying blind.",
    rule5Title: "5. Live & Substitutions", rule5Desc: "Follow games live. You have 5 Substitutions to swap out a group stage pick before that game kicks off. They don't roll over.",
    rule6Title: "6. Bracket Reset", rule6Desc: "Bracket busted after the group stage? Activate the reset for a clean slate with the real teams — but all playoff points from that point are cut by 50%.",
    scoreExact: "Perfect Pick (e.g. 2-1)", scoreResult: "Correct Winner", scorePenalty: "Reset Penalty",
    scoreQualTitle: "Round of 32 Qualifiers", scoreQualDesc: "3 pts per team correctly predicted to reach the Round of 32 from the regular season — up to 96 pts.",
    scoreKnockoutTitle: "Playoff Points", scoreKnockoutDesc: "Halves all playoff points from Round of 16 to the Final. Round of 32 is unaffected.",
    specialConditions: "Details", gotIt: "Understood", analysisTab: "Analysis", analysisTitle: "Matchup Analysis", selectRival: "Compare vs",
    maxPotential: "Ceiling", swingMatches: "Key Matchups", pathVictory: "Path to Victory", noSwings: "No differential picks found.",
    me: "Me", vs: "VS", risk: "Spread", proTip: "Pro Tip:", aiInsight: "AI Analyst:",
    swingExplainerTitle: "What is Swing?", swingExplainerDesc: "Points you can gain over your opponent when you pick correctly and they miss.",
    simulationTitle: "Simulation", projectedStandings: "Projected Standings", resetBtn: "Reset", punditSays: "The Analyst Says:",
    tacticalAnalysisTitle: "Tactical Analysis", tacticalAnalysisDesc: "Adjust the results below to see how it affects the standings.",
    criticalGames: "Critical Games", vsTool: "Matchup Tool", closeTool: "Close Tool", selectTeam: "Select Team", winChance: "Win Probability",
    tier1: "Elite (1-10)", tier2: "Contenders (11-25)", tier3: "Sleepers (26-50)", tier4: "Underdogs (50+)", tierView: "Power Tiers",
    allNations: "All Rosters", compareBtn: "Compare", compareActive: "Versus", addToCompare: "Add to VS", simulatedRank: "Simulated Rank",
    rivalWatch: "Opponent Watch", whoAdvances: "Who Advances?", filterNext48: "48 Hrs", resetSim: "Reset Sim",
    analysisOpportunity: "Upside", analysisOpportunityDesc: "Ceiling", analysisPitfall: "Downside", analysisPitfallDesc: "Floor",
    analysisRealistic: "Projection", analysisRealisticDesc: "The Spread", analysisRoast: "Hot Take", analysisRoastDesc: "Roast Me",
    analysisCorrectWinner: "Boom! Money in the bank.", analysisIncorrectWinner: "Oof. Total brick.", analysisExact: "Bullseye! Perfect score.",
    analysisResult: "Solid. Correct outcome.", analysisWaiting: "Pregame...", scoutingTab: "Scouting", scoutReport: "Scouting Report",
    attack: "OFF", midfield: "MID", defense: "DEF", overall: "OVR", starPlayer: "MVP", formGuide: "Last 5", searchNation: "Find team...",
    fifaRank: "Rank", tacticalAnalysis: "Game Plan", closeReport: "Close", strengthsLabel: "Strengths", weaknessesLabel: "Weaknesses",
    trendLabel: "Momentum", trendUp: "Hot Streak", trendDown: "Ice Cold", trendFlat: "Choppy", lastMatches: "Recent Games",
    backToGroup: "Back to Groups", backTo: "Back to", goToBracket: "Go to Bracket", prevGroup: "Prev", nextGroup: "Next",
    overviewBtn: "Overview", bracketBtn: "The Bracket", allBtn: "All", tablesBtn: "Standings", confirmClear: "Clear all picks?",
    finishGroupBtn: "Finish Group {0}", revealBtn: "Reveal", tokensLeft: "Intel", spyCost: "1 Intel", rivalLive: "Opponent Status",
    rivalIntel: "Intel", scenarioAnalysis: "Scenarios", now: "Now", noPick: "No Pick", myPick: "My Pick", advanced: "Advanced",
    live: "LIVE", ft: "FINAL", substitutions: "Subs", makeSub: "Make Sub", subConfirm: "Use 1 Sub?", spyConfirm: "Send out the scouts?", sendScouts: "Send out the scouts", subSuccess: "Match Unlocked!", unlocked: "OPEN", saving: "Saving", saved: "Saved", pledgeLocked: "Pledge Locked", pledgeLockedDesc: "The group stage is still in play. Come back when the timer hits zero to set your knockout picks.", knockoutNotYet: "Knockout Stage Not Predicted", knockoutUnlockHint: "Finish your group stage picks first to unlock the bracket.", draftingWindowOpen: "Drafting Window Open", timeTolockIn: "Time to lock-in",
    tabTournament: "Tournament", tabManager: "Coach", subnavSchedule: "Schedule", subnavTables: "Standings", subnavBracket: "Bracket", mgrHint: "Your predictions hub. Toggle between groups and bracket picks, and spend a Sub token to edit a locked-in pick before kick-off.",
    rank: "Rank", manager: "Coach", status: "Status", total: "Tot", liveStandings: "Live Rankings", bankedOnly: "Banked", scoringRulesInfo: "Scoring:",
    lbBreakdown: "Stats", lbAccuracy: "Accuracy", lbExact: "Perfect", lbCorrect: "Winners", lbGroupPts: "Reg. Season", lbKoPts: "Playoffs",
    lbGlobal: "Global", lbLeague: "League", liveToggle: "LIVE", bankedToggle: "BANKED", lbQualified: "Advanced", lbQualifiedDesc: "Playoff Winners",
    lbGroupRes: "Group Results", journeyTitle: "Season Progress", journeyDesc: "Track your stats.", picksMade: "Picks", completion: "Complete",
    searchPlaceholder: "Search...", noMatches: "No games found", noMatchesHint: "Check filters.", groupStagePoints: "Group Pts",
    filterAll: "All", filterConfirmed: "Confirmed", filterUpcoming: "Upcoming", filterLive: "Live", filterFinished: "Final", today: "Today", simKnockoutTitle: "Sim Playoffs",
    simGroupTitle: "Sim Groups", simKnockoutDesc: "Pick up to 3 favorites — they get a boost in the bracket. Close games break their way.", simGroupDesc: "Pick up to 3 favorites — they get a boost in the draw. Close games break their way.", simBoostNote: "Your picks get a statistical boost — in close games they're more likely to win. In blowouts it barely matters. Not a guarantee, just weighted in their favor.",
    runSim: "Run Sim", simulating: "Running...", selected: "Active", clearAll: "Clear", openHand: "Auto-Fill",
    champion: "Champ", grandFinal: "Championship", thirdPlacePlayoff: "Bronze Game", scrollHint: "Scroll ->",
    nextRound: "Next", prevRound: "Prev", lockedBracketTitle: "Bracket Locked", lockedBracketDesc: "Finish your regular season picks first.",
    allGroupTables: "All Standings", bestThirdPlace: "Wild Card Race", top8Advance: "Top 8 Advance", eliminationLine: "Eliminated",
    teamCol: "Team", grpCol: "Grp", days: "Days", hours: "Hrs", minutes: "Min", seconds: "Sec", myPickShort: "Pick", watchOn: "Watch on", deadlineLabel: "Until lock-in",

    // --- NEW KEYS ---
    nameTaken: "Name already taken — try a different one.",
    noSubsTitle: "Out of Subs",
    noSubsMsg: "You used all your moves.",
    loggedOutTitle: "Signed Out",
    loggedOutMsg: "Catch you at kickoff.",
    profileUpdated: "Roster Updated",
    profileMsg: "Looking sharp, coach.",
    predSaved: "Pick Locked",
    predLocked: "Prediction submitted.",
    rivalRevealed: "Intel Gathered",
    intelUsed: "-1 Intel Token.",
    subRefunded: "Sub Returned",
    subRefundedMsg: "Game started. Token returned.",
    secondChanceConfirm: "Unlock Second Chance? This cuts your playoff points by 50%.",
    lockInConfirm: "Lock in this bracket? The 50% penalty is now permanent.",
    pledgeToastMsg: "Head to the Playoffs tab when groups end to set your bracket.",
    bracketLockedIn: "Bracket Locked In",
    bracketLockedInMsg: "Your reset is active. Time to climb.",
    leagueJoined: "League Joined",
    predictionsCleared: "Reset",
    predictionsClearedMsg: "Your picks have been cleared.",
    saveFailed: "Save Error",
    saveFailedMsg: "Could not save your changes. Try again.",
    tooLate: "Too Late",
    tooLateMsg: "The game has already started.",
    magicApplied: "Auto-Pick Done",
    noIntel: "Out of Intel",
    noIntelMsg: "You need tokens to scout opponents.",
    scoutBtn: "Scout Teams",
    saveBtn: "Submit",
    stadiumTbd: "Venue TBD",
    liveTag: "LIVE",
    ftTag: "FINAL",
    changeIdentity: "Edit Persona",
    cancelBtn: "Cancel",
    noMatchesDate: "No matchups today.",

    // --- ROUND NAMES ---
    roundOf32: "Round of 32",
    roundOf16: "Round of 16",
    quarterFinal: "Quarterfinals",
    semiFinal: "Semifinals",
    thirdPlace: "Bronze Medal Match",
    final: "Championship",

    stadiumWCMatches: "World Cup Games",
    playerApps: "Games",
    playerNoStats: "Stats coming soon — check back after their next match.",

    // --- PSO & MATCH DISPLAY ---
    goingThrough: "Advancing",
    psoLabel: "PKs", pensTab: "PKs 🥅", statsTab: "Stats", aetLabel: "AET",
    psoLive: "Live — PK Shootout", psoNoData: "No PK data yet",
    psoPreMatchPen: "PK scored in regulation time",
    psoPreMatchPens: "PKs scored in regulation time",
    psoMissed: "Missed", psoSaved: "Saved", psoOffTarget: "Wide", psoPost: "Post",

    teamNames: BASE_TEAM_NAMES,
    teamOverviews: {}
};

const NO_TRANSLATION: Translation = {
    ...EN_TRANSLATION,
    genderMan: "Mann", genderWoman: "Kvinne", genPlaceholder: "Beskriv utseende (f.eks. skjegg, briller, skjerf)...", credits: "Sjanser",
    group: "Gruppe", groups: "Gruppene", lineups: "Lagoppstilling", startingXi: "Startoppstilling", benchLabel: "Benken", knockout: "Sluttspill", myPredictions: "Mine Tips",
    
    competition: "Konkurrentene",
    leaderboard: "Resultatliste",
    managersTab: "Managere",

    match: "Kamp", standings: "Tabell", points: "P", goalDiff: "MF", goalsFor: "M+",
    magicWand: "Tryllestav", revealRival: "Se Tips", qualified: "Kvalifisert", draw: "Uavgjort",
    welcome: "Velkommen tilbake", loginMode: "Logg Inn", signupMode: "Ny Konto", emailLabel: "E-postadresse",
    passwordLabel: "Passord", nameLabel: "Manager Navn", enterBtn: "Gå til Stadion", subTitle: "Den Ultimate Turneringen",
    selectAvatar: "Velg Identitet", treeView: "Tre", listView: "Runder", createIdentity: "Opprett Din Identitet",
    genAvatarBtn: "Lag AI Persona", genAvatarTitle: "AI Studio", genAvatarDesc: "Beskriv din managerstil. Vår AI maler den.", genAvatarPlaceholder: "f.eks. Iført norsk drakt, ansiktsmaling, skjerf...", generate: "Generer", useAvatar: "Bruk Persona", orChoosePreset: "Eller velg en ferdig stil",
    secondChanceTab: "Ny Sjanse", secondChanceTitle: "Ny Sjanse Modus", secondChanceDesc: "Stemte ikke gruppetipsene dine? Lås opp de ekte lagene for sluttspillet.", secondChanceBtn: "Lås opp ekte oppsett (-50% poeng)", secondChanceUnlockWarn: "Advarsel: Aktivering av Ny Sjanse halverer alle fremtidige poeng. Dette kan ikke angres.",
    refreshTeams: "Oppdater Lag", refreshTeamsDesc: "Oppdater sluttspillet med de nyeste kvalifiserte lagene.",
    deadline: "Frist:", deadlinePassed: "Frist Ute", lockedState: "Låst", secondChanceActive: "Ny Sjanse Aktiv", pointsReduced: "Poeng redusert med 50%",
    progressGroups: "Gruppespill", progressKnockout: "Sluttspill", managerReady: "Klar til kamp", managerIncomplete: "Forbereder seg",
    profile: "Manager Profil", logout: "Logg Ut", rulesBtn: "Spilleregler", rulesTitle: "Turneringsregler", tabHowToPlay: "Slik Spiller Du", tabScoring: "Poengsystem",
    riskTitle: "Hvor uforutsigbare skal resultatene være?", riskBanker: "Sikker", riskBalanced: "Balansert", riskWildcard: "Kaos", riskBankerDesc: "Favorittene vinner", riskBalancedDesc: "Den vakre sporten", riskWildcardDesc: "Overraskelsenes tur",
    bracketAdjusted: "Bracket oppdatert", bracketAdjustedMsg: "Noen knockout-tips ble fjernet — bracket er oppdatert.", undo: "Angre",
    nudgeTitle: "Tips mangler", nudgeMsg: "Du mangler {n} tips — legg dem inn før kampstart!", nudgeCta: "Legg inn nå",
    rulesPreSubtitle: "Bygg dine tips. Samle poeng. Kjemp om æren.",
    rulesLiveSubtitle: "Turneringen er i gang. Her er det som teller nå.",
    rulesLiveScoringSection: "Poeng Nå",
    rulesLiveToolsSection: "Dine Verktøy",
    rulesLiveAnalysisTitle: "Analyse — Finn Din Fordel",
    rulesLiveAnalysisDesc: "Analyse-fanen viser swing-kamper der poengtabellen kan bevege seg. Bruk den til å prioritere bytter og ta igjen rivaler.",
    rule1Title: "1. Tipp Gruppene", rule1Desc: "Sett inn eksakte resultater for alle gruppekamper. Tabellene og beste 3. plass-rangeringen beregnes automatisk mens du bygger dine scenarioer.",
    rule2Title: "2. Tryllestaven", rule2Desc: "Har du ikke tid eller inspirasjon? Bruk Tryllestaven til å auto-generere tips basert på verdensrangeringen. Fyll ut raskt og juster etterpå.",
    rule3Title: "3. Velg Sluttspillet", rule3Desc: "Ut fra dine grupperesultater genereres sluttspillbraketten. Velg hvem som går videre i hver kamp fra 16-delsfinalen til finalen. Ingen eksakte resultater — bare velg vinneren.",
    deadlineTitle: "🚨 Fristen", deadlineBodyPre: "Hele brettet ditt — både gruppespillresultater og sluttspillvalg — må leveres før turneringen begynner. Alle tips låses permanent kl.", deadlineBodyPost: ", ved åpningskampen.",
    rule4Title: "4. Spioner på Rivaler", rule4Desc: "Du har nøyaktig 5 Speider-tokens for hele turneringen. Bruk ett token for å se nøyaktig hva en rival har tippet på en bestemt kamp. Bruk dem klokt — når de er borte, flyr du blindt.",
    rule5Title: "5. Live & Bytter", rule5Desc: "Følg kampene live. Du har 5 Bytter til å endre et gruppetips, så lenge den aktuelle kampen ikke har startet ennå.",
    rule6Title: "6. Ny Sjanse", rule6Desc: "Røk sluttspillbraketten etter gruppespillet? Aktiver din Andre Sjanse for en ren brakettmed de virkelige lagene — men alle sluttspillpoeng heretter halveres.",
    scoreExact: "Eksakt Resultat (f.eks 2-1)", scoreResult: "Riktig Utfall (Seier/Uavgjort)", scorePenalty: "Straff for Ny Sjanse",
    scoreQualTitle: "R32-kvalifiseringer", scoreQualDesc: "3 poeng per lag du riktig forutså ville nå 16-delsfinalen fra gruppespillet — opptil 96 poeng.",
    scoreKnockoutTitle: "Sluttspillpoeng", scoreKnockoutDesc: "Halverer alle sluttspillpoeng fra runde 16 til finalen. R32 er ikke berørt.",
    specialConditions: "Spesielle Betingelser", gotIt: "Skjønner", analysisTab: "Analyse", analysisTitle: "Hva Hvis?", selectRival: "Sammenlign med",
    maxPotential: "Maks Potensial", swingMatches: "Vippekamper", pathVictory: "Veien til Seier", noSwings: "Ingen forskjeller funnet i kommende kamper.",
    me: "Meg", vs: "MOT", risk: "Gevinst/Tap", proTip: "Profft Tips:", aiInsight: "AI Innsikt:",
    swingExplainerTitle: "Hva er Gevinst/Tap?", swingExplainerDesc: "Poeng du kan tjene i forhold til rivalene dine. Hvis du tipper rett og de bommer, 'vipper' du resultatet i din favør.",
    simulationTitle: "Simulering", projectedStandings: "Prognose", resetBtn: "Nullstill", punditSays: "Eksperten Sier:",
    tacticalAnalysisTitle: "Taktisk Analyse", tacticalAnalysisDesc: "Juster resultatene under for å se hvordan det påvirker tabellen.",
    criticalGames: "Nøkkelkamper", vsTool: "Duell Verktøy", closeTool: "Lukk Verktøy", selectTeam: "Velg Lag", winChance: "Vinnersjanse",
    tier1: "Verdensklasse (1-10)", tier2: "Utfordrere (11-25)", tier3: "Outsidere (26-50)", tier4: "Underdogs (50+)", tierView: "Nivåer",
    allNations: "Alle Nasjoner", compareBtn: "Sammenlign", compareActive: "Sammenligner", addToCompare: "Legg til Duell", simulatedRank: "Simulert Rank",
    rivalWatch: "Rivalene", whoAdvances: "Hvem går videre?", filterNext48: "48 Timer", resetSim: "Nullstill",
    analysisOpportunity: "Mulighet", analysisOpportunityDesc: "Beste Utfall", analysisPitfall: "Felle", analysisPitfallDesc: "Verste Utfall",
    analysisRealistic: "Realistisk", analysisRealisticDesc: "AI Tips", analysisRoast: "Eksperten", analysisRoastDesc: "Slakt Meg",
    analysisCorrectWinner: "🔥 Riktig Vinner! Poeng sikret.", analysisIncorrectWinner: "⚠️ Feil Vinner. Opphenting trengs.", analysisExact: "🎯 Bullseye! Eksakt resultat.",
    analysisResult: "🛡️ Riktig Utfall. Poeng sikret.", analysisWaiting: "Venter på avspark...", scoutingTab: "Speiding", scoutReport: "Speiderrapport",
    attack: "ANG", midfield: "MID", defense: "FOR", overall: "TOT", starPlayer: "Nøkkelspiller", formGuide: "Formkurve", searchNation: "Søk nasjon...",
    fifaRank: "FIFA Ranking", tacticalAnalysis: "Taktisk Analyse", closeReport: "Lukk Rapport", strengthsLabel: "Styrker", weaknessesLabel: "Svakheter",
    trendLabel: "Trend", trendUp: "I Form", trendDown: "Sliter", trendFlat: "Varierende", lastMatches: "Siste Kamper",
    backToGroup: "Tilbake til Gruppe", backTo: "Tilbake til", goToBracket: "Gå til Sluttspill", prevGroup: "Forrige Gruppe", nextGroup: "Neste Gruppe",
    overviewBtn: "Oversikt", bracketBtn: "Knockout-fasen", allBtn: "Alle", tablesBtn: "Tabeller", confirmClear: "Er du sikker på at du vil slette tipsene dine?",
    finishGroupBtn: "Fullfør Gruppe {0}", revealBtn: "Avslør", tokensLeft: "Intel", spyCost: "1 Intel", rivalLive: "Rival Live Status",
    rivalIntel: "Rival Etterretning", scenarioAnalysis: "Scenarioanalyse", now: "Now", noPick: "Ingen Tips", myPick: "Mitt Tips", advanced: "Videre",
    live: "LIVE", ft: "SLUTT", substitutions: "Bytter", makeSub: "Gjør Bytte", subConfirm: "Bruk 1 bytte for å åpne?", spyConfirm: "Sende ut speideren?", sendScouts: "Sende ut speideren", subSuccess: "Kamp Åpnet!", unlocked: "ÅPEN", saving: "Lagrer", saved: "Lagret", pledgeLocked: "Løfte Låst", pledgeLockedDesc: "Gruppespillet pågår fortsatt. Kom tilbake når nedtellingen når null for å sette opp sluttspillbraketten.", knockoutNotYet: "Sluttspillet er ikke tippet ennå", knockoutUnlockHint: "Fullfør gruppetipsene dine for å låse opp sluttspillet.", draftingWindowOpen: "Drafteringsvindu Åpent", timeTolockIn: "Tid igjen til låsing",
    tabTournament: "Turneringen", tabManager: "Manager", subnavSchedule: "Terminliste", subnavTables: "Tabeller", subnavBracket: "Treet", mgrHint: "Her finner du alle dine tips. Bytt mellom gruppespill og sluttspill, og bruk et byttetoken for å endre et tips før kampstart.",
    rank: "Plass", manager: "Manager", status: "Status", total: "Total", liveStandings: "Live Tabell", bankedOnly: "Kun Bankede", scoringRulesInfo: "Poengregler:",
    lbBreakdown: "Poengfordeling", lbAccuracy: "Treffsikkerhet", lbExact: "Eksakte Tips", lbCorrect: "Riktig Utfall", lbGroupPts: "Gruppespill", lbKoPts: "Sluttspill",
    lbGlobal: "Globalt", lbLeague: "Liga", liveToggle: "LIVE", bankedToggle: "BANKET", lbQualified: "Videre", lbQualifiedDesc: "Riktig Avansement",
    lbGroupRes: "Grupperesultat", journeyTitle: "Din Turneringsreise", journeyDesc: "Følg din fremgang i tippingen.", picksMade: "Tips Levert",
    completion: "Ferdig", searchPlaceholder: "Søk lag...", noMatches: "Ingen kamper funnet", noMatchesHint: "Prøv å endre filter eller søkeord.",
    groupStagePoints: "Gruppespill Poeng", filterAll: "Alle", filterConfirmed: "Bekreftet", filterUpcoming: "Kommende", filterLive: "Live", filterFinished: "Ferdig", today: "I dag",
    simKnockoutTitle: "Simuler Sluttspill", simGroupTitle: "Simuler Gruppespill", simKnockoutDesc: "Velg opptil 3 favoritter — de får en bias i sluttspillet. Jevne kamper tippes til deres fordel.",
    simGroupDesc: "Velg opptil 3 favoritter — de får en bias i trekningen. Jevne kamper tippes til deres fordel.", simBoostNote: "Lagene du velger får en statistisk bias — i jevne kamper vinner de oftere. I store mismatcher betyr det lite. Ingen garanti, bare vektet i deres favør.", runSim: "Kjør Simulering", simulating: "Simulerer...", selected: "Valgt",
    clearAll: "Slett Alt", openHand: "Åpne Hjelper", champion: "Mester", grandFinal: "Finale", thirdPlacePlayoff: "Bronsefinale",
    scrollHint: "Scroll horisontalt for å se hele treet →", nextRound: "Neste Runde", prevRound: "Forrige Runde", lockedBracketTitle: "Sluttspill Låst",
    lockedBracketDesc: "Du må tippe alle gruppekampene før du får tilgang til sluttspillet.", allGroupTables: "Alle Gruppetabeller", bestThirdPlace: "Beste 3. Plasser",
    top8Advance: "Topp 8 går til R32", eliminationLine: "Eliminasjonslinje", teamCol: "Team", grpCol: "Grp", headToHead: "Innbyrdes oppgjør", wins: "Seire", draws: "Uavgjort", totalMeetings: "møter", firstMeeting: "Første møte noensinne!",
    firstMeetingDesc: "Vi fant ingen tidligere kamper mellom disse lagene. Historien starter nå!", showingLast5: "Viser siste 5 av {0} møter",
    noHistory: "Ingen historikk funnet.", loadingHistory: "Laster historikk...", days: "Dager", hours: "Timer", minutes: "Min", seconds: "Sek", deadlineLabel: "Til tipsen låses",
    myPickShort: "Tips", watchOn: "Se på",

    // --- NEW KEYS ---
    nameTaken: "Navnet er allerede tatt — prøv et annet.",
    noSubsTitle: "Tomt for Bytter",
    noSubsMsg: "Alle bytter er brukt opp.",
    loggedOutTitle: "Logget ut",
    loggedOutMsg: "Vi sees ved avspark.",
    profileUpdated: "Profil Oppdatert",
    profileMsg: "Ny look på plass!",
    predSaved: "Tips Lagret",
    predLocked: "Kampen er låst igjen.",
    rivalRevealed: "Rival Avslørt",
    intelUsed: "-1 Intel brukt.",
    subRefunded: "Bytte Refundert",
    subRefundedMsg: "Kampen startet før lagring.",
    secondChanceConfirm: "Aktiver Ny Sjanse? Dette halverer poengene dine i sluttspillet.",
    lockInConfirm: "Lås inn denne braketten? 50% poengstraff er nå permanent.",
    pledgeToastMsg: "Gå til Sluttspill-fanen når gruppespillet slutter for å sette opp braketten.",
    bracketLockedIn: "Brakett Låst Inn",
    bracketLockedInMsg: "Ny Sjanse er nå aktiv. Lykke til!",
    leagueJoined: "Liga Tilkoblet",
    predictionsCleared: "Slettet",
    predictionsClearedMsg: "Tipsene dine er nullstilt.",
    saveFailed: "Lagring Feilet",
    saveFailedMsg: "Kunne ikke lagre. Prøv igjen.",
    tooLate: "For Sent",
    tooLateMsg: "Kampen er allerede i gang.",
    magicApplied: "Magi Brukt",
    noIntel: "Ingen Intel",
    noIntelMsg: "Du trenger tokens for å spionere på rivaler.",
    scoutBtn: "Start Speiding",
    saveBtn: "Lagre",
    stadiumTbd: "Stadion TBD",
    liveTag: "LIVE",
    ftTag: "SLUTT",
    changeIdentity: "Endre Identitet",
    cancelBtn: "Avbryt",
    noMatchesDate: "Ingen kamper på denne datoen.",

    // --- ROUND NAMES ---
    roundOf32: "16-delsfinale",
    roundOf16: "8-delsfinale",
    quarterFinal: "Kvartfinale",
    semiFinal: "Semifinale",
    thirdPlace: "Bronsefinale",
    final: "Finale",

    openingMatch: "Åpningskamp",
    stadiumFifaName: "FIFA-navn",
    stadiumLocalName: "Lokalt navn",
    stadiumCity: "By",
    stadiumCapacity: "Kapasitet",
    stadiumOpened: "Åpnet",
    stadiumSurface: "Underlag",
    stadiumRoof: "Tak",
    stadiumWCMatches: "VM-kamper",
    stadiumKeyMatches: "Nøkkelkamper",
    roofOpen: "Åpent",
    roofRetractable: "Innfellbart tak",
    roofFixed: "Fast tak",

    playerClose: "Lukk",
    playerRating: "Karakter",
    playerAvgRating: "Snittkarakter · VM 2026",
    playerMatchRatings: "Kampkarakterer",
    playerTournamentLabel: "VM 2026",
    playerGoals: "Mål",
    playerAssists: "Assist",
    playerApps: "Kamper",
    playerYellow: "Gult",
    playerRed: "Rødt",
    playerOwnGoal: "EM",
    playerRatedSuffix: "vurdert",
    playerNoStats: "Statistikk ikke tilgjengelig ennå — sjekk igjen etter neste kamp.",

    // --- PSO & MATCH DISPLAY ---
    goingThrough: "Går videre",
    psoLabel: "STRAFF", pensTab: "Straffer 🥅", statsTab: "Statistikk", aetLabel: "ET",
    psoLive: "Direkte — Straffespark", psoNoData: "Ingen straffesparkdata ennå",
    psoPreMatchPen: "straffespark fra ordinær tid",
    psoPreMatchPens: "straffespark fra ordinær tid",
    psoMissed: "Bom", psoSaved: "Reddet", psoOffTarget: "Utenfor", psoPost: "Stang",

    teamNames: TEAM_NAMES_NO,
    teamOverviews: {}
};

// --- GAME CONFIG CONSTANTS ---
export const MAX_SUBSTITUTIONS = 5;  // Max subs per manager (also used for scout tokens)
export const TOTAL_MATCHES = 104;    // 72 group stage + 32 knockout

// --- BROADCAST DEFAULTS ---
// Default TV channels per locale when no match-specific override is set.
// Update individual matches in Management → Channel Editor when assignments are announced.
export const BROADCAST_CHANNELS: Record<string, string> = {};

// --- LEAGUE CONFIG ---
// Add new leagues here only. Slug = URL invite key. Name = display name.
export const LEAGUES: Record<string, string> = {
  armchair_gaffers:   'The Armchair Gaffers',
  beeline:            'Beeline World Cup 2026',
  sofa_ekspertene:    'Rasten-ligaen avd Sofa-ekspertene',
  infantinos_hustle:  "Infantino's Side Hustle",
};

// Default language shown when joining via each league's invite link.
// Can be overridden at runtime by the admin in the Management panel.
export const LEAGUE_DEFAULT_LANGS: Record<string, LanguageCode> = {
  armchair_gaffers:   'SCO',
  beeline:            'EN',
  sofa_ekspertene:    'NO',
  infantinos_hustle:  'SCO',
};

// --- DATA EXPORTS ---

export const TRANSLATIONS: Record<LanguageCode, Translation> = {
  EN: EN_TRANSLATION,
  NO: NO_TRANSLATION,
  SCO: SCO_TRANSLATION,
  US: US_TRANSLATION
};

const FLAG_MAP: Record<string, string> = {
  MEX: "mx", RSA: "za", KOR: "kr", CZE: "cz",
  CAN: "ca", BIH: "ba", QAT: "qa", SUI: "ch",
  BRA: "br", MAR: "ma", HAI: "ht", SCO: "gb-sct",
  USA: "us", PAR: "py", AUS: "au", TUR: "tr",
  GER: "de", CUW: "cw", CIV: "ci", ECU: "ec",
  NED: "nl", JPN: "jp", SWE: "se", TUN: "tn",
  BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz",
  ESP: "es", CPV: "cv", KSA: "sa", URU: "uy",
  FRA: "fr", SEN: "sn", IRQ: "iq", NOR: "no",
  ARG: "ar", ALG: "dz", AUT: "at", JOR: "jo",
  POR: "pt", COD: "cd", UZB: "uz", COL: "co",
  ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa",
  TBD: ""
};

// REAL STATS LOOKUP TABLE (Projected 2026 Rankings)
const TEAM_STATS: Record<string, { rank: number, att: number, mid: number, def: number }> = {
  MEX: { rank: 15, att: 79, mid: 78, def: 77 },
  RSA: { rank: 60, att: 73, mid: 72, def: 70 },
  KOR: { rank: 25, att: 81, mid: 79, def: 76 },
  CZE: { rank: 38, att: 76, mid: 77, def: 75 },
  CAN: { rank: 30, att: 79, mid: 77, def: 75 },
  BIH: { rank: 65, att: 75, mid: 76, def: 74 },
  QAT: { rank: 53, att: 72, mid: 73, def: 71 },
  SUI: { rank: 19, att: 78, mid: 81, def: 83 },
  BRA: { rank: 6, att: 89, mid: 87, def: 84 },
  MAR: { rank: 8, att: 81, mid: 84, def: 87 },
  HAI: { rank: 82, att: 71, mid: 69, def: 68 },
  SCO: { rank: 43, att: 75, mid: 79, def: 78 },
  USA: { rank: 16, att: 80, mid: 81, def: 78 },
  PAR: { rank: 41, att: 74, mid: 75, def: 76 },
  AUS: { rank: 27, att: 75, mid: 76, def: 77 },
  TUR: { rank: 22, att: 78, mid: 80, def: 77 },
  GER: { rank: 10, att: 85, mid: 87, def: 84 },
  CUW: { rank: 81, att: 70, mid: 71, def: 69 },
  CIV: { rank: 34, att: 79, mid: 78, def: 76 },
  ECU: { rank: 23, att: 77, mid: 79, def: 78 },
  NED: { rank: 7, att: 84, mid: 86, def: 87 },
  JPN: { rank: 18, att: 80, mid: 82, def: 78 },
  SWE: { rank: 37, att: 79, mid: 78, def: 77 },
  TUN: { rank: 44, att: 72, mid: 74, def: 75 },
  BEL: { rank: 9, att: 84, mid: 87, def: 80 },
  EGY: { rank: 29, att: 80, mid: 75, def: 73 },
  IRN: { rank: 20, att: 78, mid: 76, def: 77 },
  NZL: { rank: 85, att: 69, mid: 68, def: 69 },
  ESP: { rank: 2, att: 86, mid: 90, def: 86 },
  CPV: { rank: 67, att: 73, mid: 71, def: 70 },
  KSA: { rank: 61, att: 74, mid: 73, def: 71 },
  URU: { rank: 17, att: 83, mid: 84, def: 83 },
  FRA: { rank: 1, att: 92, mid: 89, def: 88 },
  SEN: { rank: 13, att: 82, mid: 80, def: 83 },
  IRQ: { rank: 55, att: 72, mid: 70, def: 69 },
  NOR: { rank: 31, att: 87, mid: 79, def: 75 },
  ARG: { rank: 3, att: 91, mid: 88, def: 85 },
  ALG: { rank: 28, att: 78, mid: 77, def: 75 },
  AUT: { rank: 24, att: 77, mid: 80, def: 78 },
  JOR: { rank: 70, att: 71, mid: 70, def: 69 },
  POR: { rank: 5, att: 88, mid: 89, def: 84 },
  COD: { rank: 46, att: 75, mid: 73, def: 72 },
  UZB: { rank: 49, att: 71, mid: 72, def: 70 },
  COL: { rank: 12, att: 83, mid: 80, def: 79 },
  ENG: { rank: 4, att: 89, mid: 90, def: 85 },
  CRO: { rank: 11, att: 78, mid: 85, def: 82 },
  GHA: { rank: 58, att: 76, mid: 75, def: 73 },
  PAN: { rank: 33, att: 72, mid: 71, def: 71 },
  TBD: { rank: 99, att: 50, mid: 50, def: 50 }
};

const TEAM_JERSEYS: Record<string, { bg: string; text: string }> = {
  MEX: { bg: '#006847', text: '#FFFFFF' }, RSA: { bg: '#FFB81C', text: '#007749' },
  KOR: { bg: '#E03A3E', text: '#FFFFFF' }, CZE: { bg: '#ED1B24', text: '#FFFFFF' },
  CAN: { bg: '#C5281C', text: '#FFFFFF' }, BIH: { bg: '#002F6C', text: '#FFFFFF' },
  QAT: { bg: '#8A1538', text: '#FFFFFF' }, SUI: { bg: '#D52B1E', text: '#FFFFFF' },
  BRA: { bg: '#FEE123', text: '#009B3A' }, MAR: { bg: '#C1272D', text: '#FFFFFF' },
  HAI: { bg: '#00205B', text: '#FFFFFF' }, SCO: { bg: '#001B49', text: '#FFFFFF' },
  USA: { bg: '#FFFFFF', text: '#002868' }, PAR: { bg: '#D52B1E', text: '#FFFFFF' },
  AUS: { bg: '#FFCD00', text: '#008751' }, TUR: { bg: '#E30A17', text: '#FFFFFF' },
  GER: { bg: '#FFFFFF', text: '#000000' }, CUW: { bg: '#002868', text: '#FFFFFF' },
  CIV: { bg: '#F77F00', text: '#FFFFFF' }, ECU: { bg: '#FFD100', text: '#00205B' },
  NED: { bg: '#F36C21', text: '#FFFFFF' }, JPN: { bg: '#000555', text: '#FFFFFF' },
  SWE: { bg: '#FFF200', text: '#006AA7' }, TUN: { bg: '#FFFFFF', text: '#E70013' },
  BEL: { bg: '#E30613', text: '#FDDA24' }, EGY: { bg: '#CE1126', text: '#FFFFFF' },
  IRN: { bg: '#FFFFFF', text: '#DA0000' }, NZL: { bg: '#FFFFFF', text: '#000000' },
  ESP: { bg: '#AA151B', text: '#F1BF00' }, CPV: { bg: '#003893', text: '#FFFFFF' },
  KSA: { bg: '#006C35', text: '#FFFFFF' }, URU: { bg: '#55B5E5', text: '#000000' },
  FRA: { bg: '#002654', text: '#FFFFFF' }, SEN: { bg: '#FFFFFF', text: '#00853F' },
  IRQ: { bg: '#007A3D', text: '#FFFFFF' }, NOR: { bg: '#C8102E', text: '#FFFFFF' },
  ARG: { bg: '#43A1D5', text: '#000000' }, ALG: { bg: '#FFFFFF', text: '#006233' },
  AUT: { bg: '#ED2939', text: '#FFFFFF' }, JOR: { bg: '#FFFFFF', text: '#E30A17' },
  POR: { bg: '#E42518', text: '#FFFFFF' }, COD: { bg: '#007FFF', text: '#FFFFFF' },
  UZB: { bg: '#005EAB', text: '#FFFFFF' }, COL: { bg: '#FCD116', text: '#003893' },
  ENG: { bg: '#FFFFFF', text: '#000040' }, CRO: { bg: '#ED1C24', text: '#FFFFFF' },
  GHA: { bg: '#FFFFFF', text: '#000000' }, PAN: { bg: '#DA291C', text: '#FFFFFF' },
  TBD: { bg: '#E2E8F0', text: '#64748B' },
};

export const TEAMS: Record<string, Team> = {};
Object.keys(BASE_TEAM_NAMES).forEach(id => {
  const stats = TEAM_STATS[id] || { rank: 50, att: 75, mid: 75, def: 75 };
  const jersey = TEAM_JERSEYS[id] || { bg: '#E2E8F0', text: '#64748B' };
  TEAMS[id] = {
    id,
    name: BASE_TEAM_NAMES[id],
    flag: FLAG_MAP[id] ? `https://flagcdn.com/w320/${FLAG_MAP[id]}.png` : '',
    rank: stats.rank,
    rating: Math.round((stats.att + stats.mid + stats.def) / 3),
    att: stats.att,
    mid: stats.mid,
    def: stats.def,
    overview: "Team overview unavailable.",
    starPlayer: "Star Player",
    form: ['D', 'D', 'D', 'D', 'D'],
    jerseyBg: jersey.bg,
    jerseyText: jersey.text,
  };
});

// --- UPDATED GROUPS WITH REALISTIC TEAMS ---
export const GROUP_CONFIG = [
  { id: 'A', teams: ['MEX', 'RSA', 'KOR', 'CZE'] },
  { id: 'B', teams: ['CAN', 'BIH', 'QAT', 'SUI'] },
  { id: 'C', teams: ['BRA', 'MAR', 'HAI', 'SCO'] },
  { id: 'D', teams: ['USA', 'PAR', 'AUS', 'TUR'] },
  { id: 'E', teams: ['GER', 'CUW', 'CIV', 'ECU'] },
  { id: 'F', teams: ['NED', 'JPN', 'SWE', 'TUN'] },
  { id: 'G', teams: ['BEL', 'EGY', 'IRN', 'NZL'] },
  { id: 'H', teams: ['ESP', 'CPV', 'KSA', 'URU'] },
  { id: 'I', teams: ['FRA', 'SEN', 'IRQ', 'NOR'] },
  { id: 'J', teams: ['ARG', 'ALG', 'AUT', 'JOR'] },
  { id: 'K', teams: ['POR', 'COD', 'UZB', 'COL'] },
  { id: 'L', teams: ['ENG', 'CRO', 'GHA', 'PAN'] }
];

// Helper to assign mock channels
const assignChannels = (matchIndex: number) => ({
  EN: matchIndex % 2 === 0 ? 'BBC One' : 'ITV1',
  SCO: matchIndex % 2 === 0 ? 'BBC Scotland' : 'STV',
  NO: matchIndex % 2 === 0 ? 'NRK 1' : 'TV2',
  US: 'FOX'
});

export const INITIAL_MATCHES: Match[] = [];
let matchCounter = 0;

// Generate Group Matches
GROUP_CONFIG.forEach(group => {
  const [t1, t2, t3, t4] = group.teams;
  // Round 1
  INITIAL_MATCHES.push({ id: `${group.id}1`, groupId: group.id, homeTeamId: t1, awayTeamId: t2, homeScore: null, awayScore: null, date: 'June 11, 2026', venue: 'Stadium', status: 'UPCOMING', isLocked: false, channels: assignChannels(matchCounter++) });
  INITIAL_MATCHES.push({ id: `${group.id}2`, groupId: group.id, homeTeamId: t3, awayTeamId: t4, homeScore: null, awayScore: null, date: 'June 11, 2026', venue: 'Stadium', status: 'UPCOMING', isLocked: false, channels: assignChannels(matchCounter++) });
  // Round 2
  INITIAL_MATCHES.push({ id: `${group.id}3`, groupId: group.id, homeTeamId: t1, awayTeamId: t3, homeScore: null, awayScore: null, date: 'June 15, 2026', venue: 'Stadium', status: 'UPCOMING', isLocked: false, channels: assignChannels(matchCounter++) });
  INITIAL_MATCHES.push({ id: `${group.id}4`, groupId: group.id, homeTeamId: t4, awayTeamId: t2, homeScore: null, awayScore: null, date: 'June 15, 2026', venue: 'Stadium', status: 'UPCOMING', isLocked: false, channels: assignChannels(matchCounter++) });
  // Round 3
  INITIAL_MATCHES.push({ id: `${group.id}5`, groupId: group.id, homeTeamId: t4, awayTeamId: t1, homeScore: null, awayScore: null, date: 'June 19, 2026', venue: 'Stadium', status: 'UPCOMING', isLocked: false, channels: assignChannels(matchCounter++) });
  INITIAL_MATCHES.push({ id: `${group.id}6`, groupId: group.id, homeTeamId: t2, awayTeamId: t3, homeScore: null, awayScore: null, date: 'June 19, 2026', venue: 'Stadium', status: 'UPCOMING', isLocked: false, channels: assignChannels(matchCounter++) });
});

// Generate Knockout placeholders
const rounds = ['R32', 'R16', 'QF', 'SF', '3RD', 'FIN'];
const counts = [16, 8, 4, 2, 1, 1];
rounds.forEach((round, idx) => {
  const count = counts[idx];
  for(let i=1; i<=count; i++) {
    let nextMatchId: string | undefined = undefined;
    
    // Official FIFA Mapping for Next Matches
    if (round === 'R32') {
        if (i === 1 || i === 4) nextMatchId = 'R16_1';        // RSA/CAN + NED/MAR
        else if (i === 2 || i === 5) nextMatchId = 'R16_2';   // BRA/JPN + CIV/NOR
        else if (i === 3 || i === 6) nextMatchId = 'R16_3';   // GER/PAR + FRA/SWE
        else if (i === 7 || i === 8) nextMatchId = 'R16_4';   // MEX/ECU + ENG/COD
        else if (i === 11 || i === 12) nextMatchId = 'R16_5'; // POR/CRO + ESP/AUT
        else if (i === 9 || i === 10) nextMatchId = 'R16_6';  // USA/BIH + BEL/SEN
        else if (i === 14 || i === 16) nextMatchId = 'R16_7'; // ARG/CPV + AUS/EGY
        else if (i === 13 || i === 15) nextMatchId = 'R16_8'; // SUI/ALG + COL/GHA
    }
    else if (round === 'R16') {
        if (i === 1 || i === 3) nextMatchId = 'QF_1';
        else if (i === 5 || i === 6) nextMatchId = 'QF_2';
        else if (i === 2 || i === 4) nextMatchId = 'QF_3';
        else if (i === 7 || i === 8) nextMatchId = 'QF_4';
    }
    else if (round === 'QF') {
        if (i === 1 || i === 2) nextMatchId = 'SF_1';
        else if (i === 3 || i === 4) nextMatchId = 'SF_2';
    }
    else if (round === 'SF') {
        nextMatchId = 'FIN_1';
    }

    const matchId = `${round}_${i}`;

    INITIAL_MATCHES.push({
      id: matchId,
      round: round as any,
      homeTeamId: 'TBD',
      awayTeamId: 'TBD',
      homeScore: null,
      awayScore: null,
      date: 'TBD',
      venue: 'TBD',
      status: 'UPCOMING',
      isLocked: false,
      nextMatchId: nextMatchId,
      channels: assignChannels(matchCounter++)
    });
  }
});


export const MOCK_PREDICTIONS: Prediction[] = [];