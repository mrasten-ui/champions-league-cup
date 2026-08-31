import React, { useMemo, useState, useEffect } from 'react';
import { ChevronRight, X, Bot } from 'lucide-react';
import { Match, Team, Translation, Prediction, UserProfile, MatchEvent, MatchLineup, MatchStats, PlayerMatchStat, Round } from '../types';
import { MatchCard } from './MatchCard';

const DONE_STATUSES = new Set(['FT', 'AET', 'PEN', 'FINISHED']);
const LIVE_STATUSES = new Set(['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT']);
const UPCOMING_STATUSES = new Set(['UPCOMING', 'NS']);

const KO_ORDER: Round[] = ['PO', 'R16', 'QF', 'SF', 'FIN'];

// Real UEFA 2024/25+ format: Playoff Round and R16 are 8 two-legged ties each
// (winners/runners-up of League Phase play the Playoff Round; the top 8 get a
// bye straight to R16), QF/SF are 4/2 ties, and the Final is a single match at
// a neutral venue. Used to pad the tie grid with TBD placeholders before the
// real draw happens and matches get seeded.
const EXPECTED_TIES: Partial<Record<Round, number>> = { PO: 8, R16: 8, QF: 4, SF: 2, FIN: 1 };
const SINGLE_LEG_ROUNDS = new Set<Round>(['FIN']);

type RoundStatus = 'upcoming' | 'inprogress' | 'live' | 'finished';

interface RoundInfo {
  key: string;
  short: string;
  label: string;
  matchday?: number;
  round?: Round;
}

interface Tie {
  key: string;
  homeTeamId?: string;
  awayTeamId?: string;
  legs: Match[];
  aggHome: number | null;
  aggAway: number | null;
  isDecided: boolean;
  isLive: boolean;
}

// Groups a knockout round's matches into two-legged ties (or single-match for
// the Final) by unordered team pair, computes the aggregate score, then pads
// with TBD placeholder ties up to the round's expected bracket size so the
// grid always shows its full shape even before the draw is made.
function buildTies(roundMatches: Match[], expectedCount: number, singleLeg: boolean): Tie[] {
  const groups = new Map<string, Match[]>();
  for (const m of roundMatches) {
    const pairKey = [m.homeTeamId, m.awayTeamId].sort().join('_');
    if (!groups.has(pairKey)) groups.set(pairKey, []);
    groups.get(pairKey)!.push(m);
  }

  const ties: Tie[] = [...groups.entries()].map(([key, legs]) => {
    const sorted = [...legs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const anchorHome = sorted[0].homeTeamId;
    const anchorAway = sorted[0].awayTeamId;

    let aggHome = 0, aggAway = 0, anyScore = false;
    for (const leg of sorted) {
      if (leg.homeScore == null || leg.awayScore == null) continue;
      anyScore = true;
      if (leg.homeTeamId === anchorHome) { aggHome += leg.homeScore; aggAway += leg.awayScore; }
      else { aggHome += leg.awayScore; aggAway += leg.homeScore; }
    }

    const isDecided = singleLeg
      ? sorted.length >= 1 && DONE_STATUSES.has(sorted[0].status)
      : sorted.length >= 2 && sorted.every(l => DONE_STATUSES.has(l.status));
    const isLive = sorted.some(l => LIVE_STATUSES.has(l.status));

    return {
      key, homeTeamId: anchorHome, awayTeamId: anchorAway, legs: sorted,
      aggHome: anyScore ? aggHome : null, aggAway: anyScore ? aggAway : null,
      isDecided, isLive,
    };
  });

  while (ties.length < expectedCount) {
    ties.push({ key: `TBD_${ties.length}`, legs: [], aggHome: null, aggAway: null, isDecided: false, isLive: false });
  }
  return ties;
}

interface RoundResultsProps {
  matches: Match[];
  teams: Record<string, Team>;
  lang: Translation;
  locale: string;
  currentUser: UserProfile | null;
  userPredictions: Prediction[];
  onTeamClick: (teamId: string) => void;
  /** The matchday currently open for predictions in the League Phase tab — flagged on its chip. */
  predictingMatchday?: number;
  jumpToMatchId?: string;
  matchEvents?: MatchEvent[];
  matchLineups?: MatchLineup[];
  matchStats?: MatchStats[];
  playerMatchStats?: PlayerMatchStat[];
  onPlayerClick?: (playerId: number | null, playerName: string, teamId: string) => void;
  onStadiumClick?: (venue: string) => void;
}

const getInitials = (name: string) => {
  const clean = (name || '').replace(/\(.*?\)/g, '').trim();
  if (!clean || clean === 'TBD') return '';
  const words = clean.split(/\s+/).filter(Boolean);
  return words.length === 1 ? words[0].slice(0, 2).toUpperCase() : (words[0][0] + words[1][0]).toUpperCase();
};

const isTbdId = (id?: string) => !id || id === 'TBD' || id.startsWith('TBD');

const koLabel = (r: Round, lang: Translation): string => {
  const map: Record<string, string> = {
    PO: (lang as any).playoffRound || 'Playoff Round',
    R16: lang.roundOf16 || 'Round of 16',
    QF: lang.quarterFinal || 'Quarter Final',
    SF: lang.semiFinal || 'Semi Final',
    FIN: lang.final || 'Final',
  };
  return map[r] || r;
};

const StatusDot: React.FC<{ status: RoundStatus }> = ({ status }) => {
  if (status === 'live') return <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.8)] animate-pulse" />;
  if (status === 'inprogress') return <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />;
  if (status === 'finished') return <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />;
  return <span className="w-1.5 h-1.5 rounded-full bg-white/20" />;
};

