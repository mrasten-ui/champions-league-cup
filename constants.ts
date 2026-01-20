import { Team, Match, Translation, LanguageCode, Prediction } from './types';

// HOST CONFIGURATION
export const HOST_KEYS = [
  "AIzaSyAkhMmQN2OJo9ezJOw0Kr4ECNhfu0svm6s",
  "AIzaSyDD1B6Yciiz2HMifr674Bnzx85bK1251Dg",
  "AIzaSyBV51XFJnE4dH1tJyb-SgKQSOzh2-V30zg",
  "AIzaSyC7BnxTrzpuwEDK8sKdrGl0urIpkYCuPKI",
  "AIzaSyCoUCXnSApmm789VgzvhXNnmCNEuhKa6Do",
  "AIzaSyAQl8JNBsg15v5IusJoGRJZYPIbDpI3B28",
  "AIzaSyAaE4PFzQkMMYDK5TIqkgFe9zXoZ_8syZU"
];

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

// --- REALISTIC 2026 TEAM LIST ---
const BASE_TEAM_NAMES: Record<string, string> = {
  MEX: "Mexico", RSA: "South Africa", KOR: "Korea Republic", CZE: "Czechia",
  CAN: "Canada", SRB: "Serbia", QAT: "Qatar", SUI: "Switzerland",
  DEN: "Denmark", SCO: "Scotland", BRA: "Brazil", MAR: "Morocco", // Denmark added!
  USA: "USA", PAR: "Paraguay", AUS: "Australia", NGA: "Nigeria",
  GER: "Germany", ITA: "Italy", CIV: "Ivory Coast", ECU: "Ecuador", // Italy added!
  NED: "Netherlands", JPN: "Japan", ALB: "Albania", TUN: "Tunisia",
  BEL: "Belgium", EGY: "Egypt", IRN: "Iran", NZL: "New Zealand",
  ESP: "Spain", CPV: "Cabo Verde", KSA: "Saudi Arabia", URU: "Uruguay",
  FRA: "France", SEN: "Senegal", CHI: "Chile", NOR: "Norway",
  ARG: "Argentina", ALG: "Algeria", AUT: "Austria", IRQ: "Iraq",
  POR: "Portugal", COD: "Congo DR", UZB: "Uzbekistan", COL: "Colombia",
  ENG: "England", CRO: "Croatia", GHA: "Ghana", PAN: "Panama",
  TBD: "TBD"
};

const TEAM_NAMES_NO: Record<string, string> = {
  MEX: "Mexico", RSA: "Sør-Afrika", KOR: "Sør-Korea", CZE: "Tsjekkia",
  CAN: "Canada", SRB: "Serbia", QAT: "Qatar", SUI: "Sveits",
  DEN: "Danmark", SCO: "Skottland", BRA: "Brasil", MAR: "Marokko",
  USA: "USA", PAR: "Paraguay", AUS: "Australia", NGA: "Nigeria",
  GER: "Tyskland", ITA: "Italia", CIV: "Elfenbenskysten", ECU: "Ecuador",
  NED: "Nederland", JPN: "Japan", ALB: "Albania", TUN: "Tunisia",
  BEL: "Belgia", EGY: "Egypt", IRN: "Iran", NZL: "New Zealand",
  ESP: "Spania", CPV: "Kapp Verde", KSA: "Saudi-Arabia", URU: "Uruguay",
  FRA: "Frankrike", SEN: "Senegal", CHI: "Chile", NOR: "Norge",
  ARG: "Argentina", ALG: "Algerie", AUT: "Østerrike", IRQ: "Irak",
  POR: "Portugal", COD: "DR Kongo", UZB: "Usbekistan", COL: "Colombia",
  ENG: "England", CRO: "Kroatia", GHA: "Ghana", PAN: "Panama",
  TBD: "TBD"
};

