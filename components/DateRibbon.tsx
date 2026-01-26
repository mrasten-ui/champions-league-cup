import React, { useRef, useEffect } from 'react';
import { Translation } from '../types';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRibbonProps {
  dates: string[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  lang: Translation;
}

export const DateRibbon: React.FC<DateRibbonProps> = ({ dates, selectedDate, onDateSelect, lang }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayStr = new Date().toDateString();

  // Scroll to selected date on load/change
  useEffect(() => {
    if (scrollRef.current && selectedDate !== 'ALL') {
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
      const scrollAmount = 300;
      scrollRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return {
        weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        day: d.getDate(),
        month: d.toLocaleDateString('en-GB', { month: 'short' })
    };
  };

  const isToday = (dateStr: string) => dateStr === todayStr;

  return (
    <div className="bg-[#0f2545] border-b border-white/10 sticky top-0 z-30 shadow-xl">
      <div className="max-w-6xl mx-auto flex items-center h-20">
        
        {/* Calendar / All Toggle */}
        <button 
          onClick={() => onDateSelect('ALL')}
          className={`
            h-full px-4 border-r border-white/10 flex flex-col items-center justify-center gap-1 transition-colors min-w-[4rem]
            ${selectedDate === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}
          `}
        >
          <Calendar size={20} />
          <span className="text-[9px] font-black uppercase tracking-widest">{lang.filterAll || "All"}</span>
        </button>

        {/* Desktop Left Arrow */}
        <button 
            onClick={() => handleScroll('left')}
            className="hidden md:flex h-full px-2 items-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
            <ChevronLeft size={24} />
        </button>
        
        {/* Scrollable Ribbon */}
        <div 
          ref={scrollRef}
          className="flex-1 flex items-center overflow-x-auto no-scrollbar h-full snap-x"
        >
          {dates.map(dateStr => {
            const { weekday, day, month } = formatDate(dateStr);
            const isSelected = selectedDate === dateStr;
            const today = isToday(dateStr);

            return (
              <button 
                key={dateStr}
                data-date={dateStr}
                onClick={() => onDateSelect(dateStr)}
                className={`
                  relative h-full flex flex-col items-center justify-center min-w-[4.5rem] snap-center transition-all duration-200 border-r border-white/5
                  ${isSelected 
                    ? 'bg-blue-600 text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                {today && !isSelected && (
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-sm"></div>
                )}
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">{weekday}</span>
                <span className={`text-2xl font-black leading-none my-0.5 ${isSelected ? 'scale-110' : ''}`}>{day}</span>
                <span className="text-[8px] font-bold uppercase opacity-60">{month}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop Right Arrow */}
        <button 
            onClick={() => handleScroll('right')}
            className="hidden md:flex h-full px-2 items-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors border-l border-white/10"
        >
            <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};