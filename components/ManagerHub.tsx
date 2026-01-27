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
  phase: TournamentPhase;
}

export const ManagerHub: React.FC<ManagerHubProps> = ({
  matches, teams, allPredictions, currentUser, lang, 
  onSubstitute, onUnlockSecondChance, onUpdate, phase
}) => {
  const userPredictions = allPredictions.filter(p => p.userId === currentUser.email);
  
  // Note: Actual total points usually come from the Leaderboard calculation in App.tsx
  // For display here, we can either calculate it or accept it as a prop.
  // Assuming 0 for now or calculating locally if needed.
  const totalPoints = 0; 

  return (
    <div className="pb-24 animate-fade-in space-y-8">
      
      {/* 1. CENTRAL PROFILE HEADER */}
      <ResourceHeader 
        user={currentUser} 
        lang={lang} 
        phase={phase}
        rank={99} // Pass actual rank if available
        totalPoints={totalPoints} // Pass actual points if available
      />

      {/* 2. STRATEGY (Second Chance) */}
      <SecondChancePromo 
        hasTaken={currentUser.hasTakenSecondChance}
        onUnlock={onUnlockSecondChance}
        lang={lang}
      />

      {/* 3. ACTIVE MATCHES (The "Touchline" for Subs) */}
      <ActionableMatchCarousel 
        matches={matches}
        teams={teams}
        predictions={userPredictions}
        user={currentUser}
        lang={lang}
        onSubstitute={onSubstitute}
        onUpdate={onUpdate}
      />

      {/* 4. THE VAULT (Prediction History) */}
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