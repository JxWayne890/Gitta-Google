import React, { useState, useMemo, useContext, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Job, Client, JobStatus, UserRole } from '../types';
import { Plus, ChevronRight, Clock, AlertCircle, Filter, Layout, ArrowUpDown, ArrowUp, ArrowDown, Table as TableIcon, GanttChart, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Pipeline } from './Pipeline';
import { StoreContext } from '../store';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, differenceInDays, isWithinInterval, startOfDay, addWeeks, subWeeks } from 'date-fns';
import { TimePicker } from '../components/TimePicker';
import { DatePicker } from '../components/DatePicker';

// ... (Imports and GanttView component remain unchanged, omitting for brevity, assuming they are kept) ...
// If re-outputting whole file is safer, I will do that below. 
// For brevity in this response, I will include the full file content to ensure no context loss as requested.

interface JobsListProps {
  jobs: Job[];
  clients: Client[];
  onAddJob: (job: Job) => void;
}

type JobFilter = 'ALL' | 'ACTIVE' | 'DRAFTS' | 'COMPLETED' | 'HIGH_PRIORITY';
type ViewType = 'TABLE' | 'PIPELINE' | 'GANTT';
type SortKey = 'JOB' | 'CLIENT' | 'DATE' | 'VEHICLE' | 'STATUS' | 'TECH' | 'VALUE';