const RowCrest: React.FC<{ team?: Team; tbd: boolean; onClick?: () => void; size?: 'md' | 'sm' }> = ({ team, tbd, onClick, size = 'md' }) => (
  <div
    onClick={(e) => { if (onClick && !tbd) { e.stopPropagation(); onClick(); } }}
    className={`${size === 'sm' ? 'w-6 h-6' : 'w-7 h-7'} shrink-0 rounded-md overflow-hidden flex items-center justify-center ${
      tbd ? 'border border-dashed border-white/20 bg-white/5' : 'border border-white/10 bg-white/5'
    } ${onClick && !tbd ? 'cursor-pointer' : ''}`}
  >
    {tbd
      ? <span className="text-[7px] font-black text-white/30 uppercase">TBD</span>
      : team?.flag
        ? <img src={team.flag} alt={team.name} className="w-full h-full object-cover" />
        : <span className="text-[9px] font-black text-white/30">{getInitials(team?.name || '')}</span>}
  </div>
);

const TieRow: React.FC<{ team?: Team; tbd: boolean; score: number | null; isWinner: boolean }> = ({ team, tbd, score, isWinner }) => {
  const name = tbd ? 'TBD' : (team?.name || '');
  return (
    <div className="flex items-center gap-2 py-0.5">
      <RowCrest team={team} tbd={tbd} size="sm" />
      <span className={`flex-1 min-w-0 text-[12px] font-bold truncate ${tbd ? 'text-slate-600 italic' : isWinner ? 'text-emerald-400' : 'text-white'}`}>{name}</span>
      {score !== null && <span className="text-[13px] font-black text-white tabular-nums">{score}</span>}
    </div>
  );
};

/**
 * A two-legged tie rendered as a compact matchup card — crest/name/aggregate
 * per side, leg-by-leg breakdown and a status pill underneath. Reads like a
 * TV "Round of 16" overview graphic rather than the flat results list used
 * for League Phase rounds. TBD cards (draw not made yet) fade into the
 * background; tapping a decided/live tie opens its most recent leg.
 */
const TieCard: React.FC<{
  tie: Tie;
  teams: Record<string, Team>;
  singleLeg: boolean;
  onOpen: (m: Match) => void;
}> = ({ tie, teams, singleLeg, onOpen }) => {
  const homeTeam = tie.homeTeamId ? teams[tie.homeTeamId] : undefined;
  const awayTeam = tie.awayTeamId ? teams[tie.awayTeamId] : undefined;
  const winnerId = tie.isDecided && tie.aggHome !== null && tie.aggAway !== null && tie.aggHome !== tie.aggAway
    ? (tie.aggHome > tie.aggAway ? tie.homeTeamId : tie.awayTeamId)
    : null;

  const legsLabel = tie.legs.length === 0
    ? '—'
    : singleLeg
      ? (tie.legs[0].homeScore != null ? 'FT' : '—')
      : tie.legs.map((l, i) => `L${i + 1} ${l.homeScore != null ? `${l.homeScore}-${l.awayScore}` : '—'}`).join(' · ');

  const statusLabel = (!tie.homeTeamId || !tie.awayTeamId) ? 'Draw pending'
    : tie.isLive ? 'Live'
    : tie.isDecided ? 'Through'
    : tie.legs.length > 0 ? 'In progress'
    : 'Upcoming';
  const statusClass = tie.isLive ? 'text-fuchsia-400' : tie.isDecided ? 'text-emerald-400' : 'text-slate-600';

  const openable = tie.legs.length > 0;
  const mostRecentLeg = tie.legs[tie.legs.length - 1];

  return (
    <button
      onClick={() => openable && onOpen(mostRecentLeg)}
      disabled={!openable}
      className={`text-left bg-blue-950/40 backdrop-blur-md border rounded-2xl p-3 shadow-sm transition-colors ${
        tie.isDecided ? 'border-emerald-500/30' : 'border-white/15'
      } ${openable ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'}`}
    >
      <TieRow team={homeTeam} tbd={!tie.homeTeamId} score={tie.aggHome} isWinner={winnerId === tie.homeTeamId} />
      <TieRow team={awayTeam} tbd={!tie.awayTeamId} score={tie.aggAway} isWinner={winnerId === tie.awayTeamId} />
      <div className="mt-2 pt-2 border-t border-dashed border-white/10 flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold text-slate-500 tabular-nums truncate">{legsLabel}</span>
        <span className={`text-[8.5px] font-black uppercase tracking-wide shrink-0 ${statusClass}`}>{statusLabel}</span>
      </div>
    </button>
  );
};

/**
 * One line per fixture — crest, name, score/kickoff, crest, name — a classic
 * sports-results row rather than the prediction picker's editable steppers.
 * Tapping a row opens the full read-only match detail (events/lineups/stats).
 */
const ResultRow: React.FC<{
  match: Match;
  homeTeam?: Team;
  awayTeam?: Team;
  locale: string;
  prediction?: Prediction | null;
  lang: Translation;
  onTeamClick: (teamId: string) => void;
  onOpen: () => void;
}> = ({ match, homeTeam, awayTeam, locale, prediction, lang, onTeamClick, onOpen }) => {
  const isLive = LIVE_STATUSES.has(match.status);
  const isFinished = DONE_STATUSES.has(match.status);
  const hasResult = (isLive || isFinished) && match.homeScore !== null && match.awayScore !== null;
  const isHomeTbd = isTbdId(match.homeTeamId);
  const isAwayTbd = isTbdId(match.awayTeamId);
  const homeName = isHomeTbd ? 'TBD' : (homeTeam?.name || match.homeTeamId);
  const awayName = isAwayTbd ? 'TBD' : (awayTeam?.name || match.awayTeamId);

  const isExact = hasResult && !!prediction && prediction.home === match.homeScore && prediction.away === match.awayScore;
  const isCorrectOutcome = hasResult && !!prediction && !isExact &&
    Math.sign(prediction.home - prediction.away) === Math.sign(match.homeScore! - match.awayScore!);

  const kickoffTime = match.date && match.date !== 'TBD' && !isNaN(new Date(match.date).getTime())
    ? new Date(match.date).toLocaleTimeString(locale || 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : 'TBD';

  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-2 px-3 py-2.5 border-b border-white/5 last:border-b-0 hover:bg-white/5 active:bg-white/10 transition-colors text-left"
    >
      <div className="w-10 shrink-0">
        {isLive ? (
          <span className="text-[9px] font-black tabular-nums text-rose-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            {match.minute ? `${match.minute}'` : 'LIVE'}
          </span>
        ) : isFinished ? (
          <span className="text-[9px] font-black tabular-nums text-slate-400">FT</span>
        ) : (
          <span className="text-[9px] font-bold tabular-nums text-slate-500">{kickoffTime}</span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex items-center justify-end gap-2">
        <span className="text-[13px] font-bold text-white text-right truncate">{homeName}</span>
        <RowCrest team={homeTeam} tbd={isHomeTbd} onClick={() => onTeamClick(match.homeTeamId)} />
      </div>

      <div className="w-16 shrink-0 flex flex-col items-center justify-center gap-0.5">
        {hasResult ? (
          <span className="text-[15px] font-black text-white tabular-nums tracking-tight">{match.homeScore}&nbsp;-&nbsp;{match.awayScore}</span>
        ) : (isHomeTbd || isAwayTbd) ? (
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">TBD</span>
        ) : (
          <span className="text-slate-600 text-[10px] font-black uppercase tracking-wide">vs</span>
        )}
        {prediction && (
          <span className={`flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wide ${isExact ? 'text-emerald-400' : isCorrectOutcome ? 'text-cyan-400' : hasResult ? 'text-slate-600' : 'text-slate-500'}`}>
            {prediction.autoFilled && <Bot size={8} className="text-amber-400" aria-label={lang.autoFilledDesc} />}
            {lang.myPick || 'Pick'}: {prediction.home}-{prediction.away}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        <RowCrest team={awayTeam} tbd={isAwayTbd} onClick={() => onTeamClick(match.awayTeamId)} />
        <span className="text-[13px] font-bold text-white truncate">{awayName}</span>
      </div>

      <ChevronRight size={14} className="text-slate-600 shrink-0" />
    </button>
  );
};

export const RoundResults: React.FC<RoundResultsProps> = ({
  matches, teams, lang, locale, currentUser, userPredictions, onTeamClick, predictingMatchday,
  jumpToMatchId, matchEvents = [], matchLineups = [], matchStats = [], playerMatchStats = [], onPlayerClick, onStadiumClick,
}) => {
  const leagueRounds: RoundInfo[] = useMemo(() => {
    const mds = [...new Set(matches.filter(m => !m.round && m.matchday != null).map(m => m.matchday as number))].sort((a, b) => a - b);
    return mds.map(md => ({ key: `MD${md}`, short: `R${md}`, label: `${lang.roundLabel || 'Round'} ${md}`, matchday: md }));
  }, [matches, lang]);

  // Always shown, even with zero real matches yet — the whole point is to see
  // the bracket shape as TBD ahead of the actual knockout draw.
  const koRounds: RoundInfo[] = useMemo(
    () => KO_ORDER.map(r => ({ key: r, short: r, label: koLabel(r, lang), round: r })),
    [lang]
  );

  const allRounds = useMemo(() => [...leagueRounds, ...koRounds], [leagueRounds, koRounds]);

  const matchesForRound = (r: RoundInfo) => matches.filter(m => r.matchday !== undefined ? m.matchday === r.matchday && !m.round : m.round === r.round);

  const roundStatus = (r: RoundInfo): RoundStatus => {
    const rm = matchesForRound(r);
    if (rm.length === 0) return 'upcoming';
    if (rm.some(m => LIVE_STATUSES.has(m.status))) return 'live';
    if (rm.every(m => DONE_STATUSES.has(m.status))) return 'finished';
    if (rm.some(m => DONE_STATUSES.has(m.status))) return 'inprogress';
    return 'upcoming';
  };

  // Default round: the LAST round (highest) whose first-by-kickoff match has
  // already started or finished — i.e. "what's happening / just happened",
  // distinct from the League Phase tab's "next round to predict".
  const defaultKey = useMemo(() => {
    let chosen: string | null = null;
    for (const r of allRounds) {
      const rm = matchesForRound(r).filter(m => m.date && m.date !== 'TBD');
      if (rm.length === 0) continue;
      const first = [...rm].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
      if (!UPCOMING_STATUSES.has(first.status)) chosen = r.key;
    }
    return chosen ?? allRounds[0]?.key ?? '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, allRounds]);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const activeKey = selectedKey ?? defaultKey;
  const activeRound = allRounds.find(r => r.key === activeKey) ?? allRounds[0];

  const [detailMatch, setDetailMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (!jumpToMatchId) return;
    const match = matches.find(m => m.id === jumpToMatchId);
    if (!match) return;
    const key = match.matchday != null && !match.round ? `MD${match.matchday}` : (match.round ?? null);
    if (key) setSelectedKey(key);
    setDetailMatch(match);
  }, [jumpToMatchId]);

  const activeMatches = useMemo(() => {
    if (!activeRound) return [];
    return matchesForRound(activeRound).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRound, matches]);

  const groupedByDay = useMemo(() => {
    const groups: { day: string; matches: Match[] }[] = [];
    const indexByDay: Record<string, number> = {};
    activeMatches.forEach(m => {
      const day = (m.date && m.date !== 'TBD' && !isNaN(new Date(m.date).getTime()))
        ? new Date(m.date).toLocaleDateString(locale || 'en-US', { weekday: 'short', day: 'numeric', month: 'long' }).toUpperCase()
        : 'DATE TBD';
      if (indexByDay[day] === undefined) { indexByDay[day] = groups.length; groups.push({ day, matches: [] }); }
      groups[indexByDay[day]].matches.push(m);
    });
    return groups;
  }, [activeMatches, locale]);

  const isKnockoutRound = activeRound?.round !== undefined;
  const singleLeg = activeRound?.round ? SINGLE_LEG_ROUNDS.has(activeRound.round) : false;
  const activeTies = useMemo(() => {
    if (!isKnockoutRound || !activeRound?.round) return [];
    return buildTies(activeMatches, EXPECTED_TIES[activeRound.round] ?? 0, singleLeg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isKnockoutRound, activeRound, activeMatches, singleLeg]);
  const decidedTies = activeTies.filter(t => t.isDecided).length;
  const tbdTies = activeTies.filter(t => !t.homeTeamId || !t.awayTeamId).length;

  if (allRounds.length === 0) {
    return (
      <div className="rounded-xl border border-white/15 bg-blue-950/40 backdrop-blur-md shadow-sm py-16 text-center">
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{lang.noMatches || 'No matches scheduled'}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Round selector */}
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1 mb-4">
        <div className="flex gap-2 min-w-max">
          {allRounds.map(r => {
            const isActive = r.key === activeKey;
            const status = roundStatus(r);
            const isPredicting = r.matchday !== undefined && r.matchday === predictingMatchday;
            return (
              <button
                key={r.key}
                onClick={() => setSelectedKey(r.key)}
                className={`shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-cyan-600 border-cyan-500 text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-black uppercase tracking-widest">{r.short}</span>
                  <StatusDot status={status} />
                </div>
                {isPredicting && (
                  <span className={`text-[7px] font-black uppercase tracking-widest ${isActive ? 'text-cyan-100' : 'text-cyan-400'}`}>
                    {lang.predicting || 'Predicting'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Round headline */}
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="text-sm font-black text-white uppercase tracking-widest">{activeRound?.label}</h3>
        {isKnockoutRound ? (
          <span className="text-[10px] font-bold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            {decidedTies} {lang.decided || 'decided'} · {tbdTies} TBD
          </span>
        ) : (
          <span className="text-[10px] font-bold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            {activeMatches.length} {activeMatches.length === 1 ? (lang.match || 'Match') : (lang.matches || 'Matches')}
          </span>
        )}
      </div>

      {isKnockoutRound ? (
        /* Tie card grid — two-legged aggregate ties (single match for the Final),
           padded with TBD placeholders up to the round's real bracket size. */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activeTies.map(tie => (
            <TieCard key={tie.key} tie={tie} teams={teams} singleLeg={singleLeg} onOpen={m => setDetailMatch(m)} />
          ))}
        </div>
      ) : (
        /* Results list, grouped by day */
        <div className="rounded-xl border border-white/15 bg-blue-950/40 backdrop-blur-md overflow-hidden shadow-sm">
          {groupedByDay.length > 0 ? groupedByDay.map(({ day, matches: dayMatches }) => (
            <div key={day}>
              <div className="px-3 py-1.5 bg-white/5 border-b border-white/10">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{day}</span>
              </div>
              {dayMatches.map(m => (
                <ResultRow
                  key={m.id}
                  match={m}
                  homeTeam={teams[m.homeTeamId]}
                  awayTeam={teams[m.awayTeamId]}
                  locale={locale}
                  prediction={userPredictions.find(p => p.matchId === m.id)}
                  lang={lang}
                  onTeamClick={onTeamClick}
                  onOpen={() => setDetailMatch(m)}
                />
              ))}
            </div>
          )) : (
            <div className="py-16 text-center">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{lang.noMatches || 'No matches scheduled'}</p>
            </div>
          )}
        </div>
      )}

      {/* Read-only match detail */}
      {detailMatch && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" onClick={() => setDetailMatch(null)} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailMatch(null)}
              className="absolute -top-2 -right-2 z-10 bg-slate-900 border border-white/20 text-white rounded-full p-1.5 shadow-lg hover:bg-slate-800 transition-colors"
            >
              <X size={16} />
            </button>
            <MatchCard
              match={{ ...detailMatch, isLocked: true }}
              homeTeam={teams[detailMatch.homeTeamId]}
              awayTeam={teams[detailMatch.awayTeamId]}
              onUpdate={() => {}}
              lang={lang}
              locale={locale}
              userTokens={0}
              rivals={[]}
              onSpy={() => {}}
              currentUser={currentUser}
              allPredictions={userPredictions}
              phase={'LIVE'}
              isAdminMode={false}
              onTeamClick={onTeamClick}
              showStatusBadge
              allMatches={matches}
              allTeams={teams}
              variant="official"
              events={matchEvents.filter(e => String(e.matchId) === String(detailMatch.id))}
              lineups={matchLineups.filter(l => l.matchId === detailMatch.id)}
              stats={matchStats.find(s => s.matchId === detailMatch.id) ?? null}
              playerMatchStats={playerMatchStats}
              onPlayerClick={onPlayerClick}
              onStadiumClick={onStadiumClick}
            />
          </div>
        </div>
      )}
    </div>
  );
};
