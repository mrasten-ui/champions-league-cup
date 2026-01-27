import React from 'react';
import { Match, Team, Prediction, UserProfile, Translation, TournamentPhase } from '../types';
import { MatchCard } from './MatchCard';
import { X } from 'lucide-react';

interface SubstitutionModalProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  currentUser: UserProfile;
  allPredictions: Prediction[];
  lang: Translation;
  onClose: () => void;
  onUpdate: (matchId: string, h: number, a: number) => void;
  onSubstitute: () => void;
}

export const SubstitutionModal: React.FC<SubstitutionModalProps> = ({
  match, homeTeam, awayTeam, currentUser, allPredictions, lang, onClose, onUpdate, onSubstitute
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
        ></div>

        {/* Modal Content */}
        <div className="relative w-full max-w-md bg-transparent animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-colors"
            >
                <X size={24} />
            </button>

            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-[#0f2545] p-3 text-center border-b border-white/10">
                    <h3 className="text-white text-sm font-black uppercase tracking-widest">Tactical Substitution</h3>
                    <p className="text-blue-200 text-[10px] font-bold mt-0.5">Edit prediction • Costs 1 Sub</p>
                </div>
                
                <div className="p-2">
                    <MatchCard 
                        match={match}
                        homeTeam={homeTeam}
                        awayTeam={awayTeam}
                        onUpdate={onUpdate}
                        lang={lang}
                        locale="en-GB"
                        userTokens={currentUser.tokens}
                        rivals={[]}
                        onSpy={()=>{}}
                        revealedRivals={[]}
                        currentUser={currentUser}
                        allPredictions={allPredictions}
                        phase="LIVE" // Force live phase so inputs are active
                        isAdminMode={false}
                        
                        // CRITICAL: We pass the sub handler here
                        onSubstitute={() => {
                            onSubstitute();
                            // Optional: Close modal after sub? Or let user close.
                            // keeping open allows them to edit immediately.
                        }}
                        substitutionsLeft={currentUser.substitutions}
                        
                        // Force unlock UI if they have unlocked it, or show locked state
                        isUnlockedBySub={currentUser.unlockedMatches?.includes(match.id)}
                        showStatusBadge={false}
                    />
                </div>
                
                <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-medium">
                        Changes are auto-saved. Click Save inside the card to confirm.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};