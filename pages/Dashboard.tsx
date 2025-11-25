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
  Pie,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { 
  CircleDollarSign, CheckCircle, Users, Clock, ArrowUpRight, AlertTriangle, 
  Calendar, MapPin, ChevronRight, FileText, Briefcase, Bell, Activity,
  Star, Zap, Truck, Box, Navigation, Phone, MessageSquare,
  Target, TrendingUp, Award, Smartphone, AlertCircle
} from 'lucide-react';
import { Job, Invoice, Quote, User, JobStatus, InvoiceStatus, QuoteStatus, UserRole } from '../types';
import { isSameDay, isAfter, isBefore, formatDistanceToNow, addDays, format, endOfDay, differenceInMinutes, endOfMonth, isSameMonth } from 'date-fns';
import { Link } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';

interface DashboardProps {
  jobs: Job[];
  invoices: Invoice[];
  quotes: Quote[];
  users: User[];
}

// Helpers to replace missing date-fns exports
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

// --- ADMIN DASHBOARD (Enhanced) ---
const AdminDashboard: React.FC<DashboardProps> = ({ jobs, invoices, quotes, users }) => {
  const store = useContext(StoreContext);
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);

  // --- EXISTING DATA PREP ---
  const overdueInvoices = invoices.filter(i => i.status === InvoiceStatus.OVERDUE);
  const unassignedJobs = jobs.filter(j => (j.assignedTechIds || []).length === 0 && j.status !== JobStatus.COMPLETED && j.status !== JobStatus.CANCELLED);
  const pendingQuotes = quotes.filter(q => q.status === QuoteStatus.SENT);
  
  const todaysJobs = jobs
    .filter(j => isSameDay(new Date(j.scheduledStart), today))
    .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());

  const technicians = users.filter(u => u.role === 'TECHNICIAN');
  
  // --- NEW FEATURE 1: MONTHLY REVENUE GOAL ---
  const monthlyRevenue = invoices
    .filter(i => i.status === InvoiceStatus.PAID && isSameMonth(new Date(i.createdAt), today))
    .reduce((acc, i) => acc + i.total, 0);
  const monthlyTarget = 75000; // Mock Target
  const goalProgress = Math.min(100, (monthlyRevenue / monthlyTarget) * 100);

  // --- NEW FEATURE 2: AVERAGE TICKET PRICE ---
  const paidInvoicesCount = invoices.filter(i => i.status === InvoiceStatus.PAID).length;
  const totalLifetimeRevenue = invoices.filter(i => i.status === InvoiceStatus.PAID).reduce((acc, i) => acc + i.total, 0);
  const avgTicket = paidInvoicesCount > 0 ? totalLifetimeRevenue / paidInvoicesCount : 0;

  // --- NEW FEATURE 3: INVENTORY HEALTH ---
  const inventoryProducts = store?.inventoryProducts || [];
  const inventoryRecords = store?.inventoryRecords || [];
  
  const inventoryAlerts = inventoryProducts.filter(p => {
      const currentStock = inventoryRecords.filter(r => r.productId === p.id).reduce((acc, r) => acc + r.quantity, 0);
      return currentStock <= p.minStock;
  }) || [];

  // --- NEW FEATURE 4: FLEET UTILIZATION ---
  const activeVehicles = new Set(
      jobs.filter(j => j.status === JobStatus.IN_PROGRESS)
          .flatMap(j => j.assignedTechIds || [])
  ).size;
  const totalVehicles = (store?.warehouses || []).filter(w => w.type === 'VEHICLE').length || 4;

  // --- NEW FEATURE 5: SERVICE MIX BREAKDOWN ---
  const serviceMixData = useMemo(() => {
      const counts: Record<string, number> = {};
      jobs.forEach(j => {
          // Simple heuristic based on title
          let type = 'General';
          if (j.title.toLowerCase().includes('detail')) type = 'Detailing';
          else if (j.title.toLowerCase().includes('wash')) type = 'Wash';
          else if (j.title.toLowerCase().includes('coating')) type = 'Coating';
          else if (j.title.toLowerCase().includes('repair') || j.title.toLowerCase().includes('restoration')) type = 'Repair';
          
          counts[type] = (counts[type] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [jobs]);
  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];

  // --- NEW FEATURE 6: TOP PERFORMER ---
  const topPerformer = useMemo(() => {
      const techRevenue: Record<string, number> = {};
      jobs.filter(j => j.status === JobStatus.COMPLETED && isSameMonth(new Date(j.scheduledEnd), today)).forEach(j => {
          // Fallback if items not on job
          const val = (j.items || []).reduce((s, i) => s + (i.total || 0), 0); 
          (j.assignedTechIds || []).forEach(id => techRevenue[id] = (techRevenue[id] || 0) + val);
      });
      const topId = Object.keys(techRevenue).sort((a, b) => techRevenue[b] - techRevenue[a])[0];
      return users.find(u => u.id === topId);
  }, [jobs, users]);

  // --- NEW FEATURE 7: MARKETING ROI ---
  const marketingRevenue = (store?.marketingAutomations || []).reduce((sum, a) => sum + a.stats.revenue, 0) || 0;

  // --- NEW FEATURE 8: ACCOUNTS RECEIVABLE AGING ---
  const arAgingData = useMemo(() => {
      const aging = { '1-30': 0, '31-60': 0, '60+': 0 };
      overdueInvoices.forEach(inv => {
          const days = differenceInMinutes(new Date(), new Date(inv.dueDate || inv.createdAt)) / (60 * 24);
          // Calculate balance due manually as it's not in standard type usually
          const balanceDue = inv.total - (inv.amountPaid || 0);
          
          if (days <= 30) aging['1-30'] += balanceDue;
          else if (days <= 60) aging['31-60'] += balanceDue;
          else aging['60+'] += balanceDue;
      });
      return Object.entries(aging).map(([name, value]) => ({ name, value }));
  }, [overdueInvoices]);

  // --- CHART DATA (Existing) ---
  const revenueChartData = useMemo(() => {
      const last7Days = Array.from({ length: 7 }).map((_, i) => addDays(today, -(6 - i)));
      return last7Days.map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          const dailyRevenue = invoices
              .filter(inv => {
                   if (inv.status !== InvoiceStatus.PAID) return false;
                   // Use safe payment access or createdAt
                   const dateToCheck = (inv.payments && inv.payments.length > 0) ? new Date(inv.payments[0].date) : new Date(inv.createdAt);
                   return dateToCheck >= dayStart && dateToCheck <= dayEnd;
              })
              .reduce((sum, inv) => sum + inv.total, 0);
          return { name: format(day, 'EEE'), revenue: dailyRevenue };
      });
  }, [invoices, today]);

  const quoteStats = [
    { name: 'Draft', value: quotes.filter(q => q.status === QuoteStatus.DRAFT).length, color: '#94a3b8' },
    { name: 'Sent', value: quotes.filter(q => q.status === QuoteStatus.SENT).length, color: '#3b82f6' },
    { name: 'Approved', value: quotes.filter(q => q.status === QuoteStatus.APPROVED).length, color: '#10b981' },
  ];

  // Helper for Tech Status
  const getTechStatus = (techId: string) => {
    const currentJob = jobs.find(j => 
      (j.assignedTechIds || []).includes(techId) && 
      j.status === JobStatus.IN_PROGRESS
    );
    if (currentJob) return { status: 'Busy', job: currentJob };
    const scheduledNow = jobs.find(j => 
      (j.assignedTechIds || []).includes(techId) &&
      isBefore(new Date(j.scheduledStart), today) &&
      isAfter(new Date(j.scheduledEnd), today)
    );
    if (scheduledNow) return { status: 'Scheduled', job: scheduledNow };
    return { status: 'Available', job: null };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Overview for {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-3">
            {/* NEW FEATURE 9: QUICK ACTIONS BUTTONS */}
            <Link to="/jobs" className="bg-slate-900 dark:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors shadow-lg shadow-slate-900/20 dark:shadow-emerald-600/20 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> New Job
            </Link>
        </div>
      </div>

      {/* --- TOP METRICS ROW (EXPANDED) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Existing: Revenue */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
             <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <CircleDollarSign className="w-6 h-6" />
                 </div>
                 <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +12%
                 </span>
             </div>
             <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Monthly Revenue</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${monthlyRevenue.toLocaleString()}</p>
             </div>
             {/* FEATURE 1: GOAL PROGRESS BAR */}
             <div className="mt-3">
                 <div className="flex justify-between text-[10px] font-medium text-slate-400 mb-1">
                     <span>Goal: ${monthlyTarget.toLocaleString()}</span>
                     <span>{goalProgress.toFixed(0)}%</span>
                 </div>
                 <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                     <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${goalProgress}%` }}></div>
                 </div>
             </div>
          </div>

          {/* FEATURE 2: AVG TICKET */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                    <FileText className="w-6 h-6" />
                 </div>
             </div>
             <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avg Ticket Price</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${avgTicket.toFixed(0)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Per paid invoice</p>
             </div>
          </div>

          {/* FEATURE 3: INVENTORY ALERTS */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                    <Box className="w-6 h-6" />
                 </div>
                 {inventoryAlerts.length > 0 && (
                     <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full animate-pulse">
                        Action Needed
                     </span>
                 )}
             </div>
             <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{inventoryAlerts.length} Items</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Below minimum level</p>
             </div>
          </div>

          {/* FEATURE 4: FLEET UTILIZATION */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                    <Truck className="w-6 h-6" />
                 </div>
             </div>
             <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Fleet Active</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{activeVehicles} <span className="text-sm text-slate-400 font-normal">/ {totalVehicles}</span></p>
                <div className="flex gap-1 mt-2">
                    {Array.from({ length: totalVehicles }).map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < activeVehicles ? 'bg-purple-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                    ))}
                </div>
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT COLUMN (MAIN) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Action Center (Existing) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Link to="/invoices?status=OVERDUE" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-500"></div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
                   <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">{overdueInvoices.length}</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Overdue Invoices</p>
                </div>
             </Link>

             <Link to="/schedule" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
                 <div className="absolute right-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
                   <Briefcase className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{unassignedJobs.length}</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Unassigned Jobs</p>
                </div>
             </Link>

             <Link to="/quotes?status=SENT" className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                   <FileText className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{pendingQuotes.length}</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Pending Quotes</p>
                </div>
             </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Today's Agenda (Existing) */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[400px]">
                <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    Today's Agenda
                  </h3>
                  <Link to="/schedule" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center uppercase">
                    View Schedule <ChevronRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 custom-scrollbar">
                  {todaysJobs.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 p-6">
                        <Calendar className="w-10 h-10 mb-3 opacity-20" />
                        <p>No jobs scheduled for today.</p>
                     </div>
                  ) : (
                    todaysJobs.map(job => (
                      <Link to={`/jobs/${job.id}`} key={job.id} className="p-4 flex items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors block group">
                        <div className="w-14 shrink-0 flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-700 pr-3 mr-3">
                           <span className="text-xs font-bold text-slate-900 dark:text-white">{new Date(job.scheduledStart).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}</span>
                           <span className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">{new Date(job.scheduledStart).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}).slice(-2)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm group-hover:text-emerald-600 transition-colors">{job.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                               <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase border ${job.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border-amber-200' : job.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                   {job.status.replace('_', ' ')}
                               </span>
                            </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* FEATURE 5: SERVICE MIX CHART */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 h-[400px] flex flex-col">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-blue-500" /> Service Mix
                  </h3>
                  <div className="flex-1 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={serviceMixData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {serviceMixData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                          <span className="text-3xl font-bold text-slate-900 dark:text-white">{jobs.length}</span>
                          <span className="text-xs text-slate-400 uppercase font-bold">Total Jobs</span>
                      </div>
                  </div>
              </div>
          </div>

           {/* Revenue Chart (Wide) */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Revenue Trend</h3>
                  <select className="text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1 outline-none">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                  </select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" strokeOpacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `$${val}`} />
                    <Tooltip 
                        contentStyle={{backgroundColor: 'var(--tw-prose-body)', borderRadius: '8px', border: '1px solid #e2e8f0'}}
                        itemStyle={{color: '#10b981'}}
                        formatter={(value) => [`$${value}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
           
           {/* FEATURE 10: LOW STOCK ALERT LIST */}
           {inventoryAlerts.length > 0 && (
               <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/50 rounded-2xl p-6">
                   <div className="flex items-center gap-3 mb-4">
                       <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                           <AlertCircle className="w-5 h-5" />
                       </div>
                       <h3 className="font-bold text-lg text-red-900 dark:text-red-200">Inventory Warning</h3>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                       {inventoryAlerts.slice(0, 3).map(item => (
                           <div key={item.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-red-100 dark:border-red-800 shadow-sm flex justify-between items-center">
                               <div>
                                   <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{item.name}</p>
                                   <p className="text-xs text-slate-500 dark:text-slate-400">Min: {item.minStock}</p>
                               </div>
                               <Link to="/inventory/orders" className="text-xs font-bold text-blue-600 hover:underline">Order</Link>
                           </div>
                       ))}
                   </div>
               </div>
           )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          
          {/* FEATURE 6: TOP PERFORMER CARD */}
          {topPerformer && (
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                  <div className="flex items-center gap-2 mb-4 relative z-10">
                      <Award className="w-5 h-5 text-yellow-300" />
                      <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Top Performer</span>
                  </div>
                  <div className="flex items-center gap-4 relative z-10">
                      <img src={topPerformer.avatarUrl} className="w-16 h-16 rounded-full border-4 border-white/20" alt="Top Tech" />
                      <div>
                          <h3 className="text-xl font-bold">{topPerformer.name}</h3>
                          <p className="text-indigo-200 text-sm">Highest Revenue This Month</p>
                      </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center relative z-10">
                      <div>
                          <p className="text-xs text-indigo-200 uppercase">Rating</p>
                          <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                              <span className="font-bold">{topPerformer.rating}</span>
                          </div>
                      </div>
                      <Link to={`/team/${topPerformer.id}`} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                          View Profile
                      </Link>
                  </div>
              </div>
          )}

          {/* Team Status (Existing) */}
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
                                <img src={tech.avatarUrl} alt={tech.name} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600 group-hover:border-emerald-400 transition-colors object-cover" />
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

          {/* FEATURE 7: MARKETING ROI SNAPSHOT */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-purple-500" /> Marketing ROI
                  </h3>
              </div>
              <div className="flex items-end justify-between mb-4">
                  <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Attributed Revenue</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">${marketingRevenue.toLocaleString()}</p>
                  </div>
                  <Link to="/marketing" className="text-purple-600 text-xs font-bold hover:underline">View Campaigns</Link>
              </div>
              <div className="space-y-3">
                  {(store?.marketingAutomations || []).slice(0, 2).map(auto => (
                      <div key={auto.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                          <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{auto.title}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{auto.trigger}</p>
                          </div>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">${auto.stats.revenue}</span>
                      </div>
                  ))}
              </div>
          </div>

          {/* FEATURE 8: AR AGING CHART */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Overdue Aging</h3>
              <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={arAgingData} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" width={40} tick={{fontSize: 10}} />
                          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: 8}} />
                          <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
              <div className="text-center text-xs text-slate-400 mt-2">Days Past Due</div>
          </div>

          {/* Activity Feed (Existing) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500" />
                    Activity Feed
                </h3>
             </div>
             <div className="p-3 space-y-2">
                 {/* Reuse existing activity logic (mocked for display here as per original component structure) */}
                 {(store?.activityLog || []).slice(0, 3).map((act, idx) => (
                     <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700">
                         <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                         <div className="flex-1 min-w-0">
                             <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{act.description}</p>
                             <p className="text-[10px] text-slate-400 mt-0.5">{formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}</p>
                         </div>
                     </div>
                 ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- TECHNICIAN DASHBOARD (Unchanged) ---
const TechnicianDashboard: React.FC<DashboardProps> = ({ jobs, invoices, users }) => {
  const store = useContext(StoreContext);
  const currentUser = store?.currentUser;
  const today = new Date();

  if (!currentUser) return null;

  // 1. Filter Data for this Tech
  const myJobs = jobs.filter(j => (j.assignedTechIds || []).includes(currentUser.id));
  const completedJobs = myJobs.filter(j => j.status === JobStatus.COMPLETED);
  
  // 2. Metrics Calculation
  const totalRevenue = completedJobs.reduce((sum, job) => {
      // Use null safe check for items
      return sum + (job.items || []).reduce((acc, item) => acc + item.total, 0);
  }, 0);

  const jobsDoneCount = completedJobs.length;
  const avgRating = currentUser.rating || 5.0;

  // Mock Average Time (in minutes)
  const avgTimeMinutes = completedJobs.length > 0 
    ? completedJobs.reduce((acc, j) => acc + differenceInMinutes(new Date(j.scheduledEnd), new Date(j.scheduledStart)), 0) / completedJobs.length
    : 0;
  
  const hours = Math.floor(avgTimeMinutes / 60);
  const mins = Math.round(avgTimeMinutes % 60);
  const avgTimeString = `${hours}h ${mins}m`;

  // 3. Today's Jobs & Next Job
  const todaysJobs = myJobs
    .filter(j => isSameDay(new Date(j.scheduledStart), today) && j.status !== JobStatus.CANCELLED)
    .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());

  const nextJob = todaysJobs.find(j => j.status === JobStatus.SCHEDULED || j.status === JobStatus.IN_PROGRESS) || todaysJobs[0];

  // 4. Inventory (Mock)
  const lowStockCount = (store?.inventoryRecords || []).filter(r => 
      // Assuming warehouses are linked to users in a real scenario, here we check generally or specific warehouse
      r.warehouseId === 'wh-2' && r.quantity < 5 // Mock 'wh-2' as Tech Van 1
  ).length || 0;

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 dark:bg-slate-800 p-6 rounded-3xl shadow-lg text-white">
          <div className="flex items-center gap-4">
              <div className="relative">
                  <img src={currentUser.avatarUrl} alt="Me" className="w-16 h-16 rounded-full border-4 border-slate-700 shadow-sm object-cover" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
              </div>
              <div>
                  <h1 className="text-2xl font-bold">Good Morning, {currentUser.name.split(' ')[0]}</h1>
                  <p className="text-slate-400 text-sm flex items-center gap-2">
                      <Briefcase className="w-3 h-3" /> Technician • {todaysJobs.length} jobs today
                  </p>
              </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 py-3 px-5 rounded-xl font-bold text-sm transition-colors border border-slate-700">
                  <Clock className="w-4 h-4 text-emerald-400" /> Clock In
              </button>
          </div>
      </div>

      {/* Stats Grid (4 Details) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Revenue</p>
              <div className="flex items-center gap-2 mt-1">
                  <CircleDollarSign className="w-5 h-5 text-emerald-500" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">${totalRevenue.toLocaleString()}</span>
              </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jobs Done</p>
              <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{jobsDoneCount}</span>
              </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rating</p>
              <div className="flex items-center gap-2 mt-1">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{avgRating}</span>
              </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Time</p>
              <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-5 h-5 text-purple-500" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{avgTimeString}</span>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* "Up Next" Focus Card */}
              {nextJob ? (
                  <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
                      
                      <div className="flex justify-between items-start mb-4 relative z-10">
                          <span className="bg-blue-500/30 border border-blue-400/30 text-blue-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                              {nextJob.status.replace('_', ' ')}
                          </span>
                          <span className="text-blue-100 font-mono text-sm">{format(new Date(nextJob.scheduledStart), 'h:mm a')}</span>
                      </div>

                      <h2 className="text-2xl font-bold mb-2 relative z-10">{nextJob.title}</h2>
                      <p className="text-blue-100 mb-6 flex items-center gap-2 relative z-10">
                          <MapPin className="w-4 h-4" /> {store?.clients.find(c => c.id === nextJob.clientId)?.address || 'No Address'}
                      </p>

                      <div className="grid grid-cols-2 gap-3 relative z-10">
                          <Link to={`/jobs/${nextJob.id}`} className="bg-white text-blue-900 py-3 rounded-xl font-bold text-center hover:bg-blue-50 transition-colors">
                              View Details
                          </Link>
                          <button className="bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors border border-blue-500">
                              <Navigation className="w-4 h-4" /> Navigate
                          </button>
                      </div>
                  </div>
              ) : (
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                      <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-50" />
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Caught Up!</h3>
                      <p className="text-slate-500 dark:text-slate-400">No active jobs scheduled for the rest of the day.</p>
                  </div>
              )}

              {/* Today's Timeline */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-500" /> Today's Route
                  </h3>
                  
                  <div className="space-y-0 relative">
                      {/* Vertical Line */}
                      <div className="absolute top-4 bottom-4 left-4 w-0.5 bg-slate-100 dark:bg-slate-700"></div>

                      {todaysJobs.map((job, idx) => {
                          const isCompleted = job.status === JobStatus.COMPLETED;
                          const isCurrent = job.id === nextJob?.id;
                          const client = store?.clients.find(c => c.id === job.clientId);

                          return (
                              <div key={job.id} className="relative pl-10 py-3 group">
                                  {/* Node */}
                                  <div className={`absolute left-[11px] top-5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 z-10 ${isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-blue-500 scale-125 ring-4 ring-blue-100 dark:ring-blue-900' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                  
                                  <Link to={`/jobs/${job.id}`} className={`block p-4 rounded-xl border transition-all ${isCurrent ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'}`}>
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <p className={`text-xs font-bold uppercase mb-1 ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                                                  {format(new Date(job.scheduledStart), 'h:mm a')}
                                              </p>
                                              <h4 className={`font-bold text-sm ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                                                  {job.title}
                                              </h4>
                                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                  {client?.lastName} • {client?.address || 'No Address'}
                                              </p>
                                          </div>
                                          <ChevronRight className="w-4 h-4 text-slate-300" />
                                      </div>
                                  </Link>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
              
              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-3">
                  <button className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-center flex flex-col items-center gap-2 transition-colors">
                      <Truck className="w-6 h-6 text-amber-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Vehicle Check</span>
                  </button>
                  <button className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-center flex flex-col items-center gap-2 transition-colors">
                      <Box className="w-6 h-6 text-blue-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Request Stock</span>
                  </button>
                  <Link to="/communication" className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-center flex flex-col items-center gap-2 transition-colors">
                      <MessageSquare className="w-6 h-6 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Dispatch</span>
                  </Link>
                  <button className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-center flex flex-col items-center gap-2 transition-colors">
                      <Phone className="w-6 h-6 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Support</span>
                  </button>
              </div>

              {/* My Vehicle Inventory Alert */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                          <Box className="w-4 h-4 text-slate-400" /> Van Inventory
                      </h3>
                      {lowStockCount > 0 && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{lowStockCount} Low</span>}
                  </div>
                  
                  {lowStockCount > 0 ? (
                      <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                              <span className="font-medium text-red-800 dark:text-red-300">Microfiber Towels</span>
                              <span className="font-bold text-red-600 dark:text-red-400">2 left</span>
                          </div>
                          <Link to="/inventory/stock" className="block text-center text-xs font-bold text-blue-600 hover:underline mt-2">View All Inventory</Link>
                      </div>
                  ) : (
                      <p className="text-xs text-slate-500 text-center py-4">Stock levels look good! 👍</p>
                  )}
              </div>

              {/* Weekly Goal */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm mb-4">
                      <Zap className="w-4 h-4 text-amber-500" /> Weekly Goal
                  </h3>
                  <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-700 dark:text-slate-300">${totalRevenue.toLocaleString()}</span>
                      <span className="text-slate-400">$2,500 Target</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                      Keep it up! You're 65% to your weekly bonus.
                  </p>
              </div>

          </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = (props) => {
  const store = useContext(StoreContext);
  const currentUser = store?.currentUser;

  if (!currentUser) return null;

  // Role-based Routing Logic
  if (currentUser.role === UserRole.TECHNICIAN) {
    return <TechnicianDashboard {...props} />;
  }

  return <AdminDashboard {...props} />;
};

export default Dashboard;
