
import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, isToday, parseISO, isValid, getYear, setYear
} from 'date-fns';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, className = '', placeholder = 'Select Date' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [tempSelectedDate, setTempSelectedDate] = useState(new Date());
  const [mode, setMode] = useState<'CALENDAR' | 'YEAR'>('CALENDAR');
  const lastScrollTime = useRef(0);

  useEffect(() => {
    if (isOpen) {
      const d = value ? parseISO(value) : new Date();
      const validDate = isValid(d) ? d : new Date();
      setTempSelectedDate(validDate);
      setViewDate(validDate);
      setMode('CALENDAR');
    }
  }, [isOpen, value]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleSave = () => {
    onChange(format(tempSelectedDate, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (mode !== 'CALENDAR') return;

    const now = Date.now();
    // Throttle scroll events to prevent rapid month jumping
    if (now - lastScrollTime.current < 250) { 
        return;
    }
    lastScrollTime.current = now;

    if (e.deltaY > 0) {
        setViewDate(prev => addMonths(prev, 1));
    } else if (e.deltaY < 0) {
        setViewDate(prev => subMonths(prev, 1));
    }
  };

  // Calendar Grid Logic
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <>
      {/* Trigger Input */}
      <div 
        onClick={() => setIsOpen(true)}
        className={`w-full flex items-center justify-between border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900 cursor-pointer hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500/20 transition-all shadow-sm group ${className}`}
      >
        <span className={`font-medium text-sm transition-colors ${value ? 'text-slate-900 font-mono' : 'text-slate-400'} group-hover:text-emerald-700`}>
          {value ? format(parseISO(value), 'MM/dd/yyyy') : placeholder}
        </span>
        <CalendarIcon className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
           
           <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[340px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
              
              {/* Header (Display) */}
              <div className="bg-slate-50 p-6 border-b border-slate-100 flex flex-col items-start relative overflow-hidden">
                  <div className="relative z-10">
                    <button 
                        onClick={() => setMode(mode === 'YEAR' ? 'CALENDAR' : 'YEAR')}
                        className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1 hover:text-emerald-600 transition-colors flex items-center gap-1"
                    >
                        {format(tempSelectedDate, 'yyyy')} <ChevronDown className={`w-3 h-3 transition-transform ${mode === 'YEAR' ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
                        {format(tempSelectedDate, 'EEE, MMM d')}
                    </div>
                  </div>
                  {/* Decorative faint background icon */}
                  <CalendarIcon className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-200/50 rotate-12 z-0 pointer-events-none" />
              </div>

              {/* Body */}
              <div 
                className="p-4 bg-white h-[320px]"
                onWheel={handleWheel}
              >
                 {mode === 'CALENDAR' ? (
                    <>
                        <div className="flex items-center justify-between mb-4 px-2">
                            <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                            <span className="font-bold text-slate-800 text-sm transition-all select-none w-32 text-center">
                                {format(viewDate, 'MMMM yyyy')}
                            </span>
                            <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                        </div>

                        <div className="grid grid-cols-7 mb-2">
                            {weekDays.map(d => (
                                <div key={d} className="text-center text-xs font-bold text-slate-400 select-none h-8 flex items-center justify-center">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-y-1">
                            {calendarDays.map(day => {
                                const isCurrentMonth = isSameMonth(day, viewDate);
                                const isSelected = isSameDay(day, tempSelectedDate);
                                const isTodayDate = isToday(day);

                                return (
                                    <div key={day.toISOString()} className="flex justify-center">
                                        <button
                                            onClick={() => setTempSelectedDate(day)}
                                            className={`
                                                w-8 h-8 rounded-full text-sm flex items-center justify-center transition-all duration-200
                                                ${isSelected 
                                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30 scale-110 font-bold' 
                                                    : isTodayDate 
                                                        ? 'text-emerald-600 font-bold bg-emerald-50' 
                                                        : isCurrentMonth 
                                                            ? 'text-slate-700 hover:bg-slate-100' 
                                                            : 'text-slate-300'
                                                }
                                            `}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                 ) : (
                    /* YEAR VIEW */
                    <div className="h-full overflow-y-auto custom-scrollbar grid grid-cols-3 gap-2 content-start pr-1">
                        {Array.from({ length: 120 }, (_, i) => getYear(new Date()) - 60 + i).map(year => (
                            <button
                                key={year}
                                onClick={() => {
                                    setTempSelectedDate(setYear(tempSelectedDate, year));
                                    setViewDate(setYear(viewDate, year));
                                    setMode('CALENDAR');
                                }}
                                className={`py-2 rounded-lg text-sm font-bold transition-all ${getYear(tempSelectedDate) === year ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                 )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <button 
                    onClick={() => {
                        const now = new Date();
                        setTempSelectedDate(now);
                        setViewDate(now);
                        setMode('CALENDAR');
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-wider pl-2"
                  >
                      Today
                  </button>
                  <div className="flex gap-3">
                      <button 
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleSave}
                        className="px-6 py-2 text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                      >
                          Set Date
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}
    </>
  );
};
