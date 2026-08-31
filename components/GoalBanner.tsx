import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Team } from '../types';
import { TEAMS } from '../constants';
import { KitImage, resolveKitType } from './KitImage';
import { lookupKitDesignation } from '../kitDesignations';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GoalNotification {
  eventId: number;
  matchId: string;
  eventType: 'Goal' | 'Var';
  teamId: string;
  player?: string;
  playerId?: number | null;
  detail?: string;
  minute: number;
  minuteExtra?: number | null;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  homeKitBg?: string | null;
  homeKitText?: string | null;
  awayKitBg?: string | null;
  awayKitText?: string | null;
}

export interface PsoNotification {
  id: string;
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <span className="flex items-center gap-[2px] shrink-0" aria-label="Live">
      <span className="text-amber-400 text-[7px] font-black leading-none">{`((`}</span>
      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
      <span className="text-amber-400 text-[7px] font-black leading-none">{`))`}</span>
    </span>
  );
}

function PillButton({
  onClick,
  children,
  gold,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  gold?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 whitespace-nowrap ${
        gold
          ? 'bg-[#C9A84C]/15 border-[#C9A84C]/45 text-[#C9A84C] hover:bg-[#C9A84C]/25'
          : 'bg-white/5 border-white/12 text-white/55 hover:bg-white/10 hover:text-white/80'
      }`}
    >
      {children}
    </button>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────

const GOAL_DISPLAY_MS = 9000;

interface GoalCardProps {
  notification: GoalNotification;
  homeTeam?: Team;
  awayTeam?: Team;
  onDismiss: () => void;
  onShowLive?: () => void;
  onNavigate?: () => void;
  onPlayerClick?: (playerId: number | null, playerName: string, teamId: string) => void;
}

function GoalCard({ notification, homeTeam, awayTeam, onDismiss, onShowLive, onNavigate, onPlayerClick }: GoalCardProps) {
  const [visible, setVisible] = useState(false);
  const [barW, setBarW] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 20);
    const t2 = setTimeout(() => setBarW(0), 80);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 320);
    }, GOAL_DISPLAY_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 320);
  };

  const isVAR = notification.eventType === 'Var';
  const isOG  = !isVAR && notification.detail === 'Own Goal';
  const isPen = !isVAR && notification.detail === 'Penalty';
  const min   = `${notification.minute}${notification.minuteExtra ? `+${notification.minuteExtra}` : ''}'`;

  // For own goals show the BENEFITING team's colors, not the team who scored it
  const benefitingTeamId = isOG
    ? (notification.teamId === notification.homeTeamId ? notification.awayTeamId : notification.homeTeamId)
    : notification.teamId;

  const staticTeam = TEAMS[benefitingTeamId];
  const scoringFlag = staticTeam?.flag;
  const scoringName = staticTeam?.name ?? benefitingTeamId;
  const teamColor   = staticTeam?.jerseyBg ?? (isVAR ? '#8B5CF6' : '#C9A84C');

  const eventLabel = isVAR ? 'GOAL DISALLOWED' : isOG ? 'OWN GOAL' : isPen ? 'PENALTY GOAL' : 'GOAL';
  const labelColor  = isVAR ? '#A78BFA' : isOG ? '#F97316' : '#C9A84C';
  const emoji       = isVAR ? '🚫' : null;

  const ogPlayer = notification.player ?? 'Defender';
  const narrative = (() => {
    if (isVAR)  return `Video review overturns the goal · ${notification.player ?? scoringName}`;
    if (isOG)   return `${ogPlayer} puts it in his own net — lucky ${scoringName}!`;
    if (isPen)  return `${notification.player ?? scoringName} converts from the spot`;
    return notification.player
      ? `${notification.player} finds the net in the ${notification.minute}th minute`
      : `${scoringName} take the lead at ${min}`;
  })();

  const isHomeTeam   = benefitingTeamId === notification.homeTeamId;
  const scoringKitBg   = isHomeTeam ? notification.homeKitBg   : notification.awayKitBg;
  const scoringKitText = isHomeTeam ? notification.homeKitText : notification.awayKitText;

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
      }`}
    >
      <div className="relative rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.85)]"
           style={{ background: '#0a1628' }}>

        {/* Team-color tint overlay — card base is always solid dark */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${teamColor}30 0%, transparent 55%)` }}
        />
        {/* Subtle team-color border */}
        <div
          className="absolute inset-0 rounded-2xl border pointer-events-none"
          style={{ borderColor: `${teamColor}35` }}
        />
        {/* Progress bar */}
        <div
          className="absolute top-0 left-0 h-[2px] transition-all ease-linear"
          style={{
            width: `${barW}%`,
            transitionDuration: `${GOAL_DISPLAY_MS}ms`,
            background: `linear-gradient(to right, ${teamColor}88, ${teamColor})`,
          }}
        />

        {/* Main content row */}
        <div
          className={`relative z-10 flex items-center ${onNavigate ? 'cursor-pointer' : ''}`}
          onClick={onNavigate}
        >
          {/* LEFT: player photo (when available), ball, or disallowed */}
          <div className="flex items-center justify-center px-3 py-4 shrink-0">
            <div
              className={`relative w-[58px] h-[58px] rounded-full flex items-center justify-center overflow-hidden ${!isVAR && notification.playerId && onPlayerClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
              style={{ background: `${teamColor}20`, boxShadow: `0 0 0 2px ${teamColor}60` }}
              onClick={!isVAR && notification.playerId && onPlayerClick ? (e) => {
                e.stopPropagation();
                onPlayerClick(notification.playerId!, notification.player ?? '', notification.teamId);
              } : undefined}
            >
              {isVAR ? (
                <span className="relative text-[30px] leading-none drop-shadow-lg">🚫</span>
              ) : notification.playerId ? (
                <>
                  <img
                    src={`https://media.api-sports.io/football/players/${notification.playerId}.png`}
                    alt={notification.player ?? ''}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const t = e.currentTarget;
                      t.style.display = 'none';
                      t.nextElementSibling && ((t.nextElementSibling as HTMLElement).style.display = 'flex');
                    }}
                  />
                  <div className="absolute inset-0 items-center justify-center hidden">
                    <img src="/wc26-ball.png" className="w-9 h-9 object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]" alt="" />
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${teamColor}35 0%, transparent 70%)` }} />
                  <img src="/wc26-ball.png" className="relative w-9 h-9 object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]" alt="" />
                </>
              )}
            </div>
          </div>

          {/* MIDDLE: text */}
          <div className="flex-1 min-w-0 py-3">
            {/* Big event label + minute */}
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className="text-xl font-black uppercase tracking-tight leading-none"
                style={{ color: labelColor }}
              >
                {eventLabel}
              </span>
              <span className="text-white/40 text-[9px] font-bold shrink-0">{min}</span>
              {!isVAR && <LiveBadge />}
            </div>

            {/* Flag + team name */}
            <div className="flex items-center gap-1.5 mb-0.5">
              {scoringFlag ? (
                <img src={scoringFlag} alt="" className="w-6 h-[16px] object-cover rounded border border-white/15 shrink-0" />
              ) : (
                <div className="w-6 h-[16px] rounded bg-white/8 border border-white/10 shrink-0" />
              )}
              <span className="text-white/90 text-[11px] font-black uppercase tracking-wide truncate">
                {scoringName}
              </span>
            </div>

            {/* Narrative */}
            <div className="text-white/35 text-[8px] leading-snug line-clamp-1 mb-2">
              {narrative}
            </div>

            {/* Score + actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white/6 border border-white/10 rounded-lg px-2 py-1 shrink-0">
                {homeTeam?.flag && <img src={homeTeam.flag} alt="" className="w-4 h-[11px] object-cover rounded-sm" />}
                <span className="text-white font-black text-xs tabular-nums tracking-tight">
                  {notification.homeScore}–{notification.awayScore}
                </span>
                {awayTeam?.flag && <img src={awayTeam.flag} alt="" className="w-4 h-[11px] object-cover rounded-sm" />}
              </div>
              {(onShowLive || onNavigate) && (
                <PillButton onClick={onShowLive ?? onNavigate} gold>Show Live</PillButton>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); dismiss(); }}
                className="ml-auto p-1 text-white/25 hover:text-white/55 transition-colors"
              >
                <X size={11} />
              </button>
            </div>
          </div>

          {/* RIGHT: kit shirt */}
          <div className="flex items-center justify-center pr-3 pl-1 shrink-0">
            <div className="relative">
              <div
                className="absolute inset-0 scale-[1.8]"
                style={{ background: `radial-gradient(circle, ${teamColor}30 0%, transparent 65%)` }}
              />
              <KitImage
                teamId={benefitingTeamId}
                kitBg={scoringKitBg}
                kitText={scoringKitText}
                kitType={lookupKitDesignation(notification.homeTeamId, notification.awayTeamId, benefitingTeamId)}
                size="sm"
                className="relative drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PSO Card ─────────────────────────────────────────────────────────────────

const PSO_DISPLAY_MS = 12000;

interface PsoCardProps {
  notification: PsoNotification;
  homeTeam?: Team;
  awayTeam?: Team;
  onDismiss: () => void;
  onNavigate?: () => void;
}

function PsoCard({ notification, homeTeam, awayTeam, onDismiss, onNavigate }: PsoCardProps) {
  const [visible, setVisible] = useState(false);
  const [barW, setBarW]       = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 20);
    const t2 = setTimeout(() => setBarW(0), 80);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 320);
    }, PSO_DISPLAY_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dismiss = () => { setVisible(false); setTimeout(onDismiss, 320); };

  const homeName = homeTeam?.name ?? notification.homeTeamId;
  const awayName = awayTeam?.name ?? notification.awayTeamId;

  return (
    <div className={`transition-all duration-300 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'}`}>
      <div className="relative rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.85)]"
           style={{ background: '#0a1628' }}>

        {/* Amber tint — pointer-events-none so overlays don't eat button clicks */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, transparent 55%)' }} />
        <div className="absolute inset-0 rounded-2xl border pointer-events-none"
             style={{ borderColor: 'rgba(251,191,36,0.28)' }} />

        {/* Progress bar */}
        <div className="absolute top-0 left-0 h-[2px] transition-all ease-linear pointer-events-none"
             style={{ width: `${barW}%`, transitionDuration: `${PSO_DISPLAY_MS}ms`,
                      background: 'linear-gradient(to right, rgba(251,191,36,0.5), #FBBf24)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/[0.07]">
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
            🥅 Penalty Shoot-Out
          </span>
          <button onClick={e => { e.stopPropagation(); dismiss(); }}
                  className="p-1 text-white/25 hover:text-white/55 transition-colors">
            <X size={11} />
          </button>
        </div>

        {/* Teams + score */}
        <div className={`flex items-center gap-3 px-4 py-3 ${onNavigate ? 'cursor-pointer' : ''}`}
             onClick={onNavigate}>
          <div className="flex items-center gap-1.5 min-w-0">
            {homeTeam?.flag && <img src={homeTeam.flag} alt="" className="w-6 h-5 object-cover rounded-sm shrink-0 border border-white/15" />}
            <span className="text-[12px] font-black text-white truncate">{homeName}</span>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 px-2">
            <span className="text-lg font-black text-white tabular-nums">{notification.homeScore}</span>
            <span className="text-white/25 font-black text-sm">–</span>
            <span className="text-lg font-black text-white tabular-nums">{notification.awayScore}</span>
          </div>

          <div className="flex items-center gap-1.5 min-w-0 justify-end flex-1">
            <span className="text-[12px] font-black text-white truncate">{awayName}</span>
            {awayTeam?.flag && <img src={awayTeam.flag} alt="" className="w-6 h-5 object-cover rounded-sm shrink-0 border border-white/15" />}
          </div>
        </div>

        {/* CTA */}
        {onNavigate && (
          <div className="px-4 pb-3" onClick={e => e.stopPropagation()}>
            <PillButton onClick={onNavigate} gold>Watch live →</PillButton>
          </div>
        )}
      </div>
    </div>
  );
}