const GanttView: React.FC<{ jobs: Job[], clients: Client[] }> = ({ jobs, clients }) => {
    // ... (Gantt logic same as before) ...
    const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [daysToShow, setDaysToShow] = useState(14); 
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const endDate = addDays(startDate, daysToShow - 1);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const cellWidth = 100; 
    const headerHeight = 50;

    const handlePrev = () => setStartDate(subWeeks(startDate, 1));
    const handleNext = () => setStartDate(addWeeks(startDate, 1));
    const handleToday = () => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));

    const getBarPosition = (job: Job) => {
        const jobStart = new Date(job.start);
        const jobEnd = new Date(job.end);
        const diffDays = differenceInDays(startOfDay(jobStart), startOfDay(startDate));
        let durationDays = (jobEnd.getTime() - jobStart.getTime()) / (1000 * 60 * 60 * 24);
        if (durationDays < 0.1) durationDays = 0.1; 
        const left = diffDays * cellWidth;
        const width = durationDays * cellWidth;
        const padding = 4;
        return { 
            left: `${left + padding}px`, 
            width: `${Math.max(width - (padding * 2), 20)}px` 
        };
    };

    const getStatusColor = (status: JobStatus) => {
        switch (status) {
            case JobStatus.COMPLETED: return 'bg-emerald-500 border-emerald-600';
            case JobStatus.IN_PROGRESS: return 'bg-amber-500 border-amber-600';
            case JobStatus.SCHEDULED: return 'bg-blue-500 border-blue-600';
            case JobStatus.CANCELLED: return 'bg-red-400 border-red-500';
            default: return 'bg-slate-400 border-slate-500';
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-sm">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={handleToday} className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border-x border-slate-100 dark:border-slate-700">Today</button>
                        <button onClick={handleNext} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-slate-400" />
                        {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                    </h3>
                </div>
                <div className="flex gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Scheduled</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500"></div> In Progress</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Completed</span>
                </div>
            </div>
            <div className="flex-1 flex overflow-hidden relative">
                <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 z-20 flex flex-col shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                    <div className="h-[50px] border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center px-4 font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Job Details
                    </div>
                    <div className="overflow-hidden">
                        {jobs.map(job => {
                            const client = clients.find(c => c.id === job.clientId);
                            return (
                                <div key={job.id} className="h-[60px] border-b border-slate-100 dark:border-slate-700/50 px-4 flex flex-col justify-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate pr-2">{job.title}</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{client?.firstName} {client?.lastName}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="flex-1 overflow-auto custom-scrollbar bg-slate-50/30 dark:bg-slate-900/30" ref={scrollContainerRef}>
                    <div className="relative" style={{ width: `${days.length * cellWidth}px` }}>
                        <div className="flex sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-[50px]">
                            {days.map(day => {
                                const isTodayDate = isSameDay(day, new Date());
                                return (
                                    <div 
                                        key={day.toISOString()} 
                                        className={`flex-shrink-0 border-r border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center ${isTodayDate ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                                        style={{ width: `${cellWidth}px` }}
                                    >
                                        <span className={`text-[10px] font-bold uppercase ${isTodayDate ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                            {format(day, 'EEE')}
                                        </span>
                                        <span className={`text-sm font-bold ${isTodayDate ? 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 rounded-full' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 flex pointer-events-none">
                                {days.map(day => (
                                    <div 
                                        key={`grid-${day.toISOString()}`} 
                                        className={`flex-shrink-0 border-r border-slate-100 dark:border-slate-700/30 h-full ${isSameDay(day, new Date()) ? 'bg-blue-50/10 dark:bg-blue-900/5' : ''}`}
                                        style={{ width: `${cellWidth}px` }}
                                    />
                                ))}
                            </div>
                            {jobs.map(job => (
                                <div key={`row-${job.id}`} className="h-[60px] border-b border-slate-100 dark:border-slate-700/50 relative group hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                                    <Link 
                                        to={`/jobs/${job.id}`}
                                        className={`absolute top-3 h-9 rounded-md shadow-sm border text-white text-xs font-bold flex items-center px-2 truncate hover:brightness-110 hover:shadow-md transition-all z-10 ${getStatusColor(job.status)}`}
                                        style={getBarPosition(job)}
                                        title={`${job.title} (${format(new Date(job.start), 'MMM d, h:mm a')} - ${format(new Date(job.end), 'h:mm a')})`}
                                    >
                                        <span className="drop-shadow-md truncate">{format(new Date(job.start), 'h:mm a')}</span>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const JobsList: React.FC<JobsListProps> = ({ jobs, clients, onAddJob }) => {
  const store = useContext(StoreContext); 
  const users = store?.users || [];
  const currentUser = store?.currentUser;
  const isTechnician = currentUser?.role === UserRole.TECHNICIAN;

  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<JobFilter>('ALL');
  const [viewType, setViewType] = useState<ViewType>('TABLE');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'DATE', direction: 'desc' });
  
  const [formData, setFormData] = useState({
      clientId: '', title: '', description: '', date: '', time: '09:00',
      carYear: '', carMake: '', carModel: '', carColor: ''
  });

  const handleSortToggle = (key: SortKey) => {
    setSortConfig(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedJobs = useMemo(() => {
    const filtered = jobs.filter(job => {
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'ACTIVE') return job.status === JobStatus.SCHEDULED || job.status === JobStatus.IN_PROGRESS;
        if (activeFilter === 'DRAFTS') return job.status === JobStatus.DRAFT;
        if (activeFilter === 'COMPLETED') return job.status === JobStatus.COMPLETED;
        if (activeFilter === 'HIGH_PRIORITY') return job.priority === 'HIGH';
        return true;
    });

    return filtered.sort((a, b) => {
        const clientA = clients.find(c => c.id === a.clientId);
        const clientB = clients.find(c => c.id === b.clientId);
        const techA = users.find(u => u.id === a.assignedTechIds[0]);
        const techB = users.find(u => u.id === b.assignedTechIds[0]);
        
        const valueA = a.items.reduce((sum, i) => sum + i.total, 0);
        const valueB = b.items.reduce((sum, i) => sum + i.total, 0);

        let valA: any = '', valB: any = '';

        switch(sortConfig.key) {
            case 'JOB': valA = a.title.toLowerCase(); valB = b.title.toLowerCase(); break;
            case 'CLIENT': valA = `${clientA?.lastName} ${clientA?.firstName}`.toLowerCase(); valB = `${clientB?.lastName} ${clientB?.firstName}`.toLowerCase(); break;
            case 'VEHICLE': valA = `${a.vehicleDetails?.make} ${a.vehicleDetails?.model}`.toLowerCase(); valB = `${b.vehicleDetails?.make} ${b.vehicleDetails?.model}`.toLowerCase(); break;
            case 'STATUS': valA = a.status; valB = b.status; break;
            case 'TECH': valA = techA?.name || 'zzzz'; valB = techB?.name || 'zzzz'; break;
            case 'VALUE': valA = valueA; valB = valueB; break;
            case 'DATE': default: valA = new Date(a.start).getTime(); valB = new Date(b.start).getTime(); break;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [jobs, activeFilter, sortConfig, clients, users]);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
      case 'IN_PROGRESS': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
      case 'SCHEDULED': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
      case 'DRAFT': return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 border-dashed';
      default: return 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600';
    }
  };

  const handleSubmit = () => {
      if (!formData.clientId || !formData.title || !formData.date) {
          alert("Please fill in required fields");
          return;
      }

      const client = clients.find(c => c.id === formData.clientId);
      if (!client) return;

      const start = new Date(`${formData.date}T${formData.time}`);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

      const newJob: Job = {
          id: crypto.randomUUID(),
          clientId: client.id,
          propertyId: client.properties[0].id,
          assignedTechIds: [],
          title: formData.title,
          description: formData.description,
          start: start.toISOString(),
          end: end.toISOString(),
          status: JobStatus.SCHEDULED,
          pipelineStage: 'SCHEDULED',
          priority: 'MEDIUM',
          vehicleDetails: {
             year: formData.carYear || 'Unknown',
             make: formData.carMake || 'Vehicle',
             model: formData.carModel || '',
             color: formData.carColor || 'N/A',
             type: 'Sedan'
          },
          items: [],
          checklists: [
             { id: crypto.randomUUID(), label: 'Inspect Vehicle', isCompleted: false },
             { id: crypto.randomUUID(), label: 'Perform Service', isCompleted: false }
          ],
          photos: [],
          notes: ''
      };

      onAddJob(newJob);
      setIsModalOpen(false);
      setFormData({ 
        clientId: '', title: '', description: '', date: '', time: '09:00',
        carYear: '', carMake: '', carModel: '', carColor: ''
      });
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-3 h-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-1" /> : <ArrowDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400 ml-1" />;
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 shrink-0">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Jobs</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Schedule, track, and manage your detailing operations.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button onClick={() => setViewType('TABLE')} className={`p-2 rounded-md transition-all ${viewType === 'TABLE' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`} title="Table View"><TableIcon className="w-5 h-5" /></button>
                <button onClick={() => setViewType('GANTT')} className={`p-2 rounded-md transition-all ${viewType === 'GANTT' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`} title="Timeline View"><GanttChart className="w-5 h-5" /></button>
                <button onClick={() => setViewType('PIPELINE')} className={`p-2 rounded-md transition-all ${viewType === 'PIPELINE' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`} title="Pipeline View"><Layout className="w-5 h-5" /></button>
            </div>
            
            {!isTechnician && (
                <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-emerald-500/20">
                    <Plus className="w-4 h-4 mr-2" /> New Job
                </Button>
            )}
        </div>
      </div>

      {(viewType === 'TABLE' || viewType === 'GANTT') && (
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
                 {[
                    { id: 'ALL', label: 'All Jobs' },
                    { id: 'ACTIVE', label: 'Active' },
                    { id: 'DRAFTS', label: 'Drafts' },
                    { id: 'COMPLETED', label: 'Completed' },
                    { id: 'HIGH_PRIORITY', label: 'Priority', icon: AlertCircle }
                 ].map((filter) => (
                     <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id as JobFilter)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${activeFilter === filter.id ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
                     >
                         {filter.icon && <filter.icon className="w-3.5 h-3.5" />}
                         {filter.label}
                     </button>
                 ))}
             </div>
          </div>
      )}

      <div className="flex-1 min-h-0">
        {viewType === 'PIPELINE' ? (
            <Pipeline 
                jobs={jobs} 
                clients={clients} 
                users={store?.users || []}
                onUpdateStage={store?.updateJobStage || (() => {})} 
            />
        ) : viewType === 'GANTT' ? (
            <GanttView jobs={sortedJobs} clients={clients} />
        ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden h-full flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none" onClick={() => handleSortToggle('JOB')}><div className="flex items-center gap-2">Job Info <SortIcon columnKey="JOB" /></div></th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none" onClick={() => handleSortToggle('CLIENT')}><div className="flex items-center gap-2">Client <SortIcon columnKey="CLIENT" /></div></th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none" onClick={() => handleSortToggle('DATE')}><div className="flex items-center gap-2">Date & Time <SortIcon columnKey="DATE" /></div></th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none" onClick={() => handleSortToggle('VEHICLE')}><div className="flex items-center gap-2">Vehicle <SortIcon columnKey="VEHICLE" /></div></th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none" onClick={() => handleSortToggle('STATUS')}><div className="flex items-center gap-2">Status <SortIcon columnKey="STATUS" /></div></th>
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none" onClick={() => handleSortToggle('TECH')}><div className="flex items-center gap-2">Technician <SortIcon columnKey="TECH" /></div></th>
                                {!isTechnician && (
                                    <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group select-none" onClick={() => handleSortToggle('VALUE')}><div className="flex items-center justify-end gap-2">Value <SortIcon columnKey="VALUE" /></div></th>
                                )}
                                <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {sortedJobs.length === 0 ? (
                                <tr>
                                    <td colSpan={isTechnician ? 7 : 8} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                                        <Filter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p>No jobs found matching your filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                sortedJobs.map((job) => {
                                    const client = clients.find((c) => c.id === job.clientId);
                                    const tech = users.find(u => u.id === job.assignedTechIds[0]);
                                    const totalValue = job.items.reduce((acc, i) => acc + i.total, 0);
                                    const statusStyle = getStatusStyles(job.status);

                                    return (
                                        <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 dark:text-white">{job.title}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">#{job.id.slice(0, 8)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">{client?.firstName[0]}{client?.lastName[0]}</div>
                                                    <div>
                                                        <div className="text-sm font-medium text-slate-900 dark:text-white">{client?.firstName} {client?.lastName}</div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">{client?.properties.find(p => p.id === job.propertyId)?.address.city}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-900 dark:text-white">{new Date(job.start).toLocaleDateString()}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(job.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {job.vehicleDetails ? (
                                                    <div className="text-sm text-slate-700 dark:text-slate-300">{job.vehicleDetails.year} {job.vehicleDetails.make} {job.vehicleDetails.model}</div>
                                                ) : <span className="text-slate-400 italic text-xs">No vehicle info</span>}
                                            </td>
                                            <td className="px-6 py-4"><span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide whitespace-nowrap ${statusStyle}`}>{job.status.replace('_', ' ')}</span></td>
                                            <td className="px-6 py-4">
                                                {tech ? (
                                                    <div className="flex items-center gap-2">
                                                        <img src={tech.avatarUrl} alt={tech.name} className="w-6 h-6 rounded-full object-cover border border-slate-200 dark:border-slate-600" />
                                                        <span className="text-sm text-slate-700 dark:text-slate-300">{tech.name.split(' ')[0]}</span>
                                                    </div>
                                                ) : <span className="text-xs text-slate-400 italic">Unassigned</span>}
                                            </td>
                                            {!isTechnician && (
                                                <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">${totalValue.toLocaleString()}</td>
                                            )}
                                            <td className="px-6 py-4 text-right">
                                                <div className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg inline-flex transition-colors"><ChevronRight className="w-4 h-4" /></div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>

      {!isTechnician && (
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Job" footer={<><Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Create Job</Button></>}>
              {/* Form Content Omitted for brevity, logic updated */}
              <div className="space-y-5 p-1">
                  <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Client</label>
                      <select className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.clientId} onChange={(e) => setFormData(p => ({...p, clientId: e.target.value}))}>
                          <option value="">Select Client...</option>
                          {clients.map(c => (<option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>))}
                      </select>
                  </div>
                   <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Service Title</label><input placeholder="e.g. Full Interior Detail" value={formData.title} onChange={(e) => setFormData(p => ({...p, title: e.target.value}))} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Vehicle Details</h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Year</label><input placeholder="2023" value={formData.carYear} onChange={(e) => setFormData(p => ({...p, carYear: e.target.value}))} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Make</label><input placeholder="Toyota" value={formData.carMake} onChange={(e) => setFormData(p => ({...p, carMake: e.target.value}))} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Model</label><input placeholder="Camry" value={formData.carModel} onChange={(e) => setFormData(p => ({...p, carModel: e.target.value}))} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Color</label><input placeholder="Silver" value={formData.carColor} onChange={(e) => setFormData(p => ({...p, carColor: e.target.value}))} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                      </div>
                  </div>
                  <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label><textarea value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 h-24 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none" /></div>
                  <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Date</label><DatePicker value={formData.date} onChange={(val) => setFormData(p => ({...p, date: val}))} /></div>
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Time</label><TimePicker value={formData.time} onChange={(newTime) => setFormData(p => ({...p, time: newTime}))} /></div>
                    </div>
              </div>
          </Modal>
      )}
    </div>
  );
};