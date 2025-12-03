
import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { 
  format, addDays, isSameDay, setHours, setMinutes, 
  differenceInMinutes, startOfDay, areIntervalsOverlapping, 
  addMinutes, isAfter, isBefore, startOfWeek, endOfWeek,
  eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth,
  addWeeks, addMonths, subWeeks, subMonths, subDays,
  isToday, startOfHour, getDay, parseISO
} from 'date-fns';
import { Job, User, JobStatus, Client, UserRole } from '../types';
import { 
  ChevronLeft, ChevronRight, 
  User as UserIcon, GripVertical, 
  Plus, Calendar as CalendarIcon, 
  Clock, Briefcase, Search,
  Move, AlertCircle, AlertTriangle,
  CheckCircle2, X, MapPin, Phone, MessageSquare,
  List, Grid, Map as MapIcon, MoreHorizontal,
  Eye, ChevronDown, MessageCircle
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

type ViewMode = 'list' | 'day' | 'week' | 'month' | 'map';
type MobileViewMode = 'list' | 'day' | '3day' | 'map';

// --- CONSTANTS ---
const START_HOUR = 7; // 7 AM
const END_HOUR = 21; // 9 PM
const HOURS_COUNT = END_HOUR - START_HOUR;
const PIXELS_PER_HOUR = 112; // h-28 = 7rem = 112px
const PIXELS_PER_MINUTE = PIXELS_PER_HOUR / 60;
const SNAP_MINUTES = 15;
const MIN_JOB_HEIGHT = 48; // Minimum visual height for very short jobs

// --- HELPER FUNCTIONS ---

const getTechColorStyles = (color: string = 'slate') => {
  const map: Record<string, { bg: string, header: string, border: string, text: string }> = {
    blue: { bg: 'bg-blue-50', header: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-700' },
    amber: { bg: 'bg-amber-50', header: 'bg-amber-100', border: 'border-amber-200', text: 'text-amber-700' },
    emerald: { bg: 'bg-emerald-50', header: 'bg-emerald-100', border: 'border-emerald-200', text: 'text-emerald-700' },
    rose: { bg: 'bg-rose-50', header: 'bg-rose-100', border: 'border-rose-200', text: 'text-rose-700' },
    purple: { bg: 'bg-purple-50', header: 'bg-purple-100', border: 'border-purple-200', text: 'text-purple-700' },
    slate: { bg: 'bg-slate-50', header: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-700' },
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
        <div className={`w-10 h-10 rounded-full ${baseColor} text-white flex items-center justify-center shadow-sm ring-2 ring-offset-1 ring-white/60 dark:ring-slate-700/60 shrink-0`}>
          {tech.avatarUrl ? (
            <img src={tech.avatarUrl} alt={tech.name} className="w-full h-full rounded-full object-cover" />
          ) : (
             <span className="font-bold text-sm">{tech.name.charAt(0)}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-800 dark:text-white truncate text-sm">{tech.name}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Technician</p>
        </div>
      </div>
      
      {/* Utilization Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wide">
            <span>Capacity</span>
            <span className={isOverloaded ? 'text-red-500' : 'text-slate-600 dark:text-slate-400'}>{hoursBooked} / 8h</span>
        </div>
        <div className="w-full bg-slate-200/50 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
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
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-sm'
    }`}
  >
    <div className="flex justify-between items-start mb-2">
      <h4 className={`font-bold text-sm leading-tight pr-6 ${isSelected ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-800 dark:text-white'}`}>{job.title}</h4>
      <div className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${isSelected ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30'}`}>
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
                                <button onClick={() => setStep('TECH')} className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center">
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
                                        className="p-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-center text-slate-700 dark:text-slate-300"
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
  const currentUser = store?.currentUser;
  
  // -- PERMISSION CHECK --
  const canDispatch = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.OFFICE;

  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Desktop View Mode
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const lastScrollTime = useRef(0);
  
  // Mobile View Mode
  const [mobileViewMode, setMobileViewMode] = useState<MobileViewMode>('list');
  const [showMobileViewOptions, setShowMobileViewOptions] = useState(false);

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

  // Auto-Minimize/Maximize Logic (Only for dispatchers)
  const prevUnassignedCount = useRef(0);
  useEffect(() => {
      if (!canDispatch) return;
      const count = baseUnassignedJobs.length;
      if (count === 0 && prevUnassignedCount.current > 0) {
          setIsSidebarOpen(false);
      }
      else if (count > 0 && prevUnassignedCount.current === 0) {
          setIsSidebarOpen(true);
      }
      prevUnassignedCount.current = count;
  }, [baseUnassignedJobs.length, canDispatch]);

  // --- HANDLERS ---

  const handlePrev = () => {
    if (viewMode === 'day') setCurrentDate((prev) => addDays(prev, -1));
    if (viewMode === 'week') setCurrentDate((prev) => subWeeks(prev, 1));
    if (viewMode === 'month') setCurrentDate((prev) => subMonths(prev, 1));
    if (viewMode === 'list') setCurrentDate((prev) => subWeeks(prev, 1));
    if (viewMode === 'map') setCurrentDate((prev) => addDays(prev, -1));
  };

  const handleNext = () => {
    if (viewMode === 'day') setCurrentDate((prev) => addDays(prev, 1));
    if (viewMode === 'week') setCurrentDate((prev) => addWeeks(prev, 1));
    if (viewMode === 'month') setCurrentDate((prev) => addMonths(prev, 1));
    if (viewMode === 'list') setCurrentDate((prev) => addWeeks(prev, 1));
    if (viewMode === 'map') setCurrentDate((prev) => addDays(prev, 1));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (viewMode === 'month') {
        const now = Date.now();
        if (now - lastScrollTime.current < 250) return; // Throttle to prevent rapid month switching
        
        if (Math.abs(e.deltaY) > 10) {
            lastScrollTime.current = now;
            if (e.deltaY > 0) {
                handleNext();
            } else {
                handlePrev();
            }
        }
    }
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
    navigate(`/jobs/${job.id}`);
  };

  const handleDragStart = (e: React.DragEvent, job: Job) => {
    if (!canDispatch) return; // Prevent techs from dragging
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
    if (!canDispatch) return;
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
    if (!canDispatch) return;
    e.preventDefault();
    e.stopPropagation();
    
    const jobId = e.dataTransfer.getData('jobId');
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    if (viewMode === 'day') {
        // Use dropPreview if available, otherwise calculate on the fly (Robustness fix)
        let targetStart = dropPreview?.start;
        if (!targetStart) {
             targetStart = calculateSnapTime(e, e.currentTarget as HTMLDivElement);
        }
        
        if (targetStart) {
            finalizeMove(jobId, techId, targetStart);
        }
    } else if (viewMode === 'week') {
        setPendingSchedule({ job, date, techId });
    } else if (viewMode === 'month') {
        setPendingSchedule({ job, date });
    }

    setDraggingJobId(null);
    setDropPreview(null);
  };

  // --- UNASSIGNED DROP HANDLERS ---
  const handleUnassignedDragOver = (e: React.DragEvent) => {
    if (!canDispatch) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    // Clear any drop preview on the calendar if we are over the unassigned section
    if (dropPreview) {
        setDropPreview(null);
    }
  };

  const handleUnassignedDrop = (e: React.DragEvent) => {
    if (!canDispatch) return;
    e.preventDefault();
    e.stopPropagation();
    const jobId = e.dataTransfer.getData('jobId');
    if (jobId) {
        unscheduleJob(jobId);
        setDraggingJobId(null);
        setDropPreview(null);
    }
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

  // --- RENDERERS ---

  const renderDayView = () => (
    <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col bg-white dark:bg-slate-800" 
         onDragOver={(e) => canDispatch && e.preventDefault()} 
    >
        {/* Header Row (Technicians) - Sticky */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-30 shadow-sm min-h-[80px]">
            <div className="w-16 shrink-0 border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col items-center justify-end pb-2">
                <Clock className="w-4 h-4 text-slate-300 dark:text-slate-500" />
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
            <div className="w-16 shrink-0 border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 select-none z-20">
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
            </div>

            {/* Tech Columns */}
            {technicians.map((tech, i) => {
                const dayJobs = getJobsForTech(tech.id, currentDate);
                const techStyles = getTechColorStyles(tech.color);

                return (
                    <div 
                        key={tech.id} 
                        className="flex-1 min-w-[180px] border-r border-slate-100 dark:border-slate-700 relative group"
                        onDragOver={(e) => handleDragOver(e, tech.id)}
                        onDrop={(e) => handleDrop(e, tech.id)}
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
                            <div 
                                className="absolute left-2 right-2 rounded-lg border-2 border-dashed border-emerald-400 bg-emerald-50/50 z-10 pointer-events-none flex items-center justify-center"
                                style={{
                                    top: `${(differenceInMinutes(dropPreview.start, setHours(currentDate, START_HOUR)) / 60) * PIXELS_PER_HOUR}px`,
                                    height: '112px' // Default 1h height preview
                                }}
                            >
                                <span className="text-emerald-600 font-bold text-sm bg-white/80 px-2 py-1 rounded">
                                    {format(dropPreview.start, 'h:mm a')}
                                </span>
                            </div>
                        )}

                        {/* Jobs */}
                        {dayJobs.map(job => {
                            const start = new Date(job.start);
                            const end = new Date(job.end);
                            const top = (differenceInMinutes(start, setHours(currentDate, START_HOUR)) / 60) * PIXELS_PER_HOUR;
                            const height = Math.max((differenceInMinutes(end, start) / 60) * PIXELS_PER_HOUR, MIN_JOB_HEIGHT); // Min height
                            const client = clients.find(c => c.id === job.clientId);
                            const isOverlapping = false; 

                            return (
                                <div
                                    key={job.id}
                                    draggable={canDispatch}
                                    onDragStart={(e) => handleDragStart(e, job)}
                                    onDragEnd={handleDragEnd}
                                    onClick={(e) => handleJobClick(job, e)}
                                    className={`
                                        absolute left-1 right-1 rounded-xl border-l-4 p-2 text-xs cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:z-50
                                        ${selectedJobId === job.id ? 'ring-2 ring-slate-900 z-40 scale-[1.02]' : 'z-10'}
                                        ${draggingJobId === job.id ? 'opacity-50' : 'opacity-100'}
                                        ${job.status === JobStatus.COMPLETED ? 'bg-slate-100 dark:bg-slate-700 border-slate-400 opacity-80 grayscale' : 
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
                                        <span className="bg-white/50 dark:bg-slate-900/50 px-1 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                            {format(start, 'h:mm')}
                                        </span>
                                    </div>
                                    <div className="font-medium text-slate-600 dark:text-slate-300 truncate mt-0.5" title={job.title}>
                                        {job.title}
                                    </div>
                                    {job.priority === 'HIGH' && (
                                        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-red-500"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            })}
        </div>
    </div>
  );

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col bg-white dark:bg-slate-800">
            {/* Header */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-30 shadow-sm min-h-[50px]">
                <div className="w-16 shrink-0 border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"></div>
                {days.map(day => (
                    <div key={day.toISOString()} className={`flex-1 border-r border-slate-100 dark:border-slate-700 p-2 text-center ${isSameDay(day, new Date()) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                        <div className={`text-xs font-bold uppercase ${isSameDay(day, new Date()) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>{format(day, 'EEE')}</div>
                        <div className={`text-lg font-bold ${isSameDay(day, new Date()) ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>{format(day, 'd')}</div>
                    </div>
                ))}
            </div>
            
            {/* Grid */}
            <div className="flex relative" style={{ height: HOURS_COUNT * PIXELS_PER_HOUR }}>
                {/* Time Axis */}
                <div className="w-16 shrink-0 border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 select-none z-20">
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
                </div>

                {/* Day Columns */}
                {days.map(day => {
                    const dayJobs = jobs.filter(j => isSameDay(new Date(j.start), day) && j.status !== 'DRAFT');
                    
                    return (
                        <div key={day.toISOString()} className="flex-1 border-r border-slate-100 dark:border-slate-700 relative">
                            {/* Grid Lines */}
                            {Array.from({ length: HOURS_COUNT }).map((_, h) => (
                                <div key={h} className="h-28 border-b border-slate-50 dark:border-slate-700/50"></div>
                            ))}
                            
                            {/* Jobs */}
                            {dayJobs.map(job => {
                                const start = new Date(job.start);
                                const end = new Date(job.end);
                                const top = (differenceInMinutes(start, setHours(day, START_HOUR)) / 60) * PIXELS_PER_HOUR;
                                const height = Math.max((differenceInMinutes(end, start) / 60) * PIXELS_PER_HOUR, MIN_JOB_HEIGHT);
                                const tech = users.find(u => u.id === job.assignedTechIds[0]);
                                const client = clients.find(c => c.id === job.clientId);
                                const techStyles = getTechColorStyles(tech?.color);

                                return (
                                    <div
                                        key={job.id}
                                        onClick={(e) => handleJobClick(job, e)}
                                        className={`absolute left-1 right-1 rounded-lg border-l-4 p-2 text-xs cursor-pointer shadow-sm hover:z-50 hover:shadow-md transition-all
                                            ${job.status === 'COMPLETED' ? 'bg-slate-100 dark:bg-slate-700 border-slate-400 opacity-80' : `bg-white dark:bg-slate-800 border-${tech?.color || 'slate'}-500`}
                                        `}
                                        style={{ 
                                            top: `${top}px`, 
                                            height: `${height}px`,
                                            backgroundColor: job.status !== 'COMPLETED' ? `var(--color-${tech?.color || 'slate'}-50)` : undefined,
                                            borderColor: tech?.color ? undefined : '#cbd5e1'
                                        }}
                                    >
                                        <div className={`font-bold truncate ${techStyles.text} dark:text-slate-200`}>{client?.lastName || 'Unknown'}</div>
                                        <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">{job.title}</div>
                                        {tech && <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">{tech.name.split(' ')[0]}</div>}
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weeks = [];
    let week = [];
    days.forEach(day => {
        week.push(day);
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
    });

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800" onWheel={handleWheel}>
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{day}</div>
                ))}
            </div>
            <div className="flex-1 grid grid-rows-5 md:grid-rows-auto">
                {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="grid grid-cols-7 flex-1">
                        {week.map(day => {
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const dayJobs = jobs.filter(j => isSameDay(new Date(j.start), day) && j.status !== 'DRAFT');
                            
                            return (
                                <div 
                                    key={day.toISOString()} 
                                    className={`border-b border-r border-slate-100 dark:border-slate-700 p-2 min-h-[100px] hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/50' : ''}`}
                                    onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                                >
                                    <div className={`text-right mb-2 text-sm font-bold ${isSameDay(day, new Date()) ? 'text-blue-600 dark:text-blue-400' : isCurrentMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}`}>
                                        {format(day, 'd')}
                                    </div>
                                    <div className="space-y-1">
                                        {dayJobs.slice(0, 4).map(job => {
                                            const tech = users.find(u => u.id === job.assignedTechIds[0]);
                                            return (
                                                <div key={job.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate border-l-2 bg-white dark:bg-slate-800 shadow-sm border-${tech?.color || 'slate'}-500 dark:text-slate-300`}>
                                                    {format(new Date(job.start), 'ha')} {job.title}
                                                </div>
                                            )
                                        })}
                                        {dayJobs.length > 4 && (
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 pl-1">+{dayJobs.length - 4} more</div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
  };

  const renderListView = () => {
      // Group jobs by date for the next 30 days
      const days = eachDayOfInterval({
          start: startOfWeek(currentDate),
          end: addDays(startOfWeek(currentDate), 14) // 2 weeks view
      });

      return (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-slate-900 space-y-6">
              {days.map(day => {
                  const dayJobs = jobs
                    .filter(j => isSameDay(new Date(j.start), day) && j.status !== 'DRAFT')
                    .sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                  if (dayJobs.length === 0) return null;

                  return (
                      <div key={day.toISOString()}>
                          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 sticky top-0 bg-slate-50 dark:bg-slate-900 py-2 z-10">
                              {format(day, 'EEEE, MMMM do')}
                          </h3>
                          <div className="space-y-3">
                              {dayJobs.map(job => {
                                  const client = clients.find(c => c.id === job.clientId);
                                  const tech = users.find(u => u.id === job.assignedTechIds[0]);
                                  const statusColor = job.status === 'COMPLETED' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' : 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';

                                  return (
                                      <Link 
                                        to={`/jobs/${job.id}`}
                                        key={job.id} 
                                        className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500 transition-all group"
                                      >
                                          <div className="w-24 shrink-0 text-center border-r border-slate-100 dark:border-slate-700 pr-4">
                                              <div className="text-sm font-bold text-slate-900 dark:text-white">{format(new Date(job.start), 'h:mm a')}</div>
                                              <div className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(job.end), 'h:mm a')}</div>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                              <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{job.title}</h4>
                                              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                                  <span className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" /> {client?.firstName} {client?.lastName}</span>
                                                  <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {client?.properties.find(p => p.id === job.propertyId)?.address.city}</span>
                                              </div>
                                          </div>
                                          <div className="flex items-center gap-4">
                                              {tech && (
                                                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-600">
                                                      <img src={tech.avatarUrl} className="w-6 h-6 rounded-full" />
                                                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{tech.name.split(' ')[0]}</span>
                                                  </div>
                                              )}
                                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase ${statusColor}`}>
                                                  {job.status.replace('_', ' ')}
                                              </span>
                                              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500" />
                                          </div>
                                      </Link>
                                  );
                              })}
                          </div>
                      </div>
                  );
              })}
              <div className="text-center py-8">
                  <Button variant="outline" onClick={() => setCurrentDate(addDays(currentDate, 7))}>Load Next Week</Button>
              </div>
          </div>
      );
  };

  // --- RENDER: MOBILE LIST VIEW ---
  const renderMobileListView = () => {
    const todaysJobs = jobs
      .filter(j => isSameDay(new Date(j.start), currentDate) && j.status !== 'DRAFT')
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    const anytimeJobs = todaysJobs.filter(j => !j.start.includes("T") || differenceInMinutes(new Date(j.end), new Date(j.start)) > 480); // Mock logic for "anytime"
    const scheduledJobs = todaysJobs.filter(j => !anytimeJobs.includes(j));

    return (
      <div className="px-4 pt-4 pb-24 space-y-6">
        
        {/* Anytime Section (Simulated) */}
        {anytimeJobs.length > 0 && (
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Anytime Visits</h3>
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
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Schedule</h3>
                <span className="text-xs text-slate-400">{scheduledJobs.length} visits</span>
            </div>
            
            {scheduledJobs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                    <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">No visits scheduled for today.</p>
                    {canDispatch && <Button variant="outline" size="sm" className="mt-4">Create Visit</Button>}
                </div>
            ) : (
                scheduledJobs.map(job => {
                    const client = clients.find(c => c.id === job.clientId);
                    const tech = users.find(u => u.id === job.assignedTechIds[0]);
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
                                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-600">
                                            <img src={tech.avatarUrl} className="w-5 h-5 rounded-full" />
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{tech.name.split(' ')[0]}</span>
                                        </div>
                                    )}
                                    <span className={`text-[10px] px-2 py-1 rounded-full border uppercase font-bold ${job.status === JobStatus.COMPLETED ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800'}`}>
                                        {job.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </Link>
                            
                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 border-t border-slate-100 dark:border-slate-700">
                                <button className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 border-r border-slate-100 dark:border-slate-700 transition-colors" onClick={(e) => { e.stopPropagation(); alert('Calling client...'); }}>
                                    <Phone className="w-4 h-4 text-slate-400" /> Call
                                </button>
                                <button className="flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 dark:active:bg-slate-600 transition-colors" onClick={(e) => { e.stopPropagation(); alert('Sending OMW message...'); }}>
                                    <MessageCircle className="w-4 h-4 text-slate-400" /> On My Way
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
                 const dayJobs = jobs.filter(j => isSameDay(new Date(j.start), day) && j.status !== 'DRAFT');
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
                                    className="absolute left-1 right-1 rounded-md border-l-4 border-emerald-500 bg-emerald-50/90 dark:bg-emerald-900/50 p-1 text-xs overflow-hidden hover:z-20 shadow-sm"
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
                                            className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 ${mobileViewMode === option.id ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-700 dark:text-slate-300'}`}
                                        >
                                            <option.icon className="w-4 h-4" /> {option.label}
                                        </button>
                                    ))}
                                </div>
                              </>
                          )}
                      </div>
                      {canDispatch && (
                          <button className="p-2 bg-slate-900 dark:bg-emerald-600 rounded-full text-white shadow-lg shadow-slate-900/20 dark:shadow-emerald-600/20 active:scale-95 transition-transform">
                              <Plus className="w-5 h-5" />
                          </button>
                      )}
                  </div>
              </div>

              {/* Date Scrubber (Jobber Style) */}
              <div className="flex overflow-x-auto py-2 px-2 hide-scrollbar bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  {eachDayOfInterval({
                      start: subDays(currentDate, 3),
                      end: addDays(currentDate, 3)
                  }).map(day => {
                      const isSelected = isSameDay(day, currentDate);
                      const isTodayDate = isToday(day);
                      
                      return (
                          <button 
                            key={day.toISOString()}
                            onClick={() => setCurrentDate(day)}
                            className={`flex flex-col items-center justify-center min-w-[3.5rem] py-2 rounded-xl mx-1 transition-all duration-200 ${isSelected ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-105' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                          >
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500'}`}>
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
                      <MapView jobs={jobs} users={users} clients={clients} />
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
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md transition-colors">Today</button>
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
                    {(['list', 'day', 'week', 'month', 'map'] as const).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                                viewMode === mode 
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                            }`}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
                {canDispatch && (
                    <Button 
                        variant="secondary" 
                        className="hidden xl:flex"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        {isSidebarOpen ? 'Hide Unassigned' : `Show Unassigned (${unassignedJobs.length})`}
                    </Button>
                )}
            </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6 flex-1 min-h-0">
            
            {/* Calendar/Map Area */}
            <div className={`flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col relative transition-all duration-300`}>
                
                {viewMode === 'map' && (
                    <div className="flex-1 relative">
                        <MapView jobs={jobs} users={users} clients={clients} />
                    </div>
                )}

                {viewMode === 'day' && renderDayView()}
                {viewMode === 'week' && renderWeekView()}
                {viewMode === 'month' && renderMonthView()}
                {viewMode === 'list' && renderListView()}

            </div>

            {/* Unassigned Sidebar (Desktop - Admin Only) */}
            {canDispatch && (
                <div 
                    className={`
                        bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 ease-in-out relative
                        ${isSidebarOpen ? 'w-80 translate-x-0 opacity-100' : 'w-0 translate-x-20 opacity-0 hidden'}
                    `}
                    onDragOver={handleUnassignedDragOver}
                    onDrop={handleUnassignedDrop}
                >
                    {/* Drop Zone Overlay */}
                    {draggingJobId && !baseUnassignedJobs.find(j => j.id === draggingJobId) && (
                        <div className="absolute inset-2 z-50 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-[1px] border-2 border-dashed border-emerald-400 rounded-xl flex flex-col items-center justify-center text-emerald-600 animate-in fade-in duration-200 pointer-events-none">
                            <div className="bg-white dark:bg-slate-900 p-3 rounded-full shadow-sm mb-2">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <p className="font-bold text-sm">Drop to Unassign</p>
                        </div>
                    )}

                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> Unassigned
                            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs">{unassignedJobs.length}</span>
                        </h3>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-4 h-4" /></button>
                    </div>
                    
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                            <input 
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search jobs..." 
                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-emerald-500 transition-colors text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/30 dark:bg-slate-900/30">
                        {unassignedJobs.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 dark:text-slate-500">
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
            )}
        </div>
      </div>

      {/* Scheduling Wizard Modal */}
      {canDispatch && (
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
      )}
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
