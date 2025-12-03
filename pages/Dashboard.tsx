
import React, { useMemo, useContext } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  CircleDollarSign, 
  CheckCircle, 
  Users, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  ChevronRight,
  FileText,
  Briefcase,
  Bell,
  Activity
} from 'lucide-react';
import { Job, Invoice, Quote, User, JobStatus, InvoiceStatus, QuoteStatus, UserRole } from '../types';
import { isSameDay, isAfter, isBefore, parseISO, formatDistanceToNow, subDays, format, startOfDay, endOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
import { StoreContext } from '../store';

interface DashboardProps {
  jobs: Job[];
  invoices: Invoice[];
  quotes: Quote[];
  users: User[];
}

export const Dashboard: React.FC<DashboardProps> = ({ jobs, invoices, quotes, users }) => {
  const store = useContext(StoreContext);
  const currentUser = store?.currentUser;
  const today = new Date();

  // --- ROLE CHECK ---
  const isTechnician = currentUser?.role === UserRole.TECHNICIAN;

  // --- DYNAMIC DATA (Last 7 Days Revenue) - Admin Only ---
  const revenueChartData = useMemo(() => {
      if (isTechnician) return [];
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = subDays(today, 6 - i);
          return d;
      });

      return last7Days.map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          
          // Calculate revenue from paid invoices on this day
          const dailyRevenue = invoices
              .filter(inv => {
                   if (inv.status !== InvoiceStatus.PAID) return false;
                   // Use payment date if available, otherwise issued date
                   const dateToCheck = inv.payments.length > 0 ? parseISO(inv.payments[0].date) : parseISO(inv.issuedDate);
                   return dateToCheck >= dayStart && dateToCheck <= dayEnd;
              })
              .reduce((sum, inv) => sum + inv.total, 0);

          return {
              name: format(day, 'EEE'), // Mon, Tue, etc.
              revenue: dailyRevenue
          };
      });
  }, [invoices, today, isTechnician]);

  // Calculate total revenue (for the header) - All time paid
  const totalRevenue = useMemo(() => invoices.filter(i => i.status === InvoiceStatus.PAID).reduce((acc, i) => acc + i.total, 0), [invoices]);

  // --- TECHNICIAN VIEW LOGIC ---
  if (isTechnician && currentUser) {
      const myJobsToday = jobs
        .filter(j => j.assignedTechIds.includes(currentUser.id) && isSameDay(parseISO(j.start), today))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      
      const currentJob = jobs.find(j => j.assignedTechIds.includes(currentUser.id) && j.status === JobStatus.IN_PROGRESS);
      const nextJob = myJobsToday.find(j => j.status === JobStatus.SCHEDULED);

      return (
          <div className="space-y-6 max-w-3xl mx-auto pb-10">
              <div className="mb-6">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Hello, {currentUser.name.split(' ')[0]}</h1>
                  <p className="text-slate-500 dark:text-slate-400">Here is your schedule for {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.</p>
              </div>

              {/* Current Job Card */}
              {currentJob ? (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border-l-4 border-l-amber-500 shadow-md overflow-hidden">
                      <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full uppercase tracking-wide">In Progress</span>
                                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{currentJob.title}</h2>
                              </div>
                              <Link to={`/jobs/${currentJob.id}`} className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors">
                                  View Job
                              </Link>
                          </div>
                          <div className="space-y-3">
                              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                  <Clock className="w-5 h-5 text-slate-400" />
                                  <span>Started at {format(parseISO(currentJob.start), 'h:mm a')}</span>
                              </div>
                              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                  <MapPin className="w-5 h-5 text-slate-400" />
                                  <span>{store?.clients.find(c => c.id === currentJob.clientId)?.properties.find(p => p.id === currentJob.propertyId)?.address.street}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                          <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                          <h3 className="font-bold text-slate-900 dark:text-white">You are currently available.</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">{nextJob ? `Next job starts at ${format(parseISO(nextJob.start), 'h:mm a')}` : 'No active jobs right now.'}</p>
                      </div>
                  </div>
              )}

              {/* Upcoming Jobs List */}
              <div className="space-y-4">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Today's Agenda</h3>
                  {myJobsToday.length === 0 ? (
                      <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
                          <p className="text-slate-500 dark:text-slate-400">No jobs scheduled for today.</p>
                      </div>
                  ) : (
                      myJobsToday.map(job => (
                          <Link to={`/jobs/${job.id}`} key={job.id} className="block bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors">
                              <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                      {format(parseISO(job.start), 'h:mm a')} - {format(parseISO(job.end), 'h:mm a')}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                      {job.status.replace('_', ' ')}
                                  </span>
                              </div>
                              <h4 className="font-bold text-slate-900 dark:text-white text-lg">{job.title}</h4>
                              <p className="text-slate-500 dark:text-slate-400 text-sm truncate">{store?.clients.find(c => c.id === job.clientId)?.properties[0].address.street}</p>
                          </Link>
                      ))
                  )}
              </div>
          </div>
      );
  }

  // --- ADMIN/OFFICE VIEW ---
  const overdueInvoices = invoices.filter(i => i.status === InvoiceStatus.OVERDUE);
  const unassignedJobs = jobs.filter(j => j.assignedTechIds.length === 0 && j.status !== JobStatus.COMPLETED && j.status !== JobStatus.CANCELLED);
  const pendingQuotes = quotes.filter(q => q.status === QuoteStatus.SENT);
  const todaysJobs = jobs
    .filter(j => isSameDay(parseISO(j.start), today))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const technicians = users.filter(u => u.role === 'TECHNICIAN');
  
  const getTechStatus = (techId: string) => {
    const currentJob = jobs.find(j => 
      j.assignedTechIds.includes(techId) && 
      j.status === JobStatus.IN_PROGRESS
    );
    if (currentJob) return { status: 'Busy', job: currentJob };
    const scheduledNow = jobs.find(j => 
      j.assignedTechIds.includes(techId) &&
      isBefore(parseISO(j.start), today) &&
      isAfter(parseISO(j.end), today)
    );
    if (scheduledNow) return { status: 'Scheduled', job: scheduledNow };
    return { status: 'Available', job: null };
  };

  const quoteStats = [
    { name: 'Draft', value: quotes.filter(q => q.status === QuoteStatus.DRAFT).length, color: '#94a3b8' },
    { name: 'Sent', value: quotes.filter(q => q.status === QuoteStatus.SENT).length, color: '#3b82f6' },
    { name: 'Approved', value: quotes.filter(q => q.status === QuoteStatus.APPROVED).length, color: '#10b981' },
  ];

  const activities = [
    ...jobs.filter(j => j.status === JobStatus.COMPLETED).map(j => ({ type: 'JOB_COMPLETE', date: j.end, data: j })),
    ...invoices.filter(i => i.status === InvoiceStatus.PAID).map(i => ({ type: 'PAYMENT', date: i.payments[0]?.date || i.issuedDate, data: i })),
    ...quotes.filter(q => q.status === QuoteStatus.SENT).map(q => ({ type: 'QUOTE_SENT', date: q.issuedDate, data: q }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Operational overview for {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
             <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <CircleDollarSign className="w-5 h-5" />
             </div>
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Total Revenue</p>
                <p className="font-bold text-slate-900 dark:text-white text-lg">${totalRevenue.toLocaleString()}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (Main Operations) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* FEATURE 1: ACTION CENTER */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Link to="/invoices?status=OVERDUE" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-500"></div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
                   <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-red-600 transition-colors">{overdueInvoices.length}</p>
                   <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Overdue Invoices</p>
                </div>
             </Link>

             <Link to="/schedule" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden">
                 <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
                   <Briefcase className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">{unassignedJobs.length}</p>
                   <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Unassigned Jobs</p>
                </div>
             </Link>

             <Link to="/quotes?status=SENT" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                   <FileText className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{pendingQuotes.length}</p>
                   <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Pending Quotes</p>
                </div>
             </Link>
          </div>

          {/* FEATURE 2: TODAY'S AGENDA */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                Today's Agenda
              </h3>
              <Link to="/schedule" className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center">
                View Schedule <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {todaysJobs.length === 0 ? (
                 <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No jobs scheduled for today.
                 </div>
              ) : (
                todaysJobs.slice(0, 5).map(job => (
                  <Link to={`/jobs/${job.id}`} key={job.id} className="p-4 flex items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors block">
                    <div className="w-20 shrink-0 flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-700 pr-4 mr-4">
                       <span className="text-xs font-bold text-slate-400 uppercase">{new Date(job.start).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}</span>
                       <span className="text-[10px] text-slate-400">TO</span>
                       <span className="text-xs font-bold text-slate-400 uppercase">{new Date(job.end).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{job.title}</h4>
                        <div className="flex items-center gap-4 mt-1">
                           <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                               <MapPin className="w-3 h-3" />
                               Location ID: {job.propertyId.slice(0, 6)}...
                           </div>
                           {job.priority === 'HIGH' && (
                               <span className="text-[10px] font-bold bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">HIGH PRIORITY</span>
                           )}
                        </div>
                    </div>
                    <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide
                            ${job.status === JobStatus.COMPLETED ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 
                              job.status === JobStatus.IN_PROGRESS ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' : 
                              'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800'}`}>
                            {job.status.replace('_', ' ')}
                        </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

           {/* Revenue Chart */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Revenue Trend (Last 7 Days)</h3>
              <div className="w-full min-w-0" style={{ height: 256 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `$${val}`} />
                    <Tooltip 
                        contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        itemStyle={{color: '#1e293b'}}
                        formatter={(value) => [`$${value}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

        </div>

        {/* RIGHT COLUMN (Status & Analytics) */}
        <div className="space-y-6">
          
          {/* FEATURE 3: LIVE TEAM STATUS */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
             <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Live Team Status
                </h3>
             </div>
             <div className="p-2">
                {technicians.map(tech => {
                    const { status, job } = getTechStatus(tech.id);
                    const isBusy = status === 'Busy';
                    const isScheduled = status === 'Scheduled';
                    
                    return (
                        <Link 
                          to={`/team/${tech.id}`} 
                          key={tech.id} 
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors cursor-pointer block group"
                        >
                            <div className="relative">
                                <img src={tech.avatarUrl} alt={tech.name} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600 group-hover:border-emerald-400 transition-colors" />
                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${isBusy ? 'bg-amber-500' : isScheduled ? 'bg-blue-400' : 'bg-emerald-500'}`}></div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{tech.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {isBusy ? `On Job: ${job?.title}` : isScheduled ? 'Starting soon' : 'Available'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {isBusy && <Activity className="w-4 h-4 text-amber-500 animate-pulse" />}
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                            </div>
                        </Link>
                    );
                })}
             </div>
          </div>

          {/* FEATURE 4: SALES PIPELINE */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Quote Pipeline</h3>
              <div className="w-full min-w-0 relative" style={{ height: 192 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={quoteStats}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {quoteStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">{quotes.length}</span>
                      <span className="text-xs text-slate-400 uppercase font-bold">Total Quotes</span>
                  </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                  {quoteStats.map(stat => (
                      <Link 
                        to={`/quotes?status=${stat.name.toUpperCase()}`}
                        key={stat.name} 
                        className="text-center p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                      >
                          <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: stat.color }}></div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.name}</p>
                          <p className="font-bold text-slate-900 dark:text-white">{stat.value}</p>
                      </Link>
                  ))}
              </div>
          </div>

          {/* FEATURE 5: RECENT ACTIVITY */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500" />
                    Activity Feed
                </h3>
             </div>
             <div className="p-3 space-y-2">
                 {activities.map((act, idx) => {
                     let icon, color, title, desc, linkTo;
                     if (act.type === 'JOB_COMPLETE') {
                         icon = CheckCircle; color = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800';
                         title = 'Job Completed'; desc = (act.data as Job).title;
                         linkTo = `/jobs/${(act.data as Job).id}`;
                     } else if (act.type === 'PAYMENT') {
                         icon = CircleDollarSign; color = 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800';
                         title = 'Payment Received'; desc = `Invoice #${(act.data as Invoice).id}`;
                         linkTo = '/invoices';
                     } else {
                         icon = FileText; color = 'text-slate-500 bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600';
                         title = 'Quote Sent'; desc = `Quote #${(act.data as Quote).id}`;
                         linkTo = '/quotes';
                     }
                     const Icon = icon;

                     return (
                        <Link 
                          to={linkTo} 
                          key={idx} 
                          className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-md transition-all group hover:-translate-y-0.5"
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${color}`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{title}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{desc}</p>
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-md">
                                {formatDistanceToNow(new Date(act.date), { addSuffix: true })}
                            </div>
                        </Link>
                     );
                 })}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
