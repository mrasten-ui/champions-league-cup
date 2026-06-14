import React, { useMemo, useState } from 'react';
import { X, Tv } from 'lucide-react';
import { Match, Team, TournamentPhase } from '../types';

const HIDDEN_KEY = 'rasten_ticker_hidden_v1';

interface LiveTickerProps {
  matches: Match[];
  teams: Record<string, Team>;
  onMatchClick: (match: Match) => void;
  phase: TournamentPhase;
  addToast: (type: 'info' | 'success' | 'error', title: string, message?: string) => void;
}

const LIVE_STATUSES     = new Set(['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT']);
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN', 'FINISHED']);

function Flag({ src, alt }: { src?: string; alt: string }) {
  if (!src) return <span className="text-[9px] font-black text-slate-400 uppercase">{alt}</span>;
  return <img src={src} alt={alt} className="w-5 h-3.5 object-cover rounded-sm border border-white/15 shrink-0" />;
}

export const LiveTicker: React.FC<LiveTickerProps> = ({ matches, teams, onMatchClick, phase, addToast }) => {
  const [hidden, setHidden] = useState(() => localStorage.getItem(HIDDEN_KEY) === 'true');

  const items = useMemo(() => {
    // en-CA gives YYYY-MM-DD in local timezone — sortable as a string
    const todayStr = new Date().toLocaleDateString('en-CA');

    const valid = matches.filter(m => m.date && m.date !== 'TBD');

    const allGameDays = [...new Set(valid.map(m => new Date(m.date).toLocaleDateString('en-CA')))].sort();
    const before = allGameDays.filter(d => d < todayStr);
    const after  = allGameDays.filter(d => d > todayStr);
    const prevGameDay = before.length > 0 ? before[before.length - 1] : null;
    const nextGameDay = after.length  > 0 ? after[0]                  : null;

    const relevantDays = new Set<string>([todayStr]);
    if (prevGameDay) relevantDays.add(prevGameDay);
    if (nextGameDay) relevantDays.add(nextGameDay);
    // At start of tournament (no prev): add one extra future game day
    if (!prevGameDay && after.length >= 2) relevantDays.add(after[1]);
    // At end of tournament (no next): add one extra past game day
    if (!nextGameDay && before.length >= 2) relevantDays.add(before[before.length - 2]);

    const relevant = valid.filter(m => relevantDays.has(new Date(m.date).toLocaleDateString('en-CA')));

    const live = relevant.filter(m => LIVE_STATUSES.has(m.status));
    const rest = relevant
      .filter(m => !LIVE_STATUSES.has(m.status))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return [...live, ...rest];
  }, [matches]);

  if (items.length === 0) return null;
  if (phase === 'PRE_LIVE') return null;

  const handleHide = () => {
    localStorage.setItem(HIDDEN_KEY, 'true');
    setHidden(true);
    addToast('info', 'Ticker hidden', "Tap the 📺 button at the bottom right to bring it back.");
  };

  const handleRestore = () => {
    localStorage.setItem(HIDDEN_KEY, 'false');
    setHidden(false);
  };

  // When hidden: show a small restore pill in the bottom-right corner
  if (hidden) {
    return (
      <>
        <style>{`
          .ticker-restore { bottom: calc(64px + env(safe-area-inset-bottom, 0px)); }
          @media (min-width: 768px) { .ticker-restore { bottom: 12px; } }
        `}</style>
        <button
          onClick={handleRestore}
          className="ticker-restore fixed right-3 z-[95] flex items-center gap-1.5 px-3 py-1.5 bg-[#08111f]/95 backdrop-blur-sm border border-white/15 rounded-full shadow-lg text-slate-400 hover:text-white hover:border-white/30 transition-all active:scale-95"
          title="Show live scores ticker"
        >
          <Tv size={12} />
          <span className="text-[10px] font-black uppercase tracking-widest">Scores</span>
        </button>
      </>
    );
  }

  // Repeat enough times so the track always overflows even on wide screens.
  // Each item is ~130px; a 1440px desktop needs ~11 items. We aim for at least 16 total.
  const REPEAT = Math.max(4, Math.ceil(16 / Math.max(1, items.length)));
  const repeated = Array.from({ length: REPEAT }, (_, r) => items.map(m => ({ m, k: `${r}-${m.id}` }))).flat();
  // Animate by one copy-width: -100% / REPEAT of the total track width
  const animPct = (100 / REPEAT).toFixed(2);

  const getStatusLabel = (m: Match) => {
    if (m.status === 'HT') return <span className="text-amber-400 font-black text-[9px]">HT</span>;
    if (m.status === 'BT') return <span className="text-sky-400 font-black text-[9px]">ET HT</span>;
    if (m.status === 'P')  return <span className="text-red-400 font-black text-[9px]">PENS</span>;
    if (LIVE_STATUSES.has(m.status)) {
      const min = m.minute ? `${m.minute}'` : 'LIVE';
      const isET = m.status === 'ET' || (m.minute && m.minute > 90);
      return (
        <span className={`font-black text-[9px] flex items-center gap-1 ${isET ? 'text-sky-400' : 'text-red-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${isET ? 'bg-sky-400' : 'bg-red-500'}`} />
          {min}
        </span>
      );
    }
    if (FINISHED_STATUSES.has(m.status)) {
      const label = m.status === 'AET' ? 'AET' : m.status === 'PEN' ? 'PSO' : 'FT';
      return <span className="text-slate-400 font-black text-[9px]">{label}</span>;
    }
    // Upcoming — smart relative label (today=time only, tomorrow, weekday, or date)
    const d = new Date(m.date);
    const timeStr = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    const todayMidnight = new Date();
    const diffDays = Math.floor(
      (d.getTime() - new Date(todayMidnight.getFullYear(), todayMidnight.getMonth(), todayMidnight.getDate()).getTime()) / 86_400_000
    );
    let prefix = '';
    if (diffDays === 1) {
      prefix = 'Tomorrow ';
    } else if (diffDays > 1 && diffDays <= 7) {
      prefix = d.toLocaleDateString('en-GB', { weekday: 'short' }) + ' ';
    } else if (diffDays > 7) {
      prefix = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ';
    }
    if (!prefix) return <span className="text-slate-300 font-black text-[9px]">{timeStr}</span>;
    return (
      <span className="flex items-center gap-0.5">
        <span className="text-slate-500 font-bold text-[9px]">{prefix.trim()}</span>
        <span className="text-slate-600 text-[8px]">·</span>
        <span className="text-slate-300 font-black text-[9px]">{timeStr}</span>
      </span>
    );
  };

  const renderScore = (m: Match) => {
    const home = teams[m.homeTeamId];
    const away = teams[m.awayTeamId];
    const homeCode = home?.name?.slice(0, 3).toUpperCase() || m.homeTeamId;
    const awayCode = away?.name?.slice(0, 3).toUpperCase() || m.awayTeamId;
    const isLive = LIVE_STATUSES.has(m.status);
    const hasScore = m.homeScore !== null && m.awayScore !== null;

    return (
      <button
        key={m.id}
        onClick={() => onMatchClick(m)}
        className="flex items-center gap-2 px-5 shrink-0 hover:bg-white/5 transition-colors rounded h-full cursor-pointer"
      >
        {getStatusLabel(m)}
        <Flag src={home?.flag} alt={homeCode} />
        <span className={`text-[10px] font-black uppercase tracking-tight ${isLive ? 'text-white' : 'text-slate-300'}`}>
          {homeCode}
        </span>
        {hasScore ? (
          <span className={`text-[11px] font-black tabular-nums mx-0.5 ${isLive ? 'text-white' : 'text-slate-300'}`}>
            {m.homeScore}–{m.awayScore}
          </span>
        ) : (
          <span className="text-slate-500 text-[10px] font-bold mx-0.5">vs</span>
        )}
        <span className={`text-[10px] font-black uppercase tracking-tight ${isLive ? 'text-white' : 'text-slate-300'}`}>
          {awayCode}
        </span>
        <Flag src={away?.flag} alt={awayCode} />
      </button>
    );
  };

  const duration = Math.max(20, items.length * 6);

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-${animPct}%); }
        }
        .ticker-track {
          animation: ticker-scroll ${duration}s linear infinite;
        }
        .ticker-track:hover,
        .ticker-track:focus-within {
          animation-play-state: paused;
        }
        .ticker-wrap { bottom: calc(56px + env(safe-area-inset-bottom, 0px)); }
        @media (min-width: 768px) { .ticker-wrap { bottom: 0; } }
      `}</style>

      {/* Mobile: above bottom nav (safe-area-aware). Desktop: at very bottom */}
      <div className="ticker-wrap fixed left-0 right-0 z-[95] h-9 bg-[#08111f]/95 backdrop-blur-sm border-t border-white/10 overflow-hidden flex items-center">

        {/* "LIVE" label badge — static left anchor */}
        <div className="shrink-0 flex items-center gap-1.5 px-3 h-full border-r border-white/10 bg-[#0f2545]">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
          <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Live</span>
        </div>

        {/* Scrolling track */}
        <div className="flex-1 overflow-hidden h-full flex items-center min-w-0">
          <div className="ticker-track flex items-center h-full whitespace-nowrap">
            {repeated.map(({ m, k }) => (
              <React.Fragment key={k}>
                {renderScore(m)}
                <span className="text-white/25 text-[8px] select-none shrink-0 px-3">◆</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Hide button */}
        <button
          onClick={handleHide}
          className="shrink-0 flex items-center justify-center w-8 h-full text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-colors border-l border-white/10"
          title="Hide ticker"
        >
          <X size={11} />
        </button>
      </div>
    </>
  );
};
