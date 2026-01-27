import React, { useMemo } from 'react';
import { Match, Team, Prediction, UserProfile, Translation } from '../types';
import { MatchCard } from './MatchCard';
import { AlertCircle } from 'lucide-react';

interface ActionableCarouselProps {
  matches: Match[];
  teams: Record<string, Team>;
  predictions: Prediction[];
  user: UserProfile;
  lang: Translation;
  onSubstitute: (matchId: string) => void;
  onUpdate: (matchId: string, h: number, a: number) => void;
}

export const ActionableMatchCarousel: React.FC<ActionableCarouselProps> = ({
  matches, teams, predictions, user, lang, onSubstitute, onUpdate
}) => {
  
  // Filter: Live Matches OR Upcoming (Next 48h)
  const actionableMatches = useMemo(() => {
      const now = new Date();
      const fortyEightHours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      
      return matches.filter(m => {
          const isLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'PEN'].includes(m.status);
          const isUpcomingSoon = m.status === 'UPCOMING' && m.date !== 'TBD' && new Date(m.date) <= fortyEightHours;
          // Also include any match unlocked by user that isn't finished
          const isUnlocked = user.unlockedMatches?.includes(m.id) && !['FT', 'FINISHED'].includes(m.status);
          
          return (isLive || isUpcomingSoon || isUnlocked) && m.homeTeamId !== 'TBD' && m.awayTeamId !== 'TBD';
      }).sort((a, b) => {
          // Live matches first
          const aLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'PEN'].includes(a.status);
          const bLive = ['LIVE', '1H', '2H', 'HT', 'ET', 'PEN'].includes(b.status);
          if (aLive && !bLive) return -1;
          if (!aLive && bLive) return 1;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
  }, [matches, user.unlockedMatches]);

  if (actionableMatches.length === 0) return null;

  return (
    <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">{lang.activeMatches || "The Dugout (Live & Upcoming)"}</h3>
        </div>
        
        {/* Horizontal Scroll Container */}
        <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory no-scrollbar">
            {actionableMatches.map(match => {
                const home = teams[match.homeTeamId];
                const away = teams[match.awayTeamId];
                if (!home || !away) return null;

                return (
                    <div key={match.id} className="min-w-[85vw] sm:min-w-[350px] snap-center">
                        <MatchCard 
                            match={match}
                            homeTeam={home}
                            awayTeam={away}
                            onUpdate={onUpdate}
                            lang={lang}
                            locale="en-GB"
                            userTokens={user.tokens}
                            rivals={[]}
                            onSpy={() => {}}
                            revealedRivals={[]}
                            currentUser={user}
                            allPredictions={predictions}
                            phase="LIVE" // Force live mode to show scores
                            isAdminMode={false}
                            onSubstitute={() => onSubstitute(match.id)}
                            substitutionsLeft={user.substitutions}
                            isUnlockedBySub={user.unlockedMatches?.includes(match.id)}
                            showStatusBadge={true}
                        />
                    </div>
                );
            })}
        </div>
    </div>
  );
};