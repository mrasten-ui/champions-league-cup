import React from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin } from 'lucide-react';
import { Translation } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type KeyMatchType =
  | 'opening' | 'final' | 'thirdPlace' | 'semiFinal'
  | 'quarterFinal' | 'roundOf16' | 'roundOf32';

export type RoofType = 'open' | 'retractable' | 'fixed';

export interface StadiumData {
  /** Substrings to match against match.venue (lowercase) */
  venueMatch: string[];
  sketchfabId: string;
  fifaName: string;
  localName: string;
  city: string;
  country: string;
  capacityWC: number;
  yearOpened: number;
  surface: string;
  roofType: RoofType;
  wcMatches: number;
  keyMatches: KeyMatchType[];
}

// ─── Stadium data ─────────────────────────────────────────────────────────────
// Sketchfab model IDs from the "2026 World Cup Stadiums" collection by Shin Xiba 3D
// https://sketchfab.com/Xiba3D/collections/2026-world-cup-stadiums-7f48b54deda847e08ff4727ead7b547c

export const STADIUMS: StadiumData[] = [
  // ── USA ──────────────────────────────────────────────────────────────────────
  {
    venueMatch: ['metlife'],
    sketchfabId: 'cfc0b282b3ec466c841087d83018a168',
    fifaName: 'New York New Jersey Stadium',
    localName: 'MetLife Stadium',
    city: 'East Rutherford, NJ',
    country: 'United States',
    capacityWC: 82_500,
    yearOpened: 2010,
    surface: 'Natural Grass',
    roofType: 'open',
    wcMatches: 8,
    keyMatches: ['final', 'roundOf16', 'roundOf32'],
  },
  {
    venueMatch: ['at&t', 'att stadium'],
    sketchfabId: '2f5f9e70d46d4b0aa1bc9cbe98563161',
    fifaName: 'Dallas Stadium',
    localName: 'AT&T Stadium',
    city: 'Arlington, TX',
    country: 'United States',
    capacityWC: 80_000,
    yearOpened: 2009,
    surface: 'Natural Grass',
    roofType: 'retractable',
    wcMatches: 8,
    keyMatches: ['semiFinal', 'roundOf16', 'roundOf32'],
  },
  {
    venueMatch: ['sofi'],
    sketchfabId: '6df1bdc877344397801400fe0c5269be',
    fifaName: 'Los Angeles Stadium',
    localName: 'SoFi Stadium',
    city: 'Inglewood, CA',
    country: 'United States',
    capacityWC: 70_240,
    yearOpened: 2020,
    surface: 'Natural Grass',
    roofType: 'fixed',
    wcMatches: 8,
    keyMatches: ['quarterFinal', 'roundOf32'],
  },
  {
    venueMatch: ['mercedes'],
    sketchfabId: '4f176a0f063743ed98fe7303498608bb',
    fifaName: 'Atlanta Stadium',
    localName: 'Mercedes-Benz Stadium',
    city: 'Atlanta, GA',
    country: 'United States',
    capacityWC: 71_000,
    yearOpened: 2017,
    surface: 'Natural Grass',
    roofType: 'retractable',
    wcMatches: 8,
    keyMatches: ['semiFinal', 'roundOf16', 'roundOf32'],
  },
  {
    venueMatch: ['gillette'],
    sketchfabId: '2148e49ae6914c88adcae710996f294a',
    fifaName: 'Boston Stadium',
    localName: 'Gillette Stadium',
    city: 'Foxborough, MA',
    country: 'United States',
    capacityWC: 65_000,
    yearOpened: 2002,
    surface: 'Natural Grass',
    roofType: 'open',
    wcMatches: 7,
    keyMatches: ['quarterFinal', 'roundOf32'],
  },
  {
    venueMatch: ['nrg'],
    sketchfabId: 'b675e828317b4c3fb4e14526a4e87e8d',
    fifaName: 'Houston Stadium',
    localName: 'NRG Stadium',
    city: 'Houston, TX',
    country: 'United States',
    capacityWC: 72_220,
    yearOpened: 2002,
    surface: 'Natural Grass',
    roofType: 'retractable',
    wcMatches: 7,
    keyMatches: ['roundOf16', 'roundOf32'],
  },
  {
    venueMatch: ['arrowhead'],
    sketchfabId: '8a4343ba53c74078808cadc937cdb20e',
    fifaName: 'Kansas City Stadium',
    localName: 'Arrowhead Stadium',
    city: 'Kansas City, MO',
    country: 'United States',
    capacityWC: 76_416,
    yearOpened: 1972,
    surface: 'Natural Grass',
    roofType: 'open',
    wcMatches: 6,
    keyMatches: ['quarterFinal', 'roundOf32'],
  },
  {
    venueMatch: ['hard rock'],
    sketchfabId: 'af2f7e013af44bafbe2043050b9d292a',
    fifaName: 'Miami Stadium',
    localName: 'Hard Rock Stadium',
    city: 'Miami Gardens, FL',
    country: 'United States',
    capacityWC: 65_326,
    yearOpened: 1987,
    surface: 'Natural Grass',
    roofType: 'open',
    wcMatches: 7,
    keyMatches: ['thirdPlace', 'quarterFinal', 'roundOf32'],
  },
  {
    venueMatch: ['lincoln financial', 'lincoln'],
    sketchfabId: '97b99892fd0b44e98bb946b78b49cfc3',
    fifaName: 'Philadelphia Stadium',
    localName: 'Lincoln Financial Field',
    city: 'Philadelphia, PA',
    country: 'United States',
    capacityWC: 69_328,
    yearOpened: 2003,
    surface: 'Natural Grass',
    roofType: 'open',
    wcMatches: 6,
    keyMatches: ['roundOf32'],
  },
  {
    venueMatch: ["levi's", 'levis', 'san francisco'],
    sketchfabId: '82a444fb65764299860149efd323ff0e',
    fifaName: 'San Francisco Bay Area Stadium',
    localName: "Levi's Stadium",
    city: 'Santa Clara, CA',
    country: 'United States',
    capacityWC: 68_500,
    yearOpened: 2014,
    surface: 'Natural Grass',
    roofType: 'open',
    wcMatches: 7,
    keyMatches: ['roundOf16', 'roundOf32'],
  },
  {
    venueMatch: ['lumen'],
    sketchfabId: '403a31928a024f4bba49d881f3e60bdf',
    fifaName: 'Seattle Stadium',
    localName: 'Lumen Field',
    city: 'Seattle, WA',
    country: 'United States',
    capacityWC: 69_000,
    yearOpened: 2002,
    surface: 'Natural Grass',
    roofType: 'open',
    wcMatches: 6,
    keyMatches: ['roundOf16', 'roundOf32'],
  },
  // ── Canada ───────────────────────────────────────────────────────────────────
  {
    venueMatch: ['bmo', 'toronto'],
    sketchfabId: '015e0f1f2e8146b5a39910324a68b2fb',
    fifaName: 'Toronto Stadium',
    localName: 'BMO Field',
    city: 'Toronto, ON',
    country: 'Canada',
    capacityWC: 45_736,
    yearOpened: 2007,
    surface: 'Natural Grass',
    roofType: 'open',
    wcMatches: 6,
    keyMatches: ['roundOf32'],
  },
  {
    venueMatch: ['bc place', 'vancouver'],
    sketchfabId: 'fb65bf95e1a04f0791d410b2361fe16e',
    fifaName: 'Vancouver Stadium',
    localName: 'BC Place',
    city: 'Vancouver, BC',
    country: 'Canada',
    capacityWC: 54_500,
    yearOpened: 1983,
    surface: 'Natural Grass',
    roofType: 'retractable',
    wcMatches: 7,
    keyMatches: ['roundOf16', 'roundOf32'],
  },
  // ── Mexico ───────────────────────────────────────────────────────────────────
  {
    venueMatch: ['azteca', 'mexico city'],
    sketchfabId: '83ca580566054b1b9d780289f4372d68',
    fifaName: 'Mexico City Stadium',
    localName: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    capacityWC: 80_000,
    yearOpened: 1966,
    surface: 'Natural Grass',
    roofType: 'open',
    wcMatches: 5,
    keyMatches: ['opening', 'roundOf16', 'roundOf32'],
  },
  {
    venueMatch: ['akron', 'guadalajara'],
    sketchfabId: '09002d3206d44f15974fc7133e543726',
    fifaName: 'Guadalajara Stadium',
    localName: 'Estadio Akron',
    city: 'Zapopan, Guadalajara',
    country: 'Mexico',
    capacityWC: 49_850,
    yearOpened: 2010,
    surface: 'Natural Grass',
    roofType: 'open',
    wcMatches: 4,
    keyMatches: [],
  },
  {
    venueMatch: ['bbva', 'monterrey'],
    sketchfabId: '7ae5e6c6393947948776c1314fbbeefd',
    fifaName: 'Monterrey Stadium',
    localName: 'Estadio BBVA',
    city: 'Guadalupe, Monterrey',
    country: 'Mexico',
    capacityWC: 53_500,
    yearOpened: 2015,
    surface: 'Natural Grass',
    roofType: 'open',
    wcMatches: 4,
    keyMatches: ['roundOf32'],
  },
];

