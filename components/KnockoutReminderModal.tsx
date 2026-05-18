import React from 'react';
import { createPortal } from 'react-dom';
import { Trophy } from 'lucide-react';
import { LanguageCode } from '../types';

interface KnockoutReminderModalProps {
    isOpen: boolean;
    onDismiss: (goToKnockouts: boolean) => void;
    langCode: LanguageCode;
}

const assetLang: Record<LanguageCode, string> = { EN: 'en', NO: 'no', SCO: 'sc', US: 'us' };

const COPY: Record<LanguageCode, { badge: string; host: string; pundit: string; cta: string; later: string }> = {
    EN: {
        badge: 'GROUP STAGE COMPLETE ✓',
        host: 'All group games predicted — well done!',
        pundit: "Now get to the knockouts. That's where champions are made — and the REAL points are won!",
        cta: 'Fill In Knockouts →',
        later: 'Remind me later',
    },
    NO: {
        badge: 'GRUPPEFASEN FERDIG ✓',
        host: 'Alle gruppekamper er ferdig! Godt gjort.',
        pundit: 'Men ikke glem knockout-fasen — det er der de store poengene vinnes!',
        cta: 'Fyll inn knockout →',
        later: 'Påminn meg senere',
    },
    SCO: {
        badge: 'GROUP STAGE SORTED ✓',
        host: 'Group stage sorted! Nae bad effort.',
        pundit: "Dinnae forget yer knockouts pal — that's where ye can really rake it in!",
        cta: 'Fill In Knockouts →',
        later: 'Remind me later',
    },
    US: {
        badge: 'GROUP STAGE DONE ✓',
        host: "Group stage predictions? Done! You're halfway there.",
        pundit: "But the bracket's where it gets real — fill in those knockouts before you miss your chance!",
        cta: 'Fill In Knockouts →',
        later: 'Remind me later',
    },
};

export const KnockoutReminderModal: React.FC<KnockoutReminderModalProps> = ({ isOpen, onDismiss, langCode }) => {
    if (!isOpen) return null;

    const lang = assetLang[langCode] ?? 'en';
    const copy = COPY[langCode] ?? COPY.EN;
    const teamUrl = '/pundit/team-' + lang + '.png';

    return createPortal(
        <div className="fixed inset-0 z-[9000] flex items-end sm:items-center justify-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" onClick={() => onDismiss(false)} />

            {/* Card */}
            <div className="relative w-full max-w-lg mx-0 sm:mx-4 sm:mb-0 animate-in slide-in-from-bottom-4 duration-400">

                {/* Broadcast panel: yellow top border */}
                <div className="w-full bg-[#0f172a] border-t-4 border-yellow-400 shadow-[0_-20px_60px_rgba(0,0,0,0.9)] sm:rounded-2xl sm:border-4 sm:border-yellow-400 overflow-hidden">

                    {/* Character layer — anchored bottom-left */}
                    <div className="relative flex items-end min-h-[120px] sm:min-h-[140px]">
                        <img
                            src={teamUrl}
                            onError={(e) => { e.currentTarget.src = '/pundit/team-en.png'; }}
                            alt="Studio Team"
                            className="absolute bottom-0 left-0 w-[100px] sm:w-[130px] h-auto object-contain object-bottom drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] pointer-events-none"
                        />

                        {/* Text content — padded to clear the character image */}
                        <div className="flex-1 pl-[108px] sm:pl-[140px] pr-4 pt-4 pb-4 flex flex-col gap-2">
                            {/* Badge */}
                            <span className="inline-flex items-center gap-1.5 self-start text-[9px] font-black text-yellow-400 uppercase tracking-widest border border-yellow-400/40 rounded px-1.5 py-0.5 leading-none">
                                <Trophy size={9} />
                                {copy.badge}
                            </span>

                            {/* Host line */}
                            <p className="text-white text-[13px] sm:text-[15px] font-black leading-tight">
                                {copy.host}
                            </p>

                            {/* Pundit line */}
                            <p className="text-slate-400 text-[11px] sm:text-[13px] leading-snug italic">
                                {copy.pundit}
                            </p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/10 mx-4" />

                    {/* CTA */}
                    <div className="px-4 py-4 flex flex-col gap-2">
                        <button
                            onClick={() => onDismiss(true)}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg transition-all text-sm active:scale-95"
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
