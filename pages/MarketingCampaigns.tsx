
import React, { useState } from 'react';
import { MarketingCampaign, ChannelType, CampaignStatus, AudienceSegment } from '../types';
import { 
    Plus, Search, Filter, Mail, Smartphone, Calendar, 
    MoreHorizontal, BarChart2, Send
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

interface MarketingCampaignsProps {
  campaigns: MarketingCampaign[];
  segments: AudienceSegment[];
  onAddCampaign: (campaign: MarketingCampaign) => void;
}

export const MarketingCampaigns: React.FC<MarketingCampaignsProps> = ({ campaigns, segments, onAddCampaign }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'EMAIL' | 'SMS'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
      title: '',
      channel: ChannelType.EMAIL,
      segmentId: '',
      subject: '',
      content: ''
  });

  const filteredCampaigns = campaigns.filter(c => activeTab === 'ALL' || c.channel === activeTab);

  const handleSubmit = () => {
      if (!formData.title || !formData.segmentId || !formData.content) return;

      const newCampaign: MarketingCampaign = {
          id: `camp-${Date.now()}`,
          title: formData.title,
          channel: formData.channel,
          segmentId: formData.segmentId,
          subject: formData.channel === ChannelType.EMAIL ? formData.subject : undefined,
          content: formData.content,
          status: CampaignStatus.DRAFT,
          stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
          tags: []
      };

      onAddCampaign(newCampaign);
      setIsModalOpen(false);
      setFormData({ title: '', channel: ChannelType.EMAIL, segmentId: '', subject: '', content: '' });
  };

  const getStatusBadge = (status: CampaignStatus) => {
      const styles = {
          DRAFT: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600',
          SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
          SENDING: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
          SENT: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
          ARCHIVED: 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
      };
      return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles[status]}`}>
              {status}
          </span>
      );
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Campaigns</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Create and manage your outbound messages.</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-emerald-500/20">
                <Plus className="w-4 h-4 mr-2" /> New Campaign
            </Button>
       </div>

       <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
           {/* Toolbar */}
           <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4 bg-slate-50/50 dark:bg-slate-800/50 items-center justify-between">
                <div className="flex p-1 bg-slate-200/60 dark:bg-slate-700 rounded-xl self-start sm:self-center">
                    {['ALL', 'EMAIL', 'SMS'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === tab 
                                ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'
                            }`}
                        >
                            {tab === 'ALL' ? 'All Channels' : tab}
                        </button>
                    ))}
                </div>
                
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search campaigns..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all text-sm"
                    />
                </div>
           </div>

           {/* List */}
           <div className="flex-1 overflow-x-auto">
               <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                       <tr>
                           <th className="px-6 py-4">Campaign Name</th>
                           <th className="px-6 py-4">Status</th>
                           <th className="px-6 py-4">Audience</th>
                           <th className="px-6 py-4 text-right">Stats (Open/Click)</th>
                           <th className="px-6 py-4 w-10"></th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                       {filteredCampaigns.map(campaign => (
                           <tr key={campaign.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                               <td className="px-6 py-4">
                                   <div className="flex items-center gap-3">
                                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${campaign.channel === 'EMAIL' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                                           {campaign.channel === 'EMAIL' ? <Mail className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                                       </div>
                                       <div>
                                           <p className="font-bold text-slate-900 dark:text-white text-sm">{campaign.title}</p>
                                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                               {campaign.sentDate ? `Sent ${new Date(campaign.sentDate).toLocaleDateString()}` : 'Not sent yet'}
                                           </p>
                                       </div>
                                   </div>
                               </td>
                               <td className="px-6 py-4">
                                   {getStatusBadge(campaign.status)}
                               </td>
                               <td className="px-6 py-4">
                                   <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                                       {segments.find(s => s.id === campaign.segmentId)?.name || 'Unknown List'}
                                   </span>
                               </td>
                               <td className="px-6 py-4 text-right">
                                   {campaign.status === CampaignStatus.SENT ? (
                                       <div className="flex items-center justify-end gap-4 text-sm">
                                           <span className="text-slate-600 dark:text-slate-300"><span className="font-bold">{((campaign.stats.opened || 0) / (campaign.stats.delivered || 1) * 100).toFixed(0)}%</span> Open</span>
                                           <span className="text-slate-600 dark:text-slate-300"><span className="font-bold">{((campaign.stats.clicked || 0) / (campaign.stats.delivered || 1) * 100).toFixed(0)}%</span> Click</span>
                                       </div>
                                   ) : (
                                       <span className="text-xs text-slate-400 dark:text-slate-500">No data</span>
                                   )}
                               </td>
                               <td className="px-6 py-4 text-right">
                                   <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                       <MoreHorizontal className="w-4 h-4" />
                                   </button>
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           </div>
       </div>

       <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Create Campaign"
            footer={
                <>
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Draft</Button>
                </>
            }
       >
            <div className="space-y-4 p-1">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Campaign Name</label>
                    <input 
                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="e.g. September Newsletter"
                        value={formData.title}
                        onChange={(e) => setFormData(p => ({...p, title: e.target.value}))}
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Channel</label>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setFormData(p => ({...p, channel: ChannelType.EMAIL}))}
                            className={`flex-1 py-3 border rounded-xl flex items-center justify-center gap-2 transition-all ${formData.channel === ChannelType.EMAIL ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                            <Mail className="w-4 h-4" /> Email
                        </button>
                        <button 
                             onClick={() => setFormData(p => ({...p, channel: ChannelType.SMS}))}
                             className={`flex-1 py-3 border rounded-xl flex items-center justify-center gap-2 transition-all ${formData.channel === ChannelType.SMS ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold' : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                            <Smartphone className="w-4 h-4" /> SMS
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Audience Segment</label>
                    <select 
                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={formData.segmentId}
                        onChange={(e) => setFormData(p => ({...p, segmentId: e.target.value}))}
                    >
                        <option value="">Select Audience...</option>
                        {segments.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.count} contacts)</option>
                        ))}
                    </select>
                </div>

                {formData.channel === ChannelType.EMAIL && (
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Subject Line</label>
                        <input 
                            className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Don't miss out on this deal!"
                            value={formData.subject}
                            onChange={(e) => setFormData(p => ({...p, subject: e.target.value}))}
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Content</label>
                    <textarea 
                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 h-32 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                        placeholder="Write your message here..."
                        value={formData.content}
                        onChange={(e) => setFormData(p => ({...p, content: e.target.value}))}
                    />
                </div>
            </div>
       </Modal>
    </div>
  );
};
