
import React, { useMemo } from 'react';
import { Translation, Match, TournamentPhase } from '../types';
import {
  Target, Wand2, Trophy, ShieldAlert, Eye, RefreshCw, Zap,
  Unlock, Crown, Medal, BookOpen, TrendingUp, Star,
} from 'lucide-react';

interface RulesPageProps {
  lang: Translation;
  matches: Match[];
  currentLocale: string;
  tournamentPhase: TournamentPhase;
}

// ─── Shared scoring table ───────────────────────────────────────────────────
const PointsTable: React.FC<{ lang: Translation }> = ({ lang }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    {/* Group Stage */}
    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
      <Target size={12} className="text-slate-400" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang.groupStagePoints}</span>
    </div>
    <div className="divide-y divide-slate-50">
      <div className="px-4 py-3 flex justify-between items-center">
        <div>
          <span className="text-xs font-black text-slate-800 uppercase tracking-tight block">{lang.scoreExact}</span>
          <span className="text-[10px] text-emerald-500 font-bold italic">e.g. 2-1</span>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl font-black text-emerald-600">5</span>
          <span className="text-[10px] font-black text-emerald-600/50 uppercase">pts</span>
        </div>
      </div>
      <div className="px-4 py-3 flex justify-between items-center">
        <div>
          <span className="text-xs font-black text-slate-800 uppercase tracking-tight block">{lang.scoreResult}</span>
          <span className="text-[10px] text-blue-500 font-bold italic">e.g. 2-0 vs 1-0</span>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl font-black text-blue-600">3</span>
          <span className="text-[10px] font-black text-blue-600/50 uppercase">pts</span>
        </div>
      </div>
    </div>

    {/* Knockout */}
    <div className="px-4 py-2.5 bg-slate-50 border-y border-slate-100 flex items-center gap-2">
      <Trophy size={12} className="text-slate-400" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang.scoreKnockoutTitle}</span>
    </div>
    <div className="divide-y divide-slate-50">
      {[
        { label: lang.roundOf32,         pts: 8,  color: 'text-indigo-600'  },
        { label: lang.roundOf16,         pts: 12, color: 'text-indigo-600'  },
        { label: lang.quarterFinal,      pts: 16, color: 'text-purple-600'  },
        { label: lang.semiFinal,         pts: 24, color: 'text-purple-600'  },
        { label: lang.thirdPlacePlayoff, pts: 20, color: 'text-amber-600', icon: <Medal size={13} className="text-amber-500" /> },
      ].map(({ label, pts, color, icon }) => (
        <div key={label} className="px-4 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{label}</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className={`text-xl font-black ${color}`}>{pts}</span>
            <span className={`text-[10px] font-black opacity-40 uppercase ${color}`}>pts</span>
          </div>
        </div>
      ))}
      {/* Champion — premium row */}
      <div className="px-4 py-3 flex justify-between items-center bg-gradient-to-r from-yellow-50 to-orange-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-yellow-300/5 pointer-events-none" />
        <div className="flex items-center gap-2 relative z-10">
          <Crown size={15} className="text-yellow-500" />
          <span className="text-sm font-black text-yellow-900 uppercase tracking-tight">{lang.champion}</span>
        </div>
        <div className="relative z-10 flex items-baseline gap-1 bg-white rounded-xl px-3 py-1.5 shadow-sm border border-yellow-100">
          <span className="text-2xl font-black text-yellow-600">40</span>
          <span className="text-[10px] font-black text-yellow-600/50 uppercase">pts</span>
        </div>
      </div>
    </div>

    {/* Penalty */}
    <div className="px-4 py-2.5 bg-slate-50 border-y border-slate-100 flex items-center gap-2">
      <ShieldAlert size={12} className="text-slate-400" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang.specialConditions}</span>
    </div>
    <div className="px-4 py-4 flex items-center gap-4">
      <div className="bg-slate-200 text-slate-700 w-12 h-12 rounded-xl flex items-center justify-center font-black text-[11px] shrink-0 border border-slate-300/60">
        -50%
      </div>
      <div>
        <div className="font-black text-slate-700 uppercase text-[10px] tracking-widest mb-1">{lang.scorePenalty}</div>
        <p className="text-[11px] text-slate-500 leading-relaxed">{lang.scoreKnockoutDesc}</p>
      </div>
    </div>
  </div>
);

// ─── Section header ──────────────────────────────────────────────────────────
const SectionHeader: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2 mt-6 mb-3">
    <span className="text-slate-400">{icon}</span>
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
    <div className="flex-1 h-px bg-slate-200" />
  </div>
);