// ── GoalBanner (main export) ──────────────────────────────────────────────────

interface GoalBannerProps {
  notification: GoalNotification | null;
  homeTeam?: Team;
  awayTeam?: Team;
  scoringTeam?: Team;
  onDismiss: () => void;
  onShowLive?: () => void;
  onNavigate?: () => void;
  onPlayerClick?: (playerId: number | null, playerName: string, teamId: string) => void;
  psoNotification?: PsoNotification | null;
  onPsoDismiss?: () => void;
  onPsoNavigate?: () => void;
  psohomeTeam?: Team;
  psoAwayTeam?: Team;
}

export const GoalBanner: React.FC<GoalBannerProps> = ({
  notification,
  homeTeam,
  awayTeam,
  onDismiss,
  onShowLive,
  onNavigate,
  onPlayerClick,
  psoNotification,
  onPsoDismiss,
  onPsoNavigate,
  psohomeTeam,
  psoAwayTeam,
}) => {
  if (!notification && !psoNotification) return null;

  return createPortal(
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        top: 'calc(60px + env(safe-area-inset-top, 0px))',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 12px',
      }}
    >
      <div className="w-full max-w-[440px] pointer-events-auto flex flex-col gap-2">
        {notification && (
          <GoalCard
            key={notification.eventId}
            notification={notification}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            onDismiss={onDismiss}
            onShowLive={onShowLive}
            onNavigate={onNavigate}
            onPlayerClick={onPlayerClick}
          />
        )}
        {psoNotification && (
          <PsoCard
            key={psoNotification.id}
            notification={psoNotification}
            homeTeam={psohomeTeam}
            awayTeam={psoAwayTeam}
            onDismiss={onPsoDismiss ?? (() => {})}
            onNavigate={onPsoNavigate}
          />
        )}
      </div>
    </div>,
    document.body
  );
};
