import React, { useContext, useState, useMemo } from 'react';
import { StoreContext } from '../store';
import { 
    Clock, Play, Square, MapPin, Briefcase, Calendar, 
    CheckCircle2, AlertTriangle, DollarSign, User as UserIcon,
    Plane, Coffee, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { TimeEntry, TimeEntryType, TimeEntryStatus, JobStatus, UserRole } from '../types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, subDays, differenceInMinutes } from 'date-fns';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

export const Timesheets: React.FC = () => {
  const store = useContext(StoreContext);
  const [activeTab, setActiveTab] = useState<'MY_TIME' | 'TEAM' | 'APPROVALS' | 'TIMEOFF'>('MY_TIME');
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isTimeOffModalOpen, setIsTimeOffModalOpen] = useState(false);

  if (!store) return null;
  const { currentUser, timeEntries, addTimeEntry, updateTimeEntry, approveTimeEntry, jobs, users } = store;

  const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.OFFICE;

  const currentEntry = timeEntries.find(e => e.userId === currentUser.id && !e.endTime);
  
  const handleClockInOut = () => {
      if (currentEntry) {
          updateTimeEntry({
              ...currentEntry,
              endTime: new Date().toISOString(),
              durationMinutes: differenceInMinutes(new Date(), new Date(currentEntry.startTime))
          });
      } else {
          const mockLocation = { lat: 33.5779, lng: -101.8552, address: 'Current Location' };
          addTimeEntry({
              id: crypto.randomUUID(),
              userId: currentUser.id,
              type: TimeEntryType.JOB,
              startTime: new Date().toISOString(),
              status: TimeEntryStatus.PENDING,
              gpsLocation: mockLocation,
              jobId: jobs.find(j => j.status === JobStatus.IN_PROGRESS)?.id
          });
      }
  };

  const weekDays = eachDayOfInterval({
      start: currentWeekStart,
      end: endOfWeek(currentWeekStart, { weekStartsOn: 1 })
  });

  const getEntriesForDay = (userId: string, date: Date) => {
      return timeEntries.filter(e => e.userId === userId && isSameDay(new Date(e.startTime), date));
  };

  const calculateDailyTotal = (entries: TimeEntry[]) => {
      return entries.reduce((acc, e) => {
          if (!e.endTime) return acc;
          return acc + (e.durationMinutes || 0);
      }, 0);
  };

  const calculateWeeklyPayroll = (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return { regular: 0, overtime: 0, gross: 0, label: 'N/A' };

      const start = currentWeekStart;
      const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

      if (user.payrollType === 'COMMISSION') {
          const completedJobs = jobs.filter(j => {
              const jobDate = new Date(j.end);
              return j.assignedTechIds.includes(userId) && j.status === JobStatus.COMPLETED && jobDate >= start && jobDate <= end;
          });
          const totalRevenue = completedJobs.reduce((sum, j) => sum + j.items.reduce((s, i) => s + i.total, 0), 0);
          const gross = totalRevenue * (user.payRate / 100);
          return { regular: completedJobs.length, overtime: 0, gross, label: 'Jobs' };
      } 
      else if (user.payrollType === 'DAILY_RATE') {
          const daysWorked = weekDays.filter(day => getEntriesForDay(userId, day).length > 0).length;
          return { regular: daysWorked, overtime: 0, gross: daysWorked * user.payRate, label: 'Days' };
      } 
      else {
          const userEntries = timeEntries.filter(e => {
              const d = new Date(e.startTime);
              return e.userId === userId && d >= start && d <= end;
          });
          const totalMinutes = userEntries.reduce((acc, e) => acc + (e.durationMinutes || 0), 0);
          const regularHours = Math.min(totalMinutes / 60, 40);
          const overtimeHours = Math.max((totalMinutes / 60) - 40, 0);
          const gross = (regularHours * user.payRate) + (overtimeHours * user.payRate * 1.5);
          return { regular: regularHours, overtime: overtimeHours, gross, label: 'Hours' };
      }
  };

  const myPayroll = calculateWeeklyPayroll(currentUser.id);

  if (!currentUser.enableTimesheets && currentUser.role === 'TECHNICIAN') {
      return (
          <div className="max-w-7xl mx-auto py-20 text-center text-slate-500 dark:text-slate-400">
              <Clock className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Timesheets Disabled</h2>
              <p>Your administrator has disabled timesheets for your account.</p>
          </div>
      );
  }

  const availableTabs = [
      { id: 'MY_TIME', label: 'My Timesheet' },
      ...(isAdmin ? [{ id: 'TEAM', label: 'Team Grid' }, { id: 'APPROVALS', label: 'Approvals' }] : []),
      { id: 'TIMEOFF', label: 'Time Off' }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-10">
        {/* UI Elements - Clock Widget etc. */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
            <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Timesheets</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Track time, manage approvals, and process payroll.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-6 min-w-[320px]">
                <button onClick={handleClockInOut} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${currentEntry ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'}`}>
                    {currentEntry ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                </button>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Status</p>
                    <h3 className={`text-xl font-bold ${currentEntry ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-white'}`}>{currentEntry ? 'Clocked In' : 'Clocked Out'}</h3>
                    {currentEntry && (<div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1"><Clock className="w-3 h-3" /><span>Since {format(new Date(currentEntry.startTime), 'h:mm a')}</span></div>)}
                </div>
                {currentEntry && (<div className="ml-auto text-center"><div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-1 mx-auto"><MapPin className="w-4 h-4" /></div><span className="text-[10px] text-slate-400 font-bold">GPS ON</span></div>)}
            </div>
        </div>
        {/* ... Rest of UI ... */}
    </div>
  );
};