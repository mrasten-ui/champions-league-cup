import React from 'react';
import { Match, Team, Prediction, UserProfile, Translation } from '../types';
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
                className="absolute -top-12 right-0 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-colors z-50"
            >
                <X size={24} />
            </button>

            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-[#0f2545] p-3 text-center border-b border-white/10">
                    <h3 className="text-white text-sm font-black uppercase tracking-widest">Tactical Substitution</h3>
                    <p className="text-blue-200 text-[10px] font-bold mt-0.5">Edit prediction • Costs 1 Sub</p>
                </div>
                
                {/* Added pb-12 to ensure floating Save button is visible */}
                <div className="p-2 pb-12">
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
                        
                        // We pass this just in case, but ManagerHub handles the unlock logic beforehand
                        onSubstitute={onSubstitute}
                        substitutionsLeft={currentUser.substitutions}
                        
                        // Modal only opens after unlock confirmation — always treat as unlocked
                        isUnlockedBySub={true}
                        showStatusBadge={false}
                        hideHeader={true}
                    />
                </div>
                
                <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-medium">
                        Adjust your score and click the <span className="font-bold text-green-600">SAVE</span> button to confirm.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};