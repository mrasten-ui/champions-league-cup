import React, { useRef, useEffect } from 'react';
import { Translation } from '../types';

interface DateRibbonProps {
  dates: string[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  lang: Translation;
}

export const DateRibbon: React.FC<DateRibbonProps> = ({ dates, selectedDate, onDateSelect, lang }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const getRelativeLabel = (dateStr: string) => {
    const today = new Date().toDateString();
    const tomorrow = new Date(Date.now() + 86400000).toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (dateStr === today) return lang.now || "Today";
    if (dateStr === tomorrow) return "Tomorrow";
    if (dateStr === yesterday) return "Yesterday";
    
    return new Date(dateStr).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div 
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar p-3"
      >
        <button 
          onClick={() => onDateSelect('ALL')}
          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
            selectedDate === 'ALL' 
              ? 'bg-blue-600 text-white shadow-md scale-105' 
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {lang.filterAll || "All Games"}
        </button>
        {dates.map(d => (
          <button 
            key={d}
            onClick={() => onDateSelect(d)}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              selectedDate === d 
                ? 'bg-blue-600 text-white shadow-md scale-105' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {getRelativeLabel(d)}
          </button>
        ))}
      </div>
    </div>
  );
};