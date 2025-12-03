
import React, { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../store';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { differenceInSeconds } from 'date-fns';

export const ClockTimer: React.FC = () => {
  const store = useContext(StoreContext);
  const [elapsed, setElapsed] = useState(0);

  if (!store) return null;
  const { timeEntries, currentUser } = store;

  // Find active entry for current user
  const activeEntry = timeEntries.find((e: any) => e.userId === currentUser.id && !e.endTime);

  useEffect(() => {
    let interval: any;

    if (activeEntry) {
      const start = new Date(activeEntry.startTime);
      setElapsed(differenceInSeconds(new Date(), start));

      interval = setInterval(() => {
        setElapsed(differenceInSeconds(new Date(), start));
      }, 1000);
    } else {
      setElapsed(0);
    }

    return () => clearInterval(interval);
  }, [activeEntry]);

  if (!activeEntry) return null;

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Link 
      to="/timesheets"
      className="hidden md:flex fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500 group no-underline"
    >
      <div className="bg-[#0B1120] text-white rounded-full pl-2 pr-6 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center gap-4 border border-slate-800/60 ring-1 ring-white/5 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer backdrop-blur-md">
        
        {/* Icon Container */}
        <div className="relative w-10 h-10 flex items-center justify-center rounded-full bg-emerald-500/10 shrink-0 border border-emerald-500/20">
            <Clock className="w-5 h-5 text-emerald-500" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#0B1120]"></span>
            </span>
        </div>
        
        {/* Text Container */}
        <div className="flex flex-col">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">On the Clock</p>
            <p className="font-mono text-xl font-bold leading-none tracking-tight text-white tabular-nums shadow-black drop-shadow-md">
                {formatTime(elapsed)}
            </p>
        </div>

        {/* Vertical Separator */}
        <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-700 to-transparent mx-1 opacity-50"></div>
        
        {/* Activity Indicator / Pulse */}
        <div className="flex flex-col gap-0.5">
            <div className="w-1 h-1 bg-slate-600 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-slate-600 rounded-full animate-pulse delay-75"></div>
            <div className="w-1 h-1 bg-slate-600 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </Link>
  );
};
