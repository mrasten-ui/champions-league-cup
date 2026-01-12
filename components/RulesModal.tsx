
import React, { useState } from 'react';
import { Translation } from '../types';
import { X, Trophy, Target, ShieldAlert, BookOpen, Calculator, CheckCircle2, Wand2, Medal, Crown, Unlock, Star } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Translation;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, lang }) => {
  const [activeTab, setActiveTab] = useState<'play' | 'score'>('play');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-[#0f2545] text-white p-6 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-2"
          >
            <X size={24} />
          </button>
          
          <div className="flex flex-col items-center">
             <div className="bg-white/10 p-3 rounded-full mb-3 backdrop-blur-sm">
                <BookOpen size={32} className="text-yellow-400" />
             </div>
             <h2 className="text-2xl font-black uppercase tracking-tighter">{lang.rulesTitle}</h2>
          </div>

          {/* Tabs */}
          <div className="flex mt-6 bg-black/20 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('play')}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'play' ? 'bg-white text-[#0f2545] shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              {lang.tabHowToPlay}
            </button>
            <button 
              onClick={() => setActiveTab('score')}
              className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'score' ? 'bg-white text-[#0f2545] shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              {lang.tabScoring}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
           {activeTab === 'play' ? (
             <div className="space-y-6">
                <div className="flex gap-4 items-start">
                   <div className="bg-blue-100 text-blue-700 w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 text-lg border border-blue-200">1</div>
                   <div>
                      <h3 className="font-black text-slate-800 uppercase tracking-wide mb-1">{lang.rule1Title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{lang.rule1Desc}</p>
                   </div>
                </div>
                <div className="flex gap-4 items-start">
                   <div className="bg-purple-100 text-purple-700 w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 text-lg border border-purple-200">2</div>
                   <div>
                      <h3 className="font-black text-slate-800 uppercase tracking-wide mb-1">{lang.rule2Title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{lang.rule2Desc}</p>
                   </div>
                </div>
                <div className="flex gap-4 items-start">
                   <div className="bg-red-100 text-red-700 w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 text-lg border border-red-200">3</div>
                   <div>
                      <h3 className="font-black text-slate-800 uppercase tracking-wide mb-1">{lang.rule3Title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{lang.rule3Desc}</p>
                   </div>
                </div>
                <div className="flex gap-4 items-start">
                   <div className="bg-yellow-100 text-yellow-700 w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 text-lg border border-yellow-200">
                      <Wand2 size={16} />
                   </div>
                   <div>
                      <h3 className="font-black text-slate-800 uppercase tracking-wide mb-1">{lang.rule4Title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{lang.rule4Desc}</p>
                   </div>
                </div>
                <div className="flex gap-4 items-start">
                   <div className="bg-orange-100 text-orange-700 w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 text-lg border border-orange-200">
                      <Unlock size={16} />
                   </div>
                   <div>
                      <h3 className="font-black text-slate-800 uppercase tracking-wide mb-1">{lang.rule5Title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{lang.rule5Desc}</p>
                   </div>
                </div>
             </div>
           ) : (
             <div className="space-y-4">
                
                {/* Section: Group Stage */}
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 mb-2 flex items-center gap-2">
                    <Target size={12} /> {lang.groupStagePoints}
                </div>

                <div className="grid grid-cols-1 gap-2">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex justify-between items-center group hover:border-emerald-200 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-emerald-900 uppercase tracking-tight">{lang.scoreExact}</span>
                            <span className="text-[9px] text-emerald-600 font-bold opacity-70 italic">e.g. 2-1</span>
                        </div>
                        <span className="text-sm font-black text-emerald-600 bg-white px-2 py-1 rounded shadow-sm">5 Pts</span>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex justify-between items-center group hover:border-blue-200 transition-colors">
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-blue-900 uppercase tracking-tight">{lang.scoreResult}</span>
                            <span className="text-[9px] text-blue-600 font-bold opacity-70 italic">e.g. 2-0 vs 1-0</span>
                        </div>
                        <span className="text-sm font-black text-blue-600 bg-white px-2 py-1 rounded shadow-sm">3 Pts</span>
                    </div>
                </div>

                {/* Section: Knockout Stage */}
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 mb-2 flex items-center gap-2">
                    <Trophy size={12} /> {lang.scoreKnockoutTitle}
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex justify-between items-center hover:border-indigo-200 transition-colors">
                        <span className="text-xs font-bold text-indigo-900 uppercase tracking-tight">Round of 32</span>
                        <span className="text-sm font-black text-indigo-600 bg-white px-2 py-1 rounded shadow-sm">8 Pts</span>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex justify-between items-center hover:border-indigo-200 transition-colors">
                        <span className="text-xs font-bold text-indigo-900 uppercase tracking-tight">Round of 16</span>
                        <span className="text-sm font-black text-indigo-600 bg-white px-2 py-1 rounded shadow-sm">12 Pts</span>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex justify-between items-center hover:border-purple-200 transition-colors">
                        <span className="text-xs font-bold text-purple-900 uppercase tracking-tight">Quarter Finals</span>
                        <span className="text-sm font-black text-purple-600 bg-white px-2 py-1 rounded shadow-sm">16 Pts</span>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 flex justify-between items-center hover:border-purple-200 transition-colors">
                        <span className="text-xs font-bold text-purple-900 uppercase tracking-tight">Semi Finals</span>
                        <span className="text-sm font-black text-purple-600 bg-white px-2 py-1 rounded shadow-sm">24 Pts</span>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-3 flex justify-between items-center relative overflow-hidden group shadow-sm">
                        <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-400/10 rounded-full blur-xl group-hover:bg-yellow-400/20 transition-all"></div>
                        <div className="flex items-center gap-2 relative z-10">
                            <Crown size={14} className="text-yellow-600" />
                            <span className="text-xs font-black text-yellow-900 uppercase tracking-tight">{lang.champion}</span>
                        </div>
                        <span className="text-xl font-black text-yellow-600 relative z-10 bg-white px-3 py-1 rounded-lg shadow-sm border border-yellow-100">40 Pts</span>
                    </div>
                </div>

                {/* Penalty / Special Info */}
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-6 mb-2 flex items-center gap-2">
                    <ShieldAlert size={12} /> {lang.specialConditions}
                </div>

                <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                   <div className="bg-slate-300 text-slate-800 w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-sm border border-slate-400/20">
                      -50%
                   </div>
                   <div>
                      <div className="font-black text-slate-700 uppercase text-[10px] tracking-widest mb-1">{lang.scorePenalty}</div>
                      <p className="text-[10px] text-slate-500 leading-tight font-medium">
                         {lang.scoreKnockoutDesc}
                      </p>
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-slate-100 shrink-0">
          <button
             onClick={onClose}
             className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
          >
             {lang.gotIt}
          </button>
        </div>
      </div>
    </div>
  );
};
