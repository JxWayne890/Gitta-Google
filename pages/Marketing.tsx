
import React, { useMemo } from 'react';
import { MarketingCampaign, CampaignStatus } from '../types';
import { 
  Megaphone, MousePointerClick, MailOpen, TrendingUp, 
  Smartphone, Mail, ChevronRight, BarChart3
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import { format, subDays, isSameDay, parseISO } from 'date-fns';

interface MarketingProps {
  campaigns: MarketingCampaign[];
}

export const Marketing: React.FC<MarketingProps> = ({ campaigns }) => {
  
  // --- REAL Metrics Calculation ---
  const metrics = useMemo(() => {
      // Filter out Drafts for accurate stats
      const sentCampaigns = campaigns.filter(c => c.status === CampaignStatus.SENT || c.status === CampaignStatus.SENDING);

      const totalSent = sentCampaigns.reduce((sum, c) => sum + (c.stats.sent || 0), 0);
      const totalOpened = sentCampaigns.reduce((sum, c) => sum + (c.stats.opened || 0), 0);
      const totalClicked = sentCampaigns.reduce((sum, c) => sum + (c.stats.clicked || 0), 0);
      
      // Calculate Rates
      // Avoid division by zero
      const avgOpenRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;
      const avgClickRate = totalSent > 0 ? (totalClicked / totalSent) * 100 : 0;

      // Revenue Attribution (Placeholder logic: currently 0 as we don't track conversion yet)
      // In the future, this would link invoices to campaign IDs.
      const attributedRevenue = 0; 

      return { totalSent, avgOpenRate, avgClickRate, attributedRevenue };
  }, [campaigns]);

  // --- Real Chart Data (Last 7 Days) ---
  const chartData = useMemo(() => {
      const today = new Date();
      const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = subDays(today, 6 - i);
          return d;
      });

      return last7Days.map(day => {
          // Find campaigns sent on this day
          const campaignsOnDay = campaigns.filter(c => {
              if (!c.sentDate) return false;
              return isSameDay(parseISO(c.sentDate), day);
          });

          // Sum up sent messages
          const sentCount = campaignsOnDay.reduce((sum, c) => sum + (c.stats.sent || 0), 0);

          return {
              name: format(day, 'EEE'), // Mon, Tue...
              value: sentCount,
              date: format(day, 'MMM d')
          };
      });
  }, [campaigns]);

  const recentCampaigns = [...campaigns].sort((a, b) => {
      const dateA = new Date(a.sentDate || a.scheduledDate || a.id.split('-')[1] || 0).getTime();
      const dateB = new Date(b.sentDate || b.scheduledDate || b.id.split('-')[1] || 0).getTime();
      return dateB - dateA;
  }).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Marketing</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Grow your business with targeted Email & SMS campaigns.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Megaphone className="w-5 h-5" />
                  </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Messages Sent</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{metrics.totalSent.toLocaleString()}</h3>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <MailOpen className="w-5 h-5" />
                  </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Avg. Open Rate</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{metrics.avgOpenRate.toFixed(1)}%</h3>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                      <MousePointerClick className="w-5 h-5" />
                  </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Avg. Click Rate</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{metrics.avgClickRate.toFixed(1)}%</h3>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                  </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Attributed Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">${metrics.attributedRevenue.toLocaleString()}</h3>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Message Volume (Last 7 Days)</h3>
              </div>
              <div className="w-full min-w-0" style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                        <Tooltip 
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                            formatter={(value: any) => [value, 'Messages Sent']}
                            labelFormatter={(label) => label}
                        />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 12, fill: '#94a3b8'}} 
                            dy={10} 
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 12, fill: '#94a3b8'}} 
                        />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#3b82f6" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorEngage)" 
                        />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Quick Actions / Recent Activity */}
          <div className="space-y-6">
              
              {/* Quick Create */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg border border-slate-700">
                  <h3 className="font-bold text-lg mb-2">Create Campaign</h3>
                  <p className="text-slate-300 text-sm mb-4">Send a blast to your customers to drive bookings.</p>
                  <div className="flex gap-3">
                      <Link to="/marketing/campaigns/new" className="flex-1 bg-white text-slate-900 py-2.5 rounded-lg text-sm font-bold text-center hover:bg-slate-100 transition-colors">
                          Email Blast
                      </Link>
                      <button disabled className="flex-1 bg-slate-700 text-slate-400 py-2.5 rounded-lg text-sm font-bold text-center cursor-not-allowed border border-slate-600">
                          SMS (Soon)
                      </button>
                  </div>
              </div>

              {/* Recent Campaigns */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900 dark:text-white">Recent Campaigns</h3>
                      <Link to="/marketing/campaigns" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">View All</Link>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {recentCampaigns.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                              No campaigns sent yet.
                          </div>
                      ) : (
                          recentCampaigns.map(campaign => (
                              <Link to={`/marketing/campaigns/${campaign.id}`} key={campaign.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors block">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${campaign.channel === 'EMAIL' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                      {campaign.channel === 'EMAIL' ? <Mail className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className="font-bold text-slate-900 dark:text-white truncate text-sm">{campaign.title}</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                          {campaign.sentDate ? `Sent ${format(parseISO(campaign.sentDate), 'MMM d')}` : 'Draft'}
                                      </p>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-slate-300" />
                              </Link>
                          ))
                      )}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
