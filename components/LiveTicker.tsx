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
const H24 = 24 * 60 * 60 * 1000;

function Flag({ src, alt }: { src?: string; alt: string }) {
  if (!src) return <span className="text-[9px] font-black text-slate-400 uppercase">{alt}</span>;
  return <img src={src} alt={alt} className="w-5 h-3.5 object-cover rounded-sm border border-white/15 shrink-0" />;
}

export const LiveTicker: React.FC<LiveTickerProps> = ({ matches, teams, onMatchClick, phase, addToast }) => {
  const [hidden, setHidden] = useState(() => localStorage.getItem(HIDDEN_KEY) === 'true');
  const now = Date.now();

  const items = useMemo(() => {
    const live: Match[] = [];
    const recent: Match[] = [];
    const upcoming: Match[] = [];

    for (const m of matches) {
      if (LIVE_STATUSES.has(m.status)) {
        live.push(m);
      } else if (FINISHED_STATUSES.has(m.status) && m.homeScore !== null && m.awayScore !== null) {
        const matchTime = m.date && m.date !== 'TBD' ? new Date(m.date).getTime() : 0;
        if (matchTime && now - matchTime < H24) recent.push(m);
      } else if ((m.status === 'UPCOMING' || m.status === 'NS') && m.date && m.date !== 'TBD') {
        const t = new Date(m.date).getTime();
        if (t > now) upcoming.push(m);
      }
    }

    upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return [...live, ...recent, ...upcoming.slice(0, 12)];
  }, [matches, now]);

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
      <button
        onClick={handleRestore}
        className="fixed bottom-[64px] md:bottom-3 right-3 z-[95] flex items-center gap-1.5 px-3 py-1.5 bg-[#08111f]/95 backdrop-blur-sm border border-white/15 rounded-full shadow-lg text-slate-400 hover:text-white hover:border-white/30 transition-all active:scale-95"
        title="Show live scores ticker"
      >
        <Tv size={12} />
        <span className="text-[10px] font-black uppercase tracking-widest">Scores</span>
      </button>
    );
  }

  // Duplicate for seamless loop
  const doubled = [...items, ...items];

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
    const todayMidnight = new Date(now);
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
    const isDone = FINISHED_STATUSES.has(m.status);
    const hasScore = m.homeScore !== null && m.awayScore !== null;

    return (
      <button
        key={m.id}
        onClick={() => onMatchClick(m)}
        className="flex items-center gap-1.5 px-3 shrink-0 hover:bg-white/5 transition-colors rounded h-full cursor-pointer"
      >
        {getStatusLabel(m)}
        <span className="text-white/30 text-[9px] mx-0.5">|</span>
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

  // Animation duration scales with number of items so speed stays consistent
  const duration = Math.max(20, items.length * 6);

  return (
    <>
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker-scroll ${duration}s linear infinite;
        }
        .ticker-track:hover,
        .ticker-track:focus-within {
          animation-play-state: paused;
        }
      `}</style>

      {/* Mobile: above bottom nav. Desktop: at very bottom */}
      <div className="fixed bottom-[56px] md:bottom-0 left-0 right-0 z-[95] h-9 bg-[#08111f]/95 backdrop-blur-sm border-t border-white/10 overflow-hidden flex items-center"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>

        {/* "LIVE" label badge — static left anchor */}
        <div className="shrink-0 flex items-center gap-1.5 px-3 h-full border-r border-white/10 bg-[#0f2545]">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.9)]" />
          <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Live</span>
        </div>

        {/* Scrolling track */}
        <div className="flex-1 overflow-hidden h-full flex items-center min-w-0">
          <div className="ticker-track flex items-center h-full whitespace-nowrap">
            {doubled.map((m, i) => (
              <React.Fragment key={`${m.id}-${i}`}>
                {renderScore(m)}
                <span className="text-white/15 text-[10px] select-none shrink-0">·</span>
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
