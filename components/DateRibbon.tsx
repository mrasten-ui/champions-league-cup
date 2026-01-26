import React, { useRef, useEffect } from 'react';
import { Translation } from '../types';
import { CalendarDays } from 'lucide-react';

interface DateRibbonProps {
  dates: string[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  lang: Translation;
}

export const DateRibbon: React.FC<DateRibbonProps> = ({ dates, selectedDate, onDateSelect, lang }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayStr = new Date().toDateString();

  // Auto-scroll to selected date on mount/change
  useEffect(() => {
    if (scrollRef.current && selectedDate !== 'ALL') {
      // Find the button with the matching date (simple implementation)
      // In a real scenario, we might use data attributes or refs map
    }
  }, [selectedDate]);

  const getRelativeLabel = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    
    if (dateObj.toDateString() === todayStr) return lang.now || "Today";
    if (dateObj.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    if (dateObj.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    return dateObj.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
  };

  const jumpToToday = () => {
    // Check if today exists in the dates list
    const todayExists = dates.some(d => new Date(d).toDateString() === todayStr);
    if (todayExists) {
      onDateSelect(dates.find(d => new Date(d).toDateString() === todayStr) || todayStr);
    } else {
      onDateSelect('ALL');
    }
  };

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center">
        <button 
          onClick={jumpToToday}
          className="px-3 border-r border-slate-100 py-3 text-blue-600 hover:bg-blue-50 transition-colors h-full flex items-center justify-center"
          title="Jump to Today"
        >
          <CalendarDays size={18} />
        </button>
        
        <div 
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar p-3 flex-1 scroll-smooth"
        >
          <button 
            onClick={() => onDateSelect('ALL')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 ${
              selectedDate === 'ALL' 
                ? 'bg-slate-800 text-white shadow-md' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {lang.filterAll || "All"}
          </button>
          
          {dates.map(d => (
            <button 
              key={d}
              onClick={() => onDateSelect(d)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 ${
                selectedDate === d 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {getRelativeLabel(d)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};