// ─── Rule card ───────────────────────────────────────────────────────────────
const RuleCard: React.FC<{
  icon: React.ReactNode;
  colorClass: string;
  title: string;
  desc: string;
}> = ({ icon, colorClass, title, desc }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-3 items-start">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${colorClass}`}>
      {icon}
    </div>
    <div>
      <h3 className="font-black text-slate-800 uppercase tracking-wide mb-1 text-xs">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────
export const RulesPage: React.FC<RulesPageProps> = ({ lang, matches, currentLocale, tournamentPhase }) => {

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

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#0f2545] rounded-2xl p-6 mb-2 relative overflow-hidden shadow-xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-blue-400/8 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center gap-2">
          <div className="bg-yellow-400/10 border border-yellow-400/20 p-3 rounded-2xl mb-1">
            {isLive
              ? <Trophy size={32} className="text-yellow-400" />
              : <BookOpen size={32} className="text-yellow-400" />
            }
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">
            {lang.rulesTitle}
          </h1>
          <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-xs">
            {isLive ? (lang as any).rulesLiveSubtitle : (lang as any).rulesPreSubtitle}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  PRE-LIVE VIEW                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {!isLive && (
        <>
          {/* How to Play */}
          <SectionHeader icon={<Target size={12} />} label={lang.tabHowToPlay} />
          <div className="space-y-3">
            <RuleCard icon={<Target size={16} />}   colorClass="bg-blue-100 text-blue-700 border-blue-200"    title={lang.rule1Title} desc={lang.rule1Desc} />
            <RuleCard icon={<Wand2 size={16} />}    colorClass="bg-purple-100 text-purple-700 border-purple-200"  title={lang.rule2Title} desc={lang.rule2Desc} />
            <RuleCard icon={<Trophy size={16} />}   colorClass="bg-indigo-100 text-indigo-700 border-indigo-200"  title={lang.rule3Title} desc={lang.rule3Desc} />
          </div>

          {/* Deadline */}
          <div className="mt-3 bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-red-600 shrink-0" />
              <span className="font-black text-red-700 uppercase tracking-widest text-[10px]">
                {lang.deadlineTitle || '🚨 The Deadline'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {lang.deadlineBodyPre || 'All predictions lock permanently at'}{' '}
              {deadlineFormatted
                ? <span className="text-red-600 font-black">{deadlineFormatted}</span>
                : <span className="text-red-600 font-black">15 minutes before kick-off</span>
              }
              {lang.deadlineBodyPost || '.'}
            </p>
          </div>

          <div className="mt-3 space-y-3">
            <RuleCard icon={<Eye size={16} />}        colorClass="bg-cyan-100 text-cyan-700 border-cyan-200"       title={lang.rule4Title} desc={lang.rule4Desc} />
            <RuleCard icon={<RefreshCw size={16} />}  colorClass="bg-emerald-100 text-emerald-700 border-emerald-200" title={lang.rule5Title} desc={lang.rule5Desc} />
            <RuleCard icon={<Unlock size={16} />}     colorClass="bg-orange-100 text-orange-700 border-orange-200"  title={lang.rule6Title} desc={lang.rule6Desc} />
          </div>

          {/* Points breakdown */}
          <SectionHeader icon={<Star size={12} />} label={lang.tabScoring} />
          <PointsTable lang={lang} />

          {/* "When live" teaser */}
          <div className="mt-6 bg-[#0f2545] rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 py-4 flex items-center gap-3 border-b border-white/10">
              <Zap size={14} className="text-yellow-400 shrink-0" />
              <span className="text-xs font-black text-white uppercase tracking-widest">
                {(lang as any).rulesWhatsComingTitle}
              </span>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {(lang as any).rulesWhatsComingDesc}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: <Trophy size={18} className="text-yellow-400" />, label: lang.leaderboard || 'Leaderboard' },
                  { icon: <RefreshCw size={18} className="text-cyan-400" />, label: lang.rule5Title?.replace(/^\d+\.\s*/, '') || 'Substitutions' },
                  { icon: <TrendingUp size={18} className="text-emerald-400" />, label: lang.analysisTab || 'Analysis' },
                ].map(({ icon, label }) => (
                  <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2 text-center">
                    {icon}
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-wide leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  LIVE VIEW                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isLive && (
        <>
          {/* Scoring right now */}
          <SectionHeader icon={<Star size={12} />} label={(lang as any).rulesLiveScoringSection} />
          <PointsTable lang={lang} />

          {/* Tools */}
          <SectionHeader icon={<RefreshCw size={12} />} label={(lang as any).rulesLiveToolsSection} />
          <div className="space-y-3">
            <RuleCard icon={<RefreshCw size={16} />} colorClass="bg-emerald-100 text-emerald-700 border-emerald-200" title={lang.rule5Title} desc={lang.rule5Desc} />
            <RuleCard icon={<Eye size={16} />}       colorClass="bg-cyan-100 text-cyan-700 border-cyan-200"           title={lang.rule4Title} desc={lang.rule4Desc} />
            <RuleCard icon={<Unlock size={16} />}    colorClass="bg-orange-100 text-orange-700 border-orange-200"     title={lang.rule6Title} desc={lang.rule6Desc} />
          </div>

          {/* Analysis */}
          <SectionHeader icon={<TrendingUp size={12} />} label={(lang as any).rulesLiveAnalysisTitle} />
          <div className="bg-[#0f2545] rounded-2xl p-5 flex gap-4 items-start shadow-lg">
            <div className="bg-emerald-400/15 border border-emerald-400/20 p-2.5 rounded-xl shrink-0">
              <TrendingUp size={22} className="text-emerald-400" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
              {(lang as any).rulesLiveAnalysisDesc}
            </p>
          </div>
        </>
      )}

      {/* Bottom breathing room for mobile nav */}
      <div className="h-8" />
    </div>
  );
};
