import React from 'react';

interface RiskSliderProps {
  idSuffix: string; // unique per instance — two of these can render on the same page
  value: number; // 0-100
  onChange: (v: number) => void;
  title: string;
  lowLabel: string;
  lowIcon?: string;
  midLabel: string;
  highLabel: string;
  highIcon?: string;
  lowDesc: string;
  midDesc: string;
  highDesc: string;
}

/**
 * Two-zone-color risk slider — extracted from HelpingHandModal's Magic Wand
 * slider so both the result-risk and scoring-volume axes can reuse the same
 * look. HelpingHandModal keeps its own inline copy (untouched) since it's a
 * one-off in-context action, not a persisted preference.
 */
export const RiskSlider: React.FC<RiskSliderProps> = ({
  idSuffix, value, onChange, title, lowLabel, lowIcon, midLabel, highLabel, highIcon, lowDesc, midDesc, highDesc
}) => {
  const sliderId = `risk-slider-${idSuffix}`;

  const zone = value <= 33 ? 'low' : value <= 66 ? 'mid' : 'high';
  const zoneLabel = zone === 'low' ? lowLabel : zone === 'mid' ? midLabel : highLabel;
  const zoneDesc = zone === 'low' ? lowDesc : zone === 'mid' ? midDesc : highDesc;

  // Thumb colour interpolates blue → yellow → red as value goes 0 → 50 → 100
  const calcColor = (pos: number): [number, number, number] => {
    const p = pos / 100;
    if (p <= 0.5) { const s = p * 2; return [Math.round(59 + 175 * s), Math.round(130 + 49 * s), Math.round(246 - 238 * s)]; }
    const s = (p - 0.5) * 2;
    return [Math.round(234 + 5 * s), Math.round(179 - 111 * s), Math.round(8 + 60 * s)];
  };
  const [tr, tg, tb] = calcColor(value);
  const thumbRgb = `rgb(${tr}, ${tg}, ${tb})`;
  const midL = value * 0.5;
  const midR = value + (100 - value) * 0.5;
  const tc = (pos: number, alpha: number) => { const [r, g, b] = calcColor(pos); return `rgba(${r},${g},${b},${alpha})`; };
  const trackBg = `linear-gradient(to right, ${tc(0, 0.70)} 0%, ${tc(midL, 0.30)} ${midL}%, ${tc(value, 0.95)} ${value}%, ${tc(midR, 0.30)} ${midR}%, ${tc(100, 0.70)} 100%)`;

  return (
    <div className="px-4 py-3 bg-[#0f172a] border border-slate-800 rounded-2xl">
      <style>{`
        #${sliderId} { appearance: none; -webkit-appearance: none; outline: none; }
        #${sliderId}::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px; height: 28px;
          border-radius: 4px;
          background: ${thumbRgb};
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.9);
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        }
        #${sliderId}::-moz-range-thumb {
          width: 10px; height: 28px;
          border-radius: 4px;
          background: ${thumbRgb};
          cursor: pointer;
          border: 2px solid rgba(255,255,255,0.9);
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        }
      `}</style>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] font-black text-white uppercase tracking-widest">{title}</p>
        <span className="text-[9px] font-bold italic" style={{ color: thumbRgb }}>{zoneLabel} — {zoneDesc}</span>
      </div>
      <div className="py-2">
        <input
          id={sliderId}
          type="range" min="0" max="100" value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full cursor-pointer"
          style={{ height: '8px', borderRadius: '9999px', background: trackBg }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] font-bold text-blue-400">{lowIcon} {lowLabel}</span>
        <span className="text-[8px] font-bold text-yellow-400">{midLabel}</span>
        <span className="text-[8px] font-bold text-red-400">{highLabel} {highIcon}</span>
      </div>
    </div>
  );
};
