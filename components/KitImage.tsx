import React, { useState } from 'react';
import { TEAMS } from '../constants';
import { JerseyIcon } from './JerseyIcon';

// ── Kit type resolver ─────────────────────────────────────────────────────────

function hexHue(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  const hue = max === r ? ((g - b) / d + (g < b ? 6 : 0))
            : max === g ? ((b - r) / d + 2)
            :             ((r - g) / d + 4);
  return hue * 60;
}

export function resolveKitType(
  teamId: string,
  kitBg: string | null | undefined,
): 'home' | 'away' {
  if (!kitBg) return 'home';
  const staticBg = TEAMS[teamId]?.jerseyBg;
  if (!staticBg) return 'home';
  const h1 = hexHue(staticBg), h2 = hexHue(kitBg);
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff) <= 40 ? 'home' : 'away';
}

// ── File name overrides where the PNG name differs from the app team ID ───────
const FILE_ID_OVERRIDE: Record<string, string> = {
  HAI: 'HTI', // app ID → PNG filename prefix
  PAR: 'PRY',
  SUI: 'CHE',
};

function kitPath(teamId: string, type: 'home' | 'away' | 'third') {
  const fileId = FILE_ID_OVERRIDE[teamId] ?? teamId;
  return `/kits/${fileId}-${type}.png`;
}

// ── Size classes ──────────────────────────────────────────────────────────────

const SIZE_CLASS = {
  xs: 'w-[18px] h-[26px]',
  sm: 'w-[46px] h-[64px]',
  md: 'w-[58px] h-[82px]',
} as const;

const JERSEY_SIZE = { xs: 22, sm: 62, md: 78 } as const;

// ── Component ─────────────────────────────────────────────────────────────────

export interface KitImageProps {
  teamId: string;
  /** Live API kit hex — used to auto-resolve home/away */
  kitBg?: string | null;
  kitText?: string | null;
  kitType?: 'home' | 'away' | 'third';
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
  // 'primary' → try home/away; 'third' → try third kit; 'svg' → SVG fallback
  const [phase, setPhase] = useState<'primary' | 'third' | 'svg'>('primary');

  const resolvedType = kitType ?? resolveKitType(teamId, kitBg);
  const src = phase === 'primary' ? kitPath(teamId, resolvedType) : kitPath(teamId, 'third');

  const handleError = () => {
    if (phase === 'primary') setPhase('third');
    else setPhase('svg');
  };

  if (phase === 'svg') {
    const bg   = kitBg   ?? TEAMS[teamId]?.jerseyBg;
    const text = kitText ?? TEAMS[teamId]?.jerseyText;
    if (!bg) return null;
    return (
      <JerseyIcon
        bg={bg}
        text={text ?? '#ffffff'}
        size={JERSEY_SIZE[size]}
        className={`shrink-0 ${className}`}
      />
    );
  }

  return (
    <img
      src={src}
      className={`shrink-0 object-contain ${SIZE_CLASS[size]} ${className}`}
      onError={handleError}
      loading="lazy"
      decoding="async"
      alt=""
    />
  );
};
