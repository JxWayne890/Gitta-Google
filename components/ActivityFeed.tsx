
import React, { useContext, useState, useRef } from 'react';
import { StoreContext } from '../store';
import { Car, CheckCircle2, ChevronRight, MapPin, Activity, ChevronDown, ChevronUp, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export const ActivityFeed: React.FC = () => {
  const store = useContext(StoreContext);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!store) return null;

  const activities = store.activityLog.slice(0, 20);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 280; // Adjusted for smaller card width
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      {/* Backdrop (only visible when open) */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40 transition-opacity duration-500" 
            onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Panel Container */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-500 ease-in-out shadow-md ${isOpen ? 'translate-y-0' : '-translate-y-full'}`}
      >
        {/* Panel Background & Content */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 pt-2 pb-3 px-4 md:px-6 relative">
            
            <div className="max-w-7xl mx-auto">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400 animate-pulse">
                            <Activity className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                            Live Activity
                        </h3>
                    </div>
                    
                    {/* Manual Scroll Controls */}
                    <div className="flex gap-1">
                        <button 
                            onClick={() => scroll('left')} 
                            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            title="Scroll Left"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => scroll('right')} 
                            className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            title="Scroll Right"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Horizontal Carousel */}
                <div 
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto pb-1 hide-scrollbar snap-x snap-mandatory scroll-smooth"
                >
                    {activities.length === 0 ? (
                        <div className="w-full py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                            <p>No recent activity.</p>
                        </div>
                    ) : (
                        activities.map((activity) => {
                            const user = store.users.find(u => u.id === activity.userId);
                            let Icon = Car;
                            let iconColor = 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400';
                            let borderColor = 'border-l-2 border-blue-500';

                            if (activity.type === 'ARRIVED') {
                                Icon = MapPin;
                                iconColor = 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400';
                                borderColor = 'border-l-2 border-amber-500';
                            } else if (activity.type === 'COMPLETED') {
                                Icon = CheckCircle2;
                                iconColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400';
                                borderColor = 'border-l-2 border-emerald-500';
                            }

                            return (
                                <div 
                                    key={activity.id} 
                                    className={`snap-center shrink-0 w-[260px] md:w-[300px] p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all ${borderColor}`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${iconColor} border border-white dark:border-slate-600 shadow-sm`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                                    {user?.name.split(' ')[0]}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap ml-1.5">
                                                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                                </span>
                                            </div>
                                            
                                            <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate leading-tight">
                                                {activity.description.replace(user?.name.split(' ')[0] || '', '').trim()}
                                            </p>

                                            {activity.jobId && (
                                                <Link 
                                                    to={`/jobs/${activity.jobId}`}
                                                    onClick={() => setIsOpen(false)}
                                                    className="inline-flex items-center text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
                                                >
                                                    View <ChevronRight className="w-2.5 h-2.5 ml-0.5" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>

        {/* Tab Handle (Trigger) - Attached to the bottom of the panel */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-bold text-xs border-x border-b border-slate-200 dark:border-slate-700 rounded-b-lg shadow-md hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
            >
                {isOpen ? (
                    <>
                        Close <ChevronUp className="w-3 h-3" />
                    </>
                ) : (
                    <>
                        <span className="relative flex h-1.5 w-1.5 mr-0.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Live Feed <ChevronDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                    </>
                )}
            </button>
        </div>
      </div>
    </>
  );
};