// --- TRANSLATIONS (DEFINED BEFORE EXPORT) ---
const EN_TRANSLATION: Translation = {
    genderMan: "Man", genderWoman: "Woman", genPlaceholder: "Describe appearance (e.g. beard, glasses, scarf)...", credits: "Credits",
    groups: "Groups", knockout: "Knockout", leaderboard: "Leaderboard", myPredictions: "My Picks",
    match: "Match", standings: "Table", points: "PTS", goalDiff: "GD", goalsFor: "GF",
    magicWand: "Magic Wand", revealRival: "Peek Picks", qualified: "Qualified", draw: "Draw",
    welcome: "Welcome back", loginMode: "Log In", signupMode: "Sign Up", emailLabel: "E-mail Address",
    passwordLabel: "Password", nameLabel: "Manager Name", enterBtn: "Enter Stadium", subTitle: "The Ultimate Tournament",
    selectAvatar: "Choose Identity", treeView: "Tree", listView: "Rounds", createIdentity: "Create Your Identity",
    genAvatarBtn: "Create AI Persona", genAvatarTitle: "AI Identity Studio", genAvatarDesc: "Describe your manager persona. Our AI will paint it.", genAvatarPlaceholder: "e.g. A cyberpunk tactical genius with neon glasses", generate: "Generate", useAvatar: "Use Persona", orChoosePreset: "Or choose a preset style",
    secondChanceTab: "2nd Chance", secondChanceTitle: "Second Chance Mode", secondChanceDesc: "Your group picks didn't match the real results? Unlock the real teams for the knockout stage.", secondChanceBtn: "Unlock Real Knockout (-50% Pts)", secondChanceUnlockWarn: "Warning: Activating Second Chance will reduce all future points by 50%. This cannot be undone.",
    refreshTeams: "Refresh R32 Teams", refreshTeamsDesc: "Update the knockout tree with the latest qualified teams.",
    deadline: "Deadline:", deadlinePassed: "Deadline Passed", lockedState: "Locked", secondChanceActive: "Second Chance Active", pointsReduced: "Points reduced by 50%",
    managersTab: "Managers", progressGroups: "Group Stage", progressKnockout: "Knockout", managerReady: "Ready for Kickoff", managerIncomplete: "In Preparation",
    profile: "Manager Profile", logout: "Log Out", rulesBtn: "Game Rules", rulesTitle: "Tournament Rules",
    tabHowToPlay: "How to Play", tabScoring: "Points System",
    rule1Title: "1. Predict Groups", rule1Desc: "Fill in scores for all group matches. The table updates automatically.",
    rule2Title: "2. The Knockouts", rule2Desc: "Your group results feed into the knockout tree. Pick winners all the way to the final!",
    rule3Title: "3. Live Mode", rule3Desc: "Track live matches and compare real-time scores against rivals on the leaderboard.",
    rule4Title: "4. Helping Hand", rule4Desc: "Use the Magic Wand to instantly simulate valid predictions based on your favorite teams.",
    rule5Title: "5. Second Chance", rule5Desc: "Predictions busted after groups? Unlock the real teams for the knockouts. Cost: 50% of future points.",
    scoreExact: "Exact Score (e.g. 2-1)", scoreResult: "Correct Outcome (Win/Draw)", scorePenalty: "Second Chance Penalty",
    scoreKnockoutTitle: "Knockout Scoring", scoreKnockoutDesc: "Standard points apply for picking the correct team to advance to the next round.",
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
    filterNext48: "48 Hrs", filterAll: "All", resetSim: "Reset Simulation",
    analysisOpportunity: "Opportunity", analysisOpportunityDesc: "Best Case", analysisPitfall: "Pitfall", analysisPitfallDesc: "Worst Case",
    analysisRealistic: "Realistic", analysisRealisticDesc: "AI Prediction", analysisRoast: "The Pundit", analysisRoastDesc: "Roast Me",
    analysisCorrectWinner: "🔥 Correct Winner! Banking points.", analysisIncorrectWinner: "⚠️ Incorrect Winner. Turnaround needed.",
    analysisExact: "🎯 Bullseye! Exact score hit.", analysisResult: "🛡️ Correct Outcome. Points banked.", analysisWaiting: "Waiting for kickoff...",
    scoutingTab: "Scouting", scoutReport: "Scout Report", attack: "ATT", midfield: "MID", defense: "DEF", overall: "OVR",
    starPlayer: "Key Player", formGuide: "Recent Form", searchNation: "Search nation...", fifaRank: "FIFA Rank",
    tacticalAnalysis: "Tactical Analysis", closeReport: "Close Report", strengthsLabel: "Strengths", weaknessesLabel: "Weaknesses",
    trendLabel: "Trend", trendUp: "Heating Up", trendDown: "Cooling Off", trendFlat: "Inconsistent",
    lastMatches: "Match History", backToGroup: "Back to Group", backTo: "Back to", goToBracket: "Go to Knockouts",
    prevGroup: "Prev Group", nextGroup: "Next Group", overviewBtn: "Overview", bracketBtn: "Knockout Tree", allBtn: "All",
    tablesBtn: "Tables", confirmClear: "Are you sure you want to clear your predictions?", finishGroupBtn: "Finish Group {0}",
    revealBtn: "Reveal", tokensLeft: "Intel", spyCost: "1 Intel", rivalLive: "Rival Live Status", rivalIntel: "Rival Intelligence",
    scenarioAnalysis: "Scenario Analysis", now: "Now", noPick: "No Pick", myPick: "My Pick", advanced: "Advanced",
    live: "LIVE", ft: "FT", substitutions: "Subs", makeSub: "Make Sub", subConfirm: "Use 1 Substitution to unlock?", subSuccess: "Match Unlocked!", unlocked: "UNLOCKED",
    tabTournament: "Tournament", tabManager: "Manager", subnavSchedule: "Schedule", subnavTables: "Tables", subnavBracket: "Bracket",
    rank: "Rank", manager: "Manager", status: "Status", total: "Total", liveStandings: "Live Standings", bankedOnly: "Banked", scoringRulesInfo: "Scoring Rules:",
    lbBreakdown: "Point Breakdown", lbAccuracy: "Accuracy", lbExact: "Exact Scores", lbCorrect: "Correct Outcomes", lbGroupPts: "Group Stage", lbKoPts: "Knockout",
    lbGlobal: "Global", lbLeague: "League", liveToggle: "LIVE", bankedToggle: "BANKED", lbQualified: "Qualified", lbQualifiedDesc: "Knockout Correct", lbGroupRes: "Group Results",
    journeyTitle: "Your Tournament Journey", journeyDesc: "Track your prediction progress.", picksMade: "Picks Made", completion: "Completion", searchPlaceholder: "Search teams...",
    noMatches: "No matches found", noMatchesHint: "Try adjusting your filters or search terms.", groupStagePoints: "Group Stage Points",
    filterUpcoming: "Upcoming", filterLive: "Live", filterFinished: "Finished",
    simKnockoutTitle: "Simulate Knockout Stage", simGroupTitle: "Simulate Group Stage",
    simKnockoutDesc: "Select up to 3 teams. We will generate the entire knockout tree based on these favorites!",
    simGroupDesc: "Select up to 3 teams. We will fill in ALL Group Stage matches instantly!",
    runSim: "Run Simulation", simulating: "Simulating...", selected: "Selected", clearAll: "Clear All", openHand: "Open Assistant",
    champion: "Champion", grandFinal: "Final", thirdPlacePlayoff: "Third Place Playoff", scrollHint: "Scroll horizontally to see full bracket →",
    nextRound: "Next Round", prevRound: "Previous Round", lockedBracketTitle: "Bracket Locked", lockedBracketDesc: "You must finish predicting all group stage matches before you can access the knockout bracket.",
    allGroupTables: "All Group Tables", bestThirdPlace: "Best 3rd Place Teams", top8Advance: "Top 8 advance to R32", eliminationLine: "Elimination Line",
    teamCol: "Team", grpCol: "Grp", headToHead: "Head-to-Head History", wins: "Wins", draws: "Draws", totalMeetings: "meetings",
    firstMeeting: "First Ever Meeting!", firstMeetingDesc: "We couldn't find any previous competitive matches between these two. History starts now!",
    showingLast5: "Showing last 5 of {0} meetings", noHistory: "No recorded history found.", loadingHistory: "Loading history...",
    days: "Days", hours: "Hrs", minutes: "Min", seconds: "Sec", myPickShort: "Pick", watchOn: "Watch on",
    teamNames: BASE_TEAM_NAMES, teamOverviews: {}
};

