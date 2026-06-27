import React from 'react';
import { createPortal } from 'react-dom';
import { Clock, RefreshCw } from 'lucide-react';
import { LanguageCode } from '../types';

export type SCReminderType = 'group' | 'knockout';

interface R32Tracker {
    matched: number;
    wrong: number;
    pending: number;
    total: number;
    groupsLeft: number;
}

interface SecondChanceReminderModalProps {
    isOpen: boolean;
    type: SCReminderType;
    pickedTeams: number;
    r32Tracker?: R32Tracker | null;
    onDismiss: (goToManager: boolean) => void;
    langCode: LanguageCode;
}

const assetLang: Record<LanguageCode, string> = { EN: 'en', NO: 'no', SCO: 'sc', US: 'us' };

const COPY: Record<SCReminderType, Record<LanguageCode, {
    badge: string; host: string; pundit: string;
    what: string;         // one-sentence explanation of what Second Chance does
    cta: string; later: string;
    teamsLabel: string;   // "knockout teams predicted"
}>> = {
    group: {
        EN: {
            badge: 'SECOND CHANCE CLOSING ⏰',
            host: 'The group stage is nearly over!',
            pundit: "Don't miss your window — once the last group game ends, it's too late.",
            what: "Second Chance lets you redo your entire knockout bracket once the real 32 qualifiers are known. Your group stage picks stay the same.",
            cta: 'Go to Manager & Activate →',
            later: 'Remind me later',
            teamsLabel: 'knockout teams predicted so far',
        },
        NO: {
            badge: 'ANDRE SJANSE STENGER ⏰',
            host: 'Gruppefasen er nesten ferdig!',
            pundit: 'Ikke gå glipp av vinduet — når siste gruppekamp er over, er det for sent.',
            what: 'Andre sjanse lar deg gjøre om hele knockout-bracketen din når de 32 kvalifiserte lagene er kjent.',
            cta: 'Gå til Manager og aktiver →',
            later: 'Påminn meg senere',
            teamsLabel: 'knockout-lag forutsett så langt',
        },
        SCO: {
            badge: 'SECOND CHANCE CLOSIN ⏰',
            host: "Group stage is nearly done, pal!",
            pundit: "Dinnae miss yer window — once the last group game's done, it's ower.",
            what: "Second Chance lets ye redo yer entire knockout bracket once the real 32 qualifiers are known. Yer group picks stay the same.",
            cta: 'Go tae Manager & Activate →',
            later: 'Remind me later',
            teamsLabel: 'knockout teams predicted so far',
        },
        US: {
            badge: 'SECOND CHANCE CLOSING ⏰',
            host: 'Group stage is almost done!',
            pundit: "Don't miss your window — once the last group game is over, it's too late.",
            what: "Second Chance lets you redo your entire knockout bracket once the real 32 qualifiers are known. Your group picks stay the same.",
            cta: 'Go to Manager & Activate →',
            later: 'Remind me later',
            teamsLabel: 'knockout teams predicted so far',
        },
    },
    knockout: {
        EN: {
            badge: 'LAST CHANCE ⚠️',
            host: 'Knockouts are almost here!',
            pundit: "Once Round of 32 kicks off, your Second Chance is gone for good.",
            what: "Second Chance lets you redo your entire knockout bracket with the real 32 qualifiers. Activate it now and make your picks before the first game.",
            cta: 'Go to Manager & Activate →',
            later: "I'll skip it",
            teamsLabel: 'knockout teams predicted so far',
        },
        NO: {
            badge: 'SISTE SJANSE ⚠️',
            host: 'Knockout-fasen starter snart!',
            pundit: 'Når åttendelsfinalen starter, er din andre sjanse borte for alltid.',
            what: 'Andre sjanse lar deg gjøre om hele knockout-bracketen din med de 32 ekte kvalifiserte lagene. Aktiver nå.',
            cta: 'Gå til Manager og aktiver →',
            later: 'Jeg hopper over',
            teamsLabel: 'knockout-lag forutsett så langt',
        },
        SCO: {
            badge: 'LAST CHANCE ⚠️',
            host: 'Knockouts are almost on us!',
            pundit: "Once the first knockout game kicks aff, yer Second Chance is deid and buried.",
            what: "Second Chance lets ye redo yer entire knockout bracket wi' the real 32 qualifiers. Get on it before the first game.",
            cta: 'Go tae Manager & Activate →',
            later: "I'll skip it",
            teamsLabel: 'knockout teams predicted so far',
        },
        US: {
            badge: 'LAST CHANCE ⚠️',
            host: "Knockouts are right around the corner!",
            pundit: "Once Round of 32 kicks off, your Second Chance is gone forever.",
            what: "Second Chance lets you redo your entire knockout bracket with the real 32 qualifiers. Activate it now and lock in your picks.",
            cta: 'Go to Manager & Activate →',
            later: "I'll skip it",
            teamsLabel: 'knockout teams predicted so far',
        },
    },
};

