
import React, { useMemo, useRef } from 'react';
import { Translation, Match, TournamentPhase, Round } from '../types';
import { outcomePointsForRound, exactPointsForRound } from '../services/engine';
import {
  Target, Wand2, Trophy, ShieldAlert, Eye, RefreshCw,
  Unlock, Crown, BookOpen, TrendingUp, Bot,
} from 'lucide-react';

interface RulesPageProps {
  lang: Translation;
  matches: Match[];
  currentLocale: string;
  tournamentPhase: TournamentPhase;
  onAdminTrigger?: () => void;
}

const stripNum = (s: string) => s.replace(/^\d+\.\s*/, '');

const KNOCKOUT_ROUNDS: Round[] = ['PO', 'R16', 'QF', 'SF', 'FIN'];
const knockoutLabel = (lang: Translation, round: Round): string =>
  ({ PO: lang.playoffRound, R16: lang.roundOf16, QF: lang.quarterFinal, SF: lang.semiFinal, FIN: lang.final }[round]) || round;

// ─── Shared: full scoring breakdown ─────────────────────────────────────────
const ScoringSection: React.FC<{ lang: Translation }> = ({ lang }) => (
  <div id="rules-scoring-section" className="space-y-3">
    {/* League Phase — 2 big side-by-side cards */}
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex flex-col items-center gap-0.5">
        <span className="text-5xl font-black text-blue-400 leading-none">{outcomePointsForRound(undefined)}</span>
        <span className="text-[9px] font-black text-blue-400/60 uppercase tracking-widest">pts</span>
        <span className="text-[10px] font-black text-blue-200 uppercase tracking-tight text-center mt-2 leading-tight">{lang.scoreResult}</span>
        <span className="text-[9px] text-blue-400 italic font-semibold opacity-80 mt-0.5">e.g. 2–0 vs 1–0</span>
      </div>
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center gap-0.5">
        <span className="text-5xl font-black text-emerald-400 leading-none">{exactPointsForRound(undefined)}</span>
        <span className="text-[9px] font-black text-emerald-400/60 uppercase tracking-widest">pts</span>
        <span className="text-[10px] font-black text-emerald-200 uppercase tracking-tight text-center mt-2 leading-tight">{lang.scoreExact}</span>
        <span className="text-[9px] text-emerald-400 italic font-semibold opacity-80 mt-0.5">e.g. 2–1</span>
      </div>
    </div>

    {/* Knockout rounds — points rise every round */}
    <div className="bg-blue-950/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-sm">
      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
        <Trophy size={10} /> {lang.scoreKnockoutTitle}
      </div>
      <p className="text-[9px] text-slate-500 leading-relaxed mb-3">{lang.scoreKnockoutDesc}</p>
      <div className="grid grid-cols-5 gap-1.5">
        {KNOCKOUT_ROUNDS.map(round => {
          const isFinal = round === 'FIN';
          return (
            <div key={round} className={`rounded-xl p-2 flex flex-col items-center gap-0 border ${isFinal ? 'bg-gradient-to-b from-yellow-500/15 to-orange-500/10 border-yellow-500/30' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
              {isFinal && <Crown size={9} className="text-yellow-400 mb-0.5" />}
              <span className={`text-base font-black leading-none ${isFinal ? 'text-yellow-400' : 'text-indigo-300'}`}>
                {outcomePointsForRound(round)}<span className="text-[10px] opacity-50">/{exactPointsForRound(round)}</span>
              </span>
              <span className="text-[6px] font-black opacity-40 uppercase tracking-wide mt-0.5">pts</span>
              <span className={`text-[8px] font-bold uppercase tracking-tight text-center leading-tight mt-1 ${isFinal ? 'text-yellow-200' : 'text-indigo-200'}`}>
                {knockoutLabel(lang, round)}
              </span>
            </div>
          );
        })}
      </div>
    </div>

    {/* Penalty shootout bonus/malus */}
    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="bg-fuchsia-500/15 text-fuchsia-400 w-10 h-10 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 border border-fuchsia-500/20">
        +4/-1
      </div>
      <div>
        <div className="font-black text-slate-300 uppercase text-[9px] tracking-widest mb-0.5">{lang.scorePensBonusTitle}</div>
        <p className="text-[10px] text-slate-400 leading-relaxed">{lang.scorePensBonusDesc}</p>
      </div>
    </div>

    {/* Scouting cost */}
    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="bg-amber-500/15 text-amber-400 w-10 h-10 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 border border-amber-500/20">
        -1
      </div>
      <div>
        <div className="font-black text-slate-300 uppercase text-[9px] tracking-widest mb-0.5">{lang.scoreScoutTitle}</div>
        <p className="text-[10px] text-slate-400 leading-relaxed">{lang.scoreScoutDesc}</p>
      </div>
    </div>
  </div>
);

// ─── Shared: small section label ────────────────────────────────────────────
const SectionLabel: React.FC<{ icon: React.ReactNode; label: string; className?: string }> = ({ icon, label, className = '' }) => (
  <div className={`text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 ${className}`}>
    {icon}{label}
  </div>
);

// ─── Main ────────────────────────────────────────────────────────────────────
export const RulesPage: React.FC<RulesPageProps> = ({ lang, matches, currentLocale, tournamentPhase, onAdminTrigger }) => {
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleIconTap = () => {
    tapCountRef.current += 1;
    console.log('[admin] tap', tapCountRef.current);
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      console.log('[admin] triggering modal');
      onAdminTrigger?.();
    } else {
      tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 3000);
    }
  };

  const deadlineFormatted = useMemo(() => {
    const valid = matches.filter(m => m.date && m.date !== 'TBD');
    if (valid.length === 0) return null;
    const earliest = valid.reduce((a, b) => new Date(a.date) < new Date(b.date) ? a : b);
    const lockTime = new Date(earliest.date);
    return new Intl.DateTimeFormat(currentLocale, {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(lockTime);
  }, [matches, currentLocale]);

  const isLive = tournamentPhase === 'LIVE';

  const preRules = [
    { icon: <Target size={14} />,    cls: 'bg-blue-500/15 text-blue-400',      title: stripNum(lang.rule1Title), desc: lang.rule1Desc },
    { icon: <Wand2 size={14} />,     cls: 'bg-purple-500/15 text-purple-400',  title: stripNum(lang.rule2Title), desc: lang.rule2Desc },
    { icon: <Trophy size={14} />,    cls: 'bg-indigo-500/15 text-indigo-400',  title: stripNum(lang.rule3Title), desc: lang.rule3Desc },
    { icon: <Eye size={14} />,       cls: 'bg-cyan-500/15 text-cyan-400',      title: stripNum(lang.rule4Title), desc: lang.rule4Desc },
    { icon: <RefreshCw size={14} />, cls: 'bg-emerald-500/15 text-emerald-400', title: stripNum(lang.rule5Title), desc: lang.rule5Desc },
    { icon: <Bot size={14} />,       cls: 'bg-orange-500/15 text-orange-400',  title: stripNum(lang.rule6Title), desc: lang.rule6Desc },
  ];

  const liveTools = [
    { icon: <RefreshCw size={14} />, iconCls: 'bg-emerald-500/15 text-emerald-400', title: stripNum(lang.rule5Title), desc: lang.rule5Desc },
    { icon: <Bot size={14} />,       iconCls: 'bg-orange-500/15 text-orange-400',   title: stripNum(lang.rule6Title), desc: lang.rule6Desc },
  ];

  return (
    <div className="animate-fade-in">

      {/* ── HERO ── */}
      <div className="bg-[#0f2545] rounded-2xl px-5 py-4 mb-5 relative overflow-hidden shadow-xl">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-yellow-400/8 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-yellow-400/10 border border-yellow-400/20 p-3 rounded-xl shrink-0 cursor-default select-none" onClick={handleIconTap}>
            {isLive
              ? <Trophy size={26} className="text-yellow-400" />
              : <BookOpen size={26} className="text-yellow-400" />
            }
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter text-white leading-none mb-1">
              {lang.rulesTitle}
            </h1>
            <p className="text-slate-400 text-[11px] font-medium leading-snug">
              {isLive ? lang.rulesLiveSubtitle : lang.rulesPreSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* ════════════════════════ PRE-LIVE ════════════════════════ */}
      {!isLive && (
        <>
          {/* SCORING — first and prominent */}
          <SectionLabel icon={<Trophy size={10} />} label={lang.tabScoring} className="mb-3" />
          <ScoringSection lang={lang} />

          {/* RULES — compact icon grid */}
          <SectionLabel icon={<Target size={10} />} label={lang.tabHowToPlay} className="mt-6 mb-3" />
          <div id="rules-howtoplay-section" className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {preRules.map(({ icon, cls, title, desc }) => (
              <div key={title} className="bg-blue-950/40 backdrop-blur-md border border-white/10 rounded-xl px-3 py-3 flex items-start gap-3 shadow-sm">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cls}`}>
                  {icon}
                </div>
                <div>
                  <div className="text-[10px] font-black text-white uppercase tracking-tight leading-tight mb-1">{title}</div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* DEADLINE */}
          <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-3">
            <ShieldAlert size={13} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-red-400 uppercase tracking-widest text-[9px] block mb-0.5">
                {lang.deadlineTitle || '🚨 The Deadline'}
              </span>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {lang.deadlineBodyPre}{' '}
                <span className="text-red-400 font-black">
                  {deadlineFormatted || 'At opening kick-off'}
                </span>
                {lang.deadlineBodyPost}
              </p>
            </div>
          </div>

        </>
      )}

      {/* ════════════════════════ LIVE ════════════════════════════ */}
      {isLive && (
        <>
          {/* SCORING */}
          <SectionLabel icon={<Trophy size={10} />} label={lang.rulesLiveScoringSection} className="mb-3" />
          <ScoringSection lang={lang} />

          {/* TOOLS */}
          <SectionLabel icon={<RefreshCw size={10} />} label={lang.rulesLiveToolsSection} className="mt-6 mb-3" />
          <div id="rules-tools-section" className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {liveTools.map(({ icon, iconCls, title, desc }) => (
              <div key={title} className="bg-blue-950/40 backdrop-blur-md border border-white/10 rounded-xl px-3 py-3 flex items-start gap-3 shadow-sm">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${iconCls}`}>
                  {icon}
                </div>
                <div>
                  <div className="text-[10px] font-black text-white uppercase tracking-tight leading-tight mb-1">{title}</div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* TABLES */}
          <SectionLabel icon={<TrendingUp size={10} />} label={lang.rulesLiveTableTitle} className="mt-6 mb-3" />
          <div className="bg-[#0f2545] rounded-2xl px-4 py-4 flex gap-3 items-start shadow-lg">
            <div className="bg-emerald-400/15 border border-emerald-400/20 p-2 rounded-xl shrink-0">
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed pt-0.5">
              {lang.rulesLiveTableDesc}
            </p>
          </div>
        </>
      )}

      <div className="h-8" />
    </div>
  );
};
