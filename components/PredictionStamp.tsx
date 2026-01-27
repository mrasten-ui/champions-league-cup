import React from 'react';
import { Match, Team, Prediction, Translation } from '../types';
import { RefreshCw, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { calculatePoints } from '../services/engine';

interface PredictionStampProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  prediction?: Prediction;
  onOpenSub: () => void;
  canSubstitute: boolean;
  userHasPenalty: boolean;
  lang: Translation;
  variant?: 'standard' | 'knockout';
  isFinal?: boolean; // NEW PROP: Special styling for the Final
}

export const PredictionStamp: React.FC<PredictionStampProps> = ({
  match, homeTeam, awayTeam, prediction, onOpenSub, canSubstitute, userHasPenalty, lang, variant = 'standard', isFinal = false
}) => {
  const isFinished = ['FT', 'FINISHED', 'AET', 'PEN'].includes(match.status);
  const isLive = ['LIVE', '1H', '2H', 'HT', 'ET'].includes(match.status);
  const hasRealScore = match.homeScore !== null && match.awayScore !== null;

  // --- LOGIC: POINTS & WINNER ---
  let points = 0;
  let isCorrectWinner = false;

  if (prediction) {
      if (hasRealScore) {
          points = calculatePoints(prediction.home, prediction.away, match.homeScore, match.awayScore, userHasPenalty, match.round);
      }
      const predWinner = prediction.home > prediction.away ? 'home' : (prediction.away > prediction.home ? 'away' : 'draw');
      if (isFinished && hasRealScore) {
          const realWinner = match.homeScore! > match.awayScore! ? 'home' : (match.awayScore! > match.homeScore! ? 'away' : 'draw');
          if (predWinner === realWinner && predWinner !== 'draw') isCorrectWinner = true;
          if (points >= 10) isCorrectWinner = true; 
      }
  }

  // --- STYLE: PREDICTION HIGHLIGHT ---
  const getTeamOpacity = (isHome: boolean) => {
      if (!prediction) return 'opacity-100'; 
      if (variant === 'standard') return 'opacity-100'; 

      const predHome = prediction.home;
      const predAway = prediction.away;
      
      if (isHome && predHome > predAway) return 'opacity-100 scale-110 grayscale-0 shadow-lg z-10';
      if (!isHome && predAway > predHome) return 'opacity-100 scale-110 grayscale-0 shadow-lg z-10';
      if (predHome === predAway) return 'opacity-100'; // Keep both for draws

      return 'opacity-40 grayscale blur-[0.5px] scale-95'; // The Loser
  };

  // --- RENDER: KNOCKOUT VARIANT ---
  if (variant === 'knockout') {
      // Final Styling vs Normal Styling
      const bgClass = isFinal ? 'bg-[#0f2545] border-[#1a3a6c] shadow-lg' : 'bg-white';
      const borderClass = isFinal ? '' : (canSubstitute ? 'border-blue-100 hover:border-blue-400' : 'border-slate-100');
      const textClass = isFinal ? 'text-blue-200' : 'text-slate-300';
      const subBtnClass = isFinal 
          ? 'bg-amber-500 text-[#0f2545] hover:bg-amber-400 shadow-amber-500/20' 
          : 'bg-blue-600 text-white hover:bg-blue-500';

      return (
        <div 
            onClick={canSubstitute ? onOpenSub : undefined}
            className={`relative flex flex-col items-center justify-between p-3 rounded-xl border-2 transition-all h-32 w-full hover:shadow-md ${bgClass} ${borderClass} ${canSubstitute ? 'cursor-pointer' : ''}`}
        >
            {/* Final Decorative Background */}
            {isFinal && <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] rounded-xl"></div>}

            {/* Status Icon */}
            {isFinished && (
                <div className="absolute -top-2 -right-2 z-20 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
                    {isCorrectWinner ? (
                        <CheckCircle2 className="text-green-500 fill-green-100" size={18} />
                    ) : (
                        <XCircle className="text-slate-300 fill-slate-50" size={18} />
                    )}
                </div>
            )}

            {/* Content */}
            <div className="flex-1 flex items-center justify-center gap-4 relative z-10 w-full">
                {/* Home Flag */}
                <div className={`transition-all duration-300 rounded-lg overflow-hidden border ${isFinal ? 'border-white/10' : 'border-slate-100'} ${getTeamOpacity(true)}`}>
                    <img src={homeTeam.flag} className="w-12 h-9 object-cover" alt={homeTeam.name} />
                </div>

                <span className={`text-[10px] font-black ${textClass}`}>VS</span>

                {/* Away Flag */}
                <div className={`transition-all duration-300 rounded-lg overflow-hidden border ${isFinal ? 'border-white/10' : 'border-slate-100'} ${getTeamOpacity(false)}`}>
                    <img src={awayTeam.flag} className="w-12 h-9 object-cover" alt={awayTeam.name} />
                </div>
            </div>

            {/* Action Button */}
            <div className="h-8 w-full flex items-end justify-center mt-1 relative z-10">
                {canSubstitute ? (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onOpenSub(); }}
                        className={`w-full text-[9px] font-black uppercase tracking-widest py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm hover:shadow-md ${subBtnClass}`}
                    >
                        <RefreshCw size={10} /> {lang.makeSub || "SUB"}
                    </button>
                ) : (
                    <div className={`${isFinal ? 'text-white/30' : 'text-slate-300'} flex items-center gap-1 opacity-50`}>
                        {isFinished ? <span className="text-[9px] font-bold">FINAL</span> : <Lock size={12} />}
                    </div>
                )}
            </div>
        </div>
      );
  }

  // --- RENDER: STANDARD VARIANT (Groups) ---
  let standardStatusColor = 'border-slate-200 bg-white hover:border-slate-300';
  if (hasRealScore && prediction) {
      if (points > 0) standardStatusColor = 'border-green-200 bg-green-50/30'; 
      else standardStatusColor = 'border-red-200 bg-red-50/30'; 
  } else if (canSubstitute) {
      standardStatusColor = 'border-blue-200 bg-blue-50/30 shadow-sm ring-1 ring-blue-100'; 
  }

  return (
    <div className={`relative flex flex-col items-center justify-between p-3 rounded-xl border-2 transition-all ${standardStatusColor} h-32 w-full hover:shadow-md`}>
      
      <div className="h-6 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase tracking-wider w-full border-b border-slate-100/50 pb-1 mb-1">
        {hasRealScore ? (
            <div className={`flex gap-1 ${isLive ? 'text-red-500 animate-pulse' : ''}`}>
               <span>{match.homeScore}</span>
               <span>-</span>
               <span>{match.awayScore}</span>
               {isLive && <span className="text-[8px] ml-1 bg-red-100 text-red-600 px-1 rounded">LIVE</span>}
            </div>
        ) : (
            <span className="opacity-50 text-[9px]">{new Date(match.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full gap-2">
          <div className="flex items-center gap-3 w-full justify-center">
              <img src={homeTeam.flag} className="w-8 h-6 object-cover rounded shadow-sm border border-slate-100" alt={homeTeam.name} />
              <span className="text-[10px] font-black text-slate-300">vs</span>
              <img src={awayTeam.flag} className="w-8 h-6 object-cover rounded shadow-sm border border-slate-100" alt={awayTeam.name} />
          </div>
          <div className="text-3xl font-black text-slate-800 tracking-tight leading-none">
              {prediction ? `${prediction.home} - ${prediction.away}` : <span className="text-slate-200 text-xl">-</span>}
          </div>
          {hasRealScore && (
              <div className={`text-[9px] font-black uppercase ${points > 0 ? 'text-green-600 bg-green-100 px-2 rounded-full' : 'text-red-400'}`}>
                  {points > 0 ? `+${points} pts` : 'Miss'}
              </div>
          )}
      </div>

      <div className="h-8 w-full flex items-end justify-center mt-1">
          {canSubstitute ? (
              <button onClick={onOpenSub} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm hover:shadow-md">
                  <RefreshCw size={10} /> {lang.makeSub || "SUB"}
              </button>
          ) : (
              <div className="text-slate-300 flex items-center gap-1 opacity-50">
                  {isFinished ? <span className="text-[9px] font-bold">FINAL</span> : <Lock size={12} />}
              </div>
          )}
      </div>
    </div>
  );
};