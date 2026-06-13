/**
 * KitImage — composites 3 transparent Wikimedia PNG layers (left arm, body, right arm)
 * into a recognisable football jersey at any small size.
 *
 * Source CDN: Wikimedia Commons via Special:FilePath redirect
 * All files are Creative Commons licensed (Wikipedia football kit template, 2026 season).
 *
 * Kit type (home / away) is resolved from the live API hex color (kitBg) vs the
 * static TEAM_JERSEYS constant — same logic used in GoalBanner and KitCard.
 *
 * Optional Supabase migration (if you ever want DB-driven URLs):
 *   ALTER TABLE teams
 *     ADD COLUMN IF NOT EXISTS home_kit_url TEXT,
 *     ADD COLUMN IF NOT EXISTS away_kit_url TEXT;
 */
import React, { useState } from 'react';
import { TEAMS } from '../constants';

// ── Kit part definition ───────────────────────────────────────────────────────

interface WikiKitParts {
  arms: string; // Kit_left_arm_{arms}.png  /  Kit_right_arm_{arms}.png
  body: string; // Kit_body_{body}.png  (sometimes diverges, e.g. sco26hA)
}

interface TeamKitEntry {
  home: WikiKitParts | null;
  away: WikiKitParts | null;
}

// ── Wikimedia kit codes for all 48 World Cup 2026 teams ───────────────────────
// Researched from each national team's Wikipedia infobox (2026 kit section).
// Codes follow the pattern: {3-letter-FIFA-code}{2-digit-year}{h|a}
// Some teams use capital letters (ENG, FRA, HAI, ARG away) — these are exact.
// DR Congo uses "cod2526" (not "cod26").  NZL away uses "nze26a".
// JPN uses "jap" (Wikipedia code), not "jpn".  CUW uses "cur".

