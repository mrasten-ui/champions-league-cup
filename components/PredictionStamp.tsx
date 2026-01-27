import React from 'react';
import { Match, Team, Prediction, Translation } from '../types';
import { RefreshCw, Lock } from 'lucide-react';
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
}

export const PredictionStamp: React.FC<PredictionStampProps> = ({
  match, homeTeam, awayTeam, prediction, onOpenSub, canSubstitute, userHasPenalty, lang
}) => {
  const isFinished = ['FT', 'FINISHED', 'AET', 'PEN'].includes(match.status);
  const isLive = ['LIVE', '1H', '2H', 'HT', 'ET'].includes(match.status);
  const hasRealScore = match.homeScore !== null && match.awayScore !== null;

  // Calculate Points for status color
  let points = 0;
  let statusColor = 'border-slate-200 bg-white hover:border-slate-300';
  
  if (hasRealScore && prediction) {
      points = calculatePoints(prediction.home, prediction.away, match.homeScore, match.awayScore, userHasPenalty, match.round);
      if (points > 0) statusColor = 'border-green-200 bg-green-50/30'; 
      else statusColor = 'border-red-200 bg-red-50/30'; 
  } else if (canSubstitute) {
      statusColor = 'border-blue-200 bg-blue-50/30 shadow-sm ring-1 ring-blue-100'; 
  }

  // --- WINNER/LOSER HIGHLIGHTING LOGIC ---
  const getTeamStyle = (isHome: boolean) => {
      if (!prediction) return 'opacity-100'; // No prediction, show both normal
      
      const predHome = prediction.home;
      const predAway = prediction.away;
      
      // If it's a draw, show both normal
      if (predHome === predAway) return 'opacity-100';

      const predictedWinnerIsHome = predHome > predAway;
      
      // If I am Home Team and Home won -> Normal
      if (isHome && predictedWinnerIsHome) return 'opacity-100 scale-105 transition-transform';
      // If I am Away Team and Away won -> Normal
      if (!isHome && !predictedWinnerIsHome) return 'opacity-100 scale-105 transition-transform';
      
      // Otherwise I am the loser -> Gray out
      return 'opacity-40 grayscale';
  };

  return (
    <div className={`relative flex flex-col items-center justify-between p-3 rounded-xl border-2 transition-all ${statusColor} h-32 w-full hover:shadow-md`}>
      
      {/* TOP: Real Score */}
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

      {/* CENTER: Prediction Display */}
      <div className="flex-1 flex flex-col items-center justify-center w-full gap-2">
          
          {/* Flags Container */}
          <div className="flex items-center gap-4 w-full justify-center">
              {/* Home Flag */}
              <div className={`transition-all duration-300 ${getTeamStyle(true)}`}>
                  <img src={homeTeam.flag} className="w-8 h-6 object-cover rounded shadow-sm border border-slate-100" alt={homeTeam.name} />
              </div>
              
              <span className="text-[10px] font-black text-slate-300">vs</span>
              
              {/* Away Flag */}
              <div className={`transition-all duration-300 ${getTeamStyle(false)}`}>
                  <img src={awayTeam.flag} className="w-8 h-6 object-cover rounded shadow-sm border border-slate-100" alt={awayTeam.name} />
              </div>
          </div>
          
          {/* Prediction Score */}
          <div className="text-3xl font-black text-slate-800 tracking-tight leading-none">
              {prediction ? (
                  `${prediction.home} - ${prediction.away}`
              ) : (
                  <span className="text-slate-200 text-xl">-</span>
              )}
          </div>
          
          {/* Points Badge */}
          {hasRealScore && (
              <div className={`text-[9px] font-black uppercase ${points > 0 ? 'text-green-600 bg-green-100 px-2 rounded-full' : 'text-red-400'}`}>
                  {points > 0 ? `+${points} pts` : 'Miss'}
              </div>
          )}
      </div>

      {/* BOTTOM: Action */}
      <div className="h-8 w-full flex items-end justify-center mt-1">
          {canSubstitute ? (
              <button 
                onClick={onOpenSub}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm hover:shadow-md"
              >
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