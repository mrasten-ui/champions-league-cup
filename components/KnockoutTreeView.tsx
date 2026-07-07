import React, { useRef, useEffect } from 'react';
import { Match, Team, Translation, Prediction } from '../types';

interface KnockoutTreeViewProps {
  matches: Match[];
  teams: Record<string, Team>;
  userPredictions: Prediction[];
  onUpdate: (id: string, h: number, a: number) => void;
  lang: Translation;
  highlightedMatchId?: string | null;
}

// ── Layout constants ────────────────────────────────────────
const CARD_W    = 148;  // card width px
const CARD_H    = 46;   // card height px (2 rows × 22px + 1px divider + 1px)
const BASE_SLOT = 62;   // vertical slot height per R32 match
const COL_GAP   = 36;   // horizontal gap between columns (split evenly for stubs)
const STUB      = COL_GAP / 2; // 18px each side of vertical bar
const HDR_H     = 36;   // header row height above the bracket
const LINE_C    = 'rgba(148,163,184,0.6)'; // slate-400 at 60%
const LINE_W    = 2;

// ── Compact bracket card ─────────────────────────────────────
const BracketCard: React.FC<{
  match: Match; teams: Record<string, Team>; preds: Prediction[]; highlighted: boolean;
}> = ({ match, teams, preds, highlighted }) => {
  const home = teams[match.homeTeamId];
  const away = teams[match.awayTeamId];
  const pred = preds.find(p => p.matchId === match.id);

  const hs  = match.homeScore ?? pred?.home;
  const as_ = match.awayScore ?? pred?.away;
  const fin  = ['FINISHED', 'FT', 'AET', 'PEN'].includes(match.status);
  const live = ['LIVE', '1H', '2H', 'HT', 'P'].includes(match.status);
  const played = fin || live;
  const isPen = match.status === 'PEN';

  // For PEN matches the sync function stores winner's score as ftDraw+1 and loser's as ftDraw,
  // so the FT/AET score (a draw) = min(homeScore, awayScore). Show that for both teams.
  const ftDraw = isPen && typeof hs === 'number' && typeof as_ === 'number'
    ? Math.min(hs, as_) : undefined;
  const displayHs = ftDraw ?? hs;
  const displayAs = ftDraw ?? as_;

  const homeW = played && typeof hs === 'number' && typeof as_ === 'number' && hs > as_;
  const awayW = played && typeof hs === 'number' && typeof as_ === 'number' && as_ > hs;

  const Row = ({ team, score, win, penWin }: { team?: Team; score?: number | null; win: boolean; penWin?: boolean }) => (
    <div className={`flex items-center gap-1.5 px-2 ${win ? 'bg-white/[0.06]' : ''}`} style={{ height: 22 }}>
      {team?.flag
        ? <img src={team.flag} className="w-[18px] h-[13px] object-cover rounded-sm shrink-0" alt="" />
        : <div className="w-[18px] h-[13px] bg-white/10 rounded-sm shrink-0 border border-dashed border-white/15" />
      }
      <span className={`flex-1 text-[10px] truncate leading-none ${win ? 'font-black text-white' : 'font-medium text-slate-400'}`}>
        {team?.name ?? 'TBD'}
      </span>
      {penWin && <span className="text-[8px] font-black text-yellow-400 leading-none mr-0.5">P</span>}
      <span className={`text-[10px] font-black ml-1 shrink-0 tabular-nums leading-none
        ${win ? 'text-yellow-400' : played ? 'text-slate-400' : 'text-slate-700'}`}>
        {played ? (score ?? '–') : '–'}
      </span>
    </div>
  );

  return (
    <div
      id={`bracket-match-${match.id}`}
      className={`bg-[#0f2545] rounded-lg border overflow-hidden transition-all duration-700
        ${live      ? 'border-red-500/70 shadow-[0_0_10px_rgba(239,68,68,0.35)]' : 'border-white/10'}
        ${highlighted ? 'ring-2 ring-yellow-400 shadow-[0_0_16px_rgba(250,204,21,0.5)]' : ''}`}
      style={{ width: CARD_W, height: CARD_H }}
    >
      <Row team={home} score={displayHs} win={homeW} penWin={isPen && homeW} />
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
      <Row team={away} score={displayAs} win={awayW} penWin={isPen && awayW} />
      {live && (
        <div className="bg-red-600 text-white text-[6px] font-black uppercase tracking-[0.2em] text-center" style={{ lineHeight: '10px' }}>
          {match.status === 'P' ? 'PSO' : 'LIVE'}
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────
export const KnockoutTreeView: React.FC<KnockoutTreeViewProps> = ({
  matches, teams, userPredictions, lang, highlightedMatchId,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const label = (r: string) =>
    ({ R32: lang.roundOf32 ?? 'Round of 32', R16: lang.roundOf16 ?? 'Round of 16',
       QF: lang.quarterFinal ?? 'Quarter Final', SF: lang.semiFinal ?? 'Semi Final',
       '3RD': lang.thirdPlace ?? '3rd Place', FIN: lang.final ?? 'Final' }[r] ?? r);

  // Visual order: adjacent pairs must feed the same next-round match so the
  // connector line loop (i, i+1) → i/2 draws correctly.
  // Derived from actual real FIFA 2026 bracket (DB team placements):
  // R32 pairs: R32_3+R32_6→R16_3, R32_1+R32_4→R16_1, R32_2+R32_5→R16_2, R32_11+R32_10→R16_4,
  //            R32_13+R32_15→R16_6, R32_7+R32_12→R16_5, R32_9+R32_8→R16_7, R32_16+R32_14→R16_8
  // R16 pairs: R16_3+R16_1→QF_1, R16_2+R16_4→QF_2, R16_6+R16_5→QF_3, R16_7+R16_8→QF_4
  const VISUAL_ORDER: Record<string, string[]> = {
    R32: ['R32_3','R32_6','R32_1','R32_4','R32_2','R32_5','R32_11','R32_10',
          'R32_13','R32_15','R32_7','R32_12','R32_9','R32_8','R32_16','R32_14'],
    R16: ['R16_3','R16_1','R16_2','R16_4','R16_6','R16_5','R16_7','R16_8'],
    QF:  ['QF_1','QF_2','QF_3','QF_4'],
    SF:  ['SF_1','SF_2'],
    FIN: ['FIN_1'],
    '3RD': ['3RD_1'],
  };

  const sorted = (r: string) => {
    const order = VISUAL_ORDER[r];
    const roundMatches = matches.filter(m => m.round === r);
    if (!order) return roundMatches.sort((a, b) => parseInt(a.id.split('_')[1]||'0') - parseInt(b.id.split('_')[1]||'0'));
    return order.map(id => roundMatches.find(m => m.id === id)).filter((m): m is Match => m !== undefined);
  };

  const MAIN = ['R32', 'R16', 'QF', 'SF', 'FIN'];
  const present = MAIN.filter(r => matches.some(m => m.round === r));
  const has3rd  = matches.some(m => m.round === '3RD');

  // Slot multiplier relative to R32
  const mult: Record<string, number> = { R32: 1, R16: 2, QF: 4, SF: 8, FIN: 16 };

  const r32Count = Math.max(sorted('R32').length, 2);
  const totalH   = r32Count * BASE_SLOT;

  // Column x starts (all measured from 0 inside the relative container)
  const colX: Record<string, number> = {};
  present.forEach((r, i) => { colX[r] = i * (CARD_W + COL_GAP); });

  // Card top (y) for a match at index within its round
  const cardTop = (r: string, idx: number): number => {
    const slotH = (mult[r] ?? 1) * BASE_SLOT;
    return idx * slotH + (slotH - CARD_H) / 2;
  };

  // Card vertical midpoint
  const midY = (r: string, idx: number) => cardTop(r, idx) + CARD_H / 2;

  // Active round
  const activeRound = (() => {
    for (const r of present) {
      if (sorted(r).some(m => ['LIVE', '1H', '2H', 'HT', 'NS'].includes(m.status))) return r;
    }
    return present[present.length - 1] ?? 'FIN';
  })();

  // Auto-scroll to active round
  useEffect(() => {
    if (!scrollRef.current) return;
    const idx = present.indexOf(activeRound);
    if (idx < 0) return;
    const x = colX[activeRound] - scrollRef.current.clientWidth / 2 + CARD_W / 2;
    scrollRef.current.scrollTo({ left: Math.max(0, x), behavior: 'smooth' });
  }, [activeRound]);

  const totalW = present.length * CARD_W + (present.length - 1) * COL_GAP;

  // ── Connector lines ──────────────────────────────────────────
  // Each line is: { x, y, w, h } in px relative to the bracket container (below headers)
  const lines: { key: string; x: number; y: number; w: number; h: number }[] = [];

  for (let ri = 0; ri < present.length - 1; ri++) {
    const rA = present[ri];
    const rB = present[ri + 1];
    const rAMs = sorted(rA);

    for (let i = 0; i < rAMs.length; i += 2) {
      const y1     = midY(rA, i);
      const y2     = i + 1 < rAMs.length ? midY(rA, i + 1) : y1;
      const yMid   = (y1 + y2) / 2;
      const rightX  = colX[rA] + CARD_W;   // right edge of card
      const vbarX   = rightX + STUB;        // x of the vertical bar
      const nextLX  = colX[rB];             // left edge of next column's card

      // Stub right from card 1
      lines.push({ key: `${rA}-${i}-s1`, x: rightX, y: y1 - 1, w: STUB, h: LINE_W });
      // Stub right from card 2
      if (i + 1 < rAMs.length) {
        lines.push({ key: `${rA}-${i}-s2`, x: rightX, y: y2 - 1, w: STUB, h: LINE_W });
      }
      // Vertical bar connecting the two stubs
      const barTop = Math.min(y1, y2) - 1;
      const barH   = Math.abs(y2 - y1) + LINE_W;
      lines.push({ key: `${rA}-${i}-v`, x: vbarX - 1, y: barTop, w: LINE_W, h: barH });
      // Horizontal stub from bar midpoint into next card
      lines.push({ key: `${rA}-${i}-l`, x: vbarX, y: yMid - 1, w: nextLX - vbarX, h: LINE_W });
    }
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="pb-8 pt-2">

      {/* Round progress strip */}
      <div className="flex items-center justify-center mb-4">
        {['R32', 'R16', 'QF', 'SF', 'FIN'].map((r, i, arr) => {
          const ms   = matches.filter(m => m.round === r);
          const done = ms.length > 0 && ms.every(m => ['FINISHED','FT','AET','PEN'].includes(m.status));
          const act  = r === activeRound && ms.length > 0;
          const has  = ms.length > 0;
          return (
            <React.Fragment key={r}>
              <div className="flex flex-col items-center gap-[3px]">
                <div className={`w-2 h-2 rounded-full transition-colors
                  ${act ? 'bg-yellow-400' : done ? 'bg-green-500' : has ? 'bg-slate-600' : 'bg-slate-800'}`} />
                <span className={`text-[8px] font-bold ${act ? 'text-yellow-400' : done ? 'text-green-500' : 'text-slate-600'}`}>{r}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={`h-px w-6 mx-1 transition-colors ${done ? 'bg-green-500/50' : 'bg-slate-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Bracket */}
      <div ref={scrollRef} className="overflow-x-auto pb-2 cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>

        {/* Sizing wrapper — gives the scrollable div something to measure */}
        <div style={{ display: 'inline-block', paddingLeft: 16, paddingRight: 16 }}>

          {/* Single coordinate system for headers + connectors + cards */}
          <div className="relative" style={{ width: totalW, height: HDR_H + totalH + (has3rd ? 80 : 8) }}>

            {/* ── Column headers ── */}
            {present.map(r => {
              const ms   = sorted(r);
              const done = ms.length > 0 && ms.every(m => ['FINISHED','FT','AET','PEN'].includes(m.status));
              const act  = r === activeRound;
              return (
                <div key={`hdr-${r}`} className="absolute flex items-end justify-center pb-2"
                  style={{ left: colX[r], top: 0, width: CARD_W, height: HDR_H }}>
                  <span className={`text-[9px] font-black uppercase tracking-widest border-b pb-1
                    ${act ? 'text-yellow-400 border-yellow-400/40' : done ? 'text-green-500 border-green-500/30' : 'text-slate-500 border-white/8'}`}>
                    {label(r)}
                  </span>
                </div>
              );
            })}

            {/* ── Connector lines ── (positioned below header) */}
            {lines.map(l => (
              <div key={l.key} className="absolute pointer-events-none"
                style={{ left: l.x, top: HDR_H + l.y, width: l.w, height: l.h, background: LINE_C }} />
            ))}

            {/* ── Cards ── */}
            {present.flatMap(r =>
              sorted(r).map((m, idx) => (
                <div key={m.id} className="absolute"
                  style={{ left: colX[r], top: HDR_H + cardTop(r, idx) }}>
                  <BracketCard match={m} teams={teams} preds={userPredictions}
                    highlighted={m.id === highlightedMatchId} />
                </div>
              ))
            )}

            {/* ── 3rd place ── (below FIN, no connectors) */}
            {has3rd && (() => {
              const finX = colX['FIN'] ?? colX[present[present.length - 1]] ?? 0;
              return sorted('3RD').map(m => (
                <div key={m.id}>
                  <div className="absolute text-[9px] font-black uppercase tracking-widest text-slate-500 text-center"
                    style={{ left: finX, top: HDR_H + totalH + 14, width: CARD_W }}>
                    {label('3RD')}
                  </div>
                  <div className="absolute" style={{ left: finX, top: HDR_H + totalH + 34 }}>
                    <BracketCard match={m} teams={teams} preds={userPredictions}
                      highlighted={m.id === highlightedMatchId} />
                  </div>
                </div>
              ));
            })()}

          </div>
        </div>
      </div>
    </div>
  );
};
