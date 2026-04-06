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

// --- COMPACT BRACKET CARD ---
// ~148px wide, ~45px tall (two team rows + divider). No full MatchCard — just what a bracket needs.
const BracketCard: React.FC<{
  match: Match;
  teams: Record<string, Team>;
  preds: Prediction[];
  highlighted: boolean;
}> = ({ match, teams, preds, highlighted }) => {
  const home = teams[match.homeTeamId];
  const away = teams[match.awayTeamId];
  const pred = preds.find(p => p.matchId === match.id);

  const hs = match.homeScore ?? pred?.home;
  const as_ = match.awayScore ?? pred?.away;
  const fin  = match.status === 'FINISHED' || match.status === 'FT' || match.status === 'AET' || match.status === 'PEN';
  const live = match.status === 'LIVE' || match.status === '1H' || match.status === '2H' || match.status === 'HT';
  const played = fin || live;
  const homeW = played && typeof hs === 'number' && typeof as_ === 'number' && hs > as_;
  const awayW = played && typeof hs === 'number' && typeof as_ === 'number' && as_ > hs;

  const Row = ({ team, score, win }: { team?: Team; score?: number | null; win: boolean }) => (
    <div className={`flex items-center gap-1.5 px-2 py-[5px] ${win ? 'bg-white/5' : ''}`}>
      {team?.flag
        ? <img src={team.flag} className="w-[18px] h-[13px] object-cover rounded-sm shrink-0" alt="" />
        : <div className="w-[18px] h-[13px] bg-white/10 rounded-sm shrink-0 border border-dashed border-white/15" />
      }
      <span className={`flex-1 text-[10px] truncate ${win ? 'font-black text-white' : 'font-medium text-slate-400'}`}>
        {team?.name ?? 'TBD'}
      </span>
      <span className={`text-[10px] font-black ml-1 shrink-0 ${win ? 'text-yellow-400' : played ? 'text-slate-400' : 'text-slate-700'}`}>
        {played ? (score ?? '–') : '–'}
      </span>
    </div>
  );

  return (
    <div
      id={`bracket-match-${match.id}`}
      className={`
        bg-[#0f2545] rounded-lg border overflow-hidden w-[148px] shrink-0 transition-all duration-700
        ${live      ? 'border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.3)]' : 'border-white/10'}
        ${highlighted ? 'ring-2 ring-yellow-400 scale-[1.04] z-10' : ''}
      `}
    >
      <Row team={home} score={hs} win={homeW} />
      <div className="h-px bg-white/5" />
      <Row team={away} score={as_} win={awayW} />
      {live && (
        <div className="bg-red-600 text-white text-[7px] font-black uppercase tracking-[0.2em] text-center py-[2px]">
          Live
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---
export const KnockoutTreeView: React.FC<KnockoutTreeViewProps> = ({
  matches, teams, userPredictions, lang, highlightedMatchId,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Card geometry constants (must match BracketCard dimensions)
  const CARD_W   = 148; // px  — w-[148px]
  const CARD_H   = 45;  // px  — 2 rows × ~22px + 1px divider
  const PAIR_PY  = 4;   // px  — py-[4px] on each pair wrapper
  const PAIR_GAP = 6;   // px  — gap-[6px] between the two cards in a pair
  const COL_GAP  = 16;  // px  — gap-4 between columns (must equal STUB_W)
  const STUB_W   = 16;  // px  — w-4 horizontal stubs

  // Midpoint of card 1 from top of pair wrapper: padding + half card
  const C1_MID = PAIR_PY + CARD_H / 2;           // 4 + 22 = 26px
  // Midpoint of card 2 from top of pair wrapper: padding + full card + gap + half card
  const C2_MID = PAIR_PY + CARD_H + PAIR_GAP + CARD_H / 2; // 4 + 45 + 6 + 22 = 77px
  // Vertical bar height (C1 mid → C2 mid)
  const VBAR_H  = C2_MID - C1_MID;               // 51px
  // Vertical bar left position (right edge of card + stub width – 1px)
  const VBAR_L  = CARD_W + STUB_W - 1;            // 163px

  const getRoundLabel = (r: string) =>
    ({ R32: lang.roundOf32 ?? 'R32', R16: lang.roundOf16 ?? 'R16', QF: lang.quarterFinal ?? 'QF',
       SF: lang.semiFinal ?? 'SF', FIN: lang.final ?? 'Final', '3RD': lang.thirdPlace ?? '3rd' }[r] ?? r);

  const sorted = (round: string) =>
    matches
      .filter(m => m.round === round)
      .sort((a, b) => parseInt(a.id.split('_')[1] || '0') - parseInt(b.id.split('_')[1] || '0'));

  // Which round is currently live or upcoming?
  const activeRound = (() => {
    for (const r of ['R32', 'R16', 'QF', 'SF', 'FIN']) {
      if (matches.filter(m => m.round === r).some(
        m => m.status === 'LIVE' || m.status === '1H' || m.status === '2H' || m.status === 'HT' || m.status === 'NS'
      )) return r;
    }
    return 'FIN';
  })();

  // Auto-scroll so the active round is roughly centred
  useEffect(() => {
    if (!scrollRef.current) return;
    const colTotalW = CARD_W + COL_GAP;
    const roundOrder = ['R32', 'R16', 'QF', 'SF', 'FIN'];
    const presentRounds = roundOrder.filter(r => matches.some(m => m.round === r));
    const activeIdx = presentRounds.indexOf(activeRound);
    if (activeIdx < 0) return;
    const target = activeIdx * colTotalW - (scrollRef.current.clientWidth / 2) + colTotalW / 2;
    scrollRef.current.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [activeRound, matches]);

  // Render a round column with compact bracket cards and connector lines
  const renderColumn = (round: string, showConnectors: boolean) => {
    const rMatches = sorted(round);
    if (!rMatches.length) return null;
    const isActive = round === activeRound;
    const allDone = rMatches.every(m => m.status === 'FINISHED');

    // Group matches into pairs (each pair feeds one match in the next round)
    const pairs: Match[][] = [];
    for (let i = 0; i < rMatches.length; i += 2) pairs.push(rMatches.slice(i, i + 2));

    return (
      <div key={round} className="flex flex-col" style={{ minWidth: `${CARD_W}px` }}>
        {/* Column header */}
        <div className={`text-center text-[9px] font-black uppercase tracking-widest mb-3 pb-1.5 border-b
          ${isActive ? 'text-yellow-400 border-yellow-400/30' : allDone ? 'text-green-500 border-green-500/20' : 'text-slate-500 border-white/5'}`}>
          {getRoundLabel(round)}
        </div>

        {/* Pairs */}
        <div className="flex flex-col justify-around flex-1">
          {pairs.map((pair, pIdx) => (
            <div key={pIdx} className="relative flex flex-col items-start" style={{ paddingTop: `${PAIR_PY}px`, paddingBottom: `${PAIR_PY}px`, gap: `${PAIR_GAP}px` }}>

              {/* Card 1 + right stub */}
              <div className="relative">
                <BracketCard match={pair[0]} teams={teams} preds={userPredictions} highlighted={pair[0].id === highlightedMatchId} />
                {showConnectors && (
                  <div className="absolute bg-slate-400" style={{ left: `${CARD_W}px`, top: `${CARD_H / 2 - 1}px`, width: `${STUB_W}px`, height: '2px' }} />
                )}
              </div>

              {/* Card 2 + right stub */}
              {pair[1] && (
                <div className="relative">
                  <BracketCard match={pair[1]} teams={teams} preds={userPredictions} highlighted={pair[1].id === highlightedMatchId} />
                  {showConnectors && (
                    <div className="absolute bg-slate-400" style={{ left: `${CARD_W}px`, top: `${CARD_H / 2 - 1}px`, width: `${STUB_W}px`, height: '2px' }} />
                  )}
                </div>
              )}

              {/* Vertical bar joining the two stubs */}
              {showConnectors && pair[1] && (
                <div className="absolute bg-slate-400" style={{ left: `${VBAR_L}px`, top: `${C1_MID}px`, width: '2px', height: `${VBAR_H}px` }} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const mainRounds = ['R32', 'R16', 'QF', 'SF'].filter(r => matches.some(m => m.round === r));
  const hasFin = matches.some(m => m.round === 'FIN');
  const has3rd = matches.some(m => m.round === '3RD');

  return (
    <div className="pb-8 pt-2">

      {/* ── Round progress strip ── */}
      <div className="flex items-center justify-center mb-5 px-6">
        {['R32', 'R16', 'QF', 'SF', 'FIN'].map((r, i, arr) => {
          const rMatches = matches.filter(m => m.round === r);
          const has = rMatches.length > 0;
          const done = has && rMatches.every(m => m.status === 'FINISHED');
          const act  = r === activeRound;
          return (
            <React.Fragment key={r}>
              <div className="flex flex-col items-center gap-[3px]">
                <div className={`w-2 h-2 rounded-full transition-colors
                  ${act ? 'bg-yellow-400' : done ? 'bg-green-500' : has ? 'bg-slate-600' : 'bg-slate-800'}`} />
                <span className={`text-[8px] font-bold ${act ? 'text-yellow-400' : done ? 'text-green-500' : 'text-slate-600'}`}>
                  {r}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className={`h-px w-8 mx-1 ${done ? 'bg-green-500/40' : 'bg-slate-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Bracket tree ── */}
      <div ref={scrollRef} className="overflow-x-auto pb-4 cursor-grab active:cursor-grabbing" style={{ scrollbarWidth: 'thin' }}>
        <div className="flex items-stretch px-4 min-w-max" style={{ gap: `${COL_GAP}px` }}>

          {/* Main rounds: R32 → SF, all with right connectors */}
          {mainRounds.map(r => renderColumn(r, true))}

          {/* Finals column: FIN on top, 3RD below — no connectors going right */}
          {(hasFin || has3rd) && (
            <div className="flex flex-col justify-around gap-4" style={{ minWidth: `${CARD_W}px` }}>
              {hasFin && (
                <div>
                  <div className={`text-center text-[9px] font-black uppercase tracking-widest mb-3 pb-1.5 border-b
                    ${'FIN' === activeRound ? 'text-yellow-400 border-yellow-400/30' : 'text-slate-500 border-white/5'}`}>
                    {getRoundLabel('FIN')}
                  </div>
                  {sorted('FIN').map(m => (
                    <BracketCard key={m.id} match={m} teams={teams} preds={userPredictions} highlighted={m.id === highlightedMatchId} />
                  ))}
                </div>
              )}
              {has3rd && (
                <div>
                  <div className="text-center text-[9px] font-black uppercase text-slate-500 tracking-widest mb-3 pb-1.5 border-b border-white/5">
                    {getRoundLabel('3RD')}
                  </div>
                  {sorted('3RD').map(m => (
                    <BracketCard key={m.id} match={m} teams={teams} preds={userPredictions} highlighted={m.id === highlightedMatchId} />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
