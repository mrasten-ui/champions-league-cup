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
    roundLabel: "Round",
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
    profile: "Manager Profile", logout: "Log Out", rulesBtn: "Game Rules", rulesTitle: "Tournament Rules", quickGuideBtn: "Quick Guide",
    tabHowToPlay: "How to Play", tabScoring: "Points System",
    riskTitle: "How chaotic should the results be?", riskBanker: "Banker", riskBalanced: "Balanced", riskWildcard: "Wildcard", riskBankerDesc: "Top teams dominate", riskBalancedDesc: "The beautiful game", riskWildcardDesc: "Giant killers 🌪️",
    scoringTitle: "How high-scoring should matches be?", scoringCagey: "Cagey", scoringBalanced: "Balanced", scoringGoalFest: "Goal Fest", scoringCageyDesc: "Tight, low-scoring games", scoringBalancedDesc: "A normal spread of goals", scoringGoalFestDesc: "Goals galore ⚽🔥",
    nudgeTitle: "Missing predictions", nudgeMsg: "You're missing {n} predictions — fill them in before kickoff!", nudgeCta: "Fill them in",
    rulesPreSubtitle: "Build your predictions. Collect points. Compete for glory.",
    rulesLiveSubtitle: "The tournament is live. Here's what matters now.",
    rulesLiveScoringSection: "Scoring Right Now",
    rulesLiveToolsSection: "Your Tools",
    rulesLiveTableTitle: "Watch The Table Move",
    rulesLiveTableDesc: "The Tables tab previews standings using your predictions for the open round — once real results land, it snaps back to the real table and starts previewing the next round. Use it to see how a result could shake things up before it happens.",
    rule1Title: "1. Predict Round by Round", rule1Desc: "Each Round opens up as soon as the last one locks. Set your exact score for every match before its kickoff — the League Phase table updates live as you go.",
    rule2Title: "2. The Magic Wand", rule2Desc: "Short on time? The Magic Wand fills in the current round only, based on team rankings and your risk setting. Tweak any pick afterwards.",
    rule3Title: "3. Real Draws, One Round Ahead", rule3Desc: "There's no bracket to fill in advance. Once the League Phase ends, the real Playoff Round, Round of 16, Quarter-Finals, Semi-Finals and Final pairings are revealed as they're drawn — you only ever predict the round that's actually open.",
    deadlineTitle: "🚨 The Deadline", deadlineBodyPre: "Round 1 opens as soon as the League Phase draw is out. The whole round locks together the moment its first match kicks off, at", deadlineBodyPost: " — no per-match buffer, one deadline for the round. Same pattern every round, all the way to the Final.",
    rule4Title: "4. Scout Your Rivals", rule4Desc: "Curious what a rival predicted? Reveal any pick for 1 point, docked from your total. No limit — just weigh the cost.",
    rule5Title: "5. Live Match Tracking", rule5Desc: "Once a round locks, follow it live — goals, cards, VAR reviews and lineups update in real time as the round unfolds.",
    rule6Title: "6. Miss a Deadline? The Computer's Got You", rule6Desc: "Every account sets a Risk Profile at signup (Banker, Balanced or Wildcard). If a deadline passes before you get your pick in, we auto-fill it for you from that profile — you'll never score a blank. Auto-filled picks are marked with a 🤖.",
    scoreExact: "Exact Score (e.g. 2-1)", scoreResult: "Correct Outcome (Win/Draw)",
    scoreKnockoutTitle: "Knockout Scoring — Rises Every Round", scoreKnockoutDesc: "Outcome / exact-score points shown per round. Nailing the score is always +2 over just calling the winner.",
    scorePensBonusTitle: "Called The Shootout", scorePensBonusDesc: "Predict a level knockout tie and you'll be asked who wins on pens. Get it right that it actually goes to penalties: +4. Called pens but the tie was settled in normal or extra time: -1. A shootout winner always counts as your correct-winner pick, whatever the scoreline said.",
    scoreScoutTitle: "Scouting Costs", scoreScoutDesc: "Every rival prediction you reveal costs 1 point, permanently — no free peeks, no token limit.",
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
    confirmClear: "Are you sure you want to clear your predictions?", finishGroupBtn: "Finish Group {0}",
    revealBtn: "Reveal", tokensLeft: "Intel", spyCost: "1 Intel", rivalLive: "Rival Live Status", rivalIntel: "Rival Intelligence",
    scenarioAnalysis: "Scenario Analysis", now: "Now", noPick: "No Pick", myPick: "My Pick", advanced: "Advanced",
    live: "LIVE", ft: "FT", spyConfirm: "Costs 1 point — reveal their pick?", sendScouts: "Send out the scouts", saving: "Saving", saved: "Saved",
    tabTournament: "Tournament", tabManager: "Manager", subnavRounds: "Rounds", subnavTables: "Tables",
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
    loggedOutTitle: "Logged Out",
    loggedOutMsg: "See you next match day.",
    profileUpdated: "Profile Updated",
    profileMsg: "New avatar looks great!",
    predSaved: "Prediction Saved",
    predLocked: "Match re-locked.",
    rivalRevealed: "Rival Revealed",
    intelUsed: "-1 point spent.",
    saveBtn: "Save",
    stadiumTbd: "Stadium TBD",
    liveTag: "LIVE",
    ftTag: "FT",
    changeIdentity: "Change Identity",
    cancelBtn: "Cancel",
    noMatchesDate: "No matches on this date.",
    leagueJoined: "League Joined",
    predictionsCleared: "Cleared",
    predictionsClearedMsg: "Your predictions have been reset.",
    saveFailed: "Save Failed",
    saveFailedMsg: "Could not save your changes. Try again.",
    tooLate: "Too Late",
    tooLateMsg: "This match has already started.",
    magicApplied: "Magic Applied",
    autoFilledState: "Auto-filled",
    autoFilledDesc: "You missed the deadline — filled in for you based on your risk profile",
    riskProfileSection: "Risk Profile",

    // --- ROUND NAMES ---
    playoffRound: "Playoff Round",
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
    roundLabel: "Roond",
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
    profile: "Ma Profile", logout: "Cheerio", rulesBtn: "The Rules", rulesTitle: "Hoo tae Play", quickGuideBtn: "The Wee Tour", tabHowToPlay: "The Basics", tabScoring: "Points",
    riskTitle: "How daft dae ye want the results tae be?", riskBanker: "Banker", riskBalanced: "Balanced", riskWildcard: "Dafty", riskBankerDesc: "The big teams win", riskBalancedDesc: "The beautiful game", riskWildcardDesc: "Giant killers ahoy",
    scoringTitle: "How many goals dae ye want tae see?", scoringCagey: "Canny", scoringBalanced: "Balanced", scoringGoalFest: "Goal Fest", scoringCageyDesc: "Tight, nae many goals", scoringBalancedDesc: "A normal spread o' goals", scoringGoalFestDesc: "Goals galore",
    nudgeTitle: "Missing predictions", nudgeMsg: "Ye're missing {n} picks — get them in before the whistle!", nudgeCta: "Fill them in",
    rulesPreSubtitle: "Build yer picks. Score points. Take the glory.",
    rulesLiveSubtitle: "We're live. Here's whit matters noo.",
    rulesLiveScoringSection: "Scorin' Right Noo",
    rulesLiveToolsSection: "Yer Tools",
    rulesLiveTableTitle: "Watch the Table Shift",
    rulesLiveTableDesc: "The Tables tab shows the table wi' yer ain picks fur the open roond — once the real results are in, it snaps back tae the real table and starts previewin' the next yin. Handy fur seein' how a result could shake things up afore it happens.",
    rule1Title: "1. Tip Each Roond As It Comes", rule1Desc: "Every Roond opens up as soon as the last yin locks. Get yer exact scores in before kick-off — the table updates live as ye go.",
    rule2Title: "2. The Magic Stick", rule2Desc: "Nae time? The Magic Stick fills in this roond only, based oan the rankings and yer risk setting. Tweak onything efter.",
    rule3Title: "3. Real Draws, Yin Roond Ahead", rule3Desc: "There's nae bracket tae fill in early. Efter the League Phase, the real Playoff Roond, R16, Quarters, Semis and Final get drawn fur real — ye only ever tip the roond that's actually open.",
    deadlineTitle: "🚨 The Cutoff", deadlineBodyPre: "Roond 1 opens as soon as the League Phase draw's oot. The whole roond locks thegither the meenit its first game kicks aff, at", deadlineBodyPost: " — nae per-game buffer, wan deadline fur the roond. Same every roond, aw the way tae the Final.",
    rule4Title: "4. Spy On Yer Pals", rule4Desc: "Wantin' tae ken whit a rival tipped? See ony pick fur 1 point, taken aff yer total. Nae limit — just mind the cost.",
    rule5Title: "5. Live Match Trackin'", rule5Desc: "Once a roond locks, follow it live — goals, cards, VAR keeks and lineups update in real time as the roond unfolds.",
    rule6Title: "6. Missed the Cutoff? The Computer's Got Ye", rule6Desc: "Every profile sets a Risk Level when ye sign up (Banker, Balanced or Dafty). Miss a deadline and we'll fill it in fur ye based oan that — ye'll never score a big fat zero. Auto-filled picks get a wee 🤖 tag.",
    scoreExact: "Bang On (e.g. 2-1)", scoreResult: "Right Winner",
    scoreKnockoutTitle: "Big Points — Grows Every Roond", scoreKnockoutDesc: "Winner / bang-on points shown per roond. Gettin' the score bang on is aye +2 ower just cawin' the winner.",
    scorePensBonusTitle: "Called the Penalties", scorePensBonusDesc: "Tip a level knockout tie and ye'll get asked wha wins oan pens. Get it right that it goes tae penalties: +4. Said pens but it got sorted in normal or extra time: -1. A penalties winner is aye yer correct-winner pick, nae matter whit the scoreline said.",
    scoreScoutTitle: "Spyin' Costs", scoreScoutDesc: "Every rival pick ye see costs ye 1 point, every time — nae free keeks, nae token limit.",
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
    confirmClear: "Ye sure ye want tae bin yer picks?", finishGroupBtn: "Sort Group {0}", revealBtn: "Keek", tokensLeft: "Intel", spyCost: "1 Intel",
    rivalLive: "Pal's Picks", rivalIntel: "Intel", scenarioAnalysis: "Scenarios", now: "Noo", noPick: "Nae Pick", myPick: "Ma Pick", advanced: "Through",
    live: "LIVE", ft: "FT", spyConfirm: "Costs ye a point — keek at their pick?", sendScouts: "Send the scouts oot", saving: "Savin'", saved: "Sorted",
    tabTournament: "The Cup", tabManager: "Manager", subnavRounds: "Rounds", subnavTables: "Leagues",
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
    loggedOutTitle: "Away Ye Go",
    loggedOutMsg: "Haste ye back!",
    profileUpdated: "Lookin' Braw",
    profileMsg: "That's a belter of a photo.",
    predSaved: "Sorted",
    predLocked: "Locked in. Good luck.",
    rivalRevealed: "Rival Clocked",
    intelUsed: "-1 point. Dinnae waste it.",
    leagueJoined: "Joined a League",
    predictionsCleared: "Binned",
    predictionsClearedMsg: "Yer picks are gone.",
    saveFailed: "Didnae Save",
    saveFailedMsg: "Somethin' went wrang. Try again.",
    tooLate: "Too Late Pal",
    tooLateMsg: "That game's already kicked off.",
    magicApplied: "Done It",
    autoFilledState: "Robot Did It",
    autoFilledDesc: "Ye missed the deadline — the computer filled it in fur ye based on yer risk profile",
    riskProfileSection: "Risk Profile",
    scoutBtn: "Spying Mission",
    saveBtn: "Lock In",
    stadiumTbd: "Park TBD",
    liveTag: "ON NOO",
    ftTag: "FT",
    changeIdentity: "Change Yer Mug",
    cancelBtn: "Wheesht",
    noMatchesDate: "Nae fitba today.",

    // --- ROUND NAMES ---
    playoffRound: "Playoff Roond",
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

export const MOCK_PREDICTIONS: Prediction[] = [];