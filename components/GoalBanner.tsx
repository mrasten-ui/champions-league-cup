import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Team } from '../types';
import { TEAMS } from '../constants';
import { JerseyIcon } from './JerseyIcon';
import { KitImage } from './KitImage';

// ── Types ─────────────────────────────────────────────────────────────────────

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

function Card({
  visible,
  accentColor,
  children,
}: {
  visible: boolean;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`transition-all duration-300 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
      }`}
    >
      <div
        className="relative rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.7)]"
        style={{
          background:
            'linear-gradient(135deg, rgba(8,17,31,0.98) 0%, rgba(10,22,40,0.96) 100%)',
        }}
      >
        {/* gold border overlay */}
        <div className="absolute inset-0 rounded-2xl border border-[#C9A84C]/20 pointer-events-none" />
        {/* team color accent strip */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{
            background: `linear-gradient(to bottom, ${accentColor}dd, ${accentColor}55)`,
          }}
        />
        {children}
      </div>
    </div>
  );
}

// ── Goal Card (Variant A + B combined) ───────────────────────────────────────

const GOAL_DISPLAY_MS = 9000;

interface GoalCardProps {
  notification: GoalNotification;
  homeTeam?: Team;
  awayTeam?: Team;
  onDismiss: () => void;
  onShowLive?: () => void;
}

