import React, { useMemo, useState } from 'react';
import { Translation, Match, Round } from '../types';
import { outcomePointsForRound, exactPointsForRound } from '../services/engine';
import { Logo } from './Logo';
import {
  Target, ShieldAlert, Trophy, Wand2, Users, RefreshCw, Bot, Shuffle,
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

const KNOCKOUT_ROUNDS: Round[] = ['PO', 'R16', 'QF', 'SF', 'FIN'];
const knockoutLabel = (lang: Translation, round: Round): string =>
  ({ PO: lang.playoffRound, R16: lang.roundOf16, QF: lang.quarterFinal, SF: lang.semiFinal, FIN: lang.final }[round]) || round;

// Same brand accent used next to headline titles elsewhere (e.g. the
// Predictor tab's "Round X" heading) — reused here so the tour visually
// matches the rest of the app instead of reading as a flat, all-blue sheet.
const TitleWithAccent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2.5 mb-2">
    <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-cyan-400 to-fuchsia-500 shadow-[0_0_8px_rgba(34,211,238,0.5)] shrink-0" />
    <div className="font-black text-white text-base uppercase tracking-tight leading-tight">{children}</div>
  </div>
);

const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="space-y-1.5">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2 text-[12px] text-slate-300 leading-snug">
        <span className="mt-1.5 w-1 h-1 rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-500 shrink-0" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

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
      title: stripNum(lang.rule1Title),
      body: <BulletList items={lang.tourRoundBullets ?? []} />,
    },
    {
      icon: <ShieldAlert size={22} />, cls: 'bg-red-500/15 text-red-400 border-red-500/20',
      title: (lang.deadlineTitle || '').replace(/^\S+\s/, ''),
      body: (
        <>
          <BulletList items={lang.tourDeadlineBullets ?? []} />
          {deadlineFormatted && (
            <div className="mt-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-[11px] font-black text-red-400 text-center">
              {deadlineFormatted}
            </div>
          )}
        </>
      ),
    },
    {
      icon: <Trophy size={22} />, cls: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
      title: lang.tabScoring,
      body: (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 flex flex-col items-center">
              <span className="text-2xl font-black text-blue-400 leading-none">{outcomePointsForRound(undefined)}</span>
              <span className="text-[8px] font-bold text-blue-200 uppercase tracking-tight text-center mt-1 leading-tight">{lang.scoreResult}</span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 flex flex-col items-center">
              <span className="text-2xl font-black text-emerald-400 leading-none">{exactPointsForRound(undefined)}</span>
              <span className="text-[8px] font-bold text-emerald-200 uppercase tracking-tight text-center mt-1 leading-tight">{lang.scoreExact}</span>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1 mt-2">
            {KNOCKOUT_ROUNDS.map(round => {
              const isFinal = round === 'FIN';
              return (
                <div key={round} className={`rounded-lg p-1.5 flex flex-col items-center border ${isFinal ? 'bg-gradient-to-b from-yellow-500/15 to-fuchsia-500/10 border-yellow-500/30' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                  <span className={`text-[11px] font-black leading-none ${isFinal ? 'text-yellow-400' : 'text-indigo-300'}`}>
                    {outcomePointsForRound(round)}<span className="text-[8px] opacity-50">/{exactPointsForRound(round)}</span>
                  </span>
                  <span className={`text-[6px] font-bold uppercase tracking-tight text-center leading-tight mt-0.5 ${isFinal ? 'text-yellow-200' : 'text-indigo-200'}`}>
                    {knockoutLabel(lang, round)}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 leading-snug mt-2">{lang.tourScoringCaption}</p>
        </>
      ),
    },
    {
      icon: <Shuffle size={22} />, cls: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20',
      title: stripNum(lang.rule3Title),
      body: <BulletList items={lang.tourDrawsBullets ?? []} />,
    },
    {
      icon: <Bot size={22} />, cls: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
      title: lang.rulesLiveToolsSection || "You're Covered", custom: true,
    },
  ];

  if (!isOpen) return null;

  const isLast = step === steps.length - 1;
  const isFirst = step === 0;
  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#0f2545] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

        {/* Brand strip */}
        <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo className="w-7 h-7 shrink-0" variant="theme" />
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-gradient-to-r from-cyan-400 to-fuchsia-500' : 'w-1.5 bg-white/15'}`} />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 min-h-[230px]">
          {!current.custom ? (
            <div key={step} className="animate-in fade-in duration-200">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border mb-3 ${current.cls}`}>
                {current.icon}
              </div>
              <TitleWithAccent>{current.title}</TitleWithAccent>
              {current.body}
            </div>
          ) : (
            <div key={step} className="animate-in fade-in duration-200">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center border mb-3 bg-orange-500/15 text-orange-400 border-orange-500/20">
                <Bot size={22} />
              </div>
              <TitleWithAccent>{lang.rulesLiveToolsSection || "You're Covered"}</TitleWithAccent>
              <div className="space-y-2.5">
                {[
                  { icon: <Wand2 size={13} />, cls: 'bg-purple-500/15 text-purple-400', title: stripNum(lang.rule2Title), desc: lang.tourToolWand },
                  { icon: <Users size={13} />, cls: 'bg-cyan-500/15 text-cyan-400', title: stripNum(lang.rule4Title), desc: lang.tourToolScout },
                  { icon: <RefreshCw size={13} />, cls: 'bg-emerald-500/15 text-emerald-400', title: stripNum(lang.rule5Title), desc: lang.tourToolLive },
                  { icon: <Bot size={13} />, cls: 'bg-orange-500/15 text-orange-400', title: stripNum(lang.rule6Title), desc: lang.tourToolSafety },
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
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/40"
            >
              <Check size={16} /> {lang.gotIt || 'Got It'}
            </button>
          ) : (
            <button
              onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 hover:from-cyan-400 hover:to-fuchsia-400 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-fuchsia-900/30"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
