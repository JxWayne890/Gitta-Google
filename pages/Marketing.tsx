
import React, { useMemo } from 'react';
import { MarketingCampaign } from '../types';
import { 
  Megaphone, Users, MousePointerClick, MailOpen, TrendingUp, 
  Calendar, ArrowRight, Activity, Smartphone, Mail, ChevronRight
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Link } from 'react-router-dom';

interface MarketingProps {
  campaigns: MarketingCampaign[];
}

export const Marketing: React.FC<MarketingProps> = ({ campaigns }) => {
  
  // --- Metrics Calculation ---
  const metrics = useMemo(() => {
      const totalSent = campaigns.reduce((sum, c) => sum + (c.stats.sent || 0), 0);
      const totalOpened = campaigns.reduce((sum, c) => sum + (c.stats.opened || 0), 0);
      const totalClicked = campaigns.reduce((sum, c) => sum + (c.stats.clicked || 0), 0);
      
      // Rough averages for display
      const emailCampaigns = campaigns.filter(c => c.channel === 'EMAIL' && c.status === 'SENT');
      const smsCampaigns = campaigns.filter(c => c.channel === 'SMS' && c.status === 'SENT');
      
      const avgOpenRate = emailCampaigns.length > 0 
          ? (emailCampaigns.reduce((sum, c) => sum + ((c.stats.opened || 0) / (c.stats.delivered || 1)), 0) / emailCampaigns.length) * 100 
          : 0;

      const avgClickRate = campaigns.filter(c => c.status === 'SENT').length > 0
          ? (totalClicked / totalSent) * 100
          : 0;

      return { totalSent, avgOpenRate, avgClickRate };
  }, [campaigns]);

  // --- Mock Chart Data ---
  const chartData = [
      { name: 'Mon', value: 400 },
      { name: 'Tue', value: 300 },
      { name: 'Wed', value: 550 },
      { name: 'Thu', value: 450 },
      { name: 'Fri', value: 600 },
      { name: 'Sat', value: 200 },
      { name: 'Sun', value: 150 },
  ];

  const recentCampaigns = [...campaigns].sort((a, b) => {
      const dateA = new Date(a.sentDate || a.scheduledDate || a.id).getTime();
      const dateB = new Date(b.sentDate || b.scheduledDate || b.id).getTime();
      return dateB - dateA;
  }).slice(0, 3);

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
                  <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">+2.4%</span>
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
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">$4,250</h3>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Engagement Trends (7 Days)</h3>
              </div>
              <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Tooltip 
                            contentStyle={{backgroundColor: 'var(--tw-prose-body)', borderRadius: '8px', border: '1px solid #e2e8f0'}}
                        />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
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
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 text-white shadow-lg">
                  <h3 className="font-bold text-lg mb-2">Create Campaign</h3>
                  <p className="text-slate-300 text-sm mb-4">Send a blast to your customers to drive bookings.</p>
                  <div className="flex gap-3">
                      <Link to="/marketing/campaigns" className="flex-1 bg-white text-slate-900 py-2.5 rounded-lg text-sm font-bold text-center hover:bg-slate-100 transition-colors">
                          Email Blast
                      </Link>
                      <Link to="/marketing/campaigns" className="flex-1 bg-slate-700 text-white py-2.5 rounded-lg text-sm font-bold text-center hover:bg-slate-600 transition-colors">
                          SMS Blast
                      </Link>
                  </div>
              </div>

              {/* Recent Campaigns */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                      <Link to="/marketing/campaigns" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">View All</Link>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {recentCampaigns.map(campaign => (
                          <div key={campaign.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${campaign.channel === 'EMAIL' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                                  {campaign.channel === 'EMAIL' ? <Mail className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{campaign.title}</p>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                      <span className={`capitalize ${campaign.status === 'SENT' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-600 dark:text-amber-400 font-medium'}`}>
                                          {campaign.status.toLowerCase()}
                                      </span>
                                      <span>•</span>
                                      <span>{campaign.sentDate ? new Date(campaign.sentDate).toLocaleDateString() : 'Draft'}</span>
                                  </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
