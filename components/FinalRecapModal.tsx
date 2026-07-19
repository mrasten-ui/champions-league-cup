import React from 'react';
import { createPortal } from 'react-dom';
import { Trophy, PartyPopper } from 'lucide-react';
import { LanguageCode } from '../types';

interface FinalRecapModalProps {
    isOpen: boolean;
    onClose: () => void;
    onViewLeaderboard: () => void;
    langCode: LanguageCode;
    userName: string;
    totalPoints: number;
    rank: number;
    totalPlayers: number;
}

const assetLang: Record<LanguageCode, string> = { EN: 'en', NO: 'no', SCO: 'sc', US: 'us' };

type TierMessageFn = (rank: number, totalPlayers: number, name: string) => string;

const COPY: Record<LanguageCode, { badge: string; ptsLabel: string; rankLabel: string; cta: string; close: string; message: TierMessageFn }> = {
    EN: {
        badge: 'FULL TIME — TOURNAMENT OVER ✓',
        ptsLabel: 'points',
        rankLabel: 'of',
        cta: 'See Full Leaderboard →',
        close: 'Close',
        message: (rank, total, name) => {
            if (rank === 1) return `${name}, you actually won the whole thing. Champion manager — take a bow!`;
            if (rank <= 3) return `${name}, a podium finish! Top ${rank} of ${total} managers — brilliant tournament.`;
            if (rank <= 10) return `${name}, a top ${rank} finish out of ${total}. Proper managerial nous.`;
            if (rank / total <= 0.5) return `${name}, finishing #${rank} of ${total} — solidly upper half. Respectable stuff.`;
            return `${name}, you finished #${rank} of ${total}. There's always next tournament — thanks for playing!`;
        },
    },
    NO: {
        badge: 'FULLTID — TURNERINGEN ER OVER ✓',
        ptsLabel: 'poeng',
        rankLabel: 'av',
        cta: 'Se hele resultatlisten →',
        close: 'Lukk',
        message: (rank, total, name) => {
            if (rank === 1) return `${name}, du vant hele greia! Mesterskapsmanager — buk for folket!`;
            if (rank <= 3) return `${name}, pallplass! Nummer ${rank} av ${total} managere — strålende turnering.`;
            if (rank <= 10) return `${name}, en topp ${rank}-plassering av ${total}. Skikkelig manager-teft.`;
            if (rank / total <= 0.5) return `${name}, du endte på #${rank} av ${total} — solid øvre halvdel. Bra jobba.`;
            return `${name}, du endte på #${rank} av ${total}. Det er alltid neste turnering — takk for at du var med!`;
        },
    },
    SCO: {
        badge: "FULL TIME — IT'S A' OVER ✓",
        ptsLabel: 'points',
        rankLabel: 'oot of',
        cta: 'See the Full Table →',
        close: 'Away ye go',
        message: (rank, total, name) => {
            if (rank === 1) return `${name}, ye actually won the hale thing. Champion manager — get it up ye!`;
            if (rank <= 3) return `${name}, a podium finish! Top ${rank} oot o' ${total} managers — magic tournament.`;
            if (rank <= 10) return `${name}, a top ${rank} finish oot o' ${total}. Pure gallus.`;
            if (rank / total <= 0.5) return `${name}, finishin' #${rank} oot o' ${total} — solid upper half, nae bad.`;
            return `${name}, ye finished #${rank} oot o' ${total}. There's always next time — cheers for playin'!`;
        },
    },
    US: {
        badge: 'FINAL WHISTLE — IT’S ALL OVER ✓',
        ptsLabel: 'points',
        rankLabel: 'of',
        cta: 'See Full Leaderboard →',
        close: 'Close',
        message: (rank, total, name) => {
            if (rank === 1) return `${name}, you actually won the whole thing. Champion manager — take a bow!`;
            if (rank <= 3) return `${name}, a podium finish! Top ${rank} of ${total} managers — brilliant tournament.`;
            if (rank <= 10) return `${name}, a top ${rank} finish out of ${total}. That's real managerial instinct.`;
            if (rank / total <= 0.5) return `${name}, finishing #${rank} of ${total} — solidly upper half. Nice work.`;
            return `${name}, you finished #${rank} of ${total}. There's always next tournament — thanks for playing!`;
        },
    },
};

export const FinalRecapModal: React.FC<FinalRecapModalProps> = ({
    isOpen, onClose, onViewLeaderboard, langCode, userName, totalPoints, rank, totalPlayers,
}) => {
    if (!isOpen) return null;

    const lang = assetLang[langCode] ?? 'en';
    const copy = COPY[langCode] ?? COPY.EN;
    const teamUrl = '/pundit/team-' + lang + '.png';
    const isChampion = rank === 1;
    const isPodium = rank > 0 && rank <= 3;

    return createPortal(
        <div className="fixed inset-0 z-[9500] flex items-end sm:items-center justify-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg mx-0 sm:mx-4 sm:mb-0 animate-in slide-in-from-bottom-4 duration-400">
                <div className={`w-full bg-[#0f172a] border-t-4 shadow-[0_-20px_60px_rgba(0,0,0,0.9)] sm:rounded-2xl sm:border-4 overflow-hidden ${isChampion ? 'border-yellow-400' : isPodium ? 'border-amber-400' : 'border-blue-500'}`}>

                    {/* Character layer + badge */}
                    <div className="relative flex items-end min-h-[110px] sm:min-h-[130px]">
                        <img
                            src={teamUrl}
                            onError={(e) => { e.currentTarget.src = '/pundit/team-en.png'; }}
                            alt="Studio Team"
                            className="absolute bottom-0 left-0 w-[90px] sm:w-[120px] h-auto object-contain object-bottom drop-shadow-[0_10px_25px_rgba(0,0,0,0.9)] pointer-events-none"
                        />
                        <div className="flex-1 pl-[98px] sm:pl-[130px] pr-4 pt-4 pb-3 flex flex-col gap-1.5">
                            <span className={`inline-flex items-center gap-1.5 self-start text-[9px] font-black uppercase tracking-widest border rounded px-1.5 py-0.5 leading-none ${isChampion ? 'text-yellow-400 border-yellow-400/40' : 'text-blue-400 border-blue-400/40'}`}>
                                <PartyPopper size={9} />
                                {copy.badge}
                            </span>
                            <p className="text-white text-[13px] sm:text-[15px] font-black leading-tight">
                                {copy.message(rank, totalPlayers, userName)}
                            </p>
                        </div>
                    </div>

                    <div className="h-px bg-white/10 mx-4" />

                    {/* Score + rank hero */}
                    <div className="px-4 py-5 flex items-center justify-center gap-6">
                        <div className="flex flex-col items-center">
                            <span className="text-4xl sm:text-5xl font-black text-white tabular-nums leading-none">{totalPoints}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{copy.ptsLabel}</span>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div className="flex flex-col items-center">
                            <span className={`flex items-center gap-1.5 text-4xl sm:text-5xl font-black tabular-nums leading-none ${isChampion ? 'text-yellow-400' : isPodium ? 'text-amber-400' : 'text-white'}`}>
                                {isChampion && <Trophy size={28} className="animate-bounce" />}
                                #{rank > 0 ? rank : '–'}
                            </span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                {copy.rankLabel} {totalPlayers}
                            </span>
                        </div>
                    </div>

                    <div className="px-4 pb-4 flex flex-col gap-2">
                        <button
                            onClick={onViewLeaderboard}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white rounded-xl font-black uppercase tracking-widest shadow-lg transition-all text-sm active:scale-95"
                        >
                            {copy.cta}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-2 text-[11px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
                        >
                            {copy.close}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
