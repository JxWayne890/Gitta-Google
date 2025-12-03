
import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimePickerProps {
  value: string; // 24h format "HH:mm"
  onChange: (val: string) => void;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'HOURS' | 'MINUTES'>('HOURS');

  // Parse value helpers
  const parseTime = (val: string) => {
      const [hStr, mStr] = (val || '09:00').split(':');
      const h = parseInt(hStr) || 9;
      const m = parseInt(mStr) || 0;
      return { h, m };
  };

  const { h: currentH, m: currentM } = parseTime(value);
  
  // Computed display values
  const displayH = currentH % 12 || 12;
  const displayPeriod = currentH >= 12 ? 'PM' : 'AM';

  // Temporary state for the picker logic
  const [tempHour, setTempHour] = useState(displayH);
  const [tempMinute, setTempMinute] = useState(currentM);
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>(displayPeriod);

  useEffect(() => {
      if (isOpen) {
          const { h, m } = parseTime(value);
          setTempHour(h % 12 || 12);
          setTempMinute(m);
          setTempPeriod(h >= 12 ? 'PM' : 'AM');
          setMode('HOURS');
      }
  }, [isOpen, value]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  const handleSave = () => {
      let h = tempHour;
      if (tempPeriod === 'PM' && h < 12) h += 12;
      if (tempPeriod === 'AM' && h === 12) h = 0;
      const timeStr = `${h.toString().padStart(2, '0')}:${tempMinute.toString().padStart(2, '0')}`;
      onChange(timeStr);
      setIsOpen(false);
  };

  const CLOCK_SIZE = 256; 
  const RADIUS = CLOCK_SIZE / 2 - 32; 
  const CENTER = CLOCK_SIZE / 2;

  const renderClockFace = () => {
      const items = mode === 'HOURS' 
        ? Array.from({ length: 12 }, (_, i) => i + 1)
        : Array.from({ length: 12 }, (_, i) => i * 5);
      
      const currentVal = mode === 'HOURS' ? tempHour : tempMinute;

      return (
          <div 
            className="relative rounded-full bg-slate-50 border border-slate-200 shadow-inner select-none mx-auto"
            style={{ width: CLOCK_SIZE, height: CLOCK_SIZE }}
          >
              {/* Center Dot */}
              <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-emerald-500 rounded-full -translate-x-1/2 -translate-y-1/2 z-10 shadow-sm"></div>
              
              {/* Clock Hand */}
              <div 
                className="absolute top-1/2 left-1/2 h-1 bg-emerald-500 origin-left z-0 pointer-events-none transition-transform duration-300 ease-out rounded-full shadow-sm"
                style={{
                    width: `${RADIUS - 20}px`,
                    transform: `rotate(${((mode === 'HOURS' ? tempHour : tempMinute/5) / 12 * 360) - 90}deg)`
                }}
              >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div>
                  </div>
              </div>

              {items.map((num, i) => {
                  const valForCalc = mode === 'HOURS' ? num : (num / 5 || 12);
                  const angleDeg = (valForCalc / 12) * 360 - 90;
                  const angleRad = angleDeg * (Math.PI / 180);
                  const px = CENTER + RADIUS * Math.cos(angleRad);
                  const py = CENTER + RADIUS * Math.sin(angleRad);

                  const isSelected = num === currentVal || (mode === 'MINUTES' && num === 0 && currentVal === 0) || (mode === 'HOURS' && num === 12 && currentVal === 12 && tempHour === 12);
                  
                  return (
                      <button
                          key={num}
                          type="button"
                          onClick={() => {
                              if (mode === 'HOURS') {
                                  setTempHour(num);
                                  setTimeout(() => setMode('MINUTES'), 300);
                              } else {
                                  setTempMinute(num);
                              }
                          }}
                          className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
                              ${isSelected ? 'bg-emerald-500 text-white shadow-lg scale-110 z-20' : 'text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'}
                          `}
                          style={{ 
                              left: `${px - 20}px`, 
                              top: `${py - 20}px` 
                          }}
                      >
                          {mode === 'MINUTES' ? num.toString().padStart(2, '0') : num}
                      </button>
                  );
              })}
          </div>
      );
  };

  return (
      <>
          {/* Input Trigger */}
          <div 
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center justify-between border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900 cursor-pointer hover:border-emerald-500 hover:ring-1 hover:ring-emerald-500/20 transition-all shadow-sm group"
          >
              <span className="font-medium text-sm font-mono group-hover:text-emerald-700 transition-colors">
                  {displayH.toString().padStart(2, '0')}:{currentM.toString().padStart(2, '0')} {displayPeriod}
              </span>
              <Clock className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
          </div>

          {/* Centered Modal Overlay */}
          {isOpen && (
              <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                  {/* Backdrop */}
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
                  
                  {/* Modal Content */}
                  <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[340px] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                      
                      {/* Header (Display & Toggle) */}
                      <div className="bg-slate-50 p-6 border-b border-slate-100 flex flex-col items-center">
                          <div className="flex items-end gap-1 mb-4 select-none">
                              <button 
                                onClick={() => setMode('HOURS')}
                                className={`text-6xl font-bold leading-none transition-colors rounded-lg px-2 ${mode === 'HOURS' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-slate-400'}`}
                              >
                                  {tempHour.toString().padStart(2, '0')}
                              </button>
                              <span className="text-6xl font-bold leading-none text-slate-200 pb-2">:</span>
                              <button 
                                onClick={() => setMode('MINUTES')}
                                className={`text-6xl font-bold leading-none transition-colors rounded-lg px-2 ${mode === 'MINUTES' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-slate-400'}`}
                              >
                                  {tempMinute.toString().padStart(2, '0')}
                              </button>
                          </div>
                          
                          <div className="flex bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
                              <button 
                                onClick={() => setTempPeriod('AM')}
                                className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${tempPeriod === 'AM' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                              >AM</button>
                              <button 
                                onClick={() => setTempPeriod('PM')}
                                className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${tempPeriod === 'PM' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                              >PM</button>
                          </div>
                      </div>

                      {/* Clock Face */}
                      <div className="p-6 bg-white flex justify-center">
                          {renderClockFace()}
                      </div>

                      {/* Footer Actions */}
                      <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">
                              {mode === 'HOURS' ? 'Select Hour' : 'Select Minute'}
                          </span>
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
                                  Set Time
                              </button>
                          </div>
                      </div>

                  </div>
              </div>
          )}
      </>
  );
};