export const SecondChanceReminderModal: React.FC<SecondChanceReminderModalProps> = ({
    isOpen, type, pickedTeams, r32Tracker, onDismiss, langCode,
}) => {
    if (!isOpen) return null;

    const lang = assetLang[langCode] ?? 'en';
    const copy = COPY[type][langCode] ?? COPY[type].EN;
    const teamUrl = `/pundit/team-${lang}.png`;
    const isUrgent = type === 'knockout';
    const accentColor = isUrgent ? 'red' : 'amber';
    const pct = Math.round((pickedTeams / 32) * 100);

    return createPortal(
        <div className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" onClick={() => onDismiss(false)} />

            <div className="relative w-full max-w-lg mx-0 sm:mx-4 sm:mb-0 animate-in slide-in-from-bottom-4 duration-400">
                <div className={`w-full bg-[#0f172a] border-t-4 shadow-[0_-20px_60px_rgba(0,0,0,0.9)] sm:rounded-2xl sm:border-4 overflow-hidden ${isUrgent ? 'border-red-500' : 'border-amber-400'}`}>

                    {/* Pundit + headline */}
                    <div className="relative flex items-end min-h-[120px] sm:min-h-[140px]">
                        <img
                            src={teamUrl}
                            onError={e => { e.currentTarget.src = '/pundit/team-en.png'; }}
                            alt="Studio Team"
                            className="absolute bottom-0 left-0 w-[100px] sm:w-[130px] h-auto object-contain object-bottom drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] pointer-events-none"
                        />
                        <div className="flex-1 pl-[108px] sm:pl-[140px] pr-4 pt-4 pb-4 flex flex-col gap-2">
                            <span className={`inline-flex items-center gap-1.5 self-start text-[9px] font-black uppercase tracking-widest border rounded px-1.5 py-0.5 leading-none ${isUrgent ? 'text-red-400 border-red-400/40' : 'text-amber-400 border-amber-400/40'}`}>
                                <Clock size={9} />
                                {copy.badge}
                            </span>
                            <p className="text-white text-[13px] sm:text-[15px] font-black leading-tight">
                                {copy.host}
                            </p>
                            <p className="text-slate-400 text-[11px] sm:text-[13px] leading-snug italic">
                                {copy.pundit}
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-white/10 mx-4" />

                    {/* What is Second Chance */}
                    <div className="mx-4 mt-4 rounded-xl bg-white/5 border border-white/10 px-4 py-3 flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${isUrgent ? 'bg-red-500/15' : 'bg-amber-400/15'}`}>
                            <RefreshCw size={16} className={isUrgent ? 'text-red-400' : 'text-amber-400'} />
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                            {copy.what}
                        </p>
                    </div>

                    {/* R32 Tracker */}
                    {r32Tracker && r32Tracker.total > 0 && (() => {
                        const { matched, wrong, pending, total, groupsLeft } = r32Tracker;
                        const matchedPct = Math.round((matched / 32) * 100);
                        const wrongPct = Math.round((wrong / 32) * 100);
                        const pendingPct = Math.round((pending / 32) * 100);
                        return (
                            <div className="mx-4 mt-3 rounded-xl bg-[#0f2545] border border-white/10 px-4 py-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">R32 Prediction Tracker</span>
                                    <span className="text-white font-black text-sm tabular-nums">{matched} <span className="text-slate-500 font-normal text-xs">/ 32</span></span>
                                </div>
                                <div className="flex h-2 rounded-full overflow-hidden bg-white/10 gap-px">
                                    {matchedPct > 0 && <div className="bg-emerald-500 rounded-l-full transition-all" style={{ width: `${matchedPct}%` }} />}
                                    {wrongPct > 0 && <div className="bg-red-500 transition-all" style={{ width: `${wrongPct}%` }} />}
                                    {pendingPct > 0 && <div className="bg-white/20 rounded-r-full transition-all" style={{ width: `${pendingPct}%` }} />}
                                </div>
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                    <span className="text-[9px] text-emerald-400 font-bold">✓ {matched} tracking</span>
                                    <span className="text-[9px] text-red-400 font-bold">✗ {wrong} out</span>
                                    <span className="text-[9px] text-slate-400 font-bold">⏳ {pending} TBD</span>
                                    {groupsLeft > 0 && <span className="text-[9px] text-slate-500">{groupsLeft} group{groupsLeft !== 1 ? 's' : ''} left</span>}
                                </div>
                            </div>
                        );
                    })()}

                    {/* CTAs */}
                    <div className="px-4 pt-4 pb-4 flex flex-col gap-2">
                        <button
                            onClick={() => onDismiss(true)}
                            className={`w-full py-3.5 text-white rounded-xl font-black uppercase tracking-widest shadow-lg transition-all text-sm active:scale-95 ${isUrgent ? 'bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500'}`}
                        >
                            {copy.cta}
                        </button>
                        <button
                            onClick={() => onDismiss(false)}
                            className="w-full py-2 text-[11px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            {copy.later}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