const SCO_TRANSLATION: Translation = {
    ...EN_TRANSLATION,
    genderMan: "Lad", genderWoman: "Lass", genPlaceholder: "Whit dae ye look like? (e.g. ginger beard, kilt, scar)...", credits: "Goes",
    groups: "The Groups", knockout: "The Knockoots", leaderboard: "Big Table", myPredictions: "Ma Guesses",
    match: "Fixture", standings: "The League", points: "Pts", goalDiff: "GD", goalsFor: "GF",
    magicWand: "Magic Stick", revealRival: "Spy on Pal", qualified: "Through", draw: "Draw",
    welcome: "Awryt, pal", loginMode: "Log In", signupMode: "Sign Up", emailLabel: "Yer Email",
    passwordLabel: "Password", nameLabel: "Yer Name", enterBtn: "Get Stuck In", subTitle: "Pure Dead Brilliant Cup",
    selectAvatar: "Pick Yer Face", treeView: "Tree", listView: "List", createIdentity: "Mak Yer Face",
    genAvatarBtn: "Mak a Face", genAvatarTitle: "Wysiwyg Studio", genAvatarDesc: "Tell us whit ye look like.", genAvatarPlaceholder: "e.g. A ginger lad wi a kilt", generate: "Mak It", useAvatar: "Use It", orChoosePreset: "Or pick a normal one",
    secondChanceTab: "2nd Go", secondChanceTitle: "Redemption Arc", secondChanceDesc: "Made a mess o' the groups? Fix yer tree noo.", secondChanceBtn: "Gie's a Second Go (-50%)", secondChanceUnlockWarn: "Watch it: This costs ye half yer points. Nae turnin' back.",
    refreshTeams: "Update Teams", refreshTeamsDesc: "Get the real teams in there.",
    deadline: "Time's up:", deadlinePassed: "Too Late Pal", lockedState: "Locked In", secondChanceActive: "2nd Go Live", pointsReduced: "Half Points Noo",
    managersTab: "The Lads", progressGroups: "Groups", progressKnockout: "Knockoots", managerReady: "Sorted", managerIncomplete: "Slackin'",
    profile: "Ma Profile", logout: "Cheerio", rulesBtn: "The Rules", rulesTitle: "Hoo tae Play", tabHowToPlay: "The Basics", tabScoring: "Points",
    rule1Title: "1. Groups", rule1Desc: "Pick scores. Don't be a numpty.", rule2Title: "2. Knockoots", rule2Desc: "Pick the winners all the way tae the cup.",
    rule3Title: "3. Live", rule3Desc: "Watch the scores come in live.", rule4Title: "4. Magic Stick", rule4Desc: "Canne be bothered? Let the computer pick.",
    rule5Title: "5. Second Chance", rule5Desc: "Total disaster? Reset yer tree for a price.",
    scoreExact: "Bang On (e.g. 2-1)", scoreResult: "Right Winner", scorePenalty: " Idiot Tax", scoreKnockoutTitle: "Big Points", scoreKnockoutDesc: "Points are awarded for pickin' the winning team that goes through.",
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
    prevGroup: "Prev", nextGroup: "Next", overviewBtn: "Overview", bracketBtn: "The Tree", allBtn: "Aw", tablesBtn: "Tables",
    confirmClear: "Ye sure ye want tae bin yer picks?", finishGroupBtn: "Sort Group {0}", revealBtn: "Keek", tokensLeft: "Intel", spyCost: "1 Intel",
    rivalLive: "Pal's Picks", rivalIntel: "Intel", scenarioAnalysis: "Scenarios", now: "Noo", noPick: "Nae Pick", myPick: "Ma Pick", advanced: "Through",
    live: "LIVE", ft: "FT", substitutions: "Subs", makeSub: "Mak Sub", subConfirm: "Use 1 Sub?", subSuccess: "Sorted!", unlocked: "OPEN",
    tabTournament: "The Cup", tabManager: "Manager", subnavSchedule: "Fixtures", subnavTables: "Leagues", subnavBracket: "Tree",
    rank: "No.", manager: "Lad/Lass", status: "Status", total: "Tot", liveStandings: "Live Table", bankedOnly: "Banked", scoringRulesInfo: "Rules:",
    lbBreakdown: "Breakdoon", lbAccuracy: "Accuracy", lbExact: "Bang On", lbCorrect: "Right Winner", lbGroupPts: "Groups", lbKoPts: "Knockoots",
    lbGlobal: "World", lbLeague: "League", liveToggle: "LIVE", bankedToggle: "BANKED", lbQualified: "Went Through", lbQualifiedDesc: "Right Winners", lbGroupRes: "Group Results",
    journeyTitle: "Yer Journey", journeyDesc: "Hoo yer daein'.", picksMade: "Picks", completion: "Done", searchPlaceholder: "Find team...",
    noMatches: "Nae games", noMatchesHint: "Try lookin' for somethin' else.", groupStagePoints: "Group Pts", filterAll: "Aw", filterUpcoming: "Comin' Up",
    filterLive: "Noo", filterFinished: "Done", simKnockoutTitle: "Sim the Knockoots", simGroupTitle: "Sim the Groups",
    simKnockoutDesc: "Pick 3 teams. We'll dae the rest.", simGroupDesc: "Pick 3 teams. We'll fill the lot.", runSim: "Go", simulating: "Workin'...", selected: "Picked",
    clearAll: "Bin It", openHand: "Help Ma Boab", champion: "Winner", grandFinal: "The Final", thirdPlacePlayoff: "3rd Place", scrollHint: "Scroll it ->",
    nextRound: "Next", prevRound: "Back", lockedBracketTitle: "Nae Entry", lockedBracketDesc: "Finish yer groups first ya numpty.",
    allGroupTables: "All The Groups", bestThirdPlace: "Best 3rd Place", top8Advance: "Top 8 go through", eliminationLine: "Going Hame",
    teamCol: "Team", grpCol: "Grp", headToHead: "The Square Go", wins: "Wins", draws: "Draws", totalMeetings: "rammies",
    firstMeeting: "First Ever Square Go!", firstMeetingDesc: "Never focht afore. This is history!", showingLast5: "Last 5 of {0} scraps",
    noHistory: "No history found.", loadingHistory: "Diggin' it up...", myPickShort: "Pick", watchOn: "Watch on",
};

