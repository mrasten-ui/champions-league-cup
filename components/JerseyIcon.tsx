import React from 'react';

interface JerseyIconProps {
  bg?: string;
  text?: string;
  number?: number | null;
  size?: number;
  className?: string;
}

function hexLuminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const JerseyIcon: React.FC<JerseyIconProps> = ({
  bg = '#E2E8F0',
  text = '#64748B',
  number,
  size = 32,
  className = '',
}) => {
  const hasNumber = number != null;
  const isLight = hexLuminance(bg) > 0.6;
  const outlineColor = isLight ? '#CBD5E1' : 'none';
  const collarFill = isLight ? '#F1F5F9' : 'rgba(255,255,255,0.15)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Jersey body */}
      <path
        d="M35 8
           L10 28 L18 36 L26 30
           L26 88 L74 88 L74 30
           L82 36 L90 28
           L65 8
           Q50 22 35 8 Z"
        fill={bg}
        stroke={outlineColor}
        strokeWidth={isLight ? '1.5' : '0'}
      />
      {/* Collar cutout */}
      <path
        d="M35 8 Q50 22 65 8 Q55 18 50 18 Q45 18 35 8 Z"
        fill={collarFill}
      />
      {/* Player number */}
      {hasNumber && (
        <text
          x="50"
          y="68"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={text}
          fontSize={number! > 9 ? '34' : '40'}
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          letterSpacing="-1"
        >
          {number}
        </text>
      )}
    </svg>
  );
};
