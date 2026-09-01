import React, { useMemo, useState } from 'react';
import { Translation, Match, Round } from '../types';
import { outcomePointsForRound, exactPointsForRound } from '../services/engine';
import { Logo } from './Logo';
import {
  Target, ShieldAlert, Trophy, Users, RefreshCw, Bot, Shuffle,
  X, ChevronLeft, ChevronRight, Check, LucideIcon,
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

// Each step owns one accent colour that threads through everything inside
// it (icon, underline, bullet markers, ambient glow, watermark) so a step
// reads as one coherent scene instead of icon-says-red / rule-says-blue.
// The cyan->fuchsia brand gradient is reserved for persistent chrome (the
// progress bar, the CTA buttons) — the constant thread pulling you through
// a sequence of differently-coloured scenes.
type ThemeColor = 'blue' | 'red' | 'amber' | 'fuchsia' | 'orange';
const THEME: Record<ThemeColor, { chip: string; ring: string; text: string; dot: string; rule: string; glow: string }> = {
  blue:    { chip: 'bg-blue-500/15 border-blue-500/25',    ring: 'bg-blue-400/30',    text: 'text-blue-400',    dot: 'bg-blue-400',    rule: 'from-blue-400/70',    glow: 'bg-blue-500/10' },
  red:     { chip: 'bg-red-500/15 border-red-500/25',      ring: 'bg-red-400/30',     text: 'text-red-400',     dot: 'bg-red-400',     rule: 'from-red-400/70',     glow: 'bg-red-500/10' },
  amber:   { chip: 'bg-amber-500/15 border-amber-500/25',  ring: 'bg-amber-400/30',   text: 'text-amber-400',   dot: 'bg-amber-400',   rule: 'from-amber-400/70',   glow: 'bg-amber-500/10' },
  fuchsia: { chip: 'bg-fuchsia-500/15 border-fuchsia-500/25', ring: 'bg-fuchsia-400/30', text: 'text-fuchsia-400', dot: 'bg-fuchsia-400', rule: 'from-fuchsia-400/70', glow: 'bg-fuchsia-500/10' },
  orange:  { chip: 'bg-orange-500/15 border-orange-500/25', ring: 'bg-orange-400/30',  text: 'text-orange-400',  dot: 'bg-orange-400',  rule: 'from-orange-400/70',  glow: 'bg-orange-500/10' },
};

const BulletList: React.FC<{ items: string[]; color: ThemeColor }> = ({ items, color }) => (
  <ul className="space-y-1.5">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2.5 text-[12.5px] text-slate-300 leading-snug">
        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${THEME[color].dot}`} />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

// Icon + title inline, a fading colour rule underneath, an ambient glow in
// the corner, and (optionally) a huge, near-invisible watermark of the same
// icon — the last one exists purely to give short-bullet steps somewhere
// for the eye to land instead of empty navy, without adding more copy.
const StepScene: React.FC<{ Icon: LucideIcon; color: ThemeColor; title: React.ReactNode; watermark?: boolean; children: React.ReactNode }> = ({ Icon, color, title, watermark = true, children }) => {
  const t = THEME[color];
  return (
    <div className="relative min-h-[236px] overflow-hidden">
      <div className={`absolute -top-10 -right-10 w-44 h-44 rounded-full blur-3xl pointer-events-none ${t.glow}`} />
      {watermark && (
        <Icon size={168} strokeWidth={1} className={`absolute -bottom-8 -right-6 opacity-[0.05] pointer-events-none ${t.text}`} />
      )}
      <div className="relative">
        <div className="flex items-center gap-3 mb-2.5">
          <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${t.chip}`}>
            <div className={`absolute inset-0 rounded-2xl blur-md opacity-70 ${t.ring}`} />
            <Icon size={22} className={`relative ${t.text}`} />
          </div>
          <div className="font-black text-white text-[17px] italic uppercase tracking-tight leading-tight">{title}</div>
        </div>
        <div className={`h-px bg-gradient-to-r ${t.rule} to-transparent w-full mb-3.5`} />
        {children}
      </div>
    </div>
  );
};

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

  const steps: { render: () => React.ReactNode }[] = [
    {
      render: () => (
        <StepScene Icon={Target} color="blue" title={stripNum(lang.rule1Title)}>
          <BulletList color="blue" items={lang.tourRoundBullets ?? []} />
        </StepScene>
      ),
    },
    {
      render: () => (
        <StepScene Icon={ShieldAlert} color="red" title={(lang.deadlineTitle || '').replace(/^\S+\s/, '')}>
          <BulletList color="red" items={lang.tourDeadlineBullets ?? []} />
          {deadlineFormatted && (
            <div className="mt-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-[11px] font-black text-red-400 text-center">
              {deadlineFormatted}
            </div>
          )}
        </StepScene>
      ),
    },
    {
      render: () => (
        <StepScene Icon={Trophy} color="amber" title={lang.tabScoring} watermark={false}>
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
          <p className="text-[10px] text-slate-400 leading-snug mt-2.5">{lang.tourScoringCaption}</p>
        </StepScene>
      ),
    },
    {
      render: () => (
        <StepScene Icon={Shuffle} color="fuchsia" title={stripNum(lang.rule3Title)}>
          <BulletList color="fuchsia" items={lang.tourDrawsBullets ?? []} />
        </StepScene>
      ),
    },
    {
      render: () => (
        <StepScene Icon={Bot} color="orange" title={lang.rulesLiveToolsSection || "You're Covered"} watermark={false}>
          <div className="space-y-2.5">
            {[
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
        </StepScene>
      ),
    },
  ];

  if (!isOpen) return null;

  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#0f2545] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

        {/* Brand header — big logo up top as the anchor, progress bar underneath it */}
        <div className="relative pt-5 px-5 pb-3.5">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors z-10">
            <X size={14} />
          </button>
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-cyan-400/30 blur-xl" />
              <Logo className="w-16 h-16 relative" variant="theme" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{lang.quickGuideBtn || 'Quick Guide'}</span>
          </div>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all duration-300"
                  style={{ width: i <= step ? '100%' : '0%' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-5 pb-5 pt-2.5">
          <div key={step} className="animate-in fade-in duration-200">
            {steps[step].render()}
          </div>
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
