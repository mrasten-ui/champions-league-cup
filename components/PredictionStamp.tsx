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
  isFinal?: boolean;
}

export const PredictionStamp: React.FC<PredictionStampProps> = ({
  match, homeTeam, awayTeam, prediction, onOpenSub, canSubstitute, userHasPenalty, lang, variant = 'standard', isFinal = false
}) => {
  const isFinished = ['FT', 'FINISHED', 'AET', 'PEN'].includes(match.status);
  const isLive = ['LIVE', '1H', '2H', 'HT', 'ET'].includes(match.status);
  const hasRealScore = match.homeScore !== null && match.awayScore !== null;

  // --- LOGIC ---
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

  const getTeamOpacity = (isHome: boolean) => {
      if (!prediction) return 'opacity-100'; 
      if (variant === 'standard') return 'opacity-100'; 

      const predHome = prediction.home;
      const predAway = prediction.away;
      
      if (isHome && predHome > predAway) return 'opacity-100 scale-110 grayscale-0 shadow-xl z-10';
      if (!isHome && predAway > predHome) return 'opacity-100 scale-110 grayscale-0 shadow-xl z-10';
      if (predHome === predAway) return 'opacity-100'; 

      return 'opacity-30 grayscale blur-[0.5px] scale-95'; 
  };

  // --- KNOCKOUT VARIANT (Flags Only, Bigger) ---
  if (variant === 'knockout') {
      const bgClass = isFinal ? 'bg-[#0f2545] border-[#1a3a6c] shadow-lg' : 'bg-white';
      const borderClass = isFinal ? '' : 'border-slate-100';
      const textClass = isFinal ? 'text-blue-200' : 'text-slate-300';

      return (
        <div 
            className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all h-32 w-full hover:shadow-md ${bgClass} ${borderClass}`}
        >
            {/* Final BG */}
            {isFinal && <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] rounded-xl"></div>}

            {/* Status Icon */}
            {isFinished && (
                <div className="absolute -top-2 -right-2 z-20 bg-white rounded-full p-0.5 shadow-sm border border-slate-100">
                    {isCorrectWinner ? (
                        <CheckCircle2 className="text-green-500 fill-green-100" size={20} />
                    ) : (
                        <XCircle className="text-slate-300 fill-slate-50" size={20} />
                    )}
                </div>
            )}

            <div className="flex items-center justify-center gap-6 relative z-10 w-full">
                {/* Home Flag - BIGGER */}
                <div className={`transition-all duration-300 rounded-lg overflow-hidden border-2 ${isFinal ? 'border-white/20' : 'border-slate-100'} ${getTeamOpacity(true)}`}>
                    <img src={homeTeam.flag} className="w-14 h-10 object-cover" alt={homeTeam.name} />
                </div>

                <span className={`text-xs font-black ${textClass}`}>VS</span>

                {/* Away Flag - BIGGER */}
                <div className={`transition-all duration-300 rounded-lg overflow-hidden border-2 ${isFinal ? 'border-white/20' : 'border-slate-100'} ${getTeamOpacity(false)}`}>
                    <img src={awayTeam.flag} className="w-14 h-10 object-cover" alt={awayTeam.name} />
                </div>
            </div>
        </div>
      );
  }

  // --- STANDARD VARIANT (Groups) ---
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