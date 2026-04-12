
import React, { useState, useMemo } from 'react';
import { Translation, Match } from '../types';
import {
  Target, Wand2, Trophy, ShieldAlert, BookOpen, Calculator,
  Eye, RefreshCw, Zap, Medal, Crown, Star, ChevronDown, ChevronUp,
} from 'lucide-react';

interface RulesPageProps {
  lang: Translation;
  matches: Match[];
  currentLocale: string;
}

export const RulesPage: React.FC<RulesPageProps> = ({ lang, matches, currentLocale }) => {
  const [activeTab, setActiveTab] = useState<'play' | 'score'>('play');

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

  const rules = [
    { num: '1', color: 'blue',   icon: <Target size={18} />,   title: lang.rule1Title, desc: lang.rule1Desc },
    { num: '2', color: 'purple', icon: <Wand2 size={18} />,    title: lang.rule2Title, desc: lang.rule2Desc },
    { num: '3', color: 'indigo', icon: <Trophy size={18} />,   title: lang.rule3Title, desc: lang.rule3Desc },
  ];

  const rulesAfterDeadline = [
    { num: '4', color: 'cyan',    icon: <Eye size={18} />,      title: lang.rule4Title, desc: lang.rule4Desc },
    { num: '5', color: 'emerald', icon: <RefreshCw size={18} />, title: lang.rule5Title, desc: lang.rule5Desc },
    { num: '6', color: 'orange',  icon: <Zap size={18} />,      title: lang.rule6Title, desc: lang.rule6Desc },
  ];

  const colorMap: Record<string, string> = {
    blue:    'bg-blue-100 text-blue-700 border-blue-200',
    purple:  'bg-purple-100 text-purple-700 border-purple-200',
    indigo:  'bg-indigo-100 text-indigo-700 border-indigo-200',
    cyan:    'bg-cyan-100 text-cyan-700 border-cyan-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    orange:  'bg-orange-100 text-orange-700 border-orange-200',
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">

      {/* Hero Header */}
      <div className="bg-[#0f2545] rounded-2xl p-6 mb-6 relative overflow-hidden shadow-xl">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center gap-3">
          <div className="bg-yellow-400/10 border border-yellow-400/20 p-3 rounded-2xl">
            <BookOpen size={36} className="text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white">{lang.rulesTitle}</h1>
            <p className="text-slate-400 text-xs mt-1 font-medium">{lang.tabHowToPlay} · {lang.tabScoring}</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex mt-5 bg-black/30 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('play')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'play' ? 'bg-white text-[#0f2545] shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            {lang.tabHowToPlay}
          </button>
          <button
            onClick={() => setActiveTab('score')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'score' ? 'bg-white text-[#0f2545] shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            {lang.tabScoring}
          </button>
        </div>
      </div>

      {/* ── HOW TO PLAY ── */}
      {activeTab === 'play' && (
        <div className="space-y-4">

          {/* Rules 1–3 */}
          {rules.map(r => (
            <div key={r.num} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4 items-start">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${colorMap[r.color]}`}>
                {r.icon}
              </div>
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-wide mb-1 text-sm">{r.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}

          {/* Deadline callout */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-600 shrink-0" />
              <span className="font-black text-red-700 uppercase tracking-widest text-xs">{lang.deadlineTitle || 'The Deadline'}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {lang.deadlineBodyPre || 'Your entire board must be submitted before the tournament begins. All predictions lock permanently at'}{' '}
              {deadlineFormatted
                ? <span className="text-red-600 font-black">{deadlineFormatted}</span>
                : <span className="text-red-600 font-black">15 minutes before kick-off</span>
              }
              {lang.deadlineBodyPost || ', exactly 15 minutes before the opening kick-off.'}
            </p>
          </div>

          {/* Rules 4–6 */}
          {rulesAfterDeadline.map(r => (
            <div key={r.num} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-4 items-start">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${colorMap[r.color]}`}>
                {r.icon}
              </div>
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-wide mb-1 text-sm">{r.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SCORING ── */}
      {activeTab === 'score' && (
        <div className="space-y-4">

          {/* Group Stage */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Target size={14} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang.groupStagePoints}</span>
            </div>
            <div className="divide-y divide-slate-50">
              <div className="p-4 flex justify-between items-center">
                <div>
                  <span className="text-sm font-black text-slate-800 uppercase tracking-tight block">{lang.scoreExact}</span>
                  <span className="text-[10px] text-emerald-600 font-bold italic opacity-70">e.g. 2-1</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-600">5</span>
                  <span className="text-xs font-black text-emerald-600/60 ml-1">Pts</span>
                </div>
              </div>
              <div className="p-4 flex justify-between items-center">
                <div>
                  <span className="text-sm font-black text-slate-800 uppercase tracking-tight block">{lang.scoreResult}</span>
                  <span className="text-[10px] text-blue-600 font-bold italic opacity-70">e.g. 2-0 vs 1-0</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-blue-600">3</span>
                  <span className="text-xs font-black text-blue-600/60 ml-1">Pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Knockout Stage */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Trophy size={14} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang.scoreKnockoutTitle}</span>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                { label: lang.roundOf32,        pts: '8',  color: 'text-indigo-600'   },
                { label: lang.roundOf16,        pts: '12', color: 'text-indigo-600'   },
                { label: lang.quarterFinal,     pts: '16', color: 'text-purple-600'   },
                { label: lang.semiFinal,        pts: '24', color: 'text-purple-600'   },
                { label: lang.thirdPlacePlayoff,pts: '20', color: 'text-amber-600', icon: <Medal size={14} className="text-amber-500" /> },
              ].map(({ label, pts, color, icon }) => (
                <div key={label} className="px-4 py-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{label}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-black ${color}`}>{pts}</span>
                    <span className={`text-[10px] font-black ml-1 opacity-50 ${color}`}>Pts</span>
                  </div>
                </div>
              ))}

              {/* Champion — premium row */}
              <div className="px-4 py-4 flex justify-between items-center bg-gradient-to-r from-yellow-50 to-orange-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-yellow-400/5 pointer-events-none" />
                <div className="flex items-center gap-2 relative z-10">
                  <Crown size={16} className="text-yellow-500" />
                  <span className="text-sm font-black text-yellow-900 uppercase tracking-tight">{lang.champion}</span>
                </div>
                <div className="relative z-10 bg-white rounded-xl px-4 py-2 shadow-sm border border-yellow-100">
                  <span className="text-2xl font-black text-yellow-600">40</span>
                  <span className="text-xs font-black text-yellow-600/60 ml-1">Pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Special Conditions */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <ShieldAlert size={14} className="text-slate-400" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang.specialConditions}</span>
            </div>
            <div className="p-4 flex items-center gap-4">
              <div className="bg-slate-200 text-slate-700 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-inner border border-slate-300/60">
                -50%
              </div>
              <div>
                <div className="font-black text-slate-700 uppercase text-[10px] tracking-widest mb-1">{lang.scorePenalty}</div>
                <p className="text-xs text-slate-500 leading-relaxed">{lang.scoreKnockoutDesc}</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Bottom padding so content doesn't hide under mobile nav */}
      <div className="h-8" />
    </div>
  );
};
