import React, { useRef, useEffect } from 'react';
import { Translation } from '../types';
import { Calendar, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';

interface DateRibbonProps {
  dates: string[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  lang: Translation;
  locale?: string;
}

export const DateRibbon: React.FC<DateRibbonProps> = ({ dates, selectedDate, onDateSelect, lang, locale = 'en-GB' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (scrollRef.current && selectedDate !== 'ALL' && selectedDate !== 'CONFIRMED') {
      const selectedEl = scrollRef.current.querySelector(`[data-date="${selectedDate}"]`) as HTMLElement;
      if (selectedEl) {
        const container = scrollRef.current;
        const scrollLeft = selectedEl.offsetLeft - (container.clientWidth / 2) + (selectedEl.clientWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedDate]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  const getRelativeLabel = (dateStr: string) => {
    if (dateStr === todayStr) return { main: lang.today || "Today", sub: "" };
    const [y, mo, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
    return {
      main: dateObj.getUTCDate(),
      sub: dateObj.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' })
    };
  };

  const isToday = (dateStr: string) => dateStr === todayStr;
  const todayInDates = dates.find(d => isToday(d));
  const showTodayPill = !!(todayInDates && selectedDate !== todayInDates && selectedDate !== 'CONFIRMED');

  return (
    <div className="bg-[#0f2545] border-b border-white/10 sticky top-0 z-30 shadow-xl">

      {/* ── MOBILE: compact filter row above the date scroller ── */}
      <div className="md:hidden flex items-center gap-1.5 px-3 h-8 border-b border-white/10">
        <button
          onClick={() => onDateSelect('ALL')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-colors touch-manipulation
            ${selectedDate === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Calendar size={10} />
          {lang.filterAll || "All"}
        </button>
        <button
          onClick={() => onDateSelect('CONFIRMED')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-colors touch-manipulation
            ${selectedDate === 'CONFIRMED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <CheckSquare size={10} />
          {lang.filterConfirmed || "Confirmed"}
        </button>

        {showTodayPill && (
          <button
            onClick={() => onDateSelect(todayInDates!)}
            className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-[9px] font-black uppercase tracking-widest touch-manipulation"
          >
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse shrink-0" />
            {lang.today || "Today"}
          </button>
        )}
      </div>

      {/* ── MAIN ROW: date scroller (shorter on mobile, taller on desktop) ── */}
      <div className="max-w-6xl mx-auto flex items-center h-12 md:h-20">

        {/* ALL button — desktop only */}
        <button
          onClick={() => onDateSelect('ALL')}
          className={`hidden md:flex h-full px-4 border-r border-white/10 flex-col items-center justify-center gap-1 transition-colors min-w-[4.5rem] touch-manipulation
            ${selectedDate === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <Calendar size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">{lang.filterAll || "All"}</span>
        </button>

        {/* Left Arrow — desktop only */}
        <button
          onClick={() => handleScroll('left')}
          className="hidden md:flex h-full px-2 items-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors touch-manipulation"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Scrollable date ribbon */}
        <div
          ref={scrollRef}
          className="flex-1 flex items-center overflow-x-auto no-scrollbar h-full snap-x"
        >
          {dates.map(dateStr => {
            const label = getRelativeLabel(dateStr);
            const isSelected = selectedDate === dateStr;
            const today = isToday(dateStr);
            const isRelative = typeof label.main === 'string';

            return (
              <button
                key={dateStr}
                data-date={dateStr}
                onClick={() => onDateSelect(dateStr)}
                className={`
                  relative h-full flex flex-col items-center justify-center
                  min-w-[3.5rem] md:min-w-[4.5rem]
                  snap-center transition-all duration-200 border-r border-white/5 touch-manipulation
                  ${isSelected
                    ? 'bg-blue-600 text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                `}
              >
                {today && !isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-sm" />
                )}
                {isRelative ? (
                  <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider ${isSelected ? 'scale-110' : ''}`}>
                    {label.main}
                  </span>
                ) : (
                  <>
                    <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-wider opacity-80">{label.sub}</span>
                    <span className={`text-lg md:text-2xl font-black leading-none mt-0.5 ${isSelected ? 'scale-110' : ''}`}>{label.main}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Arrow — desktop only */}
        <button
          onClick={() => handleScroll('right')}
          className="hidden md:flex h-full px-2 items-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors border-l border-white/10 touch-manipulation"
        >
          <ChevronRight size={24} />
        </button>

        {/* Back to Today — desktop only (mobile shows it in the filter row above) */}
        {showTodayPill && (
          <button
            onClick={() => onDateSelect(todayInDates!)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 mx-2 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 hover:text-red-200 transition-all text-[9px] font-black uppercase tracking-widest whitespace-nowrap shrink-0 animate-in fade-in duration-200 touch-manipulation"
          >
            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse shrink-0" />
            {lang.today || "Today"}
          </button>
        )}

        {/* CONFIRMED button — desktop only */}
        <button
          onClick={() => onDateSelect('CONFIRMED')}
          className={`hidden md:flex h-full px-4 border-l border-white/10 flex-col items-center justify-center gap-1 transition-colors min-w-[4.5rem] shrink-0 touch-manipulation
            ${selectedDate === 'CONFIRMED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <CheckSquare size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">{lang.filterConfirmed || "Confirmed"}</span>
        </button>
      </div>
    </div>
  );
};
