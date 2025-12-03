
import React, { useMemo, useState } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, DollarSign, Briefcase, ArrowUpRight, 
  PieChart as PieChartIcon, Printer, Calendar, Filter
} from 'lucide-react';
import { Invoice, Job, User, JobStatus, InvoiceStatus } from '../types';
import { 
  format, subMonths, isSameMonth, parseISO, startOfYear, 
  startOfMonth, endOfMonth, eachMonthOfInterval, isValid
} from 'date-fns';
import { DatePicker } from '../components/DatePicker';

interface ReportsProps {
  jobs: Job[];
  invoices: Invoice[];
  users: User[];
}

export const Reports: React.FC<ReportsProps> = ({ jobs, invoices, users }) => {
  // Default to YTD
  const [dateRange, setDateRange] = useState({
    start: format(startOfYear(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  // Handle Presets
  const applyPreset = (type: '6M' | 'YTD' | '1Y') => {
     const now = new Date();
     let start = new Date();
     
     if (type === '6M') start = subMonths(now, 5); // Current + 5 previous = 6
     if (type === 'YTD') start = startOfYear(now);
     if (type === '1Y') start = subMonths(now, 11);

     setDateRange({
         start: format(startOfMonth(start), 'yyyy-MM-dd'),
         end: format(endOfMonth(now), 'yyyy-MM-dd')
     });
  };

  const handlePrint = () => {
    window.print();
  };

  // --- FILTER DATA ---
  const filteredJobs = useMemo(() => {
     const start = parseISO(dateRange.start);
     const end = parseISO(dateRange.end);
     end.setHours(23, 59, 59, 999); // End of day

     if (!isValid(start) || !isValid(end)) return [];

     return jobs.filter(j => {
         const date = parseISO(j.end);
         return date >= start && date <= end;
     });
  }, [jobs, dateRange]);

  const filteredInvoices = useMemo(() => {
     const start = parseISO(dateRange.start);
     const end = parseISO(dateRange.end);
     end.setHours(23, 59, 59, 999);

     if (!isValid(start) || !isValid(end)) return [];

     return invoices.filter(i => {
         const date = parseISO(i.issuedDate);
         return date >= start && date <= end;
     });
  }, [invoices, dateRange]);

  // --- 1. KPI CALCULATIONS ---
  const kpis = useMemo(() => {
    const totalRevenue = filteredInvoices
      .filter(i => i.status === InvoiceStatus.PAID)
      .reduce((sum, i) => sum + i.total, 0);
    
    const outstanding = filteredInvoices
      .filter(i => i.status === InvoiceStatus.SENT || i.status === InvoiceStatus.OVERDUE)
      .reduce((sum, i) => sum + i.balanceDue, 0);
    
    const completedJobsCount = filteredJobs.filter(j => j.status === JobStatus.COMPLETED).length;
    
    const paidInvoicesCount = filteredInvoices.filter(i => i.status === InvoiceStatus.PAID).length;
    const avgTicket = paidInvoicesCount > 0 ? totalRevenue / paidInvoicesCount : 0;

    return { totalRevenue, outstanding, completedJobsCount, avgTicket };
  }, [filteredInvoices, filteredJobs]);

  // --- 2. REVENUE TREND DATA (Area Chart) ---
  const revenueTrendData = useMemo(() => {
    const start = parseISO(dateRange.start);
    const end = parseISO(dateRange.end);
    
    if (!isValid(start) || !isValid(end) || start > end) return [];

    // Generate month intervals
    const months = eachMonthOfInterval({ start: startOfMonth(start), end: endOfMonth(end) });

    return months.map(date => {
      const monthName = format(date, 'MMM yy');
      const monthInvoices = filteredInvoices.filter(inv => 
        (inv.status === InvoiceStatus.PAID || inv.status === InvoiceStatus.SENT) &&
        isSameMonth(parseISO(inv.issuedDate), date)
      );
      
      const amount = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);

      return {
        name: monthName,
        revenue: amount
      };
    });
  }, [filteredInvoices, dateRange]);

  // --- 3. TECHNICIAN PERFORMANCE (Bar Chart) ---
  const techPerformanceData = useMemo(() => {
    const technicians = users.filter(u => u.role === 'TECHNICIAN');
    
    return technicians.map(tech => {
      const techJobs = filteredJobs.filter(j => 
        j.assignedTechIds.includes(tech.id) && 
        j.status === JobStatus.COMPLETED
      );
      
      const revenue = techJobs.reduce((sum, job) => {
        const jobTotal = job.items.reduce((iSum, item) => iSum + item.total, 0);
        return sum + jobTotal;
      }, 0);

      return {
        name: tech.name.split(' ')[0],
        revenue: revenue,
        jobs: techJobs.length,
        color: tech.color || 'slate'
      };
    }).sort((a, b) => b.revenue - a.revenue).filter(t => t.revenue > 0);
  }, [users, filteredJobs]);

  // --- 4. SERVICE MIX (Pie Chart) ---
  const serviceMixData = useMemo(() => {
    const categories: Record<string, number> = {};
    
    filteredJobs.forEach(job => {
      let category = 'Other';
      const title = job.title.toLowerCase();
      
      if (title.includes('ceramic') || title.includes('coating')) category = 'Ceramic Coating';
      else if (title.includes('interior') || title.includes('odor')) category = 'Interior Detail';
      else if (title.includes('wash') || title.includes('exterior')) category = 'Exterior Wash';
      else if (title.includes('paint') || title.includes('correction')) category = 'Paint Correction';
      else if (title.includes('fleet')) category = 'Fleet Services';

      if (!categories[category]) categories[category] = 0;
      categories[category]++;
    });

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#8b5cf6'];
    
    return Object.keys(categories).map((cat, index) => ({
      name: cat,
      value: categories[cat],
      color: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value);
  }, [filteredJobs]);

  // --- 5. INVOICE STATUS BREAKDOWN ---
  const invoiceStats = useMemo(() => {
    const stats = {
      PAID: filteredInvoices.filter(i => i.status === InvoiceStatus.PAID).length,
      OVERDUE: filteredInvoices.filter(i => i.status === InvoiceStatus.OVERDUE).length,
      SENT: filteredInvoices.filter(i => i.status === InvoiceStatus.SENT).length,
      DRAFT: filteredInvoices.filter(i => i.status === InvoiceStatus.DRAFT).length,
    };
    const total = filteredInvoices.length;
    return { counts: stats, total };
  }, [filteredInvoices]);

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-6 print:space-y-8 print:pb-0">
      
      {/* Print Header - Visible only when printing */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-6">
        <div className="flex justify-between items-start">
            <div className="space-y-2">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Executive Report</h1>
                <p className="text-slate-600 text-lg font-medium">The Matador Mobile Detailing</p>
            </div>
            <div className="text-right">
                <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 inline-block">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Generated On</p>
                    <p className="font-bold text-slate-900">{format(new Date(), 'MMMM d, yyyy @ h:mm a')}</p>
                </div>
            </div>
        </div>
        
        <div className="mt-8 flex items-center gap-8">
             <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
                 <p className="text-xs text-slate-500 uppercase font-bold mb-1">Reporting Period</p>
                 <div className="flex items-baseline gap-3">
                     <span className="text-xl font-bold text-slate-900">{format(parseISO(dateRange.start), 'MMMM d, yyyy')}</span>
                     <span className="text-slate-400 font-medium">to</span>
                     <span className="text-xl font-bold text-slate-900">{format(parseISO(dateRange.end), 'MMMM d, yyyy')}</span>
                 </div>
             </div>
             <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
                 <p className="text-xs text-slate-500 uppercase font-bold mb-1">Parameters</p>
                 <div className="flex gap-2">
                     <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600">All Clients</span>
                     <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-600">All Technicians</span>
                 </div>
             </div>
        </div>
      </div>

      {/* Screen Header & Controls - Hidden when printing */}
      <div className="flex flex-col gap-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Reports</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Business analytics and performance metrics.</p>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-emerald-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-emerald-700 shadow-lg shadow-slate-900/20 transition-all font-medium cursor-pointer active:scale-[0.98]"
                >
                    <Printer className="w-4 h-4" /> Download / Print PDF
                </button>
            </div>
        </div>

        {/* Date Range Toolbar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-lg shrink-0">
                    {(['6M', 'YTD', '1Y'] as const).map((type) => (
                        <button
                        key={type}
                        onClick={() => applyPreset(type)}
                        className="px-4 py-1.5 text-xs font-bold rounded-md transition-colors text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 hover:shadow-sm hover:text-slate-900 dark:hover:text-white"
                        >
                        {type}
                        </button>
                    ))}
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2 shrink-0 hidden md:block"></div>
                
                {/* Date Pickers with Custom Component */}
                <div className="flex items-center gap-3">
                    <div className="w-40">
                        <DatePicker 
                            value={dateRange.start}
                            onChange={(val) => setDateRange(p => ({...p, start: val}))}
                            placeholder="Start Date"
                        />
                    </div>
                    <span className="text-slate-400 text-sm font-medium">to</span>
                    <div className="w-40">
                        <DatePicker 
                            value={dateRange.end}
                            onChange={(val) => setDateRange(p => ({...p, end: val}))}
                            placeholder="End Date"
                        />
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-4 ml-auto md:ml-0">
                 <Filter className="w-4 h-4" />
                 <span>Filtered View</span>
            </div>
        </div>
      </div>

      {/* KPI CARDS and CHARTS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm print:border-slate-300 print:shadow-none">
              <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-800 print:hidden">
                      <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full print:hidden">
                      <ArrowUpRight className="w-3 h-3 mr-1" /> +12%
                  </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider print:text-slate-600">Total Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${kpis.totalRevenue.toLocaleString()}</h3>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm print:border-slate-300 print:shadow-none">
              <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-100 dark:border-amber-800 print:hidden">
                      <DollarSign className="w-5 h-5" />
                  </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider print:text-slate-600">Outstanding</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${kpis.outstanding.toLocaleString()}</h3>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm print:border-slate-300 print:shadow-none">
              <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-800 print:hidden">
                      <Briefcase className="w-5 h-5" />
                  </div>
                  <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full print:hidden">
                      <ArrowUpRight className="w-3 h-3 mr-1" /> +5%
                  </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider print:text-slate-600">Jobs Completed</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{kpis.completedJobsCount}</h3>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm print:border-slate-300 print:shadow-none">
              <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-100 dark:border-purple-800 print:hidden">
                      <PieChartIcon className="w-5 h-5" />
                  </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider print:text-slate-600">Avg Ticket Size</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${kpis.avgTicket.toFixed(0)}</h3>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-8">
          
          {/* 2. REVENUE TREND CHART */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 print:border-slate-300 print:shadow-none print:break-inside-avoid">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Trend</h3>
              </div>
              <div className="w-full min-w-0" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueTrendData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12}} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 12}}
                            tickFormatter={(value) => `$${value / 1000}k`}
                        />
                        <Tooltip 
                             contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                             itemStyle={{color: '#0f172a', fontWeight: 'bold'}}
                             formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#10b981" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorRev)" 
                        />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* 4. SERVICE MIX CHART */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 print:border-slate-300 print:shadow-none print:break-inside-avoid">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Service Mix</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Revenue distribution by service type.</p>
               <div className="w-full min-w-0 relative" style={{ height: 200 }}>
                   <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                           <Pie
                              data={serviceMixData}
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                           >
                               {serviceMixData.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={entry.color} />
                               ))}
                           </Pie>
                           <Tooltip />
                       </PieChart>
                   </ResponsiveContainer>
                   {/* Center Text */}
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{filteredJobs.length}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Total Jobs</span>
                  </div>
               </div>
               <div className="mt-4 space-y-2 max-h-[100px] overflow-y-auto custom-scrollbar print:max-h-none">
                   {serviceMixData.map(item => (
                       <div key={item.name} className="flex items-center justify-between text-sm">
                           <div className="flex items-center gap-2">
                               <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                               <span className="text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{item.name}</span>
                           </div>
                           <span className="font-bold text-slate-900 dark:text-white">{Math.round((item.value / (filteredJobs.length || 1)) * 100)}%</span>
                       </div>
                   ))}
               </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:break-inside-avoid">
          
          {/* 3. TECHNICIAN PERFORMANCE */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 print:border-slate-300 print:shadow-none">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Technician Leaderboard</h3>
               <div className="w-full min-w-0" style={{ height: 250 }}>
                   <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={techPerformanceData} layout="vertical" margin={{ left: 0, right: 20 }}>
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                           <XAxis type="number" hide />
                           <YAxis 
                                type="category" 
                                dataKey="name" 
                                width={100}
                                axisLine={false}
                                tickLine={false}
                                tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 600}}
                           />
                           <Tooltip 
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0'}}
                           />
                           <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={24}>
                                {techPerformanceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={
                                        entry.color === 'rose' ? '#f43f5e' :
                                        entry.color === 'blue' ? '#3b82f6' : 
                                        entry.color === 'amber' ? '#f59e0b' :
                                        entry.color === 'emerald' ? '#10b981' : '#64748b'
                                    } />
                                ))}
                           </Bar>
                       </BarChart>
                   </ResponsiveContainer>
               </div>
          </div>

           {/* 5. INVOICE STATUS BREAKDOWN */}
           <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex flex-col print:border-slate-300 print:shadow-none">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Invoice Status</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Current cash flow health based on filtered invoices.</p>
               
               <div className="space-y-6 flex-1">
                   {/* Paid */}
                   <div>
                       <div className="flex justify-between text-sm mb-1.5">
                           <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                               Paid
                           </span>
                           <span className="text-slate-500 dark:text-slate-400">{invoiceStats.counts.PAID} / {invoiceStats.total}</span>
                       </div>
                       <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden print:border print:border-slate-200">
                           <div className="h-full bg-emerald-500 rounded-full print:bg-slate-800" style={{ width: `${(invoiceStats.counts.PAID / (invoiceStats.total || 1)) * 100}%` }}></div>
                       </div>
                   </div>

                    {/* Overdue */}
                    <div>
                       <div className="flex justify-between text-sm mb-1.5">
                           <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-red-500"></div>
                               Overdue
                           </span>
                           <span className="text-slate-500 dark:text-slate-400">{invoiceStats.counts.OVERDUE} / {invoiceStats.total}</span>
                       </div>
                       <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden print:border print:border-slate-200">
                           <div className="h-full bg-red-500 rounded-full print:bg-slate-600" style={{ width: `${(invoiceStats.counts.OVERDUE / (invoiceStats.total || 1)) * 100}%` }}></div>
                       </div>
                   </div>

                   {/* Sent/Pending */}
                   <div>
                       <div className="flex justify-between text-sm mb-1.5">
                           <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                               Pending Payment
                           </span>
                           <span className="text-slate-500 dark:text-slate-400">{invoiceStats.counts.SENT} / {invoiceStats.total}</span>
                       </div>
                       <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden print:border print:border-slate-200">
                           <div className="h-full bg-blue-500 rounded-full print:bg-slate-400" style={{ width: `${(invoiceStats.counts.SENT / (invoiceStats.total || 1)) * 100}%` }}></div>
                       </div>
                   </div>
               </div>
           </div>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block text-center text-slate-400 text-xs mt-8 pt-8 border-t border-slate-200">
          <p>Report generated by The Matador FieldFlow System. Confidential.</p>
      </div>
    </div>
  );
};