// ─── Lookup helper ────────────────────────────────────────────────────────────

export function getStadiumByVenue(venue: string | null | undefined): StadiumData | null {
  if (!venue) return null;
  const v = venue.toLowerCase();
  return STADIUMS.find(s => s.venueMatch.some(key => v.includes(key))) ?? null;
}

// ─── Modal component ──────────────────────────────────────────────────────────

interface StadiumModalProps {
  venue: string;
  lang: Translation;
  onClose: () => void;
}

export const StadiumModal: React.FC<StadiumModalProps> = ({ venue, lang, onClose }) => {
  const stadium = getStadiumByVenue(venue);

  const keyMatchLabel = (type: KeyMatchType): string => ({
    opening:      lang.openingMatch   ?? 'Opening Match',
    final:        lang.final          ?? 'Final',
    thirdPlace:   lang.thirdPlace     ?? '3rd Place',
    semiFinal:    lang.semiFinal      ?? 'Semi-Final',
    quarterFinal: lang.quarterFinal   ?? 'Quarter-Final',
    roundOf16:    lang.roundOf16      ?? 'Round of 16',
    roundOf32:    lang.roundOf32      ?? 'Round of 32',
  }[type]);

  const roofLabel = (roof: RoofType): string => ({
    open:        lang.roofOpen        ?? 'Open Air',
    retractable: lang.roofRetractable ?? 'Retractable',
    fixed:       lang.roofFixed       ?? 'Fixed Roof',
  }[roof]);

  if (!stadium) {
    // Fallback for unknown venues
    return createPortal(
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />
        <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
          <MapPin size={32} className="text-slate-300 mx-auto mb-3" />
          <h2 className="font-black text-slate-700 text-lg uppercase tracking-tight mb-1">{venue.split(',')[0]}</h2>
          <p className="text-slate-400 text-sm mb-6">Stadium info coming soon.</p>
          <button onClick={onClose} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs">
            {lang.playerClose ?? 'Close'}
          </button>
        </div>
      </div>,
      document.body
    );
  }

  const embedUrl = `https://sketchfab.com/models/${stadium.sketchfabId}/embed?autostart=1&ui_controls=1&ui_infos=0`;

  const infoGrid = [
    { label: lang.stadiumFifaName   ?? 'FIFA Name',    value: stadium.fifaName },
    { label: lang.stadiumLocalName  ?? 'Local Name',   value: stadium.localName },
    { label: lang.stadiumCity       ?? 'City',         value: `${stadium.city}, ${stadium.country}` },
    { label: lang.stadiumCapacity   ?? 'Capacity',     value: stadium.capacityWC.toLocaleString() },
    { label: lang.stadiumOpened     ?? 'Year Opened',  value: String(stadium.yearOpened) },
    { label: lang.stadiumSurface    ?? 'Surface',      value: stadium.surface },
    { label: lang.stadiumRoof       ?? 'Roof',         value: roofLabel(stadium.roofType) },
    { label: lang.stadiumWCMatches  ?? 'WC Matches',   value: String(stadium.wcMatches) },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* ── 3D Embed ── */}
        <div className="relative w-full aspect-[4/3] sm:aspect-video bg-[#0d1117] shrink-0">
          <iframe
            title={stadium.localName}
            src={embedUrl}
            allow="autoplay; fullscreen; xr-spatial-tracking"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
          />
          {/* Close button overlaid on embed */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-sm text-white p-2 rounded-full transition-colors shadow-lg border border-white/10"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Credit bar ── */}
        <div className="bg-slate-900 px-4 py-2 flex items-center justify-between shrink-0">
          <p className="text-slate-500 text-[10px] leading-none">
            3D model by{' '}
            <a
              href="https://sketchfab.com/Xiba3D/collections/2026-world-cup-stadiums-7f48b54deda847e08ff4727ead7b547c"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              Shin Xiba 3D
            </a>{' '}
            via Sketchfab
          </p>
          <span className="text-amber-500/40 text-[10px] font-black uppercase tracking-widest">FIFA 2026</span>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto bg-slate-50">

          {/* Stadium name header */}
          <div className="bg-[#0f2545] relative overflow-hidden px-5 py-5 shrink-0">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.04]" />
            <div className="relative flex items-start gap-3">
              <MapPin size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tighter leading-none truncate">
                  {stadium.localName}
                </h2>
                <p className="text-amber-400/75 text-[11px] font-bold uppercase tracking-widest mt-1">
                  {stadium.city} · {stadium.country}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            {/* Info grid: 2 columns desktop, 1 column mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {infoGrid.map(({ label, value }) => (
                <div key={label} className="bg-white rounded-xl px-4 py-3 border border-slate-200 shadow-sm">
                  <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    {label}
                  </span>
                  <span className="text-sm font-bold text-slate-800 leading-snug">{value}</span>
                </div>
              ))}
            </div>

            {/* Key matches */}
            {stadium.keyMatches.length > 0 && (
              <div className="bg-white rounded-xl px-4 py-3 border border-slate-200 shadow-sm">
                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  {lang.stadiumKeyMatches ?? 'Key Matches'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {stadium.keyMatches.map(km => {
                    const isMajor = km === 'final' || km === 'semiFinal' || km === 'opening';
                    return (
                      <span
                        key={km}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                          isMajor
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        {isMajor && <span className="mr-1.5 text-[10px]">★</span>}
                        {keyMatchLabel(km)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg"
          >
            {lang.playerClose ?? 'Close'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
