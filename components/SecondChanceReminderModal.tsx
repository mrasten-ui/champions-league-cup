import React from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';
import { LanguageCode } from '../types';

export type SCReminderType = 'group' | 'knockout';

interface SecondChanceReminderModalProps {
    isOpen: boolean;
    type: SCReminderType;
    onDismiss: (goToManager: boolean) => void;
    langCode: LanguageCode;
}

const assetLang: Record<LanguageCode, string> = { EN: 'en', NO: 'no', SCO: 'sc', US: 'us' };

const COPY: Record<SCReminderType, Record<LanguageCode, {
    badge: string; host: string; pundit: string; cta: string; later: string;
}>> = {
    group: {
        EN: {
            badge: 'SECOND CHANCE CLOSING ⏰',
            host: 'The group stage is nearly over!',
            pundit: "You've still got time to activate your Second Chance and redo your knockout bracket. Once the last group game ends, the window closes — don't sleep on it!",
            cta: 'Activate Second Chance →',
            later: 'Remind me later',
        },
        NO: {
            badge: 'ANDRE SJANSE STENGER ⏰',
            host: 'Gruppefasen er nesten ferdig!',
            pundit: 'Du har fortsatt tid til å aktivere din andre sjanse og gjøre om knockout-bracketditt. Vinduet stenger når siste gruppekamp er ferdig!',
            cta: 'Aktiver andre sjanse →',
            later: 'Påminn meg senere',
        },
        SCO: {
            badge: 'SECOND CHANCE CLOSIN ⏰',
            host: "Group stage is nearly done, pal!",
            pundit: "Ye've still got time tae activate yer Second Chance and redo yer knockouts. Dinnae let that window slam shut on ye!",
            cta: 'Activate Second Chance →',
            later: 'Remind me later',
        },
        US: {
            badge: 'SECOND CHANCE CLOSING ⏰',
            host: 'Group stage is almost done!',
            pundit: "You still have time to activate your Second Chance and redo your bracket. Once that last group game is over, the window closes for good!",
            cta: 'Activate Second Chance →',
            later: 'Remind me later',
        },
    },
    knockout: {
        EN: {
            badge: 'LAST CHANCE ⚠️',
            host: 'Knockouts are almost here!',
            pundit: "Your Second Chance is still sitting there unused. Once the Round of 32 kicks off, it's gone for good — activate it now while you still can!",
            cta: 'Activate Now →',
            later: "I'll skip it",
        },
        NO: {
            badge: 'SISTE SJANSE ⚠️',
            host: 'Knockout-fasen starter snart!',
            pundit: 'Din andre sjanse er fortsatt ubrukt. Når åttendelsfinalen starter, er den borte for alltid — aktiver den nå mens du kan!',
            cta: 'Aktiver nå →',
            later: 'Jeg hopper over',
        },
        SCO: {
            badge: 'LAST CHANCE ⚠️',
            host: 'Knockouts are almost on us!',
            pundit: "Yer Second Chance is still gathering dust! Once the first knockout game kicks aff, it's deid and buried — get on it noo!",
            cta: 'Activate Now →',
            later: "I'll skip it",
        },
        US: {
            badge: 'LAST CHANCE ⚠️',
            host: "Knockouts are right around the corner!",
            pundit: "Your Second Chance is still sitting there unused! Once Round of 32 kicks off, it's gone forever — activate it while you still can!",
            cta: 'Activate Now →',
            later: "I'll skip it",
        },
    },
};

export const SecondChanceReminderModal: React.FC<SecondChanceReminderModalProps> = ({
    isOpen, type, onDismiss, langCode,
}) => {
    if (!isOpen) return null;

    const lang = assetLang[langCode] ?? 'en';
    const copy = COPY[type][langCode] ?? COPY[type].EN;
    const teamUrl = `/pundit/team-${lang}.png`;
    const isUrgent = type === 'knockout';

    return createPortal(
        <div className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" onClick={() => onDismiss(false)} />

            <div className="relative w-full max-w-lg mx-0 sm:mx-4 sm:mb-0 animate-in slide-in-from-bottom-4 duration-400">
                <div className={`w-full bg-[#0f172a] border-t-4 shadow-[0_-20px_60px_rgba(0,0,0,0.9)] sm:rounded-2xl sm:border-4 overflow-hidden ${isUrgent ? 'border-red-500' : 'border-amber-400'}`}>

                    {/* Character + text */}
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

                    <div className="px-4 py-4 flex flex-col gap-2">
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
