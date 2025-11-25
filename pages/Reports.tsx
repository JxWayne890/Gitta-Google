
import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Job, Invoice, User, JobStatus, InvoiceStatus } from '../types';
import { endOfMonth, eachMonthOfInterval, format, isSameMonth, addMonths } from 'date-fns';
import { TrendingUp, DollarSign, CheckCircle } from 'lucide-react';

interface ReportsProps {
  jobs: Job[];
  invoices: Invoice[];
  users: User[];
}

// Helper to replace missing startOfMonth export
const startOfMonth = (d: Date | number) => {
  const newDate = new Date(d);
  newDate.setDate(1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

export const Reports: React.FC<ReportsProps> = ({ jobs, invoices, users }) => {
  const [timeRange, setTimeRange] = useState<number>(6);

  // Revenue Data
  const revenueData = useMemo(() => {
    const today = new Date();
    const start = addMonths(today, -(timeRange - 1));
    const months = eachMonthOfInterval({ start: startOfMonth(start), end: endOfMonth(today) });

    return months.map(month => {
      const monthInvoices = invoices.filter(inv => 
        inv.status === InvoiceStatus.PAID && 
        isSameMonth(new Date(inv.issuedDate), month)
      );
      
      const revenue = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
      return {
        name: format(month, 'MMM'),
        revenue
      };
    });
  }, [invoices, timeRange]);

  // Job Status Distribution
  const jobStatusData = useMemo(() => {
    const counts = {
      [JobStatus.COMPLETED]: 0,
      [JobStatus.SCHEDULED]: 0,
      [JobStatus.IN_PROGRESS]: 0,
      [JobStatus.CANCELLED]: 0,
    };
    
    jobs.forEach(j => {
      if (counts[j.status as keyof typeof counts] !== undefined) {
        counts[j.status as keyof typeof counts]++;
      }
    });

    return [
      { name: 'Completed', value: counts[JobStatus.COMPLETED], color: '#10b981' },
      { name: 'Scheduled', value: counts[JobStatus.SCHEDULED], color: '#3b82f6' },
      { name: 'In Progress', value: counts[JobStatus.IN_PROGRESS], color: '#f59e0b' },
      { name: 'Cancelled', value: counts[JobStatus.CANCELLED], color: '#ef4444' },
    ].filter(d => d.value > 0);
  }, [jobs]);

  // Technician Performance (Revenue)
  const techPerformance = useMemo(() => {
    const techRevenue: Record<string, number> = {};
    
    jobs.filter(j => j.status === JobStatus.COMPLETED).forEach(job => {
        const jobRevenue = job.items.reduce((sum, item) => sum + item.total, 0);
        job.assignedTechIds.forEach(techId => {
            techRevenue[techId] = (techRevenue[techId] || 0) + (jobRevenue / job.assignedTechIds.length);
        });
    });

    return Object.entries(techRevenue)
        .map(([id, revenue]) => {
            const user = users.find(u => u.id === id);
            return {
                name: user?.name || 'Unknown',
                revenue
            };
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
  }, [jobs, users]);

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const completedJobsCount = jobs.filter(j => j.status === JobStatus.COMPLETED).length;

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-8">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Reports</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Business intelligence and performance analytics.</p>
            </div>
            <select 
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500"
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
            >
                <option value={3}>Last 3 Months</option>
                <option value={6}>Last 6 Months</option>
                <option value={12}>Last 12 Months</option>
            </select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Revenue (Period)</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${totalRevenue.toLocaleString()}</h3>
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Jobs Completed</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{completedJobsCount}</h3>
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Avg Job Value</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                            ${completedJobsCount > 0 ? (totalRevenue / completedJobsCount).toFixed(0) : 0}
                        </h3>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Chart */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Revenue Trend</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `$${val}`} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0'}}
                                itemStyle={{color: '#10b981'}}
                                formatter={(value) => [`$${value}`, 'Revenue']}
                            />
                            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Technician Performance */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Top Technicians (Revenue)</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={techPerformance} layout="vertical" margin={{ left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} axisLine={false} tickLine={false} />
                            <Tooltip 
                                cursor={{fill: '#f8fafc'}} 
                                contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0'}}
                                formatter={(value) => [`$${Number(value).toFixed(0)}`, 'Revenue']}
                            />
                            <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={32} fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* Job Status Pie Chart */}
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6">Job Status Overview</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={jobStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {jobStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
             </div>
        </div>
    </div>
  );
};
