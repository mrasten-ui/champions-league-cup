import React, { useMemo, useState, useEffect } from 'react';
import { ChevronRight, X } from 'lucide-react';
import { Match, Team, Translation, Prediction, UserProfile, MatchEvent, MatchLineup, MatchStats, PlayerMatchStat, Round } from '../types';
import { MatchCard } from './MatchCard';

const DONE_STATUSES = new Set(['FT', 'AET', 'PEN', 'FINISHED']);
const LIVE_STATUSES = new Set(['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT']);
const UPCOMING_STATUSES = new Set(['UPCOMING', 'NS']);

const KO_ORDER: Round[] = ['PO', 'R16', 'QF', 'SF', 'FIN'];

type RoundStatus = 'upcoming' | 'inprogress' | 'live' | 'finished';

interface RoundInfo {
  key: string;
  short: string;
  label: string;
  matchday?: number;
  round?: Round;
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

const RowCrest: React.FC<{ team?: Team; tbd: boolean; onClick?: () => void }> = ({ team, tbd, onClick }) => (
  <div
    onClick={(e) => { if (onClick && !tbd) { e.stopPropagation(); onClick(); } }}
    className={`w-7 h-7 shrink-0 rounded-md overflow-hidden flex items-center justify-center ${
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
  onTeamClick: (teamId: string) => void;
  onOpen: () => void;
}> = ({ match, homeTeam, awayTeam, locale, onTeamClick, onOpen }) => {
  const isLive = LIVE_STATUSES.has(match.status);
  const isFinished = DONE_STATUSES.has(match.status);
  const hasResult = (isLive || isFinished) && match.homeScore !== null && match.awayScore !== null;
  const isHomeTbd = isTbdId(match.homeTeamId);
  const isAwayTbd = isTbdId(match.awayTeamId);
  const homeName = isHomeTbd ? 'TBD' : (homeTeam?.name || match.homeTeamId);
  const awayName = isAwayTbd ? 'TBD' : (awayTeam?.name || match.awayTeamId);

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

      <div className="w-14 shrink-0 flex items-center justify-center">
        {hasResult ? (
          <span className="text-[15px] font-black text-white tabular-nums tracking-tight">{match.homeScore}&nbsp;-&nbsp;{match.awayScore}</span>
        ) : (isHomeTbd || isAwayTbd) ? (
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">TBD</span>
        ) : (
          <span className="text-slate-600 text-[10px] font-black uppercase tracking-wide">vs</span>
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
    return mds.map(md => ({ key: `MD${md}`, short: `MD ${md}`, label: `${lang.matchday || 'Matchday'} ${md}`, matchday: md }));
  }, [matches, lang]);

  const koRounds: RoundInfo[] = useMemo(() => {
    const present = new Set(matches.filter(m => !!m.round).map(m => m.round as Round));
    return KO_ORDER.filter(r => present.has(r)).map(r => ({ key: r, short: r, label: koLabel(r, lang), round: r }));
  }, [matches, lang]);

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
        <span className="text-[10px] font-bold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
          {activeMatches.length} {activeMatches.length === 1 ? (lang.match || 'Match') : (lang.matches || 'Matches')}
        </span>
      </div>

      {/* Results list, grouped by day */}
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
