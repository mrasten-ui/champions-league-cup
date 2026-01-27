import React, { useState } from 'react';
import { Match, Team, Prediction, UserProfile, Translation } from '../types';
import { ResourceHeader } from './ResourceHeader';
import { ActionableMatchCarousel } from './ActionableMatchCarousel';
import { PredictionVault } from './PredictionVault';
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
}

export const ManagerHub: React.FC<ManagerHubProps> = ({
  matches, teams, allPredictions, currentUser, lang, 
  onSubstitute, onUnlockSecondChance, onUpdate
}) => {
  // Filter predictions for current user
  const userPredictions = allPredictions.filter(p => p.userId === currentUser.email);
  
  // Calculate a "Live Rank" or "Potential" if you have that data, otherwise strictly resources
  const maxPoints = calculateMaxPotentialPoints(matches, userPredictions, currentUser);

  return (
    <div className="pb-24 animate-fade-in space-y-8">
      {/* ZONE 1: THE LOCKER ROOM (Resources) */}
      <ResourceHeader 
        user={currentUser} 
        lang={lang} 
        potentialPoints={maxPoints}
        onSecondChance={onUnlockSecondChance}
      />

      {/* ZONE 2: THE TOUCHLINE (Actionable Matches) */}
      <ActionableMatchCarousel 
        matches={matches}
        teams={teams}
        predictions={userPredictions}
        user={currentUser}
        lang={lang}
        onSubstitute={onSubstitute}
        onUpdate={onUpdate}
      />

      {/* ZONE 3: THE VAULT (History) */}
      <PredictionVault 
        matches={matches}
        teams={teams}
        predictions={userPredictions}
        user={currentUser}
        lang={lang}
      />
    </div>
  );
};