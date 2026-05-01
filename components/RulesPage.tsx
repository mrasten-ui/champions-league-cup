
import React, { useMemo, useRef } from 'react';
import { Translation, Match, TournamentPhase } from '../types';
import {
  Target, Wand2, Trophy, ShieldAlert, Eye, RefreshCw,
  Unlock, Crown, Medal, BookOpen, TrendingUp,
} from 'lucide-react';

interface RulesPageProps {
  lang: Translation;
  matches: Match[];
  currentLocale: string;
  tournamentPhase: TournamentPhase;
  onAdminTrigger?: () => void;
}

const stripNum = (s: string) => s.replace(/^\d+\.\s*/, '');

// ─── Shared: full scoring breakdown ─────────────────────────────────────────
const ScoringSection: React.FC<{ lang: Translation }> = ({ lang }) => (
  <div id="rules-scoring-section" className="space-y-3">
    {/* Group stage — 2 big side-by-side cards */}
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center gap-0.5">
        <span className="text-5xl font-black text-emerald-600 leading-none">5</span>
        <span className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest">pts</span>
        <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tight text-center mt-2 leading-tight">{lang.scoreExact}</span>
        <span className="text-[9px] text-emerald-500 italic font-semibold opacity-80 mt-0.5">e.g. 2–1</span>
      </div>
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col items-center gap-0.5">
        <span className="text-5xl font-black text-blue-600 leading-none">3</span>
        <span className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">pts</span>
        <span className="text-[10px] font-black text-blue-900 uppercase tracking-tight text-center mt-2 leading-tight">{lang.scoreResult}</span>
        <span className="text-[9px] text-blue-500 italic font-semibold opacity-80 mt-0.5">e.g. 2–0 vs 1–0</span>
      </div>
    </div>

    {/* Knockout rounds — grid of chips */}
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <Trophy size={10} /> {lang.scoreKnockoutTitle}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: lang.roundOf32,         pts: 8,  cls: 'bg-indigo-50 border-indigo-100 text-indigo-700 text-indigo-900' },
          { label: lang.roundOf16,         pts: 12, cls: 'bg-indigo-50 border-indigo-100 text-indigo-700 text-indigo-900' },
          { label: lang.quarterFinal,      pts: 16, cls: 'bg-purple-50 border-purple-100 text-purple-700 text-purple-900' },
          { label: lang.semiFinal,         pts: 24, cls: 'bg-purple-50 border-purple-100 text-purple-700 text-purple-900' },
          { label: lang.thirdPlacePlayoff, pts: 20, cls: 'bg-amber-50 border-amber-100 text-amber-700 text-amber-900', icon: <Medal size={9} className="text-amber-500 mb-0.5" /> },
        ].map(({ label, pts, cls, icon }) => {
          const [bg, border, numCls, textCls] = cls.split(' ');
          return (
            <div key={label} className={`${bg} border ${border} rounded-xl p-2.5 flex flex-col items-center gap-0`}>
              {icon}
              <span className={`text-2xl font-black ${numCls} leading-none`}>{pts}</span>
              <span className="text-[7px] font-black opacity-40 uppercase tracking-wide">pts</span>
              <span className={`text-[8px] font-bold ${textCls} uppercase tracking-tight text-center leading-tight mt-1`}>{label}</span>
            </div>
          );
        })}
        {/* Champion — premium */}
        <div className="bg-gradient-to-b from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-2.5 flex flex-col items-center gap-0 relative overflow-hidden shadow-sm">
          <Crown size={9} className="text-yellow-500 mb-0.5" />
          <span className="text-2xl font-black text-yellow-600 leading-none">40</span>
          <span className="text-[7px] font-black text-yellow-600/40 uppercase tracking-wide">pts</span>
          <span className="text-[8px] font-black text-yellow-900 uppercase tracking-tight text-center leading-tight mt-1">{lang.champion}</span>
        </div>
      </div>
    </div>

    {/* Second Chance penalty */}
    <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="bg-slate-200 text-slate-600 w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 border border-slate-300/50">
        -50%
      </div>
      <div>
        <div className="font-black text-slate-700 uppercase text-[9px] tracking-widest mb-0.5">{lang.scorePenalty}</div>
        <p className="text-[10px] text-slate-500 leading-relaxed">{lang.scoreKnockoutDesc}</p>
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
    const lockTime = new Date(new Date(earliest.date).getTime() - 15 * 60 * 1000);
    return new Intl.DateTimeFormat(currentLocale, {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(lockTime);
  }, [matches, currentLocale]);

  const isLive = tournamentPhase === 'LIVE';

  const preRules = [
    { icon: <Target size={14} />,    cls: 'bg-blue-100 text-blue-700',      title: stripNum(lang.rule1Title), desc: lang.rule1Desc },
    { icon: <Wand2 size={14} />,     cls: 'bg-purple-100 text-purple-700',  title: stripNum(lang.rule2Title), desc: lang.rule2Desc },
    { icon: <Trophy size={14} />,    cls: 'bg-indigo-100 text-indigo-700',  title: stripNum(lang.rule3Title), desc: lang.rule3Desc },
    { icon: <Eye size={14} />,       cls: 'bg-cyan-100 text-cyan-700',      title: stripNum(lang.rule4Title), desc: lang.rule4Desc },
    { icon: <RefreshCw size={14} />, cls: 'bg-emerald-100 text-emerald-700', title: stripNum(lang.rule5Title), desc: lang.rule5Desc },
    { icon: <Unlock size={14} />,    cls: 'bg-orange-100 text-orange-700',  title: stripNum(lang.rule6Title), desc: lang.rule6Desc },
  ];

  const liveTools = [
    { icon: <RefreshCw size={14} />, iconCls: 'bg-emerald-100 text-emerald-700', title: stripNum(lang.rule5Title), desc: lang.rule5Desc },
    { icon: <Eye size={14} />,       iconCls: 'bg-cyan-100 text-cyan-700',       title: stripNum(lang.rule4Title), desc: lang.rule4Desc },
    { icon: <Unlock size={14} />,    iconCls: 'bg-orange-100 text-orange-700',   title: stripNum(lang.rule6Title), desc: lang.rule6Desc },
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
              <div key={title} className="bg-white border border-slate-100 rounded-xl px-3 py-3 flex items-start gap-3 shadow-sm">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cls}`}>
                  {icon}
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-tight mb-1">{title}</div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* DEADLINE */}
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <ShieldAlert size={13} className="text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-red-700 uppercase tracking-widest text-[9px] block mb-0.5">
                {lang.deadlineTitle || '🚨 The Deadline'}
              </span>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                {lang.deadlineBodyPre}{' '}
                <span className="text-red-600 font-black">
                  {deadlineFormatted || '15 minutes before kick-off'}
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
              <div key={title} className="bg-white border border-slate-100 rounded-xl px-3 py-3 flex items-start gap-3 shadow-sm">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${iconCls}`}>
                  {icon}
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-tight mb-1">{title}</div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ANALYSIS */}
          <SectionLabel icon={<TrendingUp size={10} />} label={lang.rulesLiveAnalysisTitle} className="mt-6 mb-3" />
          <div className="bg-[#0f2545] rounded-2xl px-4 py-4 flex gap-3 items-start shadow-lg">
            <div className="bg-emerald-400/15 border border-emerald-400/20 p-2 rounded-xl shrink-0">
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed pt-0.5">
              {lang.rulesLiveAnalysisDesc}
            </p>
          </div>
        </>
      )}

      <div className="h-8" />
    </div>
  );
};
