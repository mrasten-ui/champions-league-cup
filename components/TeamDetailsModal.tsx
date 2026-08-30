import React, { useState, useEffect } from 'react';
import { Team, Translation, MatchHistoryItem, ScoutingData, LanguageCode, TeamFormData } from '../types';
import { fetchTeamHistory, fetchScoutingOverview, fetchTeamExtendedStats } from '../services/engine';
import { getScoutingReport } from '../scoutingData';
import { supabase } from '../supabase';
import { X, TrendingUp, TrendingDown, Activity, Crown, RefreshCw, AlertCircle, Minus } from 'lucide-react';

// Helper to clean quotes
const cleanText = (text?: string) => text ? text.replace(/^"|"$/g, '').trim() : '';

// Helper to render text points
const renderPoints = (text?: string) => {
    if (!text) return <span className="italic opacity-60">Data unavailable</span>;

    let points: string[] = [];

    // Handle JSON array format: ["point1", "point2"]
    if (text.trim().startsWith('[')) {
        try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) {
                points = parsed.map((p: string) => p.replace(/^•\s*/, '').trim()).filter(p => p.length > 0);
            }
        } catch { /* fall through to bullet split */ }
    }

    // Handle bullet-separated format
    if (points.length === 0) {
        points = text.split('•').map(p => p.trim()).filter(p => p.length > 0);
    }

    if (points.length === 0) return <span>{text}</span>;
    return (
        <ul className="list-none space-y-2 mt-2">
            {points.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed font-medium text-slate-700">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0 opacity-40" />
                    <span>{p}</span>
                </li>
            ))}
        </ul>
    );
};

interface TeamDetailsModalProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
  lang: Translation;
  currentLang: LanguageCode;
}

