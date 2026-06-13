import React, { useState } from 'react';
import { TEAMS } from '../constants';
import { JerseyIcon } from './JerseyIcon';

// ── Kit type resolver ─────────────────────────────────────────────────────────

export function resolveKitType(
  teamId: string,
  kitBg: string | null | undefined,
): 'home' | 'away' {
  if (!kitBg) return 'home';
  const staticBg = TEAMS[teamId]?.jerseyBg;
  if (!staticBg) return 'home';
  return staticBg.replace('#', '').toUpperCase() === kitBg.replace('#', '').toUpperCase()
    ? 'home'
    : 'away';
}

// ── File name overrides where the PNG name differs from the app team ID ───────
const FILE_ID_OVERRIDE: Record<string, string> = {
  HAI: 'HTI', // app ID → PNG filename prefix
  PAR: 'PRY',
  SUI: 'CHE',
};

function kitPath(teamId: string, type: 'home' | 'away') {
  const fileId = FILE_ID_OVERRIDE[teamId] ?? teamId;
  return `/kits/${fileId}-${type}.png`;
}

// ── Size classes ──────────────────────────────────────────────────────────────

const SIZE_CLASS = {
  xs: 'w-[18px] h-[26px]',
  sm: 'w-[29px] h-[40px]',
  md: 'w-[34px] h-[48px]',
} as const;

const JERSEY_SIZE = { xs: 22, sm: 38, md: 46 } as const;

// ── Component ─────────────────────────────────────────────────────────────────

export interface KitImageProps {
  teamId: string;
  /** Live API kit hex — used to auto-resolve home/away */
  kitBg?: string | null;
  kitText?: string | null;
  kitType?: 'home' | 'away';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const KitImage: React.FC<KitImageProps> = ({
  teamId,
  kitBg,
  kitText,
  kitType,
  size = 'sm',
  className = '',
}) => {
  const [failed, setFailed] = useState(false);

  const type = kitType ?? resolveKitType(teamId, kitBg);
  const src  = kitPath(teamId, type);

  if (failed) {
    // No PNG for this team yet — fall back to the SVG jersey with API colors
    if (!kitBg) return null;
    return (
      <JerseyIcon
        bg={kitBg}
        text={kitText ?? '#ffffff'}
        size={JERSEY_SIZE[size]}
        className={`shrink-0 ${className}`}
      />
    );
  }

  return (
    <img
      src={src}
      className={`shrink-0 object-contain ${SIZE_CLASS[size]} ${className}`}
      onError={() => setFailed(true)}
      loading="lazy"
      decoding="async"
      alt=""
    />
  );
};
