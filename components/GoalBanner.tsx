import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Team } from '../types';
import { TEAMS } from '../constants';
import { KitImage, resolveKitType } from './KitImage';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GoalNotification {
  eventId: number;
  matchId: string;
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
  homeKitBg?: string | null;
  homeKitText?: string | null;
  awayKitBg?: string | null;
  awayKitText?: string | null;
}

export interface KitNotification {
  id: string;
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeKitBg: string;
  homeKitText: string;
  awayKitBg: string;
  awayKitText: string;
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
}

function GoalCard({ notification, homeTeam, awayTeam, onDismiss, onShowLive, onNavigate }: GoalCardProps) {
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
  const emoji       = isVAR ? '🚫' : '⚽';

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
      <div className="relative rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.85)]">

        {/* Team-color gradient background bleed */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${teamColor}25 0%, #060e1a 55%, #06111d 100%)` }}
        />
        {/* Subtle team-color border */}
        <div
          className="absolute inset-0 rounded-2xl border pointer-events-none"
          style={{ borderColor: `${teamColor}35` }}
        />
        {/* Left accent strip */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[5px]"
          style={{ background: `linear-gradient(to bottom, ${teamColor}, ${teamColor}55)` }}
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

        {/* Kit image — large, anchored right */}
        {scoringKitBg && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
            {/* Radial glow behind kit */}
            <div
              className="absolute inset-0 scale-[2]"
              style={{ background: `radial-gradient(circle, ${teamColor}40 0%, transparent 65%)` }}
            />
            <KitImage
              teamId={notification.teamId}
              kitBg={scoringKitBg}
              kitText={scoringKitText}
              size="md"
              className="relative drop-shadow-2xl"
            />
          </div>
        )}

        {/* Text content — entire area is clickable to navigate to the match */}
        <div
          className={`relative z-10 pl-5 pt-3 pb-3 ${scoringKitBg ? 'pr-[74px]' : 'pr-3'} ${onNavigate ? 'cursor-pointer' : ''}`}
          onClick={onNavigate}
        >

          {/* Event label + minute */}
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="text-[13px] font-black uppercase tracking-widest"
              style={{ color: labelColor }}
            >
              {emoji} {eventLabel}
            </span>
            <span className="text-white/25 text-[9px]">·</span>
            <span className="text-white/50 text-[9px] font-bold">{min}</span>
            {!isVAR && <LiveBadge />}
          </div>

          {/* Team flag + name */}
          <div className="flex items-center gap-2 mb-1">
            {scoringFlag ? (
              <img src={scoringFlag} alt="" className="w-8 h-[22px] object-cover rounded border border-white/15 shadow-sm shrink-0" />
            ) : (
              <div className="w-8 h-[22px] rounded bg-white/8 border border-white/10 shrink-0" />
            )}
            <span className="text-white text-[16px] font-black uppercase tracking-wide leading-tight truncate">
              {scoringName}
            </span>
          </div>

          {/* Narrative */}
          <div className="text-white/40 text-[9px] leading-snug line-clamp-1 mb-2.5">
            {narrative}
          </div>

          {/* Score + actions row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/6 border border-white/10 rounded-lg px-2 py-1 shrink-0">
              {homeTeam?.flag && (
                <img src={homeTeam.flag} alt="" className="w-4 h-[11px] object-cover rounded-sm" />
              )}
              <span className="text-white font-black text-xs tabular-nums tracking-tight">
                {notification.homeScore}–{notification.awayScore}
              </span>
              {awayTeam?.flag && (
                <img src={awayTeam.flag} alt="" className="w-4 h-[11px] object-cover rounded-sm" />
              )}
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
      </div>
    </div>
  );
}

// ── Kit Card ──────────────────────────────────────────────────────────────────

function kitLabel(teamId: string, kitBg: string): string {
  const type = resolveKitType(teamId, kitBg);
  return type === 'home' ? 'Home Kit' : type === 'away' ? 'Away Kit' : 'Third Kit';
}

interface KitCardProps {
  notification: KitNotification;
  onDismiss: () => void;
  onDetails?: () => void;
  onNavigate?: () => void;
}

const KIT_DISPLAY_MS = 12000;

function KitCard({ notification, onDismiss, onDetails, onNavigate }: KitCardProps) {
  const [visible, setVisible] = useState(false);
  const [barW, setBarW] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 20);
    const t2 = setTimeout(() => setBarW(0), 80);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 320);
    }, KIT_DISPLAY_MS);
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

  const homeStatic = TEAMS[notification.homeTeamId];
  const awayStatic = TEAMS[notification.awayTeamId];
  const homeName   = homeStatic?.name ?? notification.homeTeamId;
  const awayName   = awayStatic?.name ?? notification.awayTeamId;
  const homeKit    = kitLabel(notification.homeTeamId, notification.homeKitBg);
  const awayKit    = kitLabel(notification.awayTeamId, notification.awayKitBg);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
      }`}
    >
      <div className="relative rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.85)]"
           style={{ background: 'linear-gradient(135deg, #0a1628 0%, #060e1a 100%)' }}>

        {/* Gold border */}
        <div className="absolute inset-0 rounded-2xl border border-[#C9A84C]/25 pointer-events-none" />

        {/* Progress bar */}
        <div
          className="absolute top-0 left-0 h-[2px] bg-[#C9A84C] transition-all ease-linear"
          style={{ width: `${barW}%`, transitionDuration: `${KIT_DISPLAY_MS}ms` }}
        />

        {/* Header strip */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/8">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#C9A84C]">
            🎽 Kits Locked In!
          </span>
          <button onClick={(e) => { e.stopPropagation(); dismiss(); }} className="p-1 text-white/25 hover:text-white/55 transition-colors">
            <X size={11} />
          </button>
        </div>

        {/* Two-column kit reveal — clickable to navigate to match */}
        <div className={`flex ${onNavigate ? 'cursor-pointer' : ''}`} onClick={onNavigate}>

          {/* Home team column */}
          <div className="flex-1 flex flex-col items-center py-4 px-3 relative">
            {/* Subtle kit color tint */}
            <div
              className="absolute inset-0"
              style={{ background: `radial-gradient(ellipse at center top, ${notification.homeKitBg}20 0%, transparent 70%)` }}
            />
            <KitImage
              teamId={notification.homeTeamId}
              kitBg={notification.homeKitBg}
              kitText={notification.homeKitText}
              size="md"
              className="relative drop-shadow-xl mb-2"
            />
            <div className="flex items-center gap-1.5 relative">
              {homeStatic?.flag && (
                <img src={homeStatic.flag} alt="" className="w-5 h-[14px] object-cover rounded-sm border border-white/15 shrink-0" />
              )}
              <span className="text-white text-[10px] font-black uppercase tracking-wide truncate">{homeName}</span>
            </div>
            <span
              className="text-[8px] font-bold uppercase tracking-widest mt-0.5 relative"
              style={{ color: `${notification.homeKitBg}cc` === notification.homeKitBg ? '#94a3b8' : notification.homeKitBg }}
            >
              {homeKit}
            </span>
          </div>

          {/* Divider */}
          <div className="w-px bg-white/8 my-3" />

          {/* Away team column */}
          <div className="flex-1 flex flex-col items-center py-4 px-3 relative">
            {/* Subtle kit color tint */}
            <div
              className="absolute inset-0"
              style={{ background: `radial-gradient(ellipse at center top, ${notification.awayKitBg}20 0%, transparent 70%)` }}
            />
            <KitImage
              teamId={notification.awayTeamId}
              kitBg={notification.awayKitBg}
              kitText={notification.awayKitText}
              size="md"
              className="relative drop-shadow-xl mb-2"
            />
            <div className="flex items-center gap-1.5 relative">
              {awayStatic?.flag && (
                <img src={awayStatic.flag} alt="" className="w-5 h-[14px] object-cover rounded-sm border border-white/15 shrink-0" />
              )}
              <span className="text-white text-[10px] font-black uppercase tracking-wide truncate">{awayName}</span>
            </div>
            <span
              className="text-[8px] font-bold uppercase tracking-widest mt-0.5 relative"
              style={{ color: notification.awayKitBg }}
            >
              {awayKit}
            </span>
          </div>
        </div>

        {/* Footer */}
        {(onDetails || onNavigate) && (
          <div className="flex items-center px-4 pb-3" onClick={(e) => e.stopPropagation()}>
            <PillButton onClick={onDetails ?? onNavigate} gold>Details</PillButton>
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
  kitNotification?: KitNotification | null;
  onKitDismiss?: () => void;
  onKitNavigate?: () => void;
}

export const GoalBanner: React.FC<GoalBannerProps> = ({
  notification,
  homeTeam,
  awayTeam,
  onDismiss,
  onShowLive,
  onNavigate,
  kitNotification,
  onKitDismiss,
  onKitNavigate,
}) => {
  if (!notification && !kitNotification) return null;

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
          />
        )}
        {kitNotification && (
          <KitCard
            key={kitNotification.id}
            notification={kitNotification}
            onDismiss={onKitDismiss ?? (() => {})}
            onNavigate={onKitNavigate}
          />
        )}
      </div>
    </div>,
    document.body
  );
};