const KIT_CODES: Record<string, TeamKitEntry> = {
  ALG: { home: { arms: 'alg26h',   body: 'alg26hA'  }, away: { arms: 'alg26a',   body: 'alg26aA'  } },
  ARG: { home: { arms: 'arg26h',   body: 'arg26hA'  }, away: { arms: 'arg26A',   body: 'arg26A'   } },
  AUS: { home: { arms: 'aus26h',   body: 'aus26h'   }, away: { arms: 'aus26a',   body: 'aus26a'   } },
  AUT: { home: { arms: 'aut26h',   body: 'aut26h'   }, away: { arms: 'aut26a',   body: 'aut26a'   } },
  BEL: { home: { arms: 'bel26h',   body: 'bel26hA'  }, away: { arms: 'bel26a',   body: 'bel26a'   } },
  BIH: { home: { arms: 'bih26h',   body: 'bih26h'   }, away: { arms: 'bih26a',   body: 'bih26a'   } },
  BRA: { home: { arms: 'bra26h',   body: 'bra26h'   }, away: { arms: 'bra26a',   body: 'bra26a'   } },
  CAN: { home: { arms: 'can26h',   body: 'can26h'   }, away: { arms: 'can26a',   body: 'can26a'   } },
  CIV: { home: { arms: 'civ26h',   body: 'civ26h'   }, away: { arms: 'civ26a',   body: 'civ26a'   } },
  COD: { home: { arms: 'cod2526h', body: 'cod2526h' }, away: { arms: 'cod2526a', body: 'cod2526a' } },
  COL: { home: { arms: 'col26h',   body: 'col26hA'  }, away: { arms: 'col26a',   body: 'col26aA'  } },
  CPV: { home: { arms: 'cpv26h',   body: 'cpv26h'   }, away: { arms: 'cpv26a',   body: 'cpv26a'   } },
  CRO: { home: { arms: 'cro26h',   body: 'cro26h'   }, away: { arms: 'cro26a',   body: 'cro26a'   } },
  CUW: { home: { arms: 'cur26h',   body: 'cur26hA'  }, away: { arms: 'cur26a',   body: 'cur26aA'  } },
  CZE: { home: { arms: 'cze26h',   body: 'cze26h'   }, away: { arms: 'cze26a',   body: 'cze26a'   } },
  ECU: { home: { arms: 'ecu26h',   body: 'ecu26h'   }, away: { arms: 'ecu26a',   body: 'ecu26a'   } },
  EGY: { home: { arms: 'egy26h',   body: 'egy26h'   }, away: { arms: 'egy26a',   body: 'egy26a'   } },
  ENG: { home: { arms: 'eng26H',   body: 'eng26H'   }, away: { arms: 'eng26A',   body: 'eng26A'   } },
  ESP: { home: { arms: 'esp26h',   body: 'esp26h'   }, away: { arms: 'esp26a',   body: 'esp26a'   } },
  FRA: { home: { arms: 'fra26H',   body: 'fra26H'   }, away: { arms: 'fra26a',   body: 'fra26a'   } },
  GER: { home: { arms: 'ger26h',   body: 'ger26hA'  }, away: { arms: 'ger26a',   body: 'ger26a'   } },
  GHA: { home: { arms: 'gha26h',   body: 'gha26h'   }, away: { arms: 'gha26a',   body: 'gha26a'   } },
  HAI: { home: { arms: 'hai26H',   body: 'hai26H'   }, away: { arms: 'hai26A',   body: 'hai26A'   } },
  IRN: { home: { arms: 'irn26h',   body: 'irn26h'   }, away: { arms: 'irn26a',   body: 'irn26a'   } },
  IRQ: { home: { arms: 'irq26h',   body: 'irq26h'   }, away: { arms: 'irq26a',   body: 'irq26a'   } },
  JOR: { home: { arms: 'jor26h',   body: 'jor26h'   }, away: { arms: 'jor26a',   body: 'jor26a'   } },
  JPN: { home: { arms: 'jap26h',   body: 'jap26h'   }, away: { arms: 'jap26a',   body: 'jap26a'   } },
  KOR: { home: { arms: 'kor26h',   body: 'kor26h'   }, away: { arms: 'kor26a',   body: 'kor26a'   } },
  KSA: { home: { arms: 'ksa26h',   body: 'ksa26h'   }, away: { arms: 'ksa26a',   body: 'ksa26a'   } },
  MAR: { home: { arms: 'mar26h',   body: 'mar26h'   }, away: { arms: 'mar26a',   body: 'mar26a'   } },
  MEX: { home: { arms: 'mex26h',   body: 'mex26h'   }, away: { arms: 'mex26a',   body: 'mex26a'   } },
  NED: { home: { arms: 'ned26h',   body: 'ned26h'   }, away: { arms: 'ned26a',   body: 'ned26a'   } },
  NOR: { home: { arms: 'nor26h',   body: 'nor26h'   }, away: { arms: 'nor26a',   body: 'nor26a'   } },
  NZL: { home: { arms: 'nzl26h',   body: 'nzl26h'   }, away: { arms: 'nze26a',   body: 'nze26a'   } },
  PAN: { home: { arms: 'pan26h',   body: 'pan26h'   }, away: { arms: 'pan26a',   body: 'pan26a'   } },
  PAR: { home: { arms: 'par26h',   body: 'par26h'   }, away: { arms: 'par26A',   body: 'par26A'   } },
  POR: { home: { arms: 'por26h',   body: 'por26h'   }, away: { arms: 'por26a',   body: 'por26a'   } },
  RSA: { home: { arms: 'rsa26h',   body: 'rsa26hA'  }, away: { arms: 'rsa26a',   body: 'rsa26aA'  } },
  SCO: { home: { arms: 'sco26h',   body: 'sco26hA'  }, away: { arms: 'sco26a',   body: 'sco26aA'  } },
  SEN: { home: { arms: 'sen26h',   body: 'sen26h'   }, away: { arms: 'sen26a',   body: 'sen26a'   } },
  SUI: { home: { arms: 'sui26h',   body: 'sui26h'   }, away: { arms: 'sui26a',   body: 'sui26a'   } },
  SWE: { home: { arms: 'swe26h',   body: 'swe26hA'  }, away: { arms: 'swe26a',   body: 'swe26a'   } },
  TUN: { home: { arms: 'tun26h',   body: 'tun26h'   }, away: { arms: 'tun26a',   body: 'tun26a'   } },
  TUR: { home: { arms: 'tur26h',   body: 'tur26h'   }, away: { arms: 'tur26a',   body: 'tur26a'   } },
  URU: { home: { arms: 'uru26h',   body: 'uru26h'   }, away: { arms: 'uru26a',   body: 'uru26a'   } },
  USA: { home: { arms: 'usa26h',   body: 'usa26h'   }, away: { arms: 'usa26a',   body: 'usa26a'   } },
  UZB: { home: { arms: 'uzb26h',   body: 'uzb26h'   }, away: { arms: 'uzb26a',   body: 'uzb26a'   } },
};

