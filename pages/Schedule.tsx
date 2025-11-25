
import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { 
  format, addDays, isSameDay, differenceInMinutes, areIntervalsOverlapping, 
  addMinutes, isAfter, isBefore, startOfWeek, endOfWeek,
  eachDayOfInterval, endOfMonth, isSameMonth,
  addWeeks, addMonths, isToday
} from 'date-fns';
import { Job, User, JobStatus, Client } from '../types';
import { 
  ChevronLeft, ChevronRight, 
  User as UserIcon, GripVertical, 
  Plus, Calendar as CalendarIcon, 
  Clock, Briefcase, Search,
  Move, AlertCircle, AlertTriangle,
  CheckCircle2, X, MapPin, Phone, MessageSquare,
  List, Grid, Map as MapIcon, MoreHorizontal,
  Eye, ChevronDown, MessageCircle, Users, Car
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { StoreContext } from '../store';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import MapView from '../components/MapView';

interface ScheduleProps {
  jobs: Job[];
  users: User[];
}

type ViewMode = 'day' | 'week' | 'month' | 'map';
type MobileViewMode = 'list' | 'day' | '3day' | 'map';

// --- CONSTANTS ---
const START_HOUR = 7; // 7 AM
const END_HOUR = 21; // 9 PM
const HOURS_COUNT = END_HOUR - START_HOUR;
const PIXELS_PER_HOUR = 112; // h-28 = 7rem = 112px
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
const SNAP_MINUTES = 15;
const MIN_JOB_HEIGHT = 48; // Minimum visual height for very short jobs

// --- HELPER FUNCTIONS (Replaces missing date-fns imports) ---

const setHours = (d: Date | number, hours: number) => {
  const newDate = new Date(d);
  newDate.setHours(hours);
  return newDate;
};

const setMinutes = (d: Date | number, minutes: number) => {
  const newDate = new Date(d);
  newDate.setMinutes(minutes);
  return newDate;
};

const startOfDay = (d: Date | number) => {
  const newDate = new Date(d);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const startOfMonth = (d: Date | number) => {
  const newDate = new Date(d);
  newDate.setDate(1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

const getTechColorStyles = (color: string = 'slate') => {
  const map: Record<string, { bg: string, header: string, border: string }> = {
    blue: { bg: 'bg-blue-50/30 dark:bg-blue-900/10', header: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-900/30' },
    amber: { bg: 'bg-amber-50/30 dark:bg-amber-900/10', header: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-900/30' },
    emerald: { bg: 'bg-emerald-50/30 dark:bg-emerald-900/10', header: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-900/30' },
    rose: { bg: 'bg-rose-50/30 dark:bg-rose-900/10', header: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-100 dark:border-rose-900/30' },
    purple: { bg: 'bg-purple-50/30 dark:bg-purple-900/10', header: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-900/30' },
    slate: { bg: 'bg-slate-50/30 dark:bg-slate-900/10', header: 'bg-slate-50 dark:bg-slate-800/50', border: 'border-slate-100 dark:border-slate-700' },
  };
  return map[color] || map.slate;
};

// --- HELPER COMPONENTS ---

const TechHeader: React.FC<{ tech: User, dayJobs: Job[] }> = ({ tech, dayJobs }) => {
  const WORK_DAY_MINUTES = 8 * 60; 
  const bookedMinutes = dayJobs.reduce((acc, job) => {
    const duration = differenceInMinutes(new Date(job.end), new Date(job.start));
    return acc + duration;
  }, 0);
  
  const percentage = Math.min(100, (bookedMinutes / WORK_DAY_MINUTES) * 100);
  const hoursBooked = (bookedMinutes / 60).toFixed(1);
  const isOverloaded = bookedMinutes > WORK_DAY_MINUTES;
  
  const colorMap: any = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    rose: 'bg-rose-500',
    slate: 'bg-slate-500',
  };
  
  const baseColor = colorMap[tech.color || 'slate'];

  return (
    <div className="flex flex-col gap-2 h-full justify-center select-none">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full ${baseColor} text-white flex items-center justify-center shadow-sm ring-2 ring-offset-1 ring-white/60 dark:ring-slate-700 shrink-0`}>
          {tech.avatarUrl ? (
            <img src={tech.avatarUrl} alt={tech.name} className="w-full h-full rounded-full object-cover" />
          ) : (
             <span className="font-bold text-sm">{tech.name.charAt(0)}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-800 dark:text-slate-200 truncate text-sm">{tech.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Technician</p>
        </div>
      </div>
      
      {/* Utilization Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wide">
            <span>Capacity</span>
            <span className={isOverloaded ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}>{hoursBooked} / 8h</span>
        </div>
        <div className="w-full bg-slate-200/50 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div 
            className={`h-full transition-all duration-500 rounded-full ${isOverloaded ? 'bg-red-500' : baseColor}`} 
            style={{ width: `${percentage}%` }}
            />
        </div>
      </div>
    </div>
  );
};

interface UnassignedCardProps {
    job: Job;
    client?: Client;
    onClick: () => void;
    isSelected: boolean;
    onDragStart: (e: React.DragEvent) => void;
}

const UnassignedJobCard: React.FC<UnassignedCardProps> = ({ job, client, onClick, isSelected, onDragStart }) => (
  <div 
    draggable={true}
    onDragStart={onDragStart}
    onClick={onClick}
    className={`p-4 rounded-xl border cursor-grab active:cursor-grabbing transition-all duration-200 group relative select-none ${
      isSelected 
        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 shadow-md ring-1 ring-emerald-500 z-10' 
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm'
    }`}
  >
    <div className="flex justify-between items-start mb-2">
      <h4 className={`font-bold text-sm leading-tight pr-6 ${isSelected ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>{job.title}</h4>
      <div className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30'}`}>
        <GripVertical className="w-3.5 h-3.5" />
      </div>
    </div>
    
    <div className="flex flex-col gap-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <UserIcon className="w-3 h-3" />
            <span className="font-medium">{client?.firstName} {client?.lastName}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Briefcase className="w-3 h-3" />
            <span>{client?.properties.find(p => p.id === job.propertyId)?.address.city || 'No Location'}</span>
        </div>
    </div>
    
    <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wide">
            <Clock className="w-3 h-3" />
            {Math.max(1, Math.round(differenceInMinutes(new Date(job.end), new Date(job.start)) / 60))}h
        </span>
    </div>
  </div>
);

// --- SCHEDULING MODAL COMPONENT ---
interface SchedulingWizardProps {
    isOpen: boolean;
    onClose: () => void;
    job: Job | null;
    date: Date | null;
    preSelectedTechId?: string;
    technicians: User[];
    jobs: Job[];
    onConfirm: (jobId: string, techId: string, start: Date) => void;
}

const SchedulingWizard: React.FC<SchedulingWizardProps> = ({ 
    isOpen, onClose, job, date, preSelectedTechId, technicians, jobs, onConfirm 
}) => {
    const [step, setStep] = useState<'TECH' | 'TIME'>('TECH');
    const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<Date[]>([]);

    useEffect(() => {
        if (isOpen) {
            if (preSelectedTechId) {
                setSelectedTechId(preSelectedTechId);
                setStep('TIME');
            } else {
                setStep('TECH');
                setSelectedTechId(null);
            }
        }
    }, [isOpen, preSelectedTechId]);

    useEffect(() => {
        if (step === 'TIME' && selectedTechId && date && job) {
            const duration = differenceInMinutes(new Date(job.end), new Date(job.start));
            const validDuration = isNaN(duration) || duration <= 0 ? 120 : duration;

            const slots = [];
            let cursor = setMinutes(setHours(date, START_HOUR), 0);
            const endOfDay = setMinutes(setHours(date, END_HOUR), 0);

            const techJobs = jobs.filter(j => 
                j.assignedTechIds.includes(selectedTechId) && 
                isSameDay(new Date(j.start), date)
            );

            while (differenceInMinutes(endOfDay, cursor) >= validDuration) {
                const proposedEnd = addMinutes(cursor, validDuration);
                const hasConflict = techJobs.some(j => 
                    areIntervalsOverlapping(
                        { start: cursor, end: proposedEnd },
                        { start: new Date(j.start), end: new Date(j.end) }
                    )
                );

                if (!hasConflict) {
                    slots.push(cursor);
                }
                cursor = addMinutes(cursor, 30);
            }
            setAvailableSlots(slots);
        }
    }, [step, selectedTechId, date, job, jobs]);

    if (!job) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Schedule Job">
            <div className="p-1">
                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                    <h4 className="font-bold text-slate-900 dark:text-white">{job.title}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{date && format(date, 'EEEE, MMMM do')}</p>
                </div>

                {step === 'TECH' && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">Select Technician</h3>
                        {technicians.map(tech => (
                            <button
                                key={tech.id}
                                onClick={() => { setSelectedTechId(tech.id); setStep('TIME'); }}
                                className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-left group"
                            >
                                <div className={`w-10 h-10 rounded-full bg-${tech.color}-500 flex items-center justify-center text-white shadow-sm`}>
                                    {tech.avatarUrl ? (
                                        <img src={tech.avatarUrl} className="w-full h-full rounded-full" />
                                    ) : tech.name[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{tech.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">View availability</p>
                                </div>
                                <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-emerald-500" />
                            </button>
                        ))}
                    </div>
                )}

                {step === 'TIME' && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            {!preSelectedTechId && (
                                <button onClick={() => setStep('TECH')} className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center">
                                    <ChevronLeft className="w-3 h-3" /> Back
                                </button>
                            )}
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Available Time Slots</h3>
                        </div>
                        
                        {availableSlots.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                                <p>No available slots for this day.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                                {availableSlots.map(slot => (
                                    <button
                                        key={slot.toISOString()}
                                        onClick={() => selectedTechId && onConfirm(job.id, selectedTechId, slot)}
                                        className="p-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-center"
                                    >
                                        {format(slot, 'h:mm a')}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};


export const Schedule: React.FC<ScheduleProps> = ({ jobs, users }) => {
  const store = useContext(StoreContext);
  const clients = store ? store.clients : [];
  const moveJob = store ? store.moveJob : () => {};
  const unscheduleJob = store ? store.unscheduleJob : () => {};
  const markOnMyWay = store ? store.markOnMyWay : () => {};
  const currentUser = store ? store.currentUser : null;

  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Desktop View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  
  // Mobile View Mode
  const [mobileViewMode, setMobileViewMode] = useState<MobileViewMode>('list');
  const [showMobileViewOptions, setShowMobileViewOptions] = useState(false);
  
  // Mobile Tech Filter
  const [filterTechId, setFilterTechId] = useState<string | null>(null);
  const [showTechMenu, setShowTechMenu] = useState(false);

  const technicians = users.filter((u) => u.role === 'TECHNICIAN');
  
  // Dispatch Mode State
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [draggingJobId, setDraggingJobId] = useState<string | null>(null);
  const [dropPreview, setDropPreview] = useState<{ techId: string, start: Date } | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Scheduling Wizard State
  const [pendingSchedule, setPendingSchedule] = useState<{ job: Job, date: Date, techId?: string } | null>(null);

  // Current Time Indicator
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- MEMOIZED CALCULATIONS ---
  const baseUnassignedJobs = useMemo(() => {
    return jobs.filter(j => j.status === JobStatus.DRAFT || j.assignedTechIds.length === 0);
  }, [jobs]);

  const unassignedJobs = useMemo(() => {
    if (!searchQuery) return baseUnassignedJobs;
    const searchLower = searchQuery.toLowerCase();
    
    return baseUnassignedJobs.filter(j => {
         const client = clients.find(c => c.id === j.clientId);
         return (
            j.title.toLowerCase().includes(searchLower) ||
            client?.firstName.toLowerCase().includes(searchLower) ||
            client?.lastName.toLowerCase().includes(searchLower)
         );
    });
  }, [baseUnassignedJobs, searchQuery, clients]);

  // Auto-Minimize/Maximize Logic
  const prevUnassignedCount = useRef(0);
  useEffect(() => {
      const count = baseUnassignedJobs.length;
      if (count === 0 && prevUnassignedCount.current > 0) {
          setIsSidebarOpen(false);
      }
      else if (count > 0 && prevUnassignedCount.current === 0) {
          setIsSidebarOpen(true);
      }
      prevUnassignedCount.current = count;
  }, [baseUnassignedJobs.length]);

  const effectiveJobs = useMemo(() => {
      return filterTechId 
        ? jobs.filter(j => j.assignedTechIds.includes(filterTechId)) 
        : jobs;
  }, [jobs, filterTechId]);

  // --- HANDLERS ---

  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate((prev) => addDays(prev, -1));
    if (viewMode === 'week') setCurrentDate((prev) => addWeeks(prev, -1));
    if (viewMode === 'month') setCurrentDate((prev) => addMonths(prev, -1));
    if (viewMode === 'map') setCurrentDate((prev) => addDays(prev, -1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate((prev) => addDays(prev, 1));
    if (viewMode === 'week') setCurrentDate((prev) => addWeeks(prev, 1));
    if (viewMode === 'month') setCurrentDate((prev) => addMonths(prev, 1));
    if (viewMode === 'map') setCurrentDate((prev) => addDays(prev, 1));
  };

  const getJobsForTech = (techId: string, date: Date) => {
    return jobs.filter(
      (j) =>
        j.assignedTechIds.includes(techId) &&
        isSameDay(new Date(j.start), date)
    );
  };

  const handleJobClick = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedJobId === job.id) {
      setSelectedJobId(null);
      setDropPreview(null);
    } else {
      setSelectedJobId(job.id);
    }
  };

  const handleDragStart = (e: React.DragEvent, job: Job) => {
    e.stopPropagation();
    e.dataTransfer.setData('jobId', job.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
        setDraggingJobId(job.id);
    }, 20);
  };

  const calculateSnapTime = (e: React.MouseEvent | React.DragEvent, container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect();
    const offsetY = e.clientY - rect.top + container.scrollTop;
    const minutesFromStart = offsetY / PIXELS_PER_MINUTE;
    const snappedMinutes = Math.round(minutesFromStart / SNAP_MINUTES) * SNAP_MINUTES;
    const snapTime = new Date(currentDate);
    snapTime.setHours(START_HOUR, 0, 0, 0);
    return addMinutes(snapTime, snappedMinutes);
  };

  const handleDragOver = (e: React.DragEvent, techId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (viewMode === 'day' && techId) {
        const time = calculateSnapTime(e, e.currentTarget as HTMLDivElement);
        if (!dropPreview || dropPreview.techId !== techId || dropPreview.start.getTime() !== time.getTime()) {
            setDropPreview({ techId, start: time });
        }
    }
  };

  const handleDrop = (e: React.DragEvent, techId: string, date: Date = currentDate) => {
    e.preventDefault();
    e.stopPropagation();
    
    const jobId = e.dataTransfer.getData('jobId');
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    if (viewMode === 'day') {
        if (dropPreview) {
            finalizeMove(jobId, dropPreview.techId, dropPreview.start);
        }
    } else if (viewMode === 'week') {
        setPendingSchedule({ job, date, techId });
    } else if (viewMode === 'month') {
        setPendingSchedule({ job, date });
    }

    setDraggingJobId(null);
    setDropPreview(null);
  };

  const finalizeMove = (jobId: string, techId: string, newStart: Date) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    let durationMinutes = differenceInMinutes(new Date(job.end), new Date(job.start));
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
        durationMinutes = 120;
    }
    
    const newEnd = addMinutes(newStart, durationMinutes);

    moveJob(jobId, newStart.toISOString(), newEnd.toISOString(), techId);
    setSelectedJobId(null);
    setDraggingJobId(null);
    setDropPreview(null);
    setPendingSchedule(null);
  };

  const handleDragEnd = () => {
    setDraggingJobId(null);
    setDropPreview(null);
  };

  const handleColumnClick = (techId: string) => {
    setSelectedJobId(null);
  };

  const handleColumnMouseMove = (e: React.MouseEvent, techId: string) => {
    // Placeholder for future interactions
  };

  const renderCurrentTimeLine = (inColumn: boolean = false) => {
    if (!isSameDay(now, currentDate)) return null;
    const currentHour = now.getHours() + now.getMinutes() / 60;
    if (currentHour < START_HOUR || currentHour > END_HOUR) return null;

    const top = (currentHour - START_HOUR) * PIXELS_PER_HOUR;
    
    return (
      <div 
        className="absolute left-0 right-0 z-20 pointer-events-none flex items-center group"
        style={{ top: `${top}px` }}
      >
        {!inColumn && (
            <div className="absolute -left-16 w-16 text-right pr-2">
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                    {format(now, 'h:mm a')}
                </span>
            </div>
        )}
        <div className="w-full border-t-2 border-red-500/50 shadow-[0_0_4px_rgba(239,68,68,0.4)]"></div>
      </div>
    );
  };

  // --- RENDER: MOBILE LIST VIEW ---
  const renderMobileListView = () => {
    const todaysJobs = effectiveJobs
      .filter(j => isSameDay(new Date(j.start), currentDate) && j.status !== 'DRAFT')
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const anytimeJobs = todaysJobs.filter(j => !j.start.includes("T") || differenceInMinutes(new Date(j.end), new Date(j.start)) > 480); // Mock logic for "anytime"
    const scheduledJobs = todaysJobs.filter(j => !anytimeJobs.includes(j));

    return (
      <div className="px-4 pt-4 pb-24 space-y-6">
        
        {/* Anytime Section (Simulated) */}
        {anytimeJobs.length > 0 && (
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Anytime Visits</h3>
                {anytimeJobs.map(job => (
                    <div key={job.id} className="bg-white dark:bg-slate-800 rounded-lg border-l-4 border-blue-500 shadow-sm p-4">
                        <h4 className="font-bold text-slate-900 dark:text-white">{job.title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Anytime today</p>
                    </div>
                ))}
            </div>
        )}

        {/* Scheduled Section */}
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Schedule</h3>
                <span className="text-xs text-slate-400 dark:text-slate-500">{scheduledJobs.length} visits</span>
            </div>
            
            {scheduledJobs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No visits scheduled for today.</p>
                    <Button variant="outline" size="sm" className="mt-4">Create Visit</Button>
                </div>
            ) : (
                scheduledJobs.map(job => {
                    const client = clients.find(c => c.id === job.clientId);
                    const tech = users.find(u => u.id === job.assignedTechIds[0]);
                    const onMyWayUser = users.find(u => u.id === job.onMyWayBy);
                    const isCurrentUserOnWay = job.onMyWayBy === currentUser?.id;

                    return (
                        <div key={job.id} className="bg-white dark:bg-slate-800 rounded-xl border-l-4 border-emerald-500 shadow-sm overflow-hidden active:scale-[0.98] transition-transform">
                            <Link to={`/jobs/${job.id}`} className="block p-4 pb-3">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {format(new Date(job.start), 'h:mm')} - {format(new Date(job.end), 'h:mm a')}
                                        </span>
                                        {job.priority === 'HIGH' && (
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                        )}
                                    </div>
                                    <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">#{job.id.slice(-4)}</span>
                                </div>
                                
                                <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{client?.firstName} {client?.lastName}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{client?.properties.find(p => p.id === job.propertyId)?.address.street}</p>
                                
                                <div className="flex items-center gap-2 mt-3">
                                    {tech && (
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                                            <img src={tech.avatarUrl} className="w-5 h-5 rounded-full" />
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{tech.name.split(' ')[0]}</span>
                                        </div>
                                    )}
                                    <span className={`text-[10px] px-2 py-1 rounded-full border uppercase font-bold ${job.status === JobStatus.COMPLETED ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800'}`}>
                                        {job.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </Link>
                            
                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 border-t border-slate-100 dark:border-slate-700">
                                <button className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 dark:active:bg-slate-700 border-r border-slate-100 dark:border-slate-700 transition-colors" onClick={(e) => { e.stopPropagation(); alert('Calling client...'); }}>
                                    <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Call
                                </button>
                                <button 
                                    className={`flex items-center justify-center gap-2 py-3 text-sm font-bold transition-colors ${
                                        isCurrentUserOnWay ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 
                                        job.onMyWayBy ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 
                                        'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 active:bg-slate-100 dark:active:bg-slate-700'
                                    }`}
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if (!job.onMyWayBy) markOnMyWay(job.id);
                                    }}
                                    disabled={!!job.onMyWayBy && !isCurrentUserOnWay}
                                >
                                    {isCurrentUserOnWay ? (
                                        <> <Car className="w-4 h-4" /> Arriving </>
                                    ) : job.onMyWayBy ? (
                                        <> <Car className="w-4 h-4" /> {onMyWayUser?.name.split(' ')[0]} </>
                                    ) : (
                                        <> <MessageCircle className="w-4 h-4 text-slate-400 dark:text-slate-500" /> On My Way </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
    );
  };

  // --- RENDER: MOBILE DAY/3DAY VIEW ---
  const renderMobileDayView = (daysToShow: number = 1) => {
    const days = [];
    for (let i = 0; i < daysToShow; i++) {
        days.push(addDays(currentDate, i));
    }

    return (
      <div className="flex h-full overflow-hidden relative bg-white dark:bg-slate-800">
         {/* Time Labels */}
         <div className="w-12 shrink-0 border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 z-20 pt-2">
            {Array.from({ length: HOURS_COUNT + 1 }).map((_, i) => {
                const hour = START_HOUR + i;
                return (
                    <div key={hour} className="h-28 text-[10px] font-medium text-slate-400 dark:text-slate-500 text-center relative -top-2">
                        {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                    </div>
                );
            })}
         </div>

         {/* Columns */}
         <div className="flex flex-1 overflow-x-auto">
             {days.map((day) => {
                 const dayJobs = effectiveJobs.filter(j => isSameDay(new Date(j.start), day) && j.status !== 'DRAFT');
                 return (
                     <div key={day.toISOString()} className="flex-1 min-w-[100px] border-r border-slate-100 dark:border-slate-700 relative h-[1680px]"> {/* 15 * 112 = 1680px height */}
                         {/* Grid Lines */}
                         {Array.from({ length: HOURS_COUNT }).map((_, i) => (
                             <div key={i} className="h-28 border-b border-slate-50 dark:border-slate-700/50 w-full box-border"></div>
                         ))}

                         {/* Current Time Line */}
                         {isSameDay(day, now) && (
                             <div className="absolute left-0 right-0 z-10 pointer-events-none border-t-2 border-red-500 w-full" 
                                  style={{ top: `${(now.getHours() - START_HOUR + now.getMinutes()/60) * PIXELS_PER_HOUR}px` }}>
                                  <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500"></div>
                             </div>
                         )}

                         {/* Jobs */}
                         {dayJobs.map(job => {
                             const start = new Date(job.start);
                             const end = new Date(job.end);
                             const top = (differenceInMinutes(start, setHours(day, START_HOUR)) / 60) * PIXELS_PER_HOUR;
                             const height = Math.max((differenceInMinutes(end, start) / 60) * PIXELS_PER_HOUR, MIN_JOB_HEIGHT);
                             const client = clients.find(c => c.id === job.clientId);

                             return (
                                 <Link 
                                    to={`/jobs/${job.id}`}
                                    key={job.id}
                                    className="absolute left-1 right-1 rounded-md border-l-4 border-emerald-500 bg-emerald-50/90 dark:bg-emerald-900/80 p-1 text-xs overflow-hidden hover:z-20 shadow-sm"
                                    style={{ top: `${top}px`, height: `${height}px` }}
                                 >
                                     <div className="font-bold text-emerald-900 dark:text-emerald-100 truncate leading-tight">{job.title}</div>
                                     <div className="text-emerald-700 dark:text-emerald-300 truncate scale-90 origin-top-left">{client?.lastName}</div>
                                 </Link>
                             );
                         })}
                     </div>
                 );
             })}
         </div>
      </div>
    );
  };

  return (
    <>
      {/* --- MOBILE LAYOUT (Jobber Style) --- */}
      <div className="flex flex-col h-[calc(100vh-64px)] md:hidden bg-slate-50 dark:bg-slate-900 -m-4 relative">
          
          {/* Mobile Header */}
          <div className="bg-white dark:bg-slate-800 shadow-sm z-30 shrink-0">
              {/* Top Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <button 
                    className="flex items-center gap-1 text-lg font-bold text-slate-900 dark:text-white"
                    onClick={() => setCurrentDate(new Date())} // Reset to today on tap
                  >
                      {format(currentDate, 'MMMM yyyy')}
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                  <div className="flex items-center gap-3">
                      {/* Tech Filter */}
                      <div className="relative">
                          <button 
                            onClick={() => setShowTechMenu(!showTechMenu)}
                            className={`p-2 rounded-full transition-colors ${filterTechId ? 'bg-emerald-100 text-emerald-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                          >
                              <Users className="w-5 h-5" />
                              {filterTechId && <div className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800"></div>}
                          </button>
                          {showTechMenu && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowTechMenu(false)}></div>
                                <div className="absolute right-0 top-12 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 py-2 animate-in fade-in zoom-in-95 duration-100 origin-top-right max-h-[60vh] overflow-y-auto">
                                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 mb-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Team</p>
                                    </div>
                                    <button 
                                        onClick={() => { setFilterTechId(null); setShowTechMenu(false); }}
                                        className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 ${!filterTechId ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-700 dark:text-slate-200'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        All Team
                                    </button>
                                    {technicians.map(tech => (
                                        <button 
                                            key={tech.id}
                                            onClick={() => { setFilterTechId(tech.id); setShowTechMenu(false); }}
                                            className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 ${filterTechId === tech.id ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-700 dark:text-slate-200'}`}
                                        >
                                            <img src={tech.avatarUrl} alt={tech.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-600" />
                                            {tech.name}
                                        </button>
                                    ))}
                                </div>
                              </>
                          )}
                      </div>

                      <div className="relative">
                          <button 
                            onClick={() => setShowMobileViewOptions(!showMobileViewOptions)}
                            className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          >
                              {mobileViewMode === 'list' && <List className="w-5 h-5" />}
                              {mobileViewMode === 'day' && <Grid className="w-5 h-5" />}
                              {mobileViewMode === '3day' && <Layout3DayIcon className="w-5 h-5" />}
                              {mobileViewMode === 'map' && <MapIcon className="w-5 h-5" />}
                          </button>
                          
                          {/* View Switcher Dropdown */}
                          {showMobileViewOptions && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowMobileViewOptions(false)}></div>
                                <div className="absolute right-0 top-12 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                    {[
                                        { id: 'list', label: 'List View', icon: List },
                                        { id: 'day', label: 'Day View', icon: Grid },
                                        { id: '3day', label: '3-Day View', icon: Layout3DayIcon },
                                        { id: 'map', label: 'Map View', icon: MapIcon },
                                    ].map(option => (
                                        <button 
                                            key={option.id}
                                            onClick={() => { setMobileViewMode(option.id as MobileViewMode); setShowMobileViewOptions(false); }}
                                            className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 ${mobileViewMode === option.id ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-700 dark:text-slate-200'}`}
                                        >
                                            <option.icon className="w-4 h-4" /> {option.label}
                                        </button>
                                    ))}
                                </div>
                              </>
                          )}
                      </div>
                      <button className="p-2 bg-slate-900 dark:bg-emerald-600 rounded-full text-white shadow-lg shadow-slate-900/20 dark:shadow-emerald-600/20 active:scale-95 transition-transform">
                          <Plus className="w-5 h-5" />
                      </button>
                  </div>
              </div>

              {/* Date Scrubber (Jobber Style) */}
              <div className="flex overflow-x-auto py-2 px-2 hide-scrollbar bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  {eachDayOfInterval({
                      start: addDays(currentDate, -3),
                      end: addDays(currentDate, 3)
                  }).map(day => {
                      const isSelected = isSameDay(day, currentDate);
                      const isTodayDate = isToday(day);
                      
                      return (
                          <button 
                            key={day.toISOString()}
                            onClick={() => setCurrentDate(day)}
                            className={`flex flex-col items-center justify-center min-w-[3.5rem] py-2 rounded-xl mx-1 transition-all duration-200 ${isSelected ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-md transform scale-105' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                          >
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-slate-300 dark:text-emerald-100' : 'text-slate-400 dark:text-slate-500'}`}>
                                  {format(day, 'EEE')}
                              </span>
                              <span className={`text-lg font-bold leading-none mt-1 ${isTodayDate && !isSelected ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                                  {format(day, 'd')}
                              </span>
                              {isTodayDate && !isSelected && <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1"></div>}
                          </button>
                      );
                  })}
              </div>
          </div>

          {/* Mobile Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-900 relative">
              {mobileViewMode === 'list' && renderMobileListView()}
              {mobileViewMode === 'day' && renderMobileDayView(1)}
              {mobileViewMode === '3day' && renderMobileDayView(3)}
              {mobileViewMode === 'map' && (
                  <div className="h-full w-full">
                      <MapView jobs={effectiveJobs} users={users} clients={clients} />
                  </div>
              )}
          </div>
      </div>

      {/* --- DESKTOP LAYOUT (Existing) --- */}
      <div className="flex-col h-[calc(100vh-100px)] hidden md:flex">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0">
            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center">
                    <button onClick={handlePrev} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors">Today</button>
                    <button onClick={handleNext} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                </div>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white px-2 min-w-[200px] text-center select-none">
                    {format(currentDate, viewMode === 'day' ? 'EEEE, MMMM do' : 'MMMM yyyy')}
                </h2>
            </div>

            <div className="flex gap-3">
                {/* View Switcher */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    {(['day', 'week', 'month', 'map'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                viewMode === mode 
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                            }`}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
                <Button 
                    variant="secondary" 
                    className="hidden xl:flex"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                    {isSidebarOpen ? 'Hide Unassigned' : `Show Unassigned (${unassignedJobs.length})`}
                </Button>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6 flex-1 min-h-0">
            
            {/* Calendar/Map Area */}
            <div className={`flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col relative transition-all duration-300`}>
                
                {viewMode === 'map' ? (
                    <div className="flex-1 relative">
                        <MapView jobs={jobs} users={users} clients={clients} />
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col" 
                         onDragOver={(e) => e.preventDefault()} // Allow drop on empty space
                         onDrop={(e) => {
                             // Global drop handler for "anytime" or generic day drops if needed
                             // For now, specific columns handle the drops
                         }}
                    >
                        {/* Header Row (Technicians) - Sticky */}
                        <div className="flex border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-30 shadow-sm min-h-[80px]">
                            <div className="w-16 shrink-0 border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col items-center justify-end pb-2">
                                <Clock className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                            </div>
                            {technicians.map(tech => {
                                const techStyles = getTechColorStyles(tech.color);
                                return (
                                    <div key={tech.id} className="flex-1 min-w-[180px] border-r border-slate-100 dark:border-slate-700 p-3 group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <TechHeader tech={tech} dayJobs={getJobsForTech(tech.id, currentDate)} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Grid Body */}
                        <div className="flex relative min-h-[1680px]"> {/* 15 hours * 112px */}
                            {/* Time Column */}
                            <div className="w-16 shrink-0 border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 select-none z-20 relative">
                                {Array.from({ length: HOURS_COUNT }).map((_, i) => {
                                    const hour = START_HOUR + i;
                                    return (
                                        <div key={hour} className="h-28 border-b border-slate-50 dark:border-slate-700/50 relative">
                                            <span className="absolute -top-2.5 left-0 right-0 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                                                {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                                            </span>
                                        </div>
                                    );
                                })}
                                
                                {/* DYNAMIC TIME AXIS INDICATOR FOR DROP PREVIEW */}
                                {dropPreview && (
                                    <div 
                                        className="absolute right-0 w-full flex items-center justify-end pr-1 pointer-events-none z-50"
                                        style={{
                                            top: `${(differenceInMinutes(dropPreview.start, setHours(currentDate, START_HOUR)) / 60) * PIXELS_PER_HOUR}px`,
                                            transform: 'translateY(-50%)'
                                        }}
                                    >
                                        <div className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-l-sm shadow-sm">
                                            {format(dropPreview.start, 'h:mm')}
                                        </div>
                                        <div className="w-2 h-px bg-emerald-600"></div>
                                    </div>
                                )}
                            </div>

                            {/* Tech Columns */}
                            {technicians.map((tech, i) => {
                                const dayJobs = getJobsForTech(tech.id, currentDate);
                                const techStyles = getTechColorStyles(tech.color);

                                return (
                                    <div 
                                        key={tech.id} 
                                        className="flex-1 min-w-[180px] border-r border-slate-100 dark:border-slate-700 relative group bg-white dark:bg-slate-800/50"
                                        onDragOver={(e) => handleDragOver(e, tech.id)}
                                        onDrop={(e) => handleDrop(e, tech.id)}
                                        onMouseMove={(e) => handleColumnMouseMove(e, tech.id)}
                                        onClick={() => handleColumnClick(tech.id)}
                                    >
                                        {/* Hour Grid Lines */}
                                        {Array.from({ length: HOURS_COUNT }).map((_, h) => (
                                            <div key={h} className="h-28 border-b border-slate-50 dark:border-slate-700/50"></div>
                                        ))}

                                        {/* Current Time Line (if today) */}
                                        {renderCurrentTimeLine(true)}

                                        {/* Drop Preview Phantom */}
                                        {dropPreview && dropPreview.techId === tech.id && (
                                            (() => {
                                                const draggingJob = jobs.find(j => j.id === draggingJobId);
                                                // Calculate duration or default to 1 hour (60 mins) if unknown
                                                let duration = 60;
                                                if (draggingJob) {
                                                    duration = differenceInMinutes(new Date(draggingJob.end), new Date(draggingJob.start));
                                                    if (duration <= 0) duration = 60;
                                                }
                                                
                                                // Calculate dimensions and time
                                                const endTime = addMinutes(dropPreview.start, duration);
                                                const height = Math.max((duration / 60) * PIXELS_PER_HOUR, MIN_JOB_HEIGHT);
                                                
                                                return (
                                                    <div 
                                                        className="absolute left-1 right-1 rounded-lg border-2 border-dashed border-emerald-500 bg-emerald-50/80 dark:bg-emerald-900/50 z-50 pointer-events-none flex flex-col shadow-xl ring-4 ring-emerald-500/10 transition-all duration-75 ease-out overflow-visible"
                                                        style={{
                                                            top: `${(differenceInMinutes(dropPreview.start, setHours(currentDate, START_HOUR)) / 60) * PIXELS_PER_HOUR}px`,
                                                            height: `${height}px`
                                                        }}
                                                    >
                                                        {/* Floating Time Badge (Visible even if card is covered) */}
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full bg-slate-900 text-white px-3 py-1 rounded-full shadow-lg border border-slate-700 z-[100] flex items-center gap-2 whitespace-nowrap mb-1">
                                                             <Clock className="w-3 h-3 text-emerald-400" />
                                                             <span className="font-bold text-xs">{format(dropPreview.start, 'h:mm a')}</span>
                                                             <span className="text-[10px] text-slate-400">to</span>
                                                             <span className="font-bold text-xs">{format(endTime, 'h:mm a')}</span>
                                                        </div>

                                                        {/* Internal Card Time Header */}
                                                        <div className="bg-emerald-600 text-white px-2 py-1 flex justify-between items-center shadow-sm shrink-0">
                                                            <span className="text-xs font-extrabold tracking-tight">
                                                                {format(dropPreview.start, 'h:mm a')}
                                                            </span>
                                                            <span className="text-[10px] font-medium opacity-90">
                                                                - {format(endTime, 'h:mm a')}
                                                            </span>
                                                        </div>
                                                        
                                                        {draggingJob && (
                                                            <div className="p-2 flex-1 min-h-0 flex flex-col justify-center">
                                                                <div className="font-bold text-emerald-900 dark:text-emerald-100 text-xs truncate leading-tight">
                                                                    {draggingJob.title}
                                                                </div>
                                                                {height > 50 && (
                                                                    <div className="text-[10px] text-emerald-700 dark:text-emerald-300 truncate opacity-90 mt-0.5">
                                                                        {Math.round(duration / 60 * 10) / 10} hrs
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()
                                        )}

                                        {/* Jobs */}
                                        {dayJobs.map(job => {
                                            const start = new Date(job.start);
                                            const end = new Date(job.end);
                                            const top = (differenceInMinutes(start, setHours(currentDate, START_HOUR)) / 60) * PIXELS_PER_HOUR;
                                            const height = Math.max((differenceInMinutes(end, start) / 60) * PIXELS_PER_HOUR, MIN_JOB_HEIGHT); // Min height
                                            const client = clients.find(c => c.id === job.clientId);
                                            const onMyWayUser = users.find(u => u.id === job.onMyWayBy);
                                            
                                            // Check for overlap to inset
                                            // Simple logic: if overlaps with any previous job in this column, inset it
                                            // A real implementation needs a more robust layout algorithm (like fullcalendar)
                                            const isOverlapping = false; // Simplified for this demo

                                            return (
                                                <div
                                                    key={job.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, job)}
                                                    onDragEnd={handleDragEnd}
                                                    onClick={(e) => handleJobClick(job, e)}
                                                    className={`
                                                        absolute left-1 right-1 rounded-xl border-l-4 p-2 text-xs cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:z-50
                                                        ${selectedJobId === job.id ? 'ring-2 ring-slate-900 dark:ring-white z-40 scale-[1.02]' : 'z-10'}
                                                        ${draggingJobId === job.id ? 'opacity-50' : 'opacity-100'}
                                                        ${job.status === JobStatus.COMPLETED ? 'bg-slate-100 dark:bg-slate-700 border-slate-400 dark:border-slate-500 opacity-80 grayscale' : 
                                                          job.status === JobStatus.IN_PROGRESS ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-500' : 
                                                          'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500'}
                                                    `}
                                                    style={{
                                                        top: `${top}px`,
                                                        height: `${height}px`,
                                                        left: isOverlapping ? '20%' : '4px'
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start gap-1">
                                                        <span className="font-bold text-slate-900 dark:text-white truncate text-[11px] leading-tight">
                                                            {client?.lastName || 'Unknown'}
                                                        </span>
                                                        <span className="bg-white/50 dark:bg-black/20 px-1 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                                            {format(start, 'h:mm')}
                                                        </span>
                                                    </div>
                                                    <div className="font-medium text-slate-600 dark:text-slate-300 truncate mt-0.5" title={job.title}>
                                                        {job.title}
                                                    </div>
                                                    <div className="flex justify-between items-end mt-auto pt-1">
                                                        {job.priority === 'HIGH' && (
                                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                        )}
                                                        {onMyWayUser && (
                                                            <div className="ml-auto bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full p-0.5" title={`${onMyWayUser.name} is on the way`}>
                                                                <Car className="w-3 h-3" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Unassigned Sidebar (Desktop) */}
            <div 
                className={`
                    bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 ease-in-out
                    ${isSidebarOpen ? 'w-80 translate-x-0 opacity-100' : 'w-0 translate-x-20 opacity-0 hidden'}
                `}
            >
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Unassigned
                        <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs">{unassignedJobs.length}</span>
                    </h3>
                    <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>
                </div>
                
                <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search jobs..." 
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-xs focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white placeholder-slate-400"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/30 dark:bg-slate-900/30">
                    {unassignedJobs.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <p className="text-xs">No unassigned jobs.</p>
                        </div>
                    ) : (
                        unassignedJobs.map(job => {
                            const client = clients.find(c => c.id === job.clientId);
                            return (
                                <UnassignedJobCard 
                                    key={job.id} 
                                    job={job} 
                                    client={client} 
                                    onClick={() => setSelectedJobId(job.id)}
                                    isSelected={selectedJobId === job.id}
                                    onDragStart={(e) => handleDragStart(e, job)}
                                />
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Scheduling Wizard Modal */}
      <SchedulingWizard 
          isOpen={!!pendingSchedule}
          onClose={() => setPendingSchedule(null)}
          job={pendingSchedule?.job || null}
          date={pendingSchedule?.date || null}
          preSelectedTechId={pendingSchedule?.techId}
          technicians={technicians}
          jobs={jobs}
          onConfirm={(jobId, techId, start) => finalizeMove(jobId, techId, start)}
      />
    </>
  );
};

const Layout3DayIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
);