const US_TRANSLATION: Translation = {
    ...EN_TRANSLATION,
    genderMan: "Male Coach", genderWoman: "Female Coach", genPlaceholder: "Describe the swagger (e.g. shades, headset, championship ring)...", credits: "Tokens",
    groups: "Group Play", knockout: "The Playoffs", leaderboard: "Power Rankings", myPredictions: "My Picks",
    match: "Game", standings: "Standings", points: "Pts", goalDiff: "Diff", goalsFor: "GF",
    magicWand: "Auto-Pick", revealRival: "Peek Picks", qualified: "Clinched", draw: "Tie Game",
    welcome: "What's up, Coach", loginMode: "Log In", signupMode: "Register", emailLabel: "Email",
    passwordLabel: "Password", nameLabel: "Coach Name", enterBtn: "Let's Go!", subTitle: "The World Series of Soccer",
    selectAvatar: "Build Your Avatar", treeView: "Bracket", listView: "List", createIdentity: "Build Your Identity",
    genAvatarBtn: "AI Generator", genAvatarTitle: "Avatar Lab", genAvatarDesc: "Describe your look.", genAvatarPlaceholder: "e.g. Sports caster with a headset", generate: "Create", useAvatar: "Select", orChoosePreset: "Or pick a preset",
    secondChanceTab: "Reset", secondChanceTitle: "Bracket Reset", secondChanceDesc: "Busted bracket? Buy back in for the playoffs.", secondChanceBtn: "Buy Back In (-50% Pts)", secondChanceUnlockWarn: "Warning: This costs 50% of future points. High risk!",
    refreshTeams: "Update Bracket", refreshTeamsDesc: "Load the real qualified teams.",
    deadline: "Kickoff in:", deadlinePassed: "Deadline Passed", lockedState: "Locked", secondChanceActive: "Reset Active", pointsReduced: "50% Point Reduction",
    managersTab: "Roster", progressGroups: "Regular Season", progressKnockout: "Post Season", managerReady: "Locked In", managerIncomplete: "Pending",
    profile: "Coach Profile", logout: "Sign Out", rulesBtn: "Rulebook", rulesTitle: "Official Rules", tabHowToPlay: "Basics", tabScoring: "Scoring",
    rule1Title: "1. Group Play", rule1Desc: "Predict the score of every game. Standings update live.", rule2Title: "2. The Playoffs", rule2Desc: "Pick the winner of every matchup all the way to the Championship.",
    rule3Title: "3. Live Action", rule3Desc: "Track games live and see how you stack up against the competition.", rule4Title: "4. Auto-Pick", rule4Desc: "Use the wand to auto-fill your bracket based on favorites.",
    rule5Title: "5. Bracket Reset", rule5Desc: "Bracket busted? Buy back in for half points.",
    scoreExact: "Perfect Pick (e.g. 2-1)", scoreResult: "Correct Winner", scorePenalty: "Reset Penalty", scoreKnockoutTitle: "Playoff Points", scoreKnockoutDesc: "Points are awarded for correctly picking the winning team that advances.",
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
    overviewBtn: "Overview", bracketBtn: "Bracket", allBtn: "All", tablesBtn: "Standings", confirmClear: "Clear all picks?",
    finishGroupBtn: "Finish Group {0}", revealBtn: "Reveal", tokensLeft: "Intel", spyCost: "1 Intel", rivalLive: "Opponent Status",
    rivalIntel: "Intel", scenarioAnalysis: "Scenarios", now: "Now", noPick: "No Pick", myPick: "My Pick", advanced: "Advanced",
    live: "LIVE", ft: "FINAL", substitutions: "Subs", makeSub: "Make Sub", subConfirm: "Use 1 Sub?", subSuccess: "Match Unlocked!", unlocked: "OPEN",
    tabTournament: "Tournament", tabManager: "Coach", subnavSchedule: "Schedule", subnavTables: "Standings", subnavBracket: "Bracket",
    rank: "Rank", manager: "Coach", status: "Status", total: "Tot", liveStandings: "Live Rankings", bankedOnly: "Banked", scoringRulesInfo: "Scoring:",
    lbBreakdown: "Stats", lbAccuracy: "Accuracy", lbExact: "Perfect", lbCorrect: "Winners", lbGroupPts: "Reg. Season", lbKoPts: "Playoffs",
    lbGlobal: "Global", lbLeague: "League", liveToggle: "LIVE", bankedToggle: "BANKED", lbQualified: "Advanced", lbQualifiedDesc: "Playoff Winners",
    lbGroupRes: "Group Results", journeyTitle: "Season Progress", journeyDesc: "Track your stats.", picksMade: "Picks", completion: "Complete",
    searchPlaceholder: "Search...", noMatches: "No games found", noMatchesHint: "Check filters.", groupStagePoints: "Group Pts",
    filterAll: "All", filterUpcoming: "Upcoming", filterLive: "Live", filterFinished: "Final", simKnockoutTitle: "Sim Playoffs",
    simGroupTitle: "Sim Groups", simKnockoutDesc: "Pick 3 favorites. We'll build the bracket.", simGroupDesc: "Pick 3 favorites. We'll fill the schedule.",
    runSim: "Run Sim", simulating: "Running...", selected: "Active", clearAll: "Clear", openHand: "Auto-Fill",
    champion: "Champ", grandFinal: "Championship", thirdPlacePlayoff: "Bronze Game", scrollHint: "Scroll ->",
    nextRound: "Next", prevRound: "Prev", lockedBracketTitle: "Bracket Locked", lockedBracketDesc: "Finish your regular season picks first.",
    allGroupTables: "All Standings", bestThirdPlace: "Wild Card Race", top8Advance: "Top 8 Advance", eliminationLine: "Eliminated",
    teamCol: "Team", grpCol: "Grp", myPickShort: "Pick", watchOn: "Watch on",
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
  CAN: "ca", SRB: "rs", QAT: "qa", SUI: "ch",
  DEN: "dk", SCO: "gb-sct", BRA: "br", MAR: "ma",
  USA: "us", PAR: "py", AUS: "au", NGA: "ng",
  GER: "de", ITA: "it", CIV: "ci", ECU: "ec",
  NED: "nl", JPN: "jp", ALB: "al", TUN: "tn",
  BEL: "be", EGY: "eg", IRN: "ir", NZL: "nz",
  ESP: "es", CPV: "cv", KSA: "sa", URU: "uy",
  FRA: "fr", SEN: "sn", CHI: "cl", NOR: "no",
  ARG: "ar", ALG: "dz", AUT: "at", IRQ: "iq",
  POR: "pt", COD: "cd", UZB: "uz", COL: "co",
  ENG: "gb-eng", CRO: "hr", GHA: "gh", PAN: "pa",
  TBD: ""
};

