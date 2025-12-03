
import React from 'react';
import { MarketingCampaign, CampaignStatus, AudienceSegment } from '../types';
import { Plus, Search, Mail, Smartphone, ArrowUpRight } from 'lucide-react';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';

interface MarketingCampaignsProps {
  campaigns: MarketingCampaign[];
  segments: AudienceSegment[];
  onAddCampaign: (campaign: MarketingCampaign) => void;
}

export const MarketingCampaigns: React.FC<MarketingCampaignsProps> = ({ campaigns, segments }) => {
  const [activeTab, setActiveTab] = React.useState<'ALL' | 'EMAIL' | 'SMS'>('ALL');
  const filteredCampaigns = campaigns.filter(c => activeTab === 'ALL' || c.channel === activeTab);

  const getStatusBadge = (status: CampaignStatus) => {
      const styles = {
          DRAFT: 'bg-slate-100 text-slate-600',
          SCHEDULED: 'bg-blue-50 text-blue-700',
          SENDING: 'bg-amber-50 text-amber-700',
          SENT: 'bg-emerald-50 text-emerald-700',
          PAUSED: 'bg-red-50 text-red-700',
          ARCHIVED: 'bg-gray-50 text-gray-400'
      };
      return <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-transparent ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Campaigns</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Create and manage your outbound messages.</p>
            </div>
            <Link to="/marketing/campaigns/new">
                <Button className="shadow-lg shadow-emerald-500/20"><Plus className="w-4 h-4 mr-2" /> New Campaign</Button>
            </Link>
       </div>

       <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden min-h-[500px]">
           <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4 bg-slate-50/50 dark:bg-slate-900/50 items-center justify-between">
                <div className="flex p-1 bg-slate-200/60 dark:bg-slate-700/60 rounded-xl self-start sm:self-center">
                    {['ALL', 'EMAIL', 'SMS'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>{tab === 'ALL' ? 'All Channels' : tab}</button>
                    ))}
                </div>
           </div>

           <div className="flex-1 overflow-x-auto">
               <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                       <tr>
                           <th className="px-6 py-4">Campaign Name</th>
                           <th className="px-6 py-4">Status</th>
                           <th className="px-6 py-4">Audience</th>
                           <th className="px-6 py-4 text-right">Stats (Open/Click)</th>
                           <th className="px-6 py-4 w-10"></th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                       {filteredCampaigns.map(campaign => (
                           <tr key={campaign.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors group">
                               <td className="px-6 py-4">
                                   <div className="flex items-center gap-3">
                                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${campaign.channel === 'EMAIL' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                                           {campaign.channel === 'EMAIL' ? <Mail className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                                       </div>
                                       <div>
                                           <Link to={`/marketing/campaigns/${campaign.id}`} className="font-bold text-slate-900 dark:text-white text-sm hover:text-emerald-600 hover:underline">{campaign.title}</Link>
                                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{campaign.sentDate ? `Sent ${new Date(campaign.sentDate).toLocaleDateString()}` : 'Draft'}</p>
                                       </div>
                                   </div>
                               </td>
                               <td className="px-6 py-4">{getStatusBadge(campaign.status)}</td>
                               <td className="px-6 py-4"><span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{segments.find(s => s.id === campaign.segmentId)?.name || 'All Clients'}</span></td>
                               <td className="px-6 py-4 text-right">
                                   {campaign.status === CampaignStatus.SENT ? (
                                       <div className="flex items-center justify-end gap-4 text-sm">
                                           <span className="text-slate-600 dark:text-slate-400"><span className="font-bold text-slate-900 dark:text-white">{((campaign.stats.opened || 0) / (campaign.stats.delivered || 1) * 100).toFixed(0)}%</span> Open</span>
                                       </div>
                                   ) : <span className="text-xs text-slate-400">No data</span>}
                               </td>
                               <td className="px-6 py-4 text-right"><Link to={`/marketing/campaigns/${campaign.id}`} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors inline-block"><ArrowUpRight className="w-4 h-4" /></Link></td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           </div>
       </div>
    </div>
  );
};
