
import React, { useState, useEffect, useMemo } from 'react';
import { Team, Translation, MatchHistoryItem, ScoutingData } from '../types';
import { fetchTeamHistory, fetchScoutingOverview } from '../services/engine';
import { Search, X, TrendingUp, Activity, BookOpen, Crown, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

// Hardcoded visual rankings to ensure unique 1-104 ranks in grid view
const VISUAL_RANKINGS: Record<string, number> = {
  ARG: 1, FRA: 2, ESP: 3, ENG: 4, BRA: 5, BEL: 6, POR: 7, NED: 8, COL: 9, 
  URU: 11, CRO: 12, GER: 13, MAR: 14, SUI: 15, USA: 16, MEX: 17, JPN: 18, 
  SEN: 19, IRN: 20, KOR: 23, AUS: 24, AUT: 25, ECU: 27, QAT: 34, PAN: 35, 
  EGY: 36, CAN: 38, CIV: 38, ALG: 46, TUN: 47, CZE: 47, NOR: 47, SCO: 48, 
  PAR: 55, KSA: 56, GHA: 64, RSA: 59, COD: 60, UZB: 61, CPV: 65, ALB: 66, 
  JOR: 68, BIH: 75, BOL: 83, HAI: 86, CUW: 90, NZL: 94, KOS: 104
};

interface ScoutingCenterProps {
  teams: Record<string, Team>;
  lang: Translation;
}

export const ScoutingCenter: React.FC<ScoutingCenterProps> = ({ teams, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // Real History & Scouting Data State
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [scoutingData, setScoutingData] = useState<ScoutingData | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const teamList = (Object.values(teams) as Team[]).filter(t => !t.id.startsWith('TBD') && (lang.teamNames[t.id] || t.name).toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Sort by Real Rank if possible, else Rating
  const sortedTeams = teamList.sort((a, b) => {
      const rankA = VISUAL_RANKINGS[a.id] || 999;
      const rankB = VISUAL_RANKINGS[b.id] || 999;
      return rankA - rankB;
  });

  useEffect(() => {
      if (selectedTeam) {
          setLoadingHistory(true);
          setScoutingData(null); // Reset while loading
          
          // CRITICAL: Pass team ID ('ARG') not Name ('Argentina') to avoid fuzzy match errors
          Promise.all([
              fetchTeamHistory(selectedTeam.id),
              fetchScoutingOverview(selectedTeam.id)
          ]).then(([historyData, scoutData]) => {
              setHistory(historyData);
              setScoutingData(scoutData);
              setLoadingHistory(false);
              
              // Debug logging
              if (!scoutData) {
                  console.warn(`No scouting data returned for team: ${selectedTeam.id}`);
              } else {
                  console.log(`Scouting data loaded for ${selectedTeam.id}:`, {
                      team_name: scoutData.team_name,
                      fifa_rank: scoutData.fifa_rank,
                      has_notes: !!scoutData.scout_notes,
                      has_strengths: !!scoutData.strengths,
                      has_weaknesses: !!scoutData.weaknesses
                  });
              }
          }).catch((err) => {
              console.error('Error loading scouting data:', err);
              setLoadingHistory(false);
          });
      } else {
          setHistory([]);
          setScoutingData(null);
      }
  }, [selectedTeam]);

  // Parse custom string data from "last_5_matches" column
  // Expected format: "vs Peru (1-0), vs Paraguay (1-2)" or "Peru (1-0)"
  const parsedMatches = useMemo(() => {
      if (!scoutingData?.last_5_matches) return null;
      
      const rawMatches = scoutingData.last_5_matches.split(',').map(s => s.trim());
      const formArray = scoutingData.recent_form ? scoutingData.recent_form.split('-') : [];

      const parsed = rawMatches.map((str, idx) => {
          // Regex to extract Opponent and Score from "vs Name (Score)"
          // Handles: "vs Peru (1-0)", "Peru (1-0)", "Peru 1-0"
          const match = str.match(/(?:vs\s+)?(.*?)\s*\(?(\d+[-:]\d+)\)?/i);
          
          if (!match) return null;
          
          const opponent = match[1].trim();
          const score = match[2].trim();
          
          // Determine Result (W/D/L)
          let result: 'W'|'D'|'L' = 'D';
          
          // Priority 1: Use explicit recent_form string if available at this index
          if (formArray[idx]) {
              const char = formArray[idx].toUpperCase().trim();
              if (char === 'W') result = 'W';
              else if (char === 'L') result = 'L';
              else result = 'D';
          } else {
              // Priority 2: Infer from score (Assuming Left is Self)
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

      return parsed.length > 0 ? parsed : null;
  }, [scoutingData]);

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
            const rank = VISUAL_RANKINGS[team.id];
            
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
              <div className="relative h-32 bg-[#0f2545] shrink-0">
                  {/* Pattern Overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-5"></div>
                  
                  {/* Large Flag Card overlap */}
                  <div className="absolute -bottom-10 left-6 w-24 h-16 rounded-lg border-4 border-white shadow-lg overflow-hidden bg-white z-10 transform -rotate-2">
                      <img src={selectedTeam.flag} alt={selectedTeam.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Rank Badge Top Right */}
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                      <span className="text-white/60 text-[9px] font-black uppercase tracking-widest">FIFA Rank</span>
                      <div className="text-3xl font-black text-white italic tracking-tighter drop-shadow-md">
                          #{scoutingData?.fifa_rank || VISUAL_RANKINGS[selectedTeam.id] || '-'}
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
                              {lang.teamNames[selectedTeam.id] || selectedTeam.name}
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
                              {scoutingData?.star_player || selectedTeam.starPlayer}
                          </div>
                      </div>
                  </div>

                  {/* SECTION 2: Scout Notes (Main Text) */}
                  <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                          <BookOpen size={16} className="text-blue-500" />
                          <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">{lang.scoutReport}</h3>
                      </div>
                      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                          {loadingHistory ? (
                              <div className="flex items-center gap-2 text-slate-400 text-sm italic py-2">
                                  <RefreshCw size={14} className="animate-spin" /> Retrieving intelligence...
                              </div>
                          ) : (
                              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                  {scoutingData?.scout_notes || (
                                      <span className="text-slate-400 italic">No detailed scout report available in the database.</span>
                                  )}
                              </p>
                          )}
                      </div>
                  </div>

                  {/* SECTION 3: Strengths & Weaknesses (Grid) */}
                  {scoutingData && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                          {/* Strengths */}
                          <div className="bg-green-50/60 rounded-xl p-4 border border-green-100/50">
                              <h4 className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                  <TrendingUp size={14} /> Strengths
                              </h4>
                              <p className="text-xs font-bold text-slate-700 leading-snug">
                                  {scoutingData.strengths || "Data unavailable"}
                              </p>
                          </div>
                          {/* Weaknesses */}
                          <div className="bg-red-50/60 rounded-xl p-4 border border-red-100/50">
                              <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                  <AlertCircle size={14} /> Weaknesses
                              </h4>
                              <p className="text-xs font-bold text-slate-700 leading-snug">
                                  {scoutingData.weaknesses || "Data unavailable"}
                              </p>
                          </div>
                      </div>
                  )}

                  {/* SECTION 4: Recent Form & History */}
                  <div className="mb-2">
                      <div className="flex justify-between items-center mb-3">
                          <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                              <Activity size={16} className="text-slate-400" /> {lang.formGuide}
                          </h3>
                          {loadingHistory && <RefreshCw size={12} className="animate-spin text-slate-400" />}
                      </div>
                      
                      {/* Form Badges */}
                      <div className="flex gap-2 mb-4">
                          {(scoutingData?.recent_form ? scoutingData.recent_form.split('-') : selectedTeam.form).map((res, i) => {
                              const r = res.trim().toUpperCase();
                              const color = r === 'W' ? 'bg-green-500 shadow-green-200' : r === 'D' ? 'bg-slate-400 shadow-slate-200' : 'bg-red-500 shadow-red-200';
                              return (
                                  <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-md ${color} transform transition-transform hover:scale-110`}>
                                      {r}
                                  </div>
                              )
                          })}
                      </div>

                      {/* Match List */}
                      <div className="space-y-2">
                          {(parsedMatches || []).map((m, idx) => (
                              <div key={idx} className="bg-white border border-slate-200 p-2.5 rounded-xl flex justify-between items-center text-xs shadow-sm">
                                  <div className="flex items-center gap-2">
                                      <div className={`w-1.5 h-1.5 rounded-full ${m.result === 'W' ? 'bg-green-500' : m.result === 'L' ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                                      <span className="font-bold text-slate-600 uppercase tracking-wider">{m.opponent.replace(/^vs\s+/i, '')}</span>
                                  </div>
                                  <span className={`font-mono font-black px-2 py-0.5 rounded text-[10px] ${m.result === 'W' ? 'bg-green-100 text-green-700' : m.result === 'L' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                      {m.score}
                                  </span>
                              </div>
                          ))}
                          {(!parsedMatches || parsedMatches.length === 0) && !loadingHistory && (
                              <div className="text-center text-slate-400 text-xs italic py-4 bg-white/50 rounded-xl border border-dashed border-slate-200">
                                  No historical match data linked.
                              </div>
                          )}
                      </div>
                  </div>

              </div>
              
              {/* MODAL FOOTER */}
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