// REAL STATS LOOKUP TABLE (Updated with Denmark, Italy, etc.)
const TEAM_STATS: Record<string, { rank: number, att: number, mid: number, def: number }> = {
  MEX: { rank: 16, att: 79, mid: 78, def: 77 },
  RSA: { rank: 61, att: 73, mid: 72, def: 70 },
  KOR: { rank: 22, att: 81, mid: 79, def: 76 },
  CZE: { rank: 44, att: 76, mid: 77, def: 75 },
  CAN: { rank: 27, att: 79, mid: 77, def: 75 },
  SRB: { rank: 32, att: 78, mid: 78, def: 76 },
  QAT: { rank: 53, att: 72, mid: 73, def: 71 },
  SUI: { rank: 18, att: 78, mid: 81, def: 83 },
  DEN: { rank: 21, att: 80, mid: 82, def: 81 }, // Denmark
  SCO: { rank: 36, att: 75, mid: 79, def: 78 },
  BRA: { rank: 5, att: 89, mid: 87, def: 84 },
  MAR: { rank: 8, att: 81, mid: 84, def: 87 },
  USA: { rank: 14, att: 80, mid: 81, def: 78 },
  PAR: { rank: 38, att: 74, mid: 75, def: 76 },
  AUS: { rank: 26, att: 75, mid: 76, def: 77 },
  NGA: { rank: 30, att: 78, mid: 75, def: 72 }, // Nigeria
  GER: { rank: 10, att: 85, mid: 87, def: 84 },
  ITA: { rank: 9, att: 83, mid: 86, def: 85 },  // Italy
  CIV: { rank: 42, att: 79, mid: 78, def: 76 },
  ECU: { rank: 23, att: 77, mid: 79, def: 78 },
  NED: { rank: 7, att: 84, mid: 86, def: 87 },
  JPN: { rank: 19, att: 80, mid: 82, def: 78 },
  ALB: { rank: 63, att: 71, mid: 73, def: 75 },
  TUN: { rank: 41, att: 72, mid: 74, def: 75 },
  BEL: { rank: 9, att: 84, mid: 87, def: 80 },
  EGY: { rank: 35, att: 80, mid: 75, def: 73 },
  IRN: { rank: 20, att: 78, mid: 76, def: 77 },
  NZL: { rank: 87, att: 69, mid: 68, def: 69 },
  ESP: { rank: 1, att: 86, mid: 90, def: 86 },
  CPV: { rank: 67, att: 73, mid: 71, def: 70 },
  KSA: { rank: 60, att: 74, mid: 73, def: 71 },
  URU: { rank: 17, att: 83, mid: 84, def: 83 },
  FRA: { rank: 3, att: 92, mid: 89, def: 88 },
  SEN: { rank: 12, att: 82, mid: 80, def: 83 },
  CHI: { rank: 40, att: 74, mid: 75, def: 73 }, // Chile
  NOR: { rank: 29, att: 87, mid: 79, def: 75 },
  ARG: { rank: 2, att: 91, mid: 88, def: 85 },
  ALG: { rank: 34, att: 78, mid: 77, def: 75 },
  AUT: { rank: 24, att: 77, mid: 80, def: 78 },
  IRQ: { rank: 58, att: 72, mid: 70, def: 69 }, // Iraq
  POR: { rank: 6, att: 88, mid: 89, def: 84 },
  COD: { rank: 56, att: 75, mid: 73, def: 72 },
  UZB: { rank: 50, att: 71, mid: 72, def: 70 },
  COL: { rank: 13, att: 83, mid: 80, def: 79 },
  ENG: { rank: 4, att: 89, mid: 90, def: 85 },
  CRO: { rank: 11, att: 78, mid: 85, def: 82 },
  GHA: { rank: 72, att: 76, mid: 75, def: 73 },
  PAN: { rank: 30, att: 72, mid: 71, def: 71 },
  TBD: { rank: 99, att: 50, mid: 50, def: 50 } 
};

export const TEAMS: Record<string, Team> = {};
Object.keys(BASE_TEAM_NAMES).forEach(id => {
    const stats = TEAM_STATS[id] || { rank: 50, att: 75, mid: 75, def: 75 };
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
        form: ['D', 'D', 'D', 'D', 'D']
    };
});

// --- UPDATED GROUPS WITH REALISTIC TEAMS ---
export const GROUP_CONFIG = [
  { id: 'A', teams: ['MEX', 'RSA', 'KOR', 'CZE'] },
  { id: 'B', teams: ['CAN', 'SRB', 'QAT', 'SUI'] }, // SRB replaces BIH
  { id: 'C', teams: ['DEN', 'SCO', 'BRA', 'MAR'] }, // DEN replaces HAI
  { id: 'D', teams: ['USA', 'PAR', 'AUS', 'NGA'] }, // NGA replaces KOS
  { id: 'E', teams: ['GER', 'ITA', 'CIV', 'ECU'] }, // ITA replaces CUW
  { id: 'F', teams: ['NED', 'JPN', 'ALB', 'TUN'] },
  { id: 'G', teams: ['BEL', 'EGY', 'IRN', 'NZL'] },
  { id: 'H', teams: ['ESP', 'CPV', 'KSA', 'URU'] },
  { id: 'I', teams: ['FRA', 'SEN', 'CHI', 'NOR'] }, // CHI replaces BOL
  { id: 'J', teams: ['ARG', 'ALG', 'AUT', 'IRQ'] }, // IRQ replaces JOR
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
        if (round === 'R32') nextMatchId = `R16_${Math.ceil(i/2)}`;
        else if (round === 'R16') nextMatchId = `QF_${Math.ceil(i/2)}`;
        else if (round === 'QF') nextMatchId = `SF_${Math.ceil(i/2)}`;
        else if (round === 'SF') nextMatchId = `FIN_1`;

        INITIAL_MATCHES.push({
            id: `${round}_${i}`,
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