import React from 'react';
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

// ── Size classes ──────────────────────────────────────────────────────────────

const JERSEY_SIZE = { xs: 22, sm: 62, md: 78 } as const;

// ── Component ─────────────────────────────────────────────────────────────────
// Renders a colored SVG jersey from live kit-color data (kitBg/kitText), since
// there are no per-club kit PNGs to fall back to.

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
  size = 'sm',
  className = '',
}) => {
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
};
