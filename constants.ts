import { Team, Match, Translation, LanguageCode, Prediction, BroadcastTeam } from './types';

export const LANGUAGES = [
  { code: 'EN' as LanguageCode, name: 'English', flag: 'https://flagcdn.com/w160/gb.png' },
  { code: 'SCO' as LanguageCode, name: 'Scots', flag: 'https://flagcdn.com/w160/gb-sct.png' },
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
  }
};

// --- TRANSLATIONS ---

const EN_TRANSLATION: Translation = {
    genderMan: "Man", genderWoman: "Woman", genPlaceholder: "Describe appearance (e.g. beard, glasses, scarf)...", credits: "Credits",
    group: "Group", groups: "Groups", leaguePhase: "Predictor", lineups: "Line-up", startingXi: "Starting XI", benchLabel: "Bench", knockout: "Knockout", myPredictions: "My Picks",
    
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
    scoringTitle: "How high-scoring should matches be?", scoringCagey: "Cagey", scoringBalanced: "Balanced", scoringGoalFest: "Goal Fest", scoringCageyDesc: "Tight, low-scoring games", scoringBalancedDesc: "A normal spread of goals", scoringGoalFestDesc: "Goals galore ⚽🔥",
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
    tabTournament: "Tournament", tabManager: "Manager", subnavSchedule: "Schedule", subnavRounds: "Rounds", subnavTables: "Tables", subnavBracket: "Bracket", mgrHint: "Here you can review all your predictions. Switch between Group Stage and Knockouts, or use a Substitution token to change a pick before a match kicks off.",
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

    teamOverviews: {}
};

const SCO_TRANSLATION: Translation = {
    ...EN_TRANSLATION,
    isScotland: true,
    genderMan: "Lad", genderWoman: "Lass", genPlaceholder: "Whit dae ye look like? (e.g. ginger beard, kilt, scar)...", credits: "Goes",
    group: "Group", groups: "The Groups", leaguePhase: "The Predictin'", lineups: "Team Sheet", startingXi: "The Startin' XI", benchLabel: "The Bench", knockout: "The Knockoots", myPredictions: "Ma Guesses",
    
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
    scoringTitle: "How many goals dae ye want tae see?", scoringCagey: "Canny", scoringBalanced: "Balanced", scoringGoalFest: "Goal Fest", scoringCageyDesc: "Tight, nae many goals", scoringBalancedDesc: "A normal spread o' goals", scoringGoalFestDesc: "Goals galore",
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
    tabTournament: "The Cup", tabManager: "Manager", subnavSchedule: "Fixtures", subnavRounds: "Rounds", subnavTables: "Leagues", subnavBracket: "Tree", mgrHint: "Here's aw yer picks. Swap between groups an' knockouts, an' use a sub token tae change a pick before the whistle.",
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

    teamOverviews: {}
};

// --- GAME CONFIG CONSTANTS ---
export const MAX_SUBSTITUTIONS = 5;  // Max subs per manager (also used for scout tokens)

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
  sofa_ekspertene:    'EN',
  infantinos_hustle:  'SCO',
};

// --- DATA EXPORTS ---

export const TRANSLATIONS: Record<LanguageCode, Translation> = {
  EN: EN_TRANSLATION,
  SCO: SCO_TRANSLATION,
};

// Intentionally empty — this app is now a club competition (Champions League), and all
// team data (name, crest, form, jersey colors reported live per-match) comes from
// Supabase's `teams` table and the live match feed, not a static roster. Kept as a
// typed lookup so KitImage/GoalBanner's `TEAMS[id]` fallback reads stay valid.
export const TEAMS: Record<string, Team> = {};

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