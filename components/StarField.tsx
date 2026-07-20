import React, { useMemo } from 'react';

interface StarFieldProps {
  className?: string;
  density?: number;
  variant?: 'subtle' | 'vivid';
}

/**
 * Decorative scattered-star backdrop, evoking a floodlit matchnight sky rather
 * than any specific competition's trademarked mark. Purely ornamental —
 * absolutely positioned, pointer-events disabled, safe to layer behind content.
 */
export const StarField: React.FC<StarFieldProps> = ({ className = '', density = 28, variant = 'subtle' }) => {
  const stars = useMemo(() => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    return Array.from({ length: density }, (_, i) => ({
      id: i,
      x: rand() * 100,
      y: rand() * 100,
      size: 1 + rand() * 2.2,
      delay: rand() * 4,
      duration: 2.5 + rand() * 3,
      opacity: variant === 'vivid' ? 0.4 + rand() * 0.6 : 0.15 + rand() * 0.35,
    }));
  }, [density, variant]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      <style>{`
        @keyframes starTwinkle { 0%, 100% { opacity: var(--star-op); transform: scale(1); } 50% { opacity: calc(var(--star-op) * 0.35); transform: scale(0.8); } }
      `}</style>
      {stars.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            boxShadow: `0 0 ${s.size * 3}px rgba(147,197,253,0.8)`,
            ['--star-op' as any]: s.opacity,
            opacity: s.opacity,
            animation: `starTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};
