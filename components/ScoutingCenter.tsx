
import React, { useState, useEffect, useMemo } from 'react';
import { Team, Translation, MatchHistoryItem, ScoutingData, LanguageCode } from '../types';
import { fetchTeamHistory, fetchScoutingOverview, fetchTeamExtendedStats, TeamFormData } from '../services/engine';
import { getScoutingReport } from '../scoutingData';
import { Search, X, TrendingUp, TrendingDown, Activity, BookOpen, Crown, RefreshCw, AlertCircle, Calendar, Minus } from 'lucide-react';

// Helper to clean quotes from CSV strings
const cleanText = (text?: string) => text ? text.replace(/^"|"$/g, '').trim() : '';

// Helper to render text as bullet points
const renderPoints = (text?: string) => {
    if (!text) return <span className="italic opacity-60">Data unavailable</span>;
    // Split by period followed by space, or period at end of string. Filter out empty.
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

interface ScoutingCenterProps {
  teams: Record<string, Team>;
  lang: Translation;
  currentLang?: LanguageCode;
}

export const ScoutingCenter: React.FC<ScoutingCenterProps> = ({ teams, lang, currentLang = 'EN' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // Real History & Scouting Data State
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [scoutingData, setScoutingData] = useState<ScoutingData | null>(null);
  const [extendedStats, setExtendedStats] = useState<TeamFormData | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const teamList = (Object.values(teams) as Team[]).filter(t => !t.id.startsWith('TBD') && (lang.teamNames[t.id] || t.name).toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Sort by Real Rank from prop
  const sortedTeams = teamList.sort((a, b) => {
      const rankA = a.rank || 999;
      const rankB = b.rank || 999;
      return rankA - rankB;
  });

  useEffect(() => {
      if (selectedTeam) {
          setLoadingHistory(true);
          setScoutingData(null); // Reset while loading
          setExtendedStats(null);
          
          const loadData = async () => {
              // Parallel Fetch: 
              // 1. fetchTeamHistory (from head_to_head - old generic)
              // 2. fetchScoutingOverview (text reports) - NOW WITH LANG
              // 3. fetchTeamExtendedStats (from team_form_data - new specific history/rank)
              const [dbHistory, dbScouting, dbExtended] = await Promise.all([
                  fetchTeamHistory(selectedTeam.id),
                  fetchScoutingOverview(selectedTeam.id, currentLang as LanguageCode),
                  fetchTeamExtendedStats(selectedTeam.id)
              ]);

              // Logic: Prioritize Extended Stats (New Table) for History/Rank
              if (dbExtended) {
                  setExtendedStats(dbExtended);
                  setHistory(dbExtended.history);
              } else {
                  setHistory(dbHistory);
              }

              if (dbScouting) {
                  // PRIORITY 1: DB Data
                  setScoutingData(dbScouting);
              } else {
                  // PRIORITY 2: Local Hardcoded Data (Fallback) - NOW LOCALIZED
                  // FIX: Explicitly cast currentLang to LanguageCode to avoid TS string inference error
                  const localReport = getScoutingReport(selectedTeam.id, currentLang as LanguageCode);
                  
                  // CHANGED: Check if localReport exists (it always will due to fallback)
                  // Removed `&& localReport.id` because local data has id: 0, which is falsy
                  if (localReport) {
                      setScoutingData({
                          id: localReport.id || 0,
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
                  } else {
                      // PRIORITY 3: Generated Fallback (Empty State - Rare)
                      setScoutingData({
                          id: 0,
                          team_id: selectedTeam.id,
                          team_name: selectedTeam.name,
                          confederation: 'FIFA',
                          fifa_rank: selectedTeam.rank || 99,
                          star_player: selectedTeam.starPlayer || 'Key Player',
                          strengths: `High Rating (${selectedTeam.rating}). Consistent performer.`,
                          weaknesses: "Data unavailable from scout network.",
                          scout_notes: `Tactical analysis pending. The team has a strong rating of ${selectedTeam.rating} and is expected to perform well.`,
                          recent_form: selectedTeam.form ? selectedTeam.form.join('-') : 'W-D-L-W-D',
                          last_5_matches: '' 
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

  // Determine which matches to display
  const parsedMatches = useMemo(() => {
      // 1. If Extended Stats exist (from team_form_data), use them directly
      if (extendedStats) {
          return extendedStats.history;
      }

      // 2. Fallback: Check scoutingData.last_5_matches string parsing
      if (scoutingData && scoutingData.last_5_matches) {
          const rawMatches = scoutingData.last_5_matches.split(',').map((s: string) => s.trim());
          const formArray = scoutingData.recent_form ? scoutingData.recent_form.split('-') : [];

          const parsed = rawMatches.map((str: string, idx: number) => {
              const cleanStr = cleanText(str);
              const match = cleanStr.match(/(?:vs\s+)?(.*?)\s*\(?(\d+[-:]\d+)\)?/i);
              
              if (!match) return null;
              
              const opponent = match[1].trim();
              const score = match[2].trim();
              
              let result: 'W'|'D'|'L' = 'D';
              if (formArray[idx]) {
                  const char = formArray[idx].toUpperCase().trim();
                  if (char === 'W') result = 'W';
                  else if (char === 'L') result = 'L';
                  else result = 'D';
              } else {
                  const parts = score.split(/[-:]/);
                  if (parts.length === 2) {
                      const s1 = parseInt(parts[0]);
                      const s2 = parseInt(parts[1]);
                      if (s1 > s2) result = 'W';
                      else if (s1 < s2) result = 'L';
                      else result = 'D';
                  }
              }

              return {
                  opponent,
                  score,
                  result,
                  date: `Match ${idx + 1}`
              } as MatchHistoryItem;
          }).filter(Boolean) as MatchHistoryItem[];

          if (parsed.length > 0) return parsed;
      }
      
      // 3. Fallback: Use generic head_to_head history
      if (history && history.length > 0) {
          return history;
      }

      return null;
  }, [scoutingData, history, extendedStats]);

  // Calculate Trend based on final matches list
  const trend = useMemo(() => {
      if (!parsedMatches || parsedMatches.length === 0) return { label: 'Unknown', color: 'text-slate-400', icon: Minus, bg: 'bg-slate-100' };
      
      let points = 0;
      const recent = parsedMatches.slice(0, 5); // Ensure only last 5
      recent.forEach(m => {
          if (m.result === 'W') points += 3;
          else if (m.result === 'D') points += 1;
      });

      if (points >= 10) return { label: lang.trendUp, color: 'text-green-500', bg: 'bg-green-100', icon: TrendingUp };
      if (points >= 7) return { label: lang.trendUp, color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp };
      if (points >= 4) return { label: lang.trendFlat, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Minus };
      return { label: lang.trendDown, color: 'text-red-500', bg: 'bg-red-50', icon: TrendingDown };
  }, [parsedMatches, lang]);

  // Prioritize FIFA Rank from Extended Stats -> Scouting Data -> Visual Fallback
  const displayRank = extendedStats?.fifaRank 
      || scoutingData?.fifa_rank 
      || selectedTeam?.rank
      || '-';
      
  // Prefer Localized Name from Lang prop if available
  const displayName = selectedTeam ? (lang.teamNames[selectedTeam.id] || scoutingData?.team_name || selectedTeam.name) : '';

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      {/* HEADER CARD */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
           <BookOpen size={140} />
        </div>
        <div className="relative z-10">
           <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 flex items-center gap-2">
             <Search size={24} className="text-blue-400" />
             {lang.scoutingTab}
           </h2>
           <p className="text-slate-300 text-sm font-medium max-w-xs">
             Deep dive into every nation. Analyze strengths, weaknesses, and key players before making your picks.
           </p>

           <div className="mt-6 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder={lang.searchNation}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white placeholder-slate-400 backdrop-blur-sm focus:outline-none focus:bg-white/20 transition-all"
              />
           </div>
        </div>
      </div>

      {/* TEAM GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
         {sortedTeams.map(team => {
            const teamName = lang.teamNames[team.id] || team.name;
            const rank = team.rank;
            
            return (
                <button 
                key={team.id}
                onClick={() => setSelectedTeam(team)}
                className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col items-center gap-2 relative group overflow-visible"
                >
                <div className="absolute top-2 right-2 text-[10px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded opacity-60">
                    {team.id}
                </div>
                <div className="relative w-12 h-8 rounded mt-2 group-hover:scale-105 transition-transform">
                    <div className="w-full h-full rounded shadow-sm overflow-hidden border border-slate-100">
                        <img src={team.flag} alt={teamName} className="w-full h-full object-cover" />
                    </div>
                    {rank && (
                        <div className="absolute -bottom-2 -right-2 bg-[#0f2545] text-white text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-full border-2 border-white shadow-xl z-20">
                            #{rank}
                        </div>
                    )}
                </div>
                <div className="text-center">
                    <div className="font-bold text-slate-800 text-xs truncate max-w-[100px]">{teamName}</div>
                </div>
                </button>
            );
         })}
      </div>

      {/* DETAIL MODAL */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div 
             className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity"
             onClick={() => setSelectedTeam(null)}
           ></div>

           <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              
              {/* MODAL HEADER: Flag, Name, Rank */}
              <div className="relative h-36 bg-[#0f2545] shrink-0">
                  {/* Pattern Overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-5"></div>
                  
                  {/* Large Flag Card overlap */}
                  <div className="absolute -bottom-10 left-6 w-28 h-20 rounded-lg border-4 border-white shadow-lg overflow-hidden bg-white z-10 transform -rotate-2">
                      <img src={selectedTeam.flag} alt={selectedTeam.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Rank Badge Top Right */}
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                      <span className="text-white/60 text-[9px] font-black uppercase tracking-widest">FIFA Rank</span>
                      <div className="text-4xl font-black text-white italic tracking-tighter drop-shadow-md">
                          #{displayRank}
                      </div>
                  </div>

                  <button 
                    onClick={() => setSelectedTeam(null)}
                    className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors backdrop-blur-sm"
                  >
                    <X size={20} />
                  </button>
              </div>

              {/* MODAL BODY */}
              <div className="flex-1 overflow-y-auto pt-14 px-6 pb-6 bg-slate-50">
                  
                  {/* Title Row */}
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">
                              {displayName}
                          </h2>
                          <div className="flex items-center gap-2">
                              <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm">
                                  {selectedTeam.id}
                              </span>
                              {scoutingData?.confederation && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border border-blue-200">
                                      {scoutingData.confederation}
                                  </span>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* SECTION 1: Star Player (Hero Card) */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-5 flex items-center gap-4 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl group-hover:bg-yellow-400/20 transition-all"></div>
                      
                      <div className="bg-yellow-100 text-yellow-600 p-3 rounded-full shrink-0 relative z-10">
                          <Crown size={24} fill="currentColor" className="text-yellow-500" />
                      </div>
                      <div className="relative z-10">
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{lang.starPlayer}</div>
                          <div className="text-xl font-black text-slate-900 leading-none">
                              {cleanText(scoutingData?.star_player) || selectedTeam.starPlayer}
                          </div>
                      </div>
                  </div>

                  {/* SECTION 2: Strengths & Weaknesses (Grid) */}
                  {scoutingData && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                          {/* Strengths */}
                          <div className="bg-green-50/60 rounded-xl p-4 border border-green-100/50">
                              <h4 className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                  <TrendingUp size={14} /> {lang.strengthsLabel}
                              </h4>
                              {renderPoints(cleanText(scoutingData.strengths))}
                          </div>
                          {/* Weaknesses */}
                          <div className="bg-red-50/60 rounded-xl p-4 border border-red-100/50">
                              <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                  <AlertCircle size={14} /> {lang.weaknessesLabel}
                              </h4>
                              {renderPoints(cleanText(scoutingData.weaknesses))}
                          </div>
                      </div>
                  )}

                  {/* SECTION 3: Recent Form & History */}
                  <div className="mb-2">
                      <div className="flex justify-between items-center mb-3">
                          <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                              <Activity size={16} className="text-slate-400" /> {lang.formGuide}
                          </h3>
                          
                          {/* Trend Indicator */}
                          {trend && (
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${trend.bg}`}>
                                  <trend.icon size={12} className={trend.color} />
                                  <span className={`text-[10px] font-black uppercase tracking-wide ${trend.color}`}>
                                      {trend.label}
                                  </span>
                              </div>
                          )}
                      </div>
                      
                      {/* Form Badges */}
                      {loadingHistory ? (
                          <div className="flex gap-2 mb-4 animate-pulse">
                              {[1,2,3,4,5].map(i => <div key={i} className="w-8 h-8 rounded-lg bg-slate-200"></div>)}
                          </div>
                      ) : (
                          <div className="flex gap-2 mb-4">
                              {(parsedMatches || []).slice(0, 5).map((m, i) => {
                                  const r = m.result;
                                  const color = r === 'W' ? 'bg-green-500 shadow-green-200' : r === 'D' ? 'bg-slate-400 shadow-slate-200' : 'bg-red-500 shadow-red-200';
                                  return (
                                      <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-md ${color} transform transition-transform hover:scale-110`}>
                                          {r}
                                      </div>
                                  )
                              })}
                              {(!parsedMatches || parsedMatches.length === 0) && (
                                  <span className="text-xs text-slate-400 italic">No recent matches</span>
                              )}
                          </div>
                      )}

                      {/* Match List */}
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-4">{lang.lastMatches}</h4>
                      <div className="space-y-2">
                          {loadingHistory ? (
                              <div className="flex justify-center py-4"><RefreshCw className="animate-spin text-slate-300" /></div>
                          ) : (
                              (parsedMatches || []).slice(0, 5).map((m, idx) => {
                                  const opponentTeam = teams[m.opponent] || { name: m.opponent, flag: '' };
                                  const oppName = lang.teamNames[m.opponent] || opponentTeam.name;
                                  
                                  return (
                                    <div key={idx} className="bg-white border border-slate-200 p-2.5 rounded-xl flex justify-between items-center text-xs shadow-sm hover:border-blue-200 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-4 rounded shadow-sm overflow-hidden bg-slate-100 border border-slate-100 relative">
                                                {opponentTeam.flag ? (
                                                    <img src={opponentTeam.flag} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-200"></div>
                                                )}
                                            </div>
                                            <span className="font-bold text-slate-700 uppercase tracking-tight truncate max-w-[120px]">
                                                {oppName.replace(/^vs\s+/i, '')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`font-mono font-black px-2 py-0.5 rounded text-[10px] ${m.result === 'W' ? 'bg-green-100 text-green-700' : m.result === 'L' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {m.score}
                                            </span>
                                            <span className="text-[9px] font-bold text-slate-400 w-8 text-right">{m.date.length === 4 ? m.date : '2024'}</span>
                                        </div>
                                    </div>
                                  );
                              })
                          )}
                          {(!parsedMatches || parsedMatches.length === 0) && !loadingHistory && (
                              <div className="text-center text-slate-400 text-xs italic py-4 bg-white/50 rounded-xl border border-dashed border-slate-200">
                                  No historical match data available.
                              </div>
                          )}
                      </div>
                  </div>

              </div>
              
              {/* MODAL FOOTER */}
              <div className="p-4 bg-white border-t border-slate-100 shrink-0 flex flex-col gap-2">
                  <button onClick={() => setSelectedTeam(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg">
                      {lang.closeReport}
                  </button>
                  {scoutingData?.created_at && (
                      <div className="text-[9px] text-slate-400 text-center uppercase tracking-widest font-bold opacity-60 flex items-center justify-center gap-1">
                          <Calendar size={10} /> Report Date: {new Date(scoutingData.created_at).toLocaleDateString()}
                      </div>
                  )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
