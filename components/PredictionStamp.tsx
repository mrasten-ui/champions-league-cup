import React from 'react';
import { Match, Team, Prediction, Translation } from '../types';
import { RefreshCw, Lock, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
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
  let statusColor = 'border-slate-200 bg-white';
  
  if (hasRealScore && prediction) {
      points = calculatePoints(prediction.home, prediction.away, match.homeScore, match.awayScore, userHasPenalty, match.round);
      if (points > 0) statusColor = 'border-green-200 bg-green-50/30'; // Points earned
      else statusColor = 'border-red-200 bg-red-50/30'; // Miss
  } else if (canSubstitute) {
      statusColor = 'border-blue-200 bg-blue-50/30 shadow-sm'; // Actionable
  }

  return (
    <div className={`relative flex flex-col items-center justify-between p-2 rounded-xl border-2 transition-all ${statusColor} h-28 w-full`}>
      
      {/* TOP: Real Score (Small) */}
      <div className="h-6 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        {hasRealScore ? (
            <div className={`flex gap-1 ${isLive ? 'text-red-500 animate-pulse' : ''}`}>
               <span>{match.homeScore}</span>
               <span>-</span>
               <span>{match.awayScore}</span>
               {isLive && <span className="text-[8px] ml-1">LIVE</span>}
            </div>
        ) : (
            <span className="opacity-50 text-[9px]">{new Date(match.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
        )}
      </div>

      {/* CENTER: User Prediction (The Hero) */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="flex items-center gap-2 mb-1 w-full justify-center">
              <img src={homeTeam.flag} className="w-4 h-3 object-cover rounded shadow-sm" alt={homeTeam.name} />
              <span className="text-[10px] font-black text-slate-300">vs</span>
              <img src={awayTeam.flag} className="w-4 h-3 object-cover rounded shadow-sm" alt={awayTeam.name} />
          </div>
          
          <div className="text-2xl font-black text-slate-800 tracking-tight leading-none">
              {prediction ? (
                  `${prediction.home} - ${prediction.away}`
              ) : (
                  <span className="text-slate-200 text-lg">-</span>
              )}
          </div>
          
          {/* Points Badge (if finished) */}
          {hasRealScore && (
              <div className={`text-[9px] font-black uppercase mt-1 ${points > 0 ? 'text-green-600' : 'text-red-400'}`}>
                  {points > 0 ? `+${points} pts` : 'Miss'}
              </div>
          )}
      </div>

      {/* BOTTOM: Action Button (Sub) */}
      <div className="h-8 w-full flex items-end justify-center">
          {canSubstitute ? (
              <button 
                onClick={onOpenSub}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm hover:shadow-md"
              >
                  <RefreshCw size={10} /> {lang.makeSub || "SUB"}
              </button>
          ) : (
              <div className="text-slate-300">
                  {isFinished ? null : <Lock size={12} />}
              </div>
          )}
      </div>
    </div>
  );
};