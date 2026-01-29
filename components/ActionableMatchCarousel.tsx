import React from 'react';
import { Match, Team, Prediction, UserProfile, Translation, TournamentPhase } from '../types';
import { MatchCard } from './MatchCard';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useSwipe } from '../hooks/useSwipe';

interface ActionableMatchCarouselProps {
  matches: Match[];
  teams: Record<string, Team>;
  allPredictions: Prediction[];
  currentUser: UserProfile | null;
  lang: Translation;
  onUpdate: (matchId: string, home: number, away: number) => void;
  onSubstitute?: (matchId: string) => void; // <--- ADDED PROP
  phase: TournamentPhase;
}

export const ActionableMatchCarousel: React.FC<ActionableMatchCarouselProps> = ({
  matches, teams, allPredictions, currentUser, lang, onUpdate, onSubstitute, phase
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Filter for active/actionable matches only
  const activeMatches = React.useMemo(() => {
      const now = Date.now();
      return matches.filter(m => {
          // 1. Match is LIVE
          if (['LIVE', 'HT', '1H', '2H', 'PEN', 'AET'].includes(m.status)) return true;
          
          // 2. Match is FINISHED but recent (within 24h) - Good for checking results
          if (['FINISHED', 'FT'].includes(m.status)) {
              const matchTime = new Date(m.date).getTime();
              return (now - matchTime) < (24 * 60 * 60 * 1000);
          }

          // 3. Match is UPCOMING and Locked (Potential for substitution)
          if (m.isLocked && m.status === 'UPCOMING') return true;

          return false;
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [matches]);

  const handleNext = () => {
      setCurrentIndex(prev => (prev + 1) % activeMatches.length);
  };

  const handlePrev = () => {
      setCurrentIndex(prev => (prev - 1 + activeMatches.length) % activeMatches.length);
  };

  const swipeHandlers = useSwipe({ onSwipeLeft: handleNext, onSwipeRight: handlePrev });

  if (activeMatches.length === 0) {
      return (
          <div className="bg-white/5 rounded-xl p-6 text-center border border-white/10 flex flex-col items-center gap-3">
              <div className="bg-white/10 p-3 rounded-full"><AlertCircle className="text-slate-400" /></div>
              <div className="text-slate-400 text-sm font-medium">{lang.noActiveMatches || "No active matches at the moment."}</div>
          </div>
      );
  }

  const currentMatch = activeMatches[currentIndex];
  const home = teams[currentMatch.homeTeamId];
  const away = teams[currentMatch.awayTeamId];

  // Calculate rival data specifically for this match
  // (In a real app, you might want to pass the full rivals list to the carousel, 
  // but for now we pass an empty array or filter from a global list if available)
  const relevantRivals: UserProfile[] = []; 

  return (
      <div className="relative group">
          <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-white/10" {...swipeHandlers}>
              <div className="relative">
                  <MatchCard 
                    key={currentMatch.id}
                    match={currentMatch}
                    homeTeam={home}
                    awayTeam={away}
                    onUpdate={onUpdate}
                    lang={lang}
                    locale="en-GB"
                    userTokens={currentUser?.tokens || 0}
                    rivals={relevantRivals}
                    onSpy={() => {}} // Spy feature not primary in carousel
                    revealedRivals={currentUser?.spiedMatches || []}
                    currentUser={currentUser}
                    allPredictions={allPredictions}
                    phase={phase}
                    isAdminMode={false}
                    
                    // --- THE FIX: PASSING SUBSTITUTION PROPS ---
                    onSubstitute={() => onSubstitute && onSubstitute(currentMatch.id)}
                    substitutionsLeft={currentUser?.substitutions || 0}
                    isUnlockedBySub={currentUser?.unlockedMatches?.includes(currentMatch.id) || false}
                    // ------------------------------------------

                    showStatusBadge={true}
                    context="carousel"
                  />
              </div>
          </div>

          {/* Navigation Buttons (Hidden on mobile, visible on hover desktop) */}
          {activeMatches.length > 1 && (
              <>
                  <button 
                    onClick={handlePrev}
                    className="absolute -left-4 top-1/2 -translate-y-1/2 bg-white text-slate-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10 hidden md:flex"
                  >
                      <ChevronLeft size={20} strokeWidth={3} />
                  </button>
                  <button 
                    onClick={handleNext}
                    className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white text-slate-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10 hidden md:flex"
                  >
                      <ChevronRight size={20} strokeWidth={3} />
                  </button>
                  
                  {/* Pagination Dots */}
                  <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-1.5">
                      {activeMatches.map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-yellow-400' : 'w-1.5 bg-slate-600'}`}
                          />
                      ))}
                  </div>
              </>
          )}
      </div>
  );
};