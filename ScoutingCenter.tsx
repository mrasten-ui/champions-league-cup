import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Team, Translation, MatchHistoryItem, ScoutingData, LanguageCode, Match } from '../types';
import { fetchTeamHistory, fetchScoutingOverview, fetchTeamExtendedStats, TeamFormData } from '../services/engine';
import { getScoutingReport } from '../scoutingData';
import { Search, X, TrendingUp, TrendingDown, Activity, BookOpen, Crown, RefreshCw, AlertCircle, Minus, Swords, ChevronDown, Trophy, Shield, Zap, CheckCircle2, PlusCircle } from 'lucide-react';

// --- HELPER COMPONENTS ---

const cleanText = (text?: string) => text ? text.replace(/^"|"$/g, '').trim() : '';

const RenderPoints = ({ text }: { text?: string }) => {
    if (!text) return <span className="italic opacity-60">Data unavailable</span>;
    const points = text.split(/\.\s+|\.$/).filter(p => p.trim().length > 0);
    if (points.length === 0) return <span>{text}</span>;
    return (
        <ul className="list-none space-y-2 mt-2">
            {points.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed font-medium text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-40" />
                    <span>{p.trim()}.</span>
                </li>
            ))}
        </ul>
    );
};

const StatBar = ({ label, valA, valB, colorA = "bg-blue-500", colorB = "bg-red-500" }: { label: string, valA: number, valB: number, colorA?: string, colorB?: string }) => (
    <div className="flex flex-col gap-1 w-full">
        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
            <span>{valA}</span>
            <span>{label}</span>
            <span>{valB}</span>
        </div>
        <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100">
             <div className="flex-1 flex justify-end pr-0.5">
                 <div style={{ width: `${Math.min(100, (valA / 100) * 100)}%` }} className={`h-full rounded-full ${colorA} transition-all duration-500`}></div>
             </div>
             <div className="w-0.5 bg-white z-10"></div>
             <div className="flex-1 pl-0.5">
                 <div style={{ width: `${Math.min(100, (valB / 100) * 100)}%` }} className={`h-full rounded-full ${colorB} transition-all duration-500`}></div>
             </div>
        </div>
    </div>
);

