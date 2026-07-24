import React, { useState, useEffect } from 'react';
import { Match, Team, Translation, UserProfile, Prediction } from '../types';
import { Search, Lock as LockIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { ScoreStepper } from './ScoreStepper';
import { AvatarDisplay } from './AvatarDisplay';
import { isMatchLocked, msUntilLock } from '../utils/date';

const LIVE_STATUSES = ['LIVE', '1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT'];
const FINISHED_STATUSES = ['FINISHED', 'FT', 'AET', 'PEN'];

interface MatchRowProps {
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  onUpdate: (id: string, h: number, a: number) => void;
  lang: Translation;
  locale: string;
  userTokens: number;
  rivals: UserProfile[];
  onSpy: (id: string) => void;
  currentUser: UserProfile | null;
  allPredictions: Prediction[];
  isAdminMode: boolean;
  isLateJoiner?: boolean;
  onTeamClick?: (teamId: string) => void;
}

const getInitials = (name: string) => {
  const clean = (name || '').replace(/\(.*?\)/g, '').trim();
  if (!clean || clean === 'TBD') return '';
  const words = clean.split(/\s+/).filter(Boolean);
  return words.length === 1 ? words[0].slice(0, 2).toUpperCase() : (words[0][0] + words[1][0]).toUpperCase();
};

/**
 * Compact single-line match row for the day-grouped League Phase matchday list —
 * a denser alternative to MatchCard for browsing many fixtures at once. Handles
 * upcoming (predict), live, and finished states so a matchday's row stays usable
 * all season, not just before its own kickoff; MatchCard remains the full-featured
 * card used for knockout/detail views.
 */
export const MatchRow: React.FC<MatchRowProps> = ({
  match, homeTeam, awayTeam, onUpdate, lang, locale, userTokens, rivals, onSpy, currentUser, allPredictions, isAdminMode, isLateJoiner = false, onTeamClick,
}) => {
  const prediction = allPredictions.find(p => p.userId === currentUser?.email && p.matchId === match.id);

  const [localHome, setLocalHome] = useState<number | null>(prediction ? prediction.home : null);
  const [localAway, setLocalAway] = useState<number | null>(prediction ? prediction.away : null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [pendingSpy, setPendingSpy] = useState(false);
  const [rivalsOpen, setRivalsOpen] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setLocalHome(prediction ? prediction.home : null);
      setLocalAway(prediction ? prediction.away : null);
    }
  }, [prediction, isDirty]);

  useEffect(() => {
    if (isDirty && localHome !== null && localAway !== null) {
      const timer = setTimeout(() => {
        setIsSaving(true);
        setIsSaved(false);
        onUpdate(match.id, localHome, localAway);
        setTimeout(() => {
          setIsSaving(false);
          setIsDirty(false);
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2000);
        }, 500);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [localHome, localAway, isDirty, match.id, onUpdate]);

  const matchNotStarted = match.status === 'NS' || match.status === 'UPCOMING';
  const isRealLifeLocked = (isLateJoiner && matchNotStarted) ? false : isMatchLocked(match);
  const isLocked = isRealLifeLocked && !isAdminMode;
  const isLive = LIVE_STATUSES.includes(match.status);
  const isFinished = FINISHED_STATUSES.includes(match.status);
  const hasResult = (isLive || isFinished) && match.homeScore !== null && match.awayScore !== null;
  const isExact = hasResult && !!prediction && prediction.home === match.homeScore && prediction.away === match.awayScore;
  const isCorrectOutcome = hasResult && !!prediction && !isExact &&
    Math.sign(prediction.home - prediction.away) === Math.sign(match.homeScore! - match.awayScore!);

  const [lockTick, setLockTick] = useState(() => Date.now());
  useEffect(() => {
    if (isLocked) return;
    const id = setInterval(() => setLockTick(Date.now()), 30000);
    return () => clearInterval(id);
  }, [isLocked]);
  const msToLock = isLocked ? null : msUntilLock(match, lockTick);
  const isUrgentLock = msToLock !== null && msToLock > 0 && msToLock < 60 * 60 * 1000;

  const isSpied = currentUser?.spiedMatches?.includes(match.id);
  const canSpy = !isLocked && !isSpied && !!onSpy && rivals.length > 0;
  const showRivals = !isLateJoiner && (isSpied || isRealLifeLocked);

  const handleActivate = () => { setLocalHome(0); setLocalAway(0); setIsDirty(true); };
  const handleScoreChange = (side: 'home' | 'away', val: number) => {
    if (side === 'home') setLocalHome(val); else setLocalAway(val);
    setIsDirty(true);
  };
  const handleSpyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (userTokens > 0) setPendingSpy(true);
  };

  const homeName = lang.teamNames[homeTeam?.id] || homeTeam?.name || 'TBD';
  const awayName = lang.teamNames[awayTeam?.id] || awayTeam?.name || 'TBD';
  const homeInitials = getInitials(homeName);
  const awayInitials = getInitials(awayName);

  const kickoffTime = match.date && match.date !== 'TBD' && !isNaN(new Date(match.date).getTime())
    ? new Date(match.date).toLocaleTimeString(locale || 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : '--:--';

  const saveState: 'idle' | 'syncing' | 'saved' = isSaved ? 'saved' : (isDirty || isSaving) ? 'syncing' : 'idle';

  const Crest: React.FC<{ team: Team; initials: string; align: 'left' | 'right' }> = ({ team, initials }) => (
    <div
      onClick={(e) => { if (onTeamClick && team?.id && !team.id.startsWith('TBD')) { e.stopPropagation(); onTeamClick(team.id); } }}
      className={`w-6 h-6 shrink-0 rounded-md overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center ${onTeamClick ? 'cursor-pointer' : ''}`}
    >
      {team?.flag
        ? <img src={team.flag} alt={team.name} className="w-full h-full object-cover" />
        : <span className="text-[8px] font-black text-white/30">{initials}</span>}
    </div>
  );

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Kickoff time / live / FT / lock state */}
        <div className="w-9 shrink-0 flex flex-col items-start">
          {isLive ? (
            <span className="text-[9px] font-black tabular-nums text-rose-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              {match.minute ? `${match.minute}'` : 'LIVE'}
            </span>
          ) : isFinished ? (
            <span className="text-[9px] font-black tabular-nums text-slate-400">FT</span>
          ) : isLocked ? (
            <LockIcon size={11} className="text-slate-500" />
          ) : (
            <span className={`text-[9px] font-bold tabular-nums ${isUrgentLock ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>{kickoffTime}</span>
          )}
        </div>

        {/* Home team */}
        <div className="flex-1 min-w-0 flex items-center justify-end gap-1.5">
          <span className="text-[11px] font-bold text-white text-right leading-tight line-clamp-2 min-w-0">{homeName}</span>
          <Crest team={homeTeam} initials={homeInitials} align="left" />
        </div>

        {/* Score entry, or the real result once the match has kicked off */}
        {hasResult ? (
          <div className="flex flex-col items-center shrink-0 min-w-[52px]">
            <span className="text-sm font-black text-white tabular-nums tracking-tight">{match.homeScore}&nbsp;-&nbsp;{match.awayScore}</span>
            {prediction && (
              <span className={`text-[8px] font-black uppercase tracking-wide ${isExact ? 'text-emerald-400' : isCorrectOutcome ? 'text-cyan-400' : 'text-slate-600'}`}>
                {lang.myPick || 'Pick'}: {prediction.home}-{prediction.away}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            <ScoreStepper
              size="compact"
              value={localHome}
              onChange={(v) => handleScoreChange('home', v)}
              isLocked={isLocked}
              onActivate={handleActivate}
              saveState={saveState}
            />
            <span className="text-slate-600 text-xs font-black">-</span>
            <ScoreStepper
              size="compact"
              value={localAway}
              onChange={(v) => handleScoreChange('away', v)}
              isLocked={isLocked}
              onActivate={handleActivate}
              saveState={saveState}
            />
          </div>
        )}

        {/* Away team */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <Crest team={awayTeam} initials={awayInitials} align="right" />
          <span className="text-[11px] font-bold text-white leading-tight line-clamp-2 min-w-0">{awayName}</span>
        </div>

        {/* Scout / rivals toggle */}
        <div className="w-6 shrink-0 flex items-center justify-center">
          {canSpy && !pendingSpy && (
            <button onClick={handleSpyClick} className={`p-1 rounded-full transition-colors ${userTokens > 0 ? 'text-amber-400 hover:bg-amber-500/10' : 'text-slate-700 cursor-not-allowed'}`} title={lang.sendScouts || 'Send out the scouts'}>
              <Search size={13} />
            </button>
          )}
          {showRivals && rivals.length > 0 && (
            <button onClick={(e) => { e.stopPropagation(); setRivalsOpen(o => !o); }} className="p-1 rounded-full text-yellow-400 hover:bg-yellow-500/10 transition-colors">
              {rivalsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Pending spy confirm */}
      {pendingSpy && (
        <div className="bg-black/20 py-1.5 px-3 flex items-center gap-2 border-t border-white/5">
          <span className="flex-1 text-[9px] font-black text-amber-400 uppercase tracking-widest">{lang.spyConfirm || 'Use a token?'}</span>
          <button onClick={() => { onSpy(match.id); setPendingSpy(false); }} className="px-2 py-0.5 rounded border bg-amber-500/30 border-amber-400/60 text-amber-300 text-[9px] font-black uppercase tracking-wide active:scale-95 transition-all">✓</button>
          <button onClick={() => setPendingSpy(false)} className="px-2 py-0.5 rounded border bg-white/5 border-white/20 text-white/50 text-[9px] font-black uppercase tracking-wide active:scale-95 transition-all">✗</button>
        </div>
      )}

      {/* Rivals panel */}
      {showRivals && rivals.length > 0 && rivalsOpen && (
        <div className="bg-slate-800/60 border-t border-yellow-500/30 px-3 py-2 flex flex-col gap-1">
          {rivals.map(rival => {
            const rivalPred = allPredictions.find(p => p.userId === rival.email && p.matchId === match.id);
            return (
              <div key={rival.email} className="flex items-center justify-between bg-white/5 px-2 py-1 rounded">
                <div className="flex items-center gap-2 min-w-0">
                  <AvatarDisplay avatar={rival.avatar} size="xs" className="w-5 h-5 text-[9px]" />
                  <span className="text-[10px] font-bold text-white truncate max-w-[100px]">{rival.name}</span>
                </div>
                <span className="text-[10px] font-mono font-black text-yellow-400 tracking-wider">{rivalPred ? `${rivalPred.home} - ${rivalPred.away}` : '-'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