export const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({ team, isOpen, onClose, lang, currentLang }) => {
  const [history, setHistory] = useState<MatchHistoryItem[]>([]);
  const [scoutingData, setScoutingData] = useState<ScoutingData | null>(null);
  const [extendedStats, setExtendedStats] = useState<TeamFormData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && team) {
      setLoading(true);
      const loadData = async () => {
        const personaMap: Record<LanguageCode, string> = {
            EN: 'neutral',
            SCO: 'scottish_pundit',
        };
        const persona = personaMap[currentLang] ?? 'neutral';

        const [dbHistory, dbScouting, dbExtended, contentResult] = await Promise.all([
            fetchTeamHistory(team.id),
            fetchScoutingOverview(team.id, currentLang),
            fetchTeamExtendedStats(team.id),
            supabase
                ? supabase.from('team_content').select('*').eq('team_id', team.id.toLowerCase()).eq('language_code', currentLang).eq('voice_persona', persona).maybeSingle()
                : Promise.resolve({ data: null }),
        ]);

        if (dbExtended) {
            setExtendedStats(dbExtended);
            setHistory(dbExtended.history);
        } else {
            setHistory(dbHistory);
        }

        const contentData = contentResult.data;

        if (contentData || dbScouting) {
            setScoutingData({
                id: dbScouting?.id ?? 0,
                team_id: team.id,
                team_name: dbScouting?.team_name || team.name,
                confederation: dbScouting?.confederation || 'FIFA',
                fifa_rank: dbScouting?.fifa_rank || team.rank || 99,
                star_player: contentData?.star_player || dbScouting?.star_player || team.starPlayer || '',
                strengths: contentData?.strengths || dbScouting?.strengths || '',
                weaknesses: contentData?.weaknesses || dbScouting?.weaknesses || '',
                scout_notes: contentData?.overview || dbScouting?.scout_notes || '',
                recent_form: dbScouting?.recent_form || '',
                last_5_matches: dbScouting?.last_5_matches || '',
                lang: currentLang,
            });
        } else {
            const localReport = getScoutingReport(team.id, currentLang);
            if (localReport) {
                setScoutingData({
                    id: 0,
                    team_id: team.id,
                    team_name: team.name,
                    confederation: localReport.confederation || 'FIFA',
                    fifa_rank: localReport.fifa_rank || team.rank || 99,
                    star_player: localReport.star_player || '',
                    strengths: localReport.strengths || '',
                    weaknesses: localReport.weaknesses || '',
                    scout_notes: localReport.scout_notes || '',
                    recent_form: localReport.recent_form || '',
                    last_5_matches: localReport.last_5_matches || '',
                    lang: currentLang,
                });
            }
        }
        setLoading(false);
      };
      loadData();
    }
  }, [isOpen, team, currentLang]);

  if (!isOpen || !team) return null;

  // Determine which matches to display
  const parsedMatches = extendedStats ? extendedStats.history : history;

  // Calculate Trend
  const trend = (() => {
      if (!parsedMatches || parsedMatches.length === 0) return { label: 'Unknown', color: 'text-slate-400', icon: Minus, bg: 'bg-slate-100' };
      let points = 0;
      parsedMatches.slice(0, 5).forEach(m => {
          if (m.result === 'W') points += 3;
          else if (m.result === 'D') points += 1;
      });
      if (points >= 10) return { label: lang.trendUp || 'Heating Up', color: 'text-green-500', bg: 'bg-green-100', icon: TrendingUp };
      if (points >= 7) return { label: lang.trendUp || 'Heating Up', color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp };
      if (points >= 4) return { label: lang.trendFlat || 'Inconsistent', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Minus };
      return { label: lang.trendDown || 'Cooling Off', color: 'text-red-500', bg: 'bg-red-50', icon: TrendingDown };
  })();

  const displayRank = extendedStats?.fifaRank || scoutingData?.fifa_rank || team.rank || '-';
  const displayName = scoutingData?.team_name || team.name;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>
        
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            {/* HEADER */}
            <div className="relative h-32 bg-[#0f2545] shrink-0">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-5"></div>
                <div className="absolute -bottom-8 left-6 w-24 h-16 rounded-lg border-4 border-white shadow-lg overflow-hidden bg-white z-10 transform -rotate-2">
                    <img src={team.flag} alt={displayName} className="w-full h-full object-cover" />
                </div>
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                    <span className="text-white/60 text-[9px] font-black uppercase tracking-widest">{lang.fifaRank}</span>
                    <div className="text-3xl font-black text-white italic tracking-tighter drop-shadow-md">#{displayRank}</div>
                </div>
                <button onClick={onClose} className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors backdrop-blur-sm">
                    <X size={20} />
                </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto pt-10 px-6 pb-6 bg-slate-50">
                <div className="mb-6">
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none mb-1">{displayName}</h2>
                    <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-sm">{team.id}</span>
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
                        <div className="text-xl font-black text-slate-900 leading-none">
                            {cleanText(scoutingData?.star_player) || team.starPlayer}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                {scoutingData && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="bg-green-50/60 rounded-xl p-4 border border-green-100/50">
                            <h4 className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <TrendingUp size={14} /> {lang.strengthsLabel}
                            </h4>
                            {renderPoints(cleanText(scoutingData.strengths))}
                        </div>
                        <div className="bg-red-50/60 rounded-xl p-4 border border-red-100/50">
                            <h4 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <AlertCircle size={14} /> {lang.weaknessesLabel}
                            </h4>
                            {renderPoints(cleanText(scoutingData.weaknesses))}
                        </div>
                    </div>
                )}

                {/* Form */}
                <div className="mb-2">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={16} className="text-slate-400" /> {lang.formGuide}
                        </h3>
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${trend.bg}`}>
                            <trend.icon size={12} className={trend.color} />
                            <span className={`text-[10px] font-black uppercase tracking-wide ${trend.color}`}>{trend.label}</span>
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-4"><RefreshCw className="animate-spin text-slate-300" /></div>
                    ) : (
                        <div className="flex gap-2 mb-4 overflow-x-auto">
                            {parsedMatches.slice(0, 5).map((m, i) => {
                                const color = m.result === 'W' ? 'bg-green-500 shadow-green-200' : m.result === 'D' ? 'bg-slate-400 shadow-slate-200' : 'bg-red-500 shadow-red-200';
                                return (
                                    <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-md ${color} shrink-0`}>
                                        {m.result}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                <button onClick={onClose} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg">
                    {lang.closeReport}
                </button>
            </div>
        </div>
    </div>
  );
};