import React, { useMemo, useState } from 'react';
import { Translation, Match } from '../types';
import { outcomePointsForRound, exactPointsForRound } from '../services/engine';
import {
  Target, ShieldAlert, Trophy, Wand2, Users, RefreshCw, Bot,
  X, ChevronLeft, ChevronRight, Check,
} from 'lucide-react';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Translation;
  matches: Match[];
  currentLocale: string;
}

const stripNum = (s: string) => s.replace(/^\d+\.\s*/, '');

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({ isOpen, onClose, lang, matches, currentLocale }) => {
  const [step, setStep] = useState(0);

  const deadlineFormatted = useMemo(() => {
    const valid = matches.filter(m => m.date && m.date !== 'TBD');
    if (valid.length === 0) return null;
    const earliest = valid.reduce((a, b) => new Date(a.date) < new Date(b.date) ? a : b);
    return new Intl.DateTimeFormat(currentLocale, {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(earliest.date));
  }, [matches, currentLocale]);

  const steps = [
    {
      icon: <Target size={22} />, cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
      title: stripNum(lang.rule1Title), desc: lang.rule1Desc,
    },
    {
      icon: <ShieldAlert size={22} />, cls: 'bg-red-500/15 text-red-400 border-red-500/20',
      title: (lang.deadlineTitle || '').replace(/^\S+\s/, ''),
      desc: <>{lang.deadlineBodyPre} <span className="text-red-400 font-black">{deadlineFormatted || '—'}</span>{lang.deadlineBodyPost}</>,
    },
    {
      icon: <Trophy size={22} />, cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
      title: lang.tabScoring,
      desc: (
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex flex-col items-center">
            <span className="text-3xl font-black text-blue-400 leading-none">{outcomePointsForRound(undefined)}</span>
            <span className="text-[9px] font-bold text-blue-200 uppercase tracking-tight text-center mt-1.5 leading-tight">{lang.scoreResult}</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex flex-col items-center">
            <span className="text-3xl font-black text-emerald-400 leading-none">{exactPointsForRound(undefined)}</span>
            <span className="text-[9px] font-bold text-emerald-200 uppercase tracking-tight text-center mt-1.5 leading-tight">{lang.scoreExact}</span>
          </div>
        </div>
      ),
    },
    {
      icon: <Trophy size={22} />, cls: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
      title: stripNum(lang.rule3Title), desc: lang.rule3Desc,
    },
    {
      icon: <Bot size={22} />, cls: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
      title: lang.rulesLiveToolsSection || "You're Covered", desc: null, custom: true,
    },
  ];

  if (!isOpen) return null;

  const isLast = step === steps.length - 1;
  const isFirst = step === 0;
  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#0f2545] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-cyan-400' : 'w-1.5 bg-white/15'}`} />
            ))}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 min-h-[220px]">
          {!current.custom ? (
            <div key={step} className="animate-in fade-in duration-200">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border mb-3 ${current.cls}`}>
                {current.icon}
              </div>
              <div className="font-black text-white text-base uppercase tracking-tight leading-tight mb-2">{current.title}</div>
              <div className="text-[12px] text-slate-300 leading-relaxed">{current.desc}</div>
            </div>
          ) : (
            <div key={step} className="animate-in fade-in duration-200">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center border mb-3 bg-orange-500/15 text-orange-400 border-orange-500/20">
                <Bot size={22} />
              </div>
              <div className="font-black text-white text-base uppercase tracking-tight leading-tight mb-3">
                {lang.rulesLiveToolsSection || "You're Covered"}
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: <Wand2 size={13} />, cls: 'bg-purple-500/15 text-purple-400', title: stripNum(lang.rule2Title), desc: lang.rule2Desc },
                  { icon: <Users size={13} />, cls: 'bg-cyan-500/15 text-cyan-400', title: stripNum(lang.rule4Title), desc: lang.rule4Desc },
                  { icon: <RefreshCw size={13} />, cls: 'bg-emerald-500/15 text-emerald-400', title: stripNum(lang.rule5Title), desc: lang.rule5Desc },
                  { icon: <Bot size={13} />, cls: 'bg-orange-500/15 text-orange-400', title: stripNum(lang.rule6Title), desc: lang.rule6Desc },
                ].map(({ icon, cls, title, desc }) => (
                  <div key={title} className="flex items-start gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cls}`}>{icon}</div>
                    <div>
                      <div className="text-[10px] font-black text-white uppercase tracking-tight leading-tight mb-0.5">{title}</div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between gap-3">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={isFirst}
            className={`p-2.5 rounded-xl transition-colors ${isFirst ? 'opacity-0 pointer-events-none' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
          >
            <ChevronLeft size={18} />
          </button>
          {isLast ? (
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/40"
            >
              <Check size={16} /> {lang.gotIt || 'Got It'}
            </button>
          ) : (
            <button
              onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/40"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
