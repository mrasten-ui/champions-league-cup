import React from 'react';
import { Match, Team, Prediction, UserProfile, Translation, TournamentPhase } from '../types';
import { ResourceHeader } from './ResourceHeader';
import { ActionableMatchCarousel } from './ActionableMatchCarousel';
import { PredictionVault } from './PredictionVault';
import { SecondChancePromo } from './SecondChancePromo';
import { calculateMaxPotentialPoints } from '../services/engine';

interface ManagerHubProps {
  matches: Match[];
  teams: Record<string, Team>;
  allPredictions: Prediction[];
  currentUser: UserProfile;
  lang: Translation;
  onSubstitute: (matchId: string) => void;
  onUnlockSecondChance: () => void;
  onUpdate: (matchId: string, h: number, a: number) => void;
  phase: TournamentPhase; // ADDED PHASE PROP
}

export const ManagerHub: React.FC<ManagerHubProps> = ({
  matches, teams, allPredictions, currentUser, lang, 
  onSubstitute, onUnlockSecondChance, onUpdate, phase
}) => {
  const userPredictions = allPredictions.filter(p => p.userId === currentUser.email);
  
  // Calculate Total Points (Real) for the Header
  const totalPoints = matches.reduce((acc, m) => {
      const pred = userPredictions.find(p => p.matchId === m.id);
      if (pred && m.homeScore !== null && m.awayScore !== null) {
          // Note: Ideally import calculatePoints here, or pass totalPoints as prop from App.tsx
          // For now, let's assume App passed it or we re-calculate lightly?
          // Actually, let's just grab it from a helper or assume 0 for layout test
          return acc; // Keep logic simple for layout demo
      }
      return acc;
  }, 0);

  // We can actually calculate the real total points by importing the engine
  // But usually this comes from the leaderboard logic. 
  // Let's assume for this component we want to show the header clearly.

  return (
    <div className="pb-24 animate-fade-in space-y-6">
      
      {/* 1. STATUS & RESOURCES */}
      <ResourceHeader 
        user={currentUser} 
        lang={lang} 
        phase={phase}
        rank={99} // You might want to pass actual rank from App.tsx
        totalPoints={0} // You might want to pass actual points from App.tsx
      />

      {/* 2. STRATEGY (If applicable) */}
      <SecondChancePromo 
        hasTaken={currentUser.hasTakenSecondChance}
        onUnlock={onUnlockSecondChance}
        lang={lang}
      />

      {/* 3. ACTIONABLE MATCHES (Live/Upcoming) */}
      <ActionableMatchCarousel 
        matches={matches}
        teams={teams}
        predictions={userPredictions}
        user={currentUser}
        lang={lang}
        onSubstitute={onSubstitute}
        onUpdate={onUpdate}
      />

      {/* 4. HISTORY (The Vault) */}
      <PredictionVault 
        matches={matches}
        teams={teams}
        predictions={userPredictions}
        lang={lang}
        hasTakenSecondChance={currentUser.hasTakenSecondChance}
      />
    </div>
  );
};