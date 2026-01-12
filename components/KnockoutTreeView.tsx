
import React, { useState, useRef, useEffect } from 'react';
import { Match, Team, Translation, UserProfile, TournamentPhase, Round } from '../types';
import { Trophy, Medal, Lock, Check, ZoomIn, ZoomOut, Maximize, Move } from 'lucide-react';

interface KnockoutTreeViewProps {
  matches: Match[];
  teams: Record<string, Team>;
  onUpdate: (id: string, h: number, a: number) => void;
  lang: Translation;
  user: UserProfile | null;
  phase: TournamentPhase;
}

// Helper: Sort matches by ID suffix (R32_1, R32_2...)
const getSortedMatches = (matches: Match[], round: Round) => {
  return matches
    .filter(m => m.round === round)
    .sort((a, b) => {
      const numA = parseInt(a.id.split('_')[1] || '0');
      const numB = parseInt(b.id.split('_')[1] || '0');
      return numA - numB;
    });
};

const BracketMatchCard: React.FC<{
  match: Match;
  home: Team;
  away: Team;
  onUpdate: (id: string, h: number, a: number) => void;
  isLocked: boolean;
  align: 'left' | 'right';
  lang: Translation; // Added 'lang' prop to interface
}> = ({ match, home, away, onUpdate, isLocked, align, lang }) => {
  const homeWin = match.homeScore !== null && match.homeScore > (match.awayScore || 0);
  const awayWin = match.awayScore !== null && match.awayScore > (match.homeScore || 0);
  const showScore = ['LIVE', 'FT', 'FINISHED', '1H', '2H', 'HT', 'AET', 'PEN'].includes(match.status);

  const handleClick = (winner: 'home' | 'away') => {
    if (isLocked) return;
    const team = winner === 'home' ? home : away;
    if (!team || team.id.startsWith('TBD')) return;
    if (winner === 'home') onUpdate(match.id, 1, 0);
    else onUpdate(match.id, 0, 1);
  };

  const TeamRow = ({ team, side, isWinner }: { team: Team, side: 'home' | 'away', isWinner: boolean }) => {
    const isTBD = !team || team.id.startsWith('TBD');
    const teamName = !isTBD ? (team.name.length > 12 ? team.id : team.name) : 'TBD'; // Use ID if name is too long

    return (
      <div 
        onClick={(e) => { e.stopPropagation(); handleClick(side); }}
        className={`flex items-center gap-2 p-1.5 rounded transition-all cursor-pointer relative ${
          isWinner ? 'bg-green-100/50' : 'hover:bg-slate-50'
        } ${isLocked || isTBD ? 'cursor-default pointer-events-none' : ''}`}
      >
        {align === 'right' && (
             <div className={`font-bold text-xs w-5 text-center ${isWinner ? 'text-green-700' : 'text-slate-400'}`}>
                 {showScore && match.homeScore !== null ? (side === 'home' ? match.homeScore : match.awayScore) : (isWinner ? '✓' : '-')}
             </div>
        )}
        
        <div className={`flex-1 flex items-center gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
            {align === 'right' && <span className={`text-[10px] font-black uppercase truncate ${isWinner ? 'text-green-900' : 'text-slate-600'}`}>{teamName}</span>}
            <div className="w-5 h-4 shrink-0 shadow-sm border border-slate-200 rounded-sm overflow-hidden bg-slate-100 relative">
                {team?.flag && <img src={team.flag} className="w-full h-full object-cover" alt="" />}
            </div>
            {align === 'left' && <span className={`text-[10px] font-black uppercase truncate ${isWinner ? 'text-green-900' : 'text-slate-600'}`}>{teamName}</span>}
        </div>

        {align === 'left' && (
             <div className={`font-bold text-xs w-5 text-center ${isWinner ? 'text-green-700' : 'text-slate-400'}`}>
                 {showScore && match.homeScore !== null ? (side === 'home' ? match.homeScore : match.awayScore) : (isWinner ? '✓' : '-')}
             </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col justify-center w-44 bg-white border rounded-xl shadow-md relative z-20 transition-all hover:scale-105 duration-200 ${match.status === 'LIVE' ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-300'}`}>
       <div className="p-1 flex flex-col gap-0.5">
           <TeamRow team={home} side="home" isWinner={homeWin} />
           <div className="h-px bg-slate-100 mx-2"></div>
           <TeamRow team={away} side="away" isWinner={awayWin} />
       </div>
    </div>
  );
};

export const KnockoutTreeView: React.FC<KnockoutTreeViewProps> = ({ matches, teams, onUpdate, lang, user, phase }) => {
  const [zoom, setZoom] = useState(0.85); // Start slightly zoomed out to fit more
  
  // Data Partitioning
  const r32 = getSortedMatches(matches, 'R32');
  const r16 = getSortedMatches(matches, 'R16');
  const qf = getSortedMatches(matches, 'QF');
  const sf = getSortedMatches(matches, 'SF');
  const fin = getSortedMatches(matches, 'FIN');
  const third = getSortedMatches(matches, '3RD');

  // Split into Left/Right Wings
  // Left: R32 (0-7), R16 (0-3), QF (0-1), SF (0)
  // Right: R32 (8-15), R16 (4-7), QF (2-3), SF (1)
  const leftWing = {
      r32: r32.slice(0, 8),
      r16: r16.slice(0, 4),
      qf: qf.slice(0, 2),
      sf: sf.slice(0, 1)
  };
  const rightWing = {
      r32: r32.slice(8, 16),
      r16: r16.slice(4, 8),
      qf: qf.slice(2, 4),
      sf: sf.slice(1, 2)
  };

  // Layout Constants
  const CARD_H = 70;
  const GAP_Y = 20;
  const ROW_H = CARD_H + GAP_Y; // 90px
  const COL_W = 220;
  const CENTER_W = 300;
  
  const TOTAL_HEIGHT = 8 * ROW_H + 100; // 8 rows max (R32 has 8 matches per side)
  const TOTAL_WIDTH = (4 * COL_W) + CENTER_W + (4 * COL_W); // 4 cols left, 1 center, 4 cols right

  const getMatchY = (roundIdx: number, matchIdxInSide: number) => {
      // roundIdx: 0=R32, 1=R16, 2=QF, 3=SF
      // Calculate vertical center based on spreading out matches
      // R32: 0, 1, 2...7
      // R16: 0.5, 2.5, 4.5... (Centered between R32 parents)
      const factor = Math.pow(2, roundIdx);
      const offset = (factor - 1) / 2;
      const row = (matchIdxInSide * factor) + offset;
      return (row * ROW_H) + 50; // +50 top padding
  };

  const RenderConnector = ({ startX, startY, endX, endY, isActive }: any) => {
      const midX = startX + (endX - startX) / 2;
      const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
      return (
          <path d={path} stroke={isActive ? "#22c55e" : "#cbd5e1"} strokeWidth={isActive ? 3 : 2} fill="none" />
      );
  };

  const RenderSide = ({ rounds, side }: { rounds: any, side: 'left' | 'right' }) => {
      const roundKeys = ['r32', 'r16', 'qf', 'sf'];
      const els: React.ReactNode[] = [];
      const svgEls: React.ReactNode[] = [];

      roundKeys.forEach((key, rIdx) => {
          const currentMatches = rounds[key] as Match[];
          // Column X Position
          // If Left: 0 -> 1 -> 2 -> 3
          // If Right: 3 -> 2 -> 1 -> 0 (Mirrored relative to center)
          const colIdx = rIdx; 
          const xPos = side === 'left' 
              ? (colIdx * COL_W) + 20 
              : TOTAL_WIDTH - ((colIdx * COL_W) + COL_W) - 20;

          const cardX = side === 'left' ? xPos : xPos + (COL_W - 176); // Adjust for card width (approx 176px/44rem)

          currentMatches.forEach((m, mIdx) => {
              const yPos = getMatchY(rIdx, mIdx);
              const home = teams[m.homeTeamId];
              const away = teams[m.awayTeamId];
              const isLocked = phase === 'LIVE' && user?.hasTakenSecondChance ? (m.status !== 'UPCOMING' && m.status !== 'NS') : (phase === 'LIVE' || m.isLocked);

              els.push(
                  <div key={m.id} className="absolute w-44" style={{ left: cardX, top: yPos }}>
                      <BracketMatchCard 
                          match={m} 
                          home={home} 
                          away={away} 
                          onUpdate={onUpdate} 
                          isLocked={isLocked} 
                          lang={lang} 
                          align={side}
                      />
                  </div>
              );

              // Connectors to Next Round
              if (rIdx < 3) {
                  const parentY = yPos + 35; // Center of card
                  const childIdx = Math.floor(mIdx / 2);
                  const childY = getMatchY(rIdx + 1, childIdx) + 35;
                  
                  // Connector Start/End points
                  const startX = side === 'left' ? cardX + 176 : cardX;
                  const endX = side === 'left' ? (xPos + COL_W) : (xPos - (COL_W - 176));
                  
                  // For right side, geometry is tricky because we draw from Right to Left visually, but logic flows parent to child
                  // Let's simplify: Parent is at `cardX`. Next round parent is at `nextColX`.
                  const nextColX = side === 'left' 
                      ? (rIdx + 1) * COL_W + 20
                      : TOTAL_WIDTH - (((rIdx + 1) * COL_W) + COL_W) - 20;
                  
                  const targetX = side === 'left' ? nextColX : nextColX + 176;

                  // Determine if active
                  // If this match has a winner selected, the path to the next round slot is "active"
                  const winnerId = m.homeScore !== null && m.awayScore !== null
                      ? (m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId)
                      : null;
                  const isActive = winnerId && winnerId !== 'TBD';

                  svgEls.push(
                      <RenderConnector 
                          key={`conn-${m.id}`} 
                          startX={side === 'left' ? startX : startX} 
                          startY={parentY} 
                          endX={targetX} 
                          endY={childY} 
                          isActive={isActive} 
                      />
                  );
              } else {
                  // Connector to Final
                  const parentY = yPos + 35;
                  const startX = side === 'left' ? cardX + 176 : cardX;
                  const finalY = (3.5 * ROW_H) + 50 + 35; // Center of middle
                  const finalX = side === 'left' ? (TOTAL_WIDTH / 2) - 100 : (TOTAL_WIDTH / 2) + 100;
                  
                  const winnerId = m.homeScore !== null && m.awayScore !== null
                      ? (m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId)
                      : null;
                  const isActive = winnerId && winnerId !== 'TBD';

                  svgEls.push(
                      <RenderConnector 
                          key={`conn-fin-${m.id}`} 
                          startX={startX} 
                          startY={parentY} 
                          endX={finalX} 
                          endY={finalY} 
                          isActive={isActive} 
                      />
                  );
              }
          });
      });

      return { els, svgEls };
  };

  const leftRender = RenderSide({ rounds: leftWing, side: 'left' });
  const rightRender = RenderSide({ rounds: rightWing, side: 'right' });

  // Final Match Rendering
  const renderFinal = () => {
      const m = fin[0];
      if (!m) return null;
      const home = teams[m.homeTeamId];
      const away = teams[m.awayTeamId];
      const isLocked = phase === 'LIVE' && user?.hasTakenSecondChance ? (m.status !== 'UPCOMING' && m.status !== 'NS') : (phase === 'LIVE' || m.isLocked);
      
      const top = (3.5 * ROW_H) + 50; // Vertically centered relative to 8 rows
      const left = (TOTAL_WIDTH / 2) - 110; // Center (220 width)

      // Winner
      const winnerId = m.homeScore !== null && m.awayScore !== null
          ? (m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId)
          : null;
      const winner = winnerId && winnerId !== 'TBD' ? teams[winnerId] : null;

      return (
          <>
            <div className="absolute w-56 transform scale-125 z-30" style={{ left, top: top }}>
                <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-lg animate-pulse">
                        <Trophy size={14} /> {lang.grandFinal}
                    </div>
                </div>
                <BracketMatchCard match={m} home={home} away={away} onUpdate={onUpdate} isLocked={isLocked} lang={lang} align="left" />
            </div>
            
            {/* Champion Display if Winner */}
            {winner && (
                <div className="absolute z-40 animate-in zoom-in slide-in-from-top duration-700" style={{ left: (TOTAL_WIDTH / 2) - 100, top: top - 140 }}>
                    <div className="flex flex-col items-center">
                        <Trophy size={64} className="text-yellow-400 drop-shadow-[0_4px_10px_rgba(250,204,21,0.5)]" />
                        <div className="bg-[#0f2545] text-white px-6 py-2 rounded-xl border-2 border-yellow-400 shadow-xl mt-2 text-center">
                            <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">{lang.champion}</div>
                            <div className="text-xl font-black uppercase tracking-tighter">{lang.teamNames[winner.id] || winner.name}</div>
                        </div>
                    </div>
                </div>
            )}
          </>
      );
  };

  return (
    <div className="relative w-full bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-inner h-[85vh]">
        {/* Controls */}
        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
            <div className="bg-white p-1 rounded-xl shadow-lg border border-slate-200 flex flex-col gap-1">
                <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg"><ZoomIn size={20} /></button>
                <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.4))} className="p-2 hover:bg-slate-50 text-slate-600 rounded-lg"><ZoomOut size={20} /></button>
                <button onClick={() => setZoom(0.85)} className="p-2 hover:bg-slate-50 text-blue-600 rounded-lg"><Maximize size={20} /></button>
            </div>
        </div>

        <div className="absolute top-4 left-4 z-40 bg-white/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm pointer-events-none">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <Move size={14} />
                <span>Drag to Pan • Scroll to Zoom</span>
            </div>
        </div>

        {/* Scroll Container */}
        <div className="w-full h-full overflow-auto cursor-move active:cursor-grabbing p-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]"
             onWheel={(e) => {
                 if (e.ctrlKey || e.metaKey) {
                     e.preventDefault();
                     setZoom(z => Math.max(0.4, Math.min(1.5, z - e.deltaY * 0.001)));
                 }
             }}
        >
            <div style={{ width: TOTAL_WIDTH, height: TOTAL_HEIGHT, transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.1s ease-out' }} className="relative">
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {leftRender.svgEls}
                    {rightRender.svgEls}
                </svg>
                {leftRender.els}
                {rightRender.els}
                {renderFinal()}
                
                {/* 3rd Place */}
                {third.map(m => {
                    const top = (6.5 * ROW_H) + 50; 
                    const left = (TOTAL_WIDTH / 2) - 88;
                    const isLocked = phase === 'LIVE' && user?.hasTakenSecondChance ? (m.status !== 'UPCOMING' && m.status !== 'NS') : (phase === 'LIVE' || m.isLocked);
                    return (
                        <div key={m.id} className="absolute w-44 z-20" style={{ left, top }}>
                             <div className="flex items-center justify-center gap-2 mb-2 opacity-70">
                                 <Medal size={14} className="text-orange-600" />
                                 <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">{lang.thirdPlacePlayoff}</span>
                             </div>
                             <BracketMatchCard 
                                match={m} 
                                home={teams[m.homeTeamId]} 
                                away={teams[m.awayTeamId]} 
                                onUpdate={onUpdate} 
                                isLocked={isLocked} 
                                lang={lang} 
                                align="left" 
                             />
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};
