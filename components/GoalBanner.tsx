import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Team } from '../types';

export interface GoalNotification {
  eventId: number;
  eventType: 'Goal' | 'Var';
  teamId: string;
  player?: string;
  detail?: string;
  minute: number;
  minuteExtra?: number | null;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
}

interface GoalBannerProps {
  notification: GoalNotification | null;
  homeTeam?: Team;
  awayTeam?: Team;
  scoringTeam?: Team;
  onDismiss: () => void;
}

const DISPLAY_MS = 7000;

export const GoalBanner: React.FC<GoalBannerProps> = ({
  notification, homeTeam, awayTeam, scoringTeam, onDismiss,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [barStarted, setBarStarted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!notification) { setVisible(false); setBarStarted(false); return; }

    setVisible(true);
    // Tiny delay so CSS transition fires after mount
    const t1 = setTimeout(() => setBarStarted(true), 60);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400); // wait for slide-out animation
    }, DISPLAY_MS);

    return () => {
      clearTimeout(t1);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification?.eventId]);

  if (!notification) return null;

  const isVAR = notification.eventType === 'Var';
  const isOG  = !isVAR && notification.detail === 'Own Goal';
  const isPen = !isVAR && notification.detail === 'Penalty';
  const min   = `${notification.minute}${notification.minuteExtra ? `+${notification.minuteExtra}` : ''}'`;

  const label     = isVAR ? 'GOAL DISALLOWED 🚫' : isOG ? 'OWN GOAL ⚽' : isPen ? 'PENALTY ⚽' : 'GOAL ⚽';
  const accentCol = isVAR ? 'border-purple-500' : isOG ? 'border-orange-500' : 'border-red-500';
  const dotCol    = isVAR ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.9)]' : isOG ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.9)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]';
  const labelCol  = isVAR ? 'text-purple-400' : isOG ? 'text-orange-400' : isPen ? 'text-yellow-400' : 'text-red-400';
  const barCol    = isVAR ? 'bg-purple-500' : isOG ? 'bg-orange-500' : 'bg-red-500';

  return createPortal(
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] pointer-events-none flex flex-col items-stretch transition-transform duration-400 ease-out ${visible ? 'translate-y-0' : '-translate-y-full'}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="pointer-events-auto">
        <div className={`border-b-2 ${accentCol} bg-[#08111f]/95 backdrop-blur-md shadow-[0_6px_40px_rgba(0,0,0,0.85)]`}>

          {/* Progress bar — shrinks from 100% to 0% over DISPLAY_MS */}
          <div
            className={`h-[3px] ${barCol} transition-all ease-linear`}
            style={{ width: barStarted ? '0%' : '100%', transitionDuration: `${DISPLAY_MS}ms` }}
          />

          <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-2.5">

            {/* Live dot + label */}
            <div className="flex items-center gap-2 shrink-0">
              <div className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${dotCol}`} />
              <span className={`text-[10px] font-black uppercase tracking-widest ${labelCol}`}>{label}</span>
            </div>

            <div className="w-px h-5 bg-white/10 shrink-0" />

            {/* Scoring team flag + name */}
            <div className="flex items-center gap-2 shrink-0">
              {scoringTeam?.flag && (
                <img src={scoringTeam.flag} alt="" className="w-7 h-5 object-cover rounded border border-white/20 shadow-sm" />
              )}
              <span className="text-white text-[11px] font-black uppercase tracking-wide">
                {scoringTeam?.name || notification.teamId}
              </span>
            </div>

            {/* Minute + player */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-slate-400 text-[10px] font-bold shrink-0">{min}</span>
              {notification.player && (
                <span className="text-slate-200 text-[11px] truncate">{notification.player}</span>
              )}
            </div>

            {/* Score pill */}
            <div className="flex items-center gap-2 shrink-0 bg-white/8 border border-white/10 rounded-xl px-3 py-1.5">
              {homeTeam?.flag && (
                <img src={homeTeam.flag} alt={homeTeam.name} className="w-5 h-3.5 object-cover rounded-sm border border-white/10" />
              )}
              <span className="text-white font-black text-sm tabular-nums tracking-tight">
                {notification.homeScore} – {notification.awayScore}
              </span>
              {awayTeam?.flag && (
                <img src={awayTeam.flag} alt={awayTeam.name} className="w-5 h-3.5 object-cover rounded-sm border border-white/10" />
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }}
              className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors p-1 rounded"
            >
              <X size={13} />
            </button>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