// Custom Dropdown with Flags
const CustomTeamSelect = ({ 
    teams, 
    value, 
    onChange, 
    placeholder,
    lang 
}: { 
    teams: Team[], 
    value: string | null, 
    onChange: (id: string) => void, 
    placeholder: string,
    lang: Translation
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedTeam = value ? teams.find(t => t.id === value) : null;
    
    // Filter teams for dropdown search
    const filteredTeams = teams.filter(t => 
        (lang.teamNames[t.id] || t.name).toLowerCase().includes(search.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all text-left"
            >
                {selectedTeam ? (
                    <div className="flex items-center gap-2">
                        <img src={selectedTeam.flag} alt="" className="w-6 h-4 object-cover rounded shadow-sm" />
                        <span className="text-xs font-bold text-slate-800 truncate">{lang.teamNames[selectedTeam.id] || selectedTeam.name}</span>
                    </div>
                ) : (
                    <span className="text-xs font-bold text-slate-400">{placeholder}</span>
                )}
                <ChevronDown size={14} className="text-slate-400 ml-2" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden max-h-60 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-slate-50 sticky top-0 bg-white z-10">
                        <div className="relative">
                            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                autoFocus
                                type="text" 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-7 pr-2 py-1.5 bg-slate-50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder={lang.searchNation}
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 p-1">
                        {filteredTeams.map(t => (
                            <button
                                key={t.id}
                                onClick={() => { onChange(t.id); setIsOpen(false); setSearch(''); }}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors ${value === t.id ? 'bg-blue-50' : ''}`}
                            >
                                <img src={t.flag} alt="" className="w-6 h-4 object-cover rounded shadow-sm" />
                                <span className={`text-xs ${value === t.id ? 'font-black text-blue-700' : 'font-medium text-slate-700'}`}>
                                    {lang.teamNames[t.id] || t.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

interface ScoutingCenterProps {
  teams: Record<string, Team>;
  lang: Translation;
  currentLang?: LanguageCode;
  matches?: Match[]; // Optional for now, but needed for form dots
}

export const ScoutingCenter: React.FC<ScoutingCenterProps> = ({ teams, lang, currentLang = 'EN', matches }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'TIERS'>('GRID');
  
  // COMPARATOR STATE
  const [compareMode, setCompareMode] = useState(false);
  const [teamAId, setTeamAId] = useState<string | null>(null);
  const [teamBId, setTeamBId] = useState<string | null>(null);
  const comparatorRef = useRef<HTMLDivElement>(null);

  // DATA STATE
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [scoutingData, setScoutingData] = useState<ScoutingData | null>(null);
  const [extendedStats, setExtendedStats] = useState<TeamFormData | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // PREPARE LIST
  const teamList = useMemo(() => {
      return (Object.values(teams) as Team[])
        .filter(t => !t.id.startsWith('TBD'))
        .filter(t => (lang.teamNames[t.id] || t.name).toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => (a.rank || 99) - (b.rank || 99));
  }, [teams, searchTerm, lang]);

  // CALCULATE LIVE FORM
  const teamForms = useMemo(() => {
      const forms: Record<string, ('W'|'D'|'L')[]> = {};
      if (!matches) return forms;

      teamList.forEach(t => {
          // Find last 5 completed matches
          const played = matches
            .filter(m => (m.status === 'FINISHED' || m.status === 'FT') && (m.homeTeamId === t.id || m.awayTeamId === t.id))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
            .slice(0, 5)
            .reverse(); // Chronological for display (Old -> New)
          
          if (played.length === 0) {
              forms[t.id] = ['D','D','D','D','D']; // Default
          } else {
              forms[t.id] = played.map(m => {
                  const isHome = m.homeTeamId === t.id;
                  const scoreH = m.homeScore || 0;
                  const scoreA = m.awayScore || 0;
                  if (scoreH === scoreA) return 'D';
                  if (isHome) return scoreH > scoreA ? 'W' : 'L';
                  return scoreA > scoreH ? 'W' : 'L';
              });
          }
      });
      return forms;
  }, [matches, teamList]);

  // LOAD DETAIL DATA
  useEffect(() => {
      if (selectedTeam) {
          setLoadingHistory(true);
          const loadData = async () => {
              const [dbHistory, dbScouting, dbExtended] = await Promise.all([
                  fetchTeamHistory(selectedTeam.id),
                  fetchScoutingOverview(selectedTeam.id, currentLang as LanguageCode),
                  fetchTeamExtendedStats(selectedTeam.id)
              ]);

              if (dbExtended) {
                  setExtendedStats(dbExtended);
                  setHistory(dbExtended.history);
              } else {
                  setHistory(dbHistory);
              }

              if (dbScouting) {
                  setScoutingData(dbScouting);
              } else {
                  const localReport = getScoutingReport(selectedTeam.id, currentLang as LanguageCode);
                  if (localReport) {
                      setScoutingData({
                          id: 0,
                          team_id: selectedTeam.id,
                          team_name: selectedTeam.name,
                          confederation: localReport.confederation || 'FIFA',
                          fifa_rank: localReport.fifa_rank || selectedTeam.rank || 99,
                          star_player: localReport.star_player || 'Key Player',
                          strengths: localReport.strengths || '',
                          weaknesses: localReport.weaknesses || '',
                          scout_notes: localReport.scout_notes || '',
                          recent_form: localReport.recent_form || (selectedTeam.form ? selectedTeam.form.join('-') : 'W-D-L-W-D'),
                          last_5_matches: localReport.last_5_matches || '',
                          created_at: new Date().toISOString()
                      });
                  }
              }
              setLoadingHistory(false);
          };
          loadData();
      } else {
          setHistory([]);
          setScoutingData(null);
          setExtendedStats(null);
      }
  }, [selectedTeam, currentLang]);

  // Handle "Tick to Compare" Logic
  const handleToggleCompare = (e: React.MouseEvent, teamId: string) => {
      e.stopPropagation();
      
      // If tool is closed, open it and set A
      if (!compareMode) {
          setCompareMode(true);
          setTeamAId(teamId);
          setTeamBId(null);
          // Scroll to top to see it
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
      }

      // Logic to toggle slots
      if (teamAId === teamId) {
          setTeamAId(null);
      } else if (teamBId === teamId) {
          setTeamBId(null);
      } else if (!teamAId) {
          setTeamAId(teamId);
      } else if (!teamBId) {
          setTeamBId(teamId);
          // "Boom you got comparison" -> scroll to tool
          if (comparatorRef.current) {
              comparatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      } else {
          // If both full, replace B (standard UX for comparison tools)
          setTeamBId(teamId);
      }
  };

  // --- DERIVED HELPERS ---
  const getParsedMatches = (stats: TeamFormData | null, sData: ScoutingData | null, fallbackHist: MatchHistoryItem[]) => {
      if (stats) return stats.history;
      if (fallbackHist.length > 0) return fallbackHist;
      return [];
  };

  const calculateTrend = (matches: MatchHistoryItem[]) => {
      if (!matches || matches.length === 0) return { label: 'Unknown', color: 'text-slate-400', icon: Minus, bg: 'bg-slate-100' };
      let points = 0;
      matches.slice(0, 5).forEach(m => {
          if (m.result === 'W') points += 3;
          else if (m.result === 'D') points += 1;
      });
      if (points >= 10) return { label: lang.trendUp, color: 'text-green-500', bg: 'bg-green-100', icon: TrendingUp };
      if (points >= 7) return { label: lang.trendUp, color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp };
      if (points >= 4) return { label: lang.trendFlat, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Minus };
      return { label: lang.trendDown, color: 'text-red-500', bg: 'bg-red-50', icon: TrendingDown };
  };

  const parsedMatches = useMemo(() => getParsedMatches(extendedStats, scoutingData, history), [extendedStats, scoutingData, history]);
  const trend = useMemo(() => calculateTrend(parsedMatches), [parsedMatches]);
  
  const displayRank = extendedStats?.fifaRank || scoutingData?.fifa_rank || selectedTeam?.rank || 99;
  const displayName = selectedTeam ? (lang.teamNames[selectedTeam.id] || scoutingData?.team_name || selectedTeam.name) : '';

  // --- RENDER SECTIONS ---

  // 1. COMPARATOR SECTION
  const renderComparator = () => {
      const teamA = teamAId ? teams[teamAId] : null;
      const teamB = teamBId ? teams[teamBId] : null;

      return (
          <div ref={comparatorRef} className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 mb-8 animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                     <Swords size={18} className="text-blue-600" /> {lang.headToHead}
                 </h3>
                 <button onClick={() => setCompareMode(false)} className="text-xs font-bold text-slate-400 hover:text-red-500">{lang.closeTool}</button>
              </div>

              <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-start">
                  {/* TEAM A SELECTOR */}
                  <div className="flex flex-col gap-2">
                      <CustomTeamSelect 
                         teams={teamList} 
                         value={teamAId} 
                         onChange={setTeamAId} 
                         placeholder={lang.selectTeam} 
                         lang={lang}
                      />
                      {teamA && (
                          <div className="flex flex-col items-center gap-2 mt-2 animate-in fade-in">
                              <div className="w-16 h-10 rounded shadow-md overflow-hidden border border-slate-100">
                                  <img src={teamA.flag} className="w-full h-full object-cover" alt="" />
                              </div>
                              <div className="text-center">
                                  <div className="text-2xl font-black text-slate-800 italic">#{teamA.rank}</div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang.fifaRank}</div>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* VS BADGE */}
                  <div className="flex items-center justify-center pt-8">
                      <div className="bg-slate-900 text-white text-[10px] font-black p-2 rounded-full shadow-lg">VS</div>
                  </div>

                  {/* TEAM B SELECTOR */}
                  <div className="flex flex-col gap-2">
                      <CustomTeamSelect 
                         teams={teamList} 
                         value={teamBId} 
                         onChange={setTeamBId} 
                         placeholder={lang.selectTeam}
                         lang={lang}
                      />
                      {teamB && (
                          <div className="flex flex-col items-center gap-2 mt-2 animate-in fade-in">
                              <div className="w-16 h-10 rounded shadow-md overflow-hidden border border-slate-100">
                                  <img src={teamB.flag} className="w-full h-full object-cover" alt="" />
                              </div>
                              <div className="text-center">
                                  <div className="text-2xl font-black text-slate-800 italic">#{teamB.rank}</div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang.fifaRank}</div>
                              </div>
                          </div>
                      )}
                  </div>
              </div>

              {/* STAT BARS (Only if both selected) */}
              {teamA && teamB && (
                  <div className="mt-8 space-y-4 pt-6 border-t border-slate-100">
                      <StatBar label={lang.attack} valA={teamA.att} valB={teamB.att} />
                      <StatBar label={lang.midfield} valA={teamA.mid} valB={teamB.mid} />
                      <StatBar label={lang.defense} valA={teamA.def} valB={teamB.def} />
                      <StatBar label={lang.overall} valA={teamA.rating} valB={teamB.rating} colorA="bg-slate-800" colorB="bg-slate-800" />
                      
                      <div className="bg-slate-50 p-3 rounded-xl mt-4 text-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{lang.winChance}</span>
                          <div className="flex justify-center items-end gap-1">
                             <span className="text-xl font-black text-blue-600">{(teamA.rating / (teamA.rating + teamB.rating) * 100).toFixed(0)}%</span>
                             <span className="text-xs font-bold text-slate-300 mb-1">vs</span>
                             <span className="text-xl font-black text-red-600">{(teamB.rating / (teamA.rating + teamB.rating) * 100).toFixed(0)}%</span>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  // 2. GRID VIEW (Standard)
  const renderGrid = (teams: Team[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {teams.map(team => {
            const teamName = lang.teamNames[team.id] || team.name;
            // Use calculated form if available, else static
            const form = (matches && teamForms[team.id]) ? teamForms[team.id] : (team.form || ['D','D','D','D','D']);
            const isInCompare = teamAId === team.id || teamBId === team.id;
            
            return (
                <div 
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`bg-white rounded-xl p-3 border shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3 relative group cursor-pointer ${isInCompare ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}
                >
                    {/* TOGGLE COMPARE BUTTON */}
                    <button 
                        onClick={(e) => handleToggleCompare(e, team.id)}
                        className={`absolute top-2 left-2 z-20 transition-all transform hover:scale-110 ${isInCompare ? 'text-blue-500' : 'text-slate-300 hover:text-blue-400'}`}
                        title={lang.addToCompare}
                    >
                        {isInCompare ? <CheckCircle2 size={18} fill="currentColor" className="text-white" /> : <PlusCircle size={18} />}
                    </button>

                    <div className="relative w-14 h-9 mt-1 group-hover:scale-105 transition-transform">
                        <div className="w-full h-full rounded shadow-sm overflow-hidden border border-slate-100">
                            <img src={team.flag} alt={teamName} className="w-full h-full object-cover" />
                        </div>
                        {team.rank && (
                            <div className="absolute -bottom-2 -right-2 bg-[#0f2545] text-white text-[9px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md z-10">
                                {team.rank}
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center w-full">
                        <div className="font-bold text-slate-800 text-xs truncate w-full">{teamName}</div>
                        {/* Tiny Form Dots */}
                        <div className="flex justify-center gap-0.5 mt-1.5 opacity-60">
                            {form.slice(-3).map((r, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${r === 'W' ? 'bg-green-500' : r === 'L' ? 'bg-red-400' : 'bg-slate-300'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
  );

  // 3. TIER VIEW (FIFA Driven)
  const renderTiers = () => {
      const tiers = {
          tier1: teamList.filter(t => (t.rank || 99) <= 10),
          tier2: teamList.filter(t => (t.rank || 99) > 10 && (t.rank || 99) <= 25),
          tier3: teamList.filter(t => (t.rank || 99) > 25 && (t.rank || 99) <= 50),
          tier4: teamList.filter(t => (t.rank || 99) > 50)
      };

      const TierRow = ({ title, teams, icon: Icon, color }: any) => (
          <div className="mb-6">
              <div className={`flex items-center gap-2 mb-3 px-1 ${color}`}>
                  <Icon size={16} />
                  <h4 className="text-xs font-black uppercase tracking-widest">{title}</h4>
                  <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded-full ml-auto text-slate-500">{teams.length}</span>
              </div>
              {renderGrid(teams)}
          </div>
      );

      return (
          <div className="space-y-2">
              <TierRow title={lang.tier1} teams={tiers.tier1} icon={Trophy} color="text-yellow-600" />
              <TierRow title={lang.tier2} teams={tiers.tier2} icon={Swords} color="text-blue-600" />
              <TierRow title={lang.tier3} teams={tiers.tier3} icon={Zap} color="text-purple-600" />
              <TierRow title={lang.tier4} teams={tiers.tier4} icon={Shield} color="text-slate-500" />
          </div>
      );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* HEADER & SEARCH */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5"><BookOpen size={140} /></div>
        <div className="relative z-10">
           <div className="flex justify-between items-start">
               <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 flex items-center gap-2">
                        <Search size={24} className="text-blue-400" />
                        {lang.scoutReport}
                    </h2>
                    <p className="text-slate-300 text-xs font-medium max-w-xs opacity-80 mb-4">
                        Analyze matchups, check form, and scout your next prediction.
                    </p>
               </div>
               {/* Comparator Toggle */}
               {!compareMode && (
                   <button 
                     onClick={() => setCompareMode(true)}
                     className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border border-white/10"
                   >
                       <Swords size={14} /> {lang.vsTool}
                   </button>
               )}
           </div>

           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder={lang.searchNation}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:bg-white/20 transition-all text-sm"
              />
           </div>
        </div>
      </div>

      {/* COMPARATOR (Conditional) */}
      {compareMode && renderComparator()}

      {/* VIEW TOGGLES */}
      <div className="flex items-center justify-between px-1">
          <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
              <button 
                onClick={() => setViewMode('GRID')}
                className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'GRID' ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  {lang.allNations}
              </button>
              <button 
                onClick={() => setViewMode('TIERS')}
                className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'TIERS' ? 'bg-slate-900 text-white shadow' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  {lang.tierView}
              </button>
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {teamList.length} Teams
          </div>
      </div>

      {/* MAIN CONTENT */}
      {viewMode === 'GRID' ? renderGrid(teamList) : renderTiers()}

      {/* DETAIL MODAL - NO CHANGES NEEDED (Uses existing logic) */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div 
             className="absolute inset-0 bg-slate-900/90 backdrop-blur-md transition-opacity"
             onClick={() => setSelectedTeam(null)}
           ></div>

           <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              
              {/* MODAL HEADER */}
              <div className="relative h-32 bg-[#0f2545] shrink-0">
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-5"></div>
                  <div className="absolute -bottom-8 left-6 w-24 h-16 rounded-lg border-4 border-white shadow-lg overflow-hidden bg-white z-10 transform -rotate-2">
                      <img src={selectedTeam.flag} alt={selectedTeam.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                      <span className="text-white/60 text-[9px] font-black uppercase tracking-widest">{lang.fifaRank}</span>
                      <div className="text-4xl font-black text-white italic tracking-tighter drop-shadow-md">#{displayRank}</div>
                  </div>
                  <button onClick={() => setSelectedTeam(null)} className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors backdrop-blur-sm">
                    <X size={20} />
                  </button>
              </div>

              {/* MODAL BODY */}
              <div className="flex-1 overflow-y-auto pt-12 px-6 pb-6 bg-slate-50">
                  <div className="mb-6">
                      <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">{displayName}</h2>
                      <div className="flex items-center gap-2">
                          <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm">{selectedTeam.id}</span>
                          {scoutingData?.confederation && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-blue-200">{scoutingData.confederation}</span>
                          )}
                      </div>
                  </div>

                  {/* Star Player */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-5 flex items-center gap-4 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl group-hover:bg-yellow-400/20 transition-all"></div>
                      <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full shrink-0 relative z-10">
                          <Crown size={24} fill="currentColor" className="text-yellow-500" />
                      </div>
                      <div className="relative z-10">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{lang.starPlayer}</div>
                          <div className="text-xl font-black text-slate-900 leading-none">{cleanText(scoutingData?.star_player) || selectedTeam.starPlayer}</div>
                      </div>
                  </div>

                  {/* Analysis */}
                  {scoutingData && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                          <div className="bg-green-50/60 rounded-xl p-4 border border-green-100/50">
                              <h4 className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-2 flex items-center gap-1.5"><TrendingUp size={14} /> {lang.strengthsLabel}</h4>
                              <RenderPoints text={cleanText(scoutingData.strengths)} />
                          </div>
                          <div className="bg-red-50/60 rounded-xl p-4 border border-red-100/50">
                              <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2 flex items-center gap-1.5"><AlertCircle size={14} /> {lang.weaknessesLabel}</h4>
                              <RenderPoints text={cleanText(scoutingData.weaknesses)} />
                          </div>
                      </div>
                  )}

                  {/* Form & History */}
                  <div className="mb-2">
                      <div className="flex justify-between items-center mb-3">
                          <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><Activity size={16} className="text-slate-400" /> {lang.formGuide}</h3>
                          {trend && (
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${trend.bg}`}>
                                  <trend.icon size={12} className={trend.color} />
                                  <span className={`text-[10px] font-black uppercase tracking-wide ${trend.color}`}>{trend.label}</span>
                              </div>
                          )}
                      </div>
                      
                      {loadingHistory ? (
                          <div className="flex justify-center py-4"><RefreshCw className="animate-spin text-slate-300" /></div>
                      ) : (
                          <>
                             <div className="flex gap-2 mb-4">
                                  {(parsedMatches || []).slice(0, 5).map((m, i) => {
                                      const r = m.result;
                                      const color = r === 'W' ? 'bg-green-500 shadow-green-200' : r === 'D' ? 'bg-slate-400 shadow-slate-200' : 'bg-red-500 shadow-red-200';
                                      return (
                                          <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-md ${color} transform transition-transform hover:scale-110`}>{r}</div>
                                      )
                                  })}
                             </div>
                             
                             <div className="space-y-2">
                                {(parsedMatches || []).slice(0, 5).map((m, idx) => {
                                    const oppName = lang.teamNames[m.opponent] || m.opponent;
                                    return (
                                        <div key={idx} className="bg-white border border-slate-200 p-2.5 rounded-xl flex justify-between items-center text-xs shadow-sm">
                                            <div className="font-bold text-slate-700 uppercase tracking-tight">{oppName.replace(/^vs\s+/i, '')}</div>
                                            <span className={`font-mono font-black px-2 py-0.5 rounded text-[10px] ${m.result === 'W' ? 'bg-green-100 text-green-700' : m.result === 'L' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{m.score}</span>
                                        </div>
                                    );
                                })}
                             </div>
                          </>
                      )}
                  </div>
              </div>
              
              <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                  <button onClick={() => setSelectedTeam(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg">
                      {lang.closeReport}
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};