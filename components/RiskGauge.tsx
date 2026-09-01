import React from 'react';

// 10 tiers instead of the old 3 (Banker/Balanced/Wildcard) — same spectrum,
// finer-grained, with a playful nickname per band riffing on real managers'
// well-known (and generally beloved) tactical reputations, low-risk to
// bare banker through total chaos. Purely a fun label for the player's own
// picking style — not a claim about any team or match in the competition.
export interface RiskTier {
  max: number; // upper bound of this tier on the 0-1 scale (inclusive)
  name: string;
  icon: string;
  color: string;
}

export const RISK_TIERS: RiskTier[] = [
  { max: 0.10, name: 'The Mourinho',     icon: '🚌', color: '#3b82f6' },
  { max: 0.20, name: 'The Simeone',      icon: '🛡️', color: '#38a5eb' },
  { max: 0.30, name: 'The Arteta',       icon: '📐', color: '#22c3d6' },
  { max: 0.40, name: 'The Guardiola',    icon: '⚙️', color: '#22c55e' },
  { max: 0.50, name: 'The Ancelotti',    icon: '⚖️', color: '#84cc16' },
  { max: 0.60, name: 'The Klopp',        icon: '🌊', color: '#eab308' },
  { max: 0.70, name: 'The Xabi Alonso',  icon: '🚀', color: '#f59e0b' },
  { max: 0.80, name: 'The Postecoglou',  icon: '🎢', color: '#f97316' },
  { max: 0.90, name: 'The Bielsa',       icon: '🌪️', color: '#ef4444' },
  { max: 1.001, name: 'The Wildcard',    icon: '🎰', color: '#dc2626' },
];

export const getRiskTier = (value: number): RiskTier => {
  const v = value ?? 0.5;
  return RISK_TIERS.find(t => v <= t.max) ?? RISK_TIERS[RISK_TIERS.length - 1];
};

const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
};

interface RiskGaugeProps {
  value: number; // 0-1
  width?: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ value, width = 96 }) => {
  const v = Math.max(0, Math.min(1, value ?? 0.5));
  const cx = 100, cy = 100, r = 80, strokeW = 16;

  const bounds = RISK_TIERS.map((t, i) => (i === 0 ? 0 : RISK_TIERS[i - 1].max));
  const segments = RISK_TIERS.map((t, i) => {
    const startVal = bounds[i];
    const endVal = Math.min(t.max, 1);
    const a1 = 180 - startVal * 180;
    const a2 = 180 - endVal * 180;
    const p1 = polarToCartesian(cx, cy, r, a1);
    const p2 = polarToCartesian(cx, cy, r, a2);
    return { d: `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A ${r} ${r} 0 0 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`, color: t.color };
  });

  const needleAngle = 180 - v * 180;
  const needleTip = polarToCartesian(cx, cy, r - strokeW / 2 - 4, needleAngle);

  return (
    <svg viewBox="0 0 200 112" width={width} height={width * 0.56} className="overflow-visible">
      {segments.map((s, i) => (
        <path key={i} d={s.d} fill="none" stroke={s.color} strokeWidth={strokeW} strokeLinecap="butt" opacity={0.9} />
      ))}
      <line x1={cx} y1={cy} x2={needleTip.x} y2={needleTip.y} stroke="white" strokeWidth={3} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="white" />
      <circle cx={cx} cy={cy} r={6} fill="none" stroke="#0f2545" strokeWidth={1.5} />
    </svg>
  );
};