// ── CDN helper ────────────────────────────────────────────────────────────────

const CDN = 'https://commons.wikimedia.org/wiki/Special:FilePath/';

function part(segment: string, code: string) {
  return `${CDN}Kit_${segment}_${code}.png`;
}

// ── Kit type resolver (exported for reuse in MatchCard / MatchdayHero) ────────

export function resolveKitType(
  teamId: string,
  kitBg: string | null | undefined,
): 'home' | 'away' {
  if (!kitBg) return 'home';
  const staticBg = TEAMS[teamId]?.jerseyBg;
  if (!staticBg) return 'home';
  return staticBg.replace('#', '').toUpperCase() === kitBg.replace('#', '').toUpperCase()
    ? 'home'
    : 'away';
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface KitImageProps {
  teamId: string;
  /** Live API kit hex (from match_lineups.kit_bg) — used to auto-resolve home/away */
  kitBg?: string | null;
  /** Override if you already know the kit type */
  kitType?: 'home' | 'away';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const SIZE_CLASS = {
  xs: 'w-[18px] h-[26px]',
  sm: 'w-[22px] h-[32px]',
  md: 'w-[30px] h-[44px]',
} as const;

export const KitImage: React.FC<KitImageProps> = ({
  teamId,
  kitBg,
  kitType,
  size = 'sm',
  className = '',
}) => {
  const [loaded, setLoaded] = useState({ arms: true, body: true });

  const type = kitType ?? resolveKitType(teamId, kitBg);
  const def  = KIT_CODES[teamId]?.[type];

  // No mapping for this team → render nothing; flag appears at full size
  if (!def) return null;

  // Both arms and body failed → hide entirely so there's no blank space
  if (!loaded.arms && !loaded.body) return null;

  const leftUrl  = part('left_arm',  def.arms);
  const bodyUrl  = part('body',      def.body);
  const rightUrl = part('right_arm', def.arms);

  const onArmsError  = () => setLoaded(p => ({ ...p, arms: false }));
  const onBodyError  = () => setLoaded(p => ({ ...p, body: false }));

  return (
    <div
      className={`relative shrink-0 ${SIZE_CLASS[size]} ${className}`}
      aria-hidden="true"
    >
      {loaded.arms && (
        <>
          <img
            src={leftUrl}
            className="absolute inset-0 w-full h-full object-contain"
            onError={onArmsError}
            loading="lazy"
            alt=""
            decoding="async"
          />
          <img
            src={rightUrl}
            className="absolute inset-0 w-full h-full object-contain"
            onError={onArmsError}
            loading="lazy"
            alt=""
            decoding="async"
          />
        </>
      )}
      {loaded.body && (
        <img
          src={bodyUrl}
          className="absolute inset-0 w-full h-full object-contain"
          onError={onBodyError}
          loading="lazy"
          alt=""
          decoding="async"
        />
      )}
    </div>
  );
};
