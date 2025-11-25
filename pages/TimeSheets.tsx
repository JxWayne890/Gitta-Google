
import React, { useContext, useMemo, useState } from 'react';
import { StoreContext } from '../store';
import { 
    Clock, Play, Square, MapPin, AlertCircle, CheckCircle2, 
    FileText, Download, ChevronLeft, ChevronRight, Calendar,
    DollarSign, Briefcase, XCircle, Coffee, Car, Users
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addDays, eachDayOfInterval, isSameDay, differenceInMinutes } from 'date-fns';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { TimeEntry, TimeEntryType, TimeSheetStatus, UserRole } from '../types';

// --- SUB-COMPONENTS ---

const StatCard: React.FC<{ label: string; value: string; subtext?: string; icon: any; color: string }> = ({ label, value, subtext, icon: Icon, color }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-start mb-3">
            <div className={`p-2 rounded-lg ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{value}</h3>
        {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
    </div>
);

export const TimeSheets: React.FC = () => {
    const store = useContext(StoreContext);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedUserId, setSelectedUserId] = useState<string>(store?.currentUser.role === UserRole.ADMIN ? 'ALL' : store?.currentUser.id || '');
    
    // Manual Entry Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        userId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        type: TimeEntryType.WORK,
        jobId: ''
    });

    if (!store) return null;
    const { timeEntries, users, currentUser, jobs, clockIn, clockOut, updateTimeSheetStatus, addTimeEntry } = store;

    const isAdmin = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.OFFICE;
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    // --- 1. CALCULATIONS & FILTERING ---

    const filteredEntries = useMemo(() => {
        return timeEntries.filter(entry => {
            const entryDate = new Date(entry.start);
            const matchesWeek = entryDate >= weekStart && entryDate <= weekEnd;
            const matchesUser = selectedUserId === 'ALL' ? true : entry.userId === selectedUserId;
            return matchesWeek && matchesUser;
        });
    }, [timeEntries, weekStart, weekEnd, selectedUserId]);

    // --- FEATURE 4 & 7: SUMMARY STATS & OVERTIME ---
    const stats = useMemo(() => {
        let totalMins = 0;
        let workMins = 0;
        let overtimeMins = 0;
        let grossPay = 0;

        const userTotals: Record<string, number> = {};

        filteredEntries.forEach(entry => {
            if (entry.type === TimeEntryType.WORK && entry.durationMinutes) {
                totalMins += entry.durationMinutes;
                workMins += entry.durationMinutes;
                userTotals[entry.userId] = (userTotals[entry.userId] || 0) + entry.durationMinutes;
                
                // Cost Calculation
                const user = users.find(u => u.id === entry.userId);
                if (user?.hourlyRate) {
                    // Very simplified overtime (over 40h/week handled loosely here, ideally needs per-user weekly agg)
                    grossPay += (entry.durationMinutes / 60) * user.hourlyRate;
                }
            }
        });

        // Simple Overtime Logic (Flagging users > 40h)
        Object.values(userTotals).forEach(mins => {
            if (mins > 2400) overtimeMins += (mins - 2400);
        });

        return {
            totalHours: (totalMins / 60).toFixed(1),
            overtimeHours: (overtimeMins / 60).toFixed(1),
            estCost: grossPay,
            activeCount: timeEntries.filter(e => !e.end && (selectedUserId === 'ALL' || e.userId === selectedUserId)).length
        };
    }, [filteredEntries, timeEntries, users, selectedUserId]);

    // --- HANDLERS ---

    const handleClockAction = () => {
        const activeEntry = timeEntries.find(e => e.userId === currentUser.id && !e.end);
        
        if (activeEntry) {
            // Clock Out
            clockOut(currentUser.id, activeEntry.id);
        } else {
            // Clock In (Feature 3: Mock Location)
            clockIn(currentUser.id, TimeEntryType.WORK, undefined, { lat: 33.5779, lng: -101.8552, address: 'HQ / Mobile' });
        }
    };

    const handleManualSubmit = () => {
        const start = new Date(`${formData.date}T${formData.startTime}:00`).toISOString();
        const end = new Date(`${formData.date}T${formData.endTime}:00`);
        const duration = Math.round((end.getTime() - new Date(start).getTime()) / 60000);

        const newEntry: TimeEntry = {
            id: `manual-${Date.now()}`,
            userId: formData.userId || currentUser.id,
            type: formData.type,
            start,
            end: end.toISOString(),
            durationMinutes: duration,
            jobId: formData.jobId || undefined,
            status: TimeSheetStatus.DRAFT
        };
        
        addTimeEntry(newEntry);
        setIsModalOpen(false);
    };

    const handleApproveAll = () => {
        const ids = filteredEntries.filter(e => e.status === TimeSheetStatus.SUBMITTED || e.status === TimeSheetStatus.DRAFT).map(e => e.id);
        updateTimeSheetStatus(ids, TimeSheetStatus.APPROVED);
    };

    // Helper for Status Colors
    const getStatusBadge = (status: TimeSheetStatus) => {
        const styles = {
            APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            SUBMITTED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            DRAFT: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${styles[status]}`}>
                {status}
            </span>
        );
    };

    const getActiveSession = () => {
        const entry = timeEntries.find(e => e.userId === currentUser.id && !e.end);
        if (!entry) return null;
        const start = new Date(entry.start);
        const diff = Math.floor((new Date().getTime() - start.getTime()) / 60000); // minutes
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return { entry, duration: `${hours}h ${mins}m` };
    };

    const activeSession = getActiveSession();

    return (
        <div className="max-w-7xl mx-auto pb-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Time Sheets</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Track hours, approvals, and payroll estimation.</p>
                </div>
                
                <div className="flex gap-3">
                    {/* FEATURE 1: CLOCK IN/OUT BUTTON */}
                    <button
                        onClick={handleClockAction}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
                            activeSession 
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                        }`}
                    >
                        {activeSession ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                        {activeSession ? `Stop (${activeSession.duration})` : 'Clock In'}
                    </button>
                    
                    {isAdmin && (
                        <Button variant="outline" onClick={() => setIsModalOpen(true)} className="bg-white dark:bg-slate-800">
                            <FileText className="w-4 h-4 mr-2" /> Add Entry
                        </Button>
                    )}
                </div>
            </div>

            {/* FEATURE 4 & 7: STATS SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard 
                    label="Total Hours" 
                    value={`${stats.totalHours}h`} 
                    subtext="This Week"
                    icon={Clock}
                    color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                />
                <StatCard 
                    label="Overtime" 
                    value={`${stats.overtimeHours}h`}
                    subtext="> 40h Threshold"
                    icon={AlertCircle}
                    color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                />
                {isAdmin && (
                    <StatCard 
                        label="Est. Cost" 
                        value={`$${stats.estCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                        subtext="Based on rates"
                        icon={DollarSign}
                        color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    />
                )}
                <StatCard 
                    label="Active Now" 
                    value={stats.activeCount.toString()}
                    subtext="Staff Clocked In"
                    icon={Users} 
                    color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                />
            </div>

            {/* Main Control Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                        <button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-md transition-colors">
                            <ChevronLeft className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                        </button>
                        <span className="px-4 text-sm font-bold text-slate-700 dark:text-slate-300 min-w-[140px] text-center">
                            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
                        </span>
                        <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-md transition-colors">
                            <ChevronRight className="w-5 h-5 text-slate-500 dark:text-slate-300" />
                        </button>
                    </div>
                    
                    {isAdmin && (
                        <select 
                            className="bg-slate-100 dark:bg-slate-700 border-transparent rounded-lg py-2 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                        >
                            <option value="ALL">All Team Members</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    )}
                </div>

                {isAdmin && (
                    <div className="flex gap-2">
                        {/* FEATURE 5: APPROVAL WORKFLOW */}
                        <Button onClick={handleApproveAll} variant="outline" className="text-emerald-600 hover:bg-emerald-50 border-emerald-200 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Visible
                        </Button>
                        <Button variant="secondary">
                            <Download className="w-4 h-4 mr-2" /> Export CSV
                        </Button>
                    </div>
                )}
            </div>

            {/* FEATURE 6: WEEKLY VISUAL GRID */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                    <div className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Employee</div>
                    {weekDays.map(day => (
                        <div key={day.toString()} className="p-4 text-center border-l border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{format(day, 'EEE')}</p>
                            <p className={`text-sm font-bold mt-1 ${isSameDay(day, new Date()) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                {format(day, 'd')}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {(selectedUserId === 'ALL' ? users : users.filter(u => u.id === selectedUserId)).map(user => {
                        // Calculate hours per day for this user
                        const daysHours = weekDays.map(day => {
                            const dayEntries = filteredEntries.filter(e => e.userId === user.id && isSameDay(new Date(e.start), day));
                            const totalMins = dayEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);
                            return totalMins / 60;
                        });
                        const totalWeekHours = daysHours.reduce((a, b) => a + b, 0);

                        return (
                            <div key={user.id} className="grid grid-cols-8 group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <div className="p-4 flex flex-col justify-center">
                                    <div className="flex items-center gap-3">
                                        <img src={user.avatarUrl} className="w-8 h-8 rounded-full" alt="" />
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[100px]">{user.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{totalWeekHours.toFixed(1)} hrs</p>
                                        </div>
                                    </div>
                                </div>
                                {daysHours.map((hours, idx) => (
                                    <div key={idx} className="border-l border-slate-100 dark:border-slate-700 p-2 flex items-center justify-center relative">
                                        {hours > 0 ? (
                                            <div className={`w-full py-2 rounded-lg text-center text-xs font-bold ${hours > 8 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                                                {hours.toFixed(1)}
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* DETAILED ENTRIES LIST */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-slate-900 dark:text-white">Detailed Logs</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Employee</th>
                                <th className="px-6 py-3">Type / Job</th>
                                <th className="px-6 py-3">Time</th>
                                <th className="px-6 py-3">Duration</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Location</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400">No entries found for this period.</td>
                                </tr>
                            ) : (
                                filteredEntries.map(entry => {
                                    const user = users.find(u => u.id === entry.userId);
                                    const job = jobs.find(j => j.id === entry.jobId);
                                    
                                    return (
                                        <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                                                {format(new Date(entry.start), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold">
                                                        {user?.name.charAt(0)}
                                                    </div>
                                                    <span className="text-slate-700 dark:text-slate-300">{user?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {/* FEATURE 2: JOB COSTING/LINKING */}
                                                <div className="flex items-center gap-2">
                                                    {entry.type === TimeEntryType.WORK ? <Briefcase className="w-4 h-4 text-blue-500" /> : entry.type === TimeEntryType.TRAVEL ? <Car className="w-4 h-4 text-amber-500" /> : <Coffee className="w-4 h-4 text-slate-400" />}
                                                    <span className="capitalize">{entry.type.toLowerCase()}</span>
                                                    {job && (
                                                        <span className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                                                            {job.title}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                                                {format(new Date(entry.start), 'h:mm a')} - {entry.end ? format(new Date(entry.end), 'h:mm a') : 'Active'}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                                {entry.durationMinutes ? `${(entry.durationMinutes/60).toFixed(2)}h` : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(entry.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {/* FEATURE 3: GPS LOCATION */}
                                                {entry.location ? (
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400" title={`${entry.location.lat}, ${entry.location.lng}`}>
                                                        <MapPin className="w-3 h-3 text-red-500" />
                                                        <span className="truncate max-w-[100px]">{entry.location.address || 'GPS Tagged'}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 text-xs italic">No Loc</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Manual Entry Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Time Entry">
                <div className="space-y-4 p-2">
                    {isAdmin && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Employee</label>
                            <select 
                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2"
                                value={formData.userId}
                                onChange={(e) => setFormData({...formData, userId: e.target.value})}
                            >
                                <option value="">Select User...</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                            <input type="date" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                            <select className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as TimeEntryType})}>
                                <option value={TimeEntryType.WORK}>Work</option>
                                <option value={TimeEntryType.TRAVEL}>Travel</option>
                                <option value={TimeEntryType.BREAK}>Break</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                            <input type="time" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                            <input type="time" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Job Link (Optional)</label>
                        <select className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-2" value={formData.jobId} onChange={e => setFormData({...formData, jobId: e.target.value})}>
                            <option value="">None</option>
                            {jobs.filter(j => j.status === 'IN_PROGRESS' || j.status === 'SCHEDULED').map(j => (
                                <option key={j.id} value={j.id}>{j.title}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleManualSubmit}>Save Entry</Button>
                </div>
            </Modal>
        </div>
    );
};