function GoalCard({ notification, homeTeam, awayTeam, onDismiss, onShowLive }: GoalCardProps) {
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

  const staticTeam = TEAMS[notification.teamId];
  const scoringFlag = staticTeam?.flag;
  const scoringName = staticTeam?.name ?? notification.teamId;
  const teamColor   = staticTeam?.jerseyBg ?? (isVAR ? '#8B5CF6' : '#C9A84C');

  const eventLabel = isVAR ? 'GOAL DISALLOWED' : isOG ? 'OWN GOAL' : isPen ? 'PENALTY GOAL' : 'GOAL';
  const labelColor  = isVAR ? '#A78BFA' : isOG ? '#F97316' : '#C9A84C';
  const emoji       = isVAR ? '🚫' : '⚽';

  const narrative = (() => {
    if (isVAR)  return `Video review overturns the goal · ${notification.player ?? scoringName}`;
    if (isOG)   return `Unfortunate own goal · ${notification.player ?? 'Defender'}`;
    if (isPen)  return `${notification.player ?? scoringName} converts from the spot`;
    return notification.player
      ? `${notification.player} finds the net in the ${notification.minute}th minute`
      : `${scoringName} take the lead at ${min}`;
  })();

  return (
    <Card visible={visible} accentColor={teamColor}>
      {/* shrinking progress bar */}
      <div
        className="absolute top-0 left-0 h-[2px] transition-all ease-linear"
        style={{
          width: `${barW}%`,
          transitionDuration: `${GOAL_DISPLAY_MS}ms`,
          background: `linear-gradient(to right, ${teamColor}99, ${teamColor})`,
        }}
      />

      <div className="flex items-start gap-2.5 pl-4 pr-2.5 py-3">
        {/* team flag */}
        <div className="shrink-0 mt-0.5">
          {scoringFlag ? (
            <img
              src={scoringFlag}
              alt=""
              className="w-10 h-7 object-cover rounded border border-white/15 shadow-md"
            />
          ) : (
            <div className="w-10 h-7 rounded bg-white/8 border border-white/10" />
          )}
        </div>

        {/* main content */}
        <div className="flex-1 min-w-0">
          {/* label row */}
          <div className="flex items-center gap-1.5 mb-[2px]">
            <span
              className="text-[9px] font-black uppercase tracking-widest"
              style={{ color: labelColor }}
            >
              {emoji} {eventLabel}
            </span>
            <span className="text-white/25 text-[9px]">·</span>
            <span className="text-white/45 text-[9px] font-bold">{min}</span>
            {!isVAR && <LiveBadge />}
          </div>
          {/* team name */}
          <div className="text-white text-[13px] font-black uppercase tracking-wide leading-tight truncate">
            {scoringName}
          </div>
          {/* narrative */}
          <div className="text-white/40 text-[9px] mt-0.5 leading-snug line-clamp-1">
            {narrative}
          </div>
        </div>

        {/* right column: score + buttons */}
        <div className="shrink-0 flex flex-col items-end gap-1.5 ml-1">
          {/* score badge */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/8 rounded-lg px-2 py-1">
            {homeTeam?.flag && (
              <img
                src={homeTeam.flag}
                alt=""
                className="w-4 h-[11px] object-cover rounded-sm"
              />
            )}
            <span className="text-white font-black text-xs tabular-nums tracking-tight">
              {notification.homeScore}–{notification.awayScore}
            </span>
            {awayTeam?.flag && (
              <img
                src={awayTeam.flag}
                alt=""
                className="w-4 h-[11px] object-cover rounded-sm"
              />
            )}
          </div>
          {/* actions */}
          <div className="flex items-center gap-1">
            {onShowLive && (
              <PillButton onClick={onShowLive} gold>
                Show Live
              </PillButton>
            )}
            <button
              onClick={dismiss}
              className="p-1 text-white/25 hover:text-white/55 transition-colors"
            >
              <X size={11} />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Kit Card (Variant C) ──────────────────────────────────────────────────────

function kitLabel(teamId: string, kitBg: string): string {
  const staticBg = TEAMS[teamId]?.jerseyBg;
  if (!staticBg) return 'Kit';
  const norm = (s: string) => s.replace('#', '').toUpperCase();
  return norm(staticBg) === norm(kitBg) ? 'Home Kit' : 'Away Kit';
}

interface KitCardProps {
  notification: KitNotification;
  onDismiss: () => void;
  onDetails?: () => void;
}

const KIT_DISPLAY_MS = 10000;

function KitCard({ notification, onDismiss, onDetails }: KitCardProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 320);
    }, KIT_DISPLAY_MS);
    return () => {
      clearTimeout(t);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 320);
  };

  const homeName = TEAMS[notification.homeTeamId]?.name ?? notification.homeTeamId;
  const awayName = TEAMS[notification.awayTeamId]?.name ?? notification.awayTeamId;
  const homeKit  = kitLabel(notification.homeTeamId, notification.homeKitBg);
  const awayKit  = kitLabel(notification.awayTeamId, notification.awayKitBg);

  return (
    <Card visible={visible} accentColor="#C9A84C">
      <div className="flex items-center gap-3 pl-4 pr-2.5 py-3">
        {/* jersey icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <KitImage
            teamId={notification.homeTeamId}
            kitBg={notification.homeKitBg}
            kitText={notification.homeKitText}
            size="sm"
          />
          <KitImage
            teamId={notification.awayTeamId}
            kitBg={notification.awayKitBg}
            kitText={notification.awayKitText}
            size="sm"
          />
        </div>

        {/* content */}
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-black uppercase tracking-widest text-[#C9A84C] mb-1">
            🎽 Kits Locked In!
          </div>
          <div className="text-[10px] text-white/55 leading-snug">
            <span className="text-white/85 font-bold">{homeName}</span>
            <span className="text-white/30"> · </span>
            {homeKit}
          </div>
          <div className="text-[10px] text-white/55 leading-snug">
            <span className="text-white/85 font-bold">{awayName}</span>
            <span className="text-white/30"> · </span>
            {awayKit}
          </div>
        </div>

        {/* actions */}
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {onDetails && <PillButton onClick={onDetails} gold>Details</PillButton>}
          <button
            onClick={dismiss}
            className="p-1 text-white/25 hover:text-white/55 transition-colors"
          >
            <X size={11} />
          </button>
        </div>
      </div>
    </Card>
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
  kitNotification?: KitNotification | null;
  onKitDismiss?: () => void;
  onKitDetails?: () => void;
}

export const GoalBanner: React.FC<GoalBannerProps> = ({
  notification,
  homeTeam,
  awayTeam,
  onDismiss,
  onShowLive,
  kitNotification,
  onKitDismiss,
  onKitDetails,
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
          />
        )}
        {kitNotification && (
          <KitCard
            key={kitNotification.id}
            notification={kitNotification}
            onDismiss={onKitDismiss ?? (() => {})}
            onDetails={onKitDetails}
          />
        )}
      </div>
    </div>,
    document.body
  );
};
