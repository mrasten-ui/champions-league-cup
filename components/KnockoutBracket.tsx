import React from 'react';
import { Match, Team, Translation, UserProfile, Prediction, TournamentPhase, Round, MatchEvent } from '../types';
import { MatchCard } from './MatchCard';
import { Lock } from 'lucide-react';
import { getTieAggregate } from '../services/engine';

interface KnockoutBracketProps {
  matches: Match[];
  teams: Record<string, Team>;
  onUpdate: (id: string, h: number, a: number) => void;
  lang: Translation;
  user: UserProfile;
  onSecondChance: () => void;
  rivals: UserProfile[];
  allPredictions: Prediction[];
  phase: TournamentPhase;
  isLeaguePhaseComplete: boolean;
  onTeamClick: (id: string) => void;
  onSpy: (id: string) => void;
  revealedRivals: string[];
  activeRound: Round;
  matchEvents?: MatchEvent[];
  allMatches?: Match[];
  isLateJoiner?: boolean;
}

export const KnockoutBracket: React.FC<KnockoutBracketProps> = ({
  matches, teams, onUpdate, lang, user, rivals, allPredictions, phase, isLeaguePhaseComplete, onTeamClick, onSpy, revealedRivals, activeRound, matchEvents = [], allMatches, isLateJoiner = false
}) => {

  // Locked State Logic (Knockout Phase unlocks only once the League Phase — real-world, not
  // per-user prediction-completeness — has finished).
  const isLockedState = !isLeaguePhaseComplete && !user.hasTakenSecondChance && phase === 'PRE_LIVE';

  if (isLockedState) {
      return (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-slate-100 p-6 rounded-full mb-6 text-slate-300">
                  <Lock size={48} />
              </div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">{lang.lockedState}</h2>
              <p className="text-slate-500 font-medium max-w-xs mb-8">
                  The Knockout Bracket unlocks once the League Phase has finished.
              </p>
          </div>
      );
  }

  const renderMatchCard = (match: Match, cardId?: string) => {
    const home = teams[match.homeTeamId];
    const away = teams[match.awayTeamId];
    return (
        <MatchCard
            key={match.id}
            match={match}
            homeTeam={home}
            awayTeam={away}
            onUpdate={onUpdate}
            lang={lang}
            locale="en-GB"
            userTokens={user.tokens}
            rivals={rivals}
            onSpy={onSpy}
            revealedRivals={revealedRivals}
            currentUser={user}
            allPredictions={allPredictions}
            phase={phase}
            isAdminMode={false}
            onTeamClick={onTeamClick}
            showStatusBadge={false}
            context="knockout"
            cardId={cardId}
            events={matchEvents.filter(e => String(e.matchId) === String(match.id))}
            allMatches={allMatches ?? matches}
            allTeams={teams}
            isLateJoiner={isLateJoiner}
        />
    );
  };

  // The Final is a single match — same rendering as before.
  if (activeRound === 'FIN') {
    const finalMatches = matches.filter(m => m.round === 'FIN');
    return (
      <div className="pb-24 animate-in fade-in duration-500">
          <div className="flex flex-col gap-6">
              {finalMatches.map((match, index) => (
                  <div key={match.id} className="relative">
                      <div className="absolute -left-4 top-1/2 w-4 h-0.5 bg-slate-200 hidden md:block"></div>
                      {renderMatchCard(match, index === 0 ? 'tour-first-knockout' : undefined)}
                  </div>
              ))}
              {finalMatches.length === 0 && (
                  <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest">
                      No matches scheduled for this round yet.
                  </div>
              )}
          </div>
      </div>
    );
  }

  // PO / R16 / QF / SF: two-legged ties. Group each round's matches by tie
  // (id convention `{ROUND}_{tieIndex}_L{leg}`) and render both legs together
  // under a running-aggregate header.
  const tieMap = new Map<string, { leg1?: Match; leg2?: Match }>();
  matches
    .filter(m => m.round === activeRound)
    .forEach(m => {
        const isLeg1 = m.id.endsWith('_L1');
        const isLeg2 = m.id.endsWith('_L2');
        const tieId = isLeg1 || isLeg2 ? m.id.slice(0, -3) : m.id;
        const entry = tieMap.get(tieId) || {};
        if (isLeg2) entry.leg2 = m; else entry.leg1 = m;
        tieMap.set(tieId, entry);
    });

  const ties = Array.from(tieMap.entries()).sort((a, b) => {
      const idxA = parseInt(a[0].split('_')[1] || '0', 10);
      const idxB = parseInt(b[0].split('_')[1] || '0', 10);
      return idxA - idxB;
  });

  return (
    <div className="pb-24 animate-in fade-in duration-500">
        <div className="flex flex-col gap-8">
            {ties.map(([tieId, { leg1, leg2 }], tieIndex) => {
                const agg = getTieAggregate(matches, tieId);
                const teamA = leg1 ? teams[leg1.homeTeamId] : undefined;
                const teamB = leg1 ? teams[leg1.awayTeamId] : undefined;

                return (
                    <div key={tieId} className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                        <div className="bg-[#0f2545] px-4 py-2.5 flex items-center justify-between text-white flex-wrap gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">
                                {lang.tieLabel || 'Tie'} {tieId.split('_')[1]}
                            </span>
                            {agg?.aggA != null && agg?.aggB != null && (
                                <span className="text-xs font-black tabular-nums flex items-center gap-1.5">
                                    <span>{teamA?.name ?? '?'} {agg.aggA} - {agg.aggB} {teamB?.name ?? '?'}</span>
                                    {agg.winnerId && (
                                        <span className="text-green-300">({teams[agg.winnerId]?.name} through)</span>
                                    )}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col divide-y divide-slate-100">
                            {[leg1, leg2].map((m, legIndex) => {
                                if (!m) return null;
                                return (
                                    <div key={m.id}>
                                        <div className="px-4 pt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                            Leg {legIndex + 1}
                                        </div>
                                        {renderMatchCard(m, tieIndex === 0 && legIndex === 0 ? 'tour-first-knockout' : undefined)}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {ties.length === 0 && (
                <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest">
                    No matches scheduled for this round yet.
                </div>
            )}
        </div>
    </div>
  );
};
