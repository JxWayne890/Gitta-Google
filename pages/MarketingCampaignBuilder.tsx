import React, { useState, useContext } from 'react';
import { StoreContext } from '../store';
import { useNavigate, useParams } from 'react-router-dom';
import { CampaignStatus, MarketingCampaign, ChannelType } from '../types';
import { ArrowLeft, Send, Save, Calendar, Eye, Users, User, Check, Search, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

export const MarketingCampaignBuilder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useContext(StoreContext);
  const existingCampaign = id && id !== 'new' ? store?.marketingCampaigns.find((c: any) => c.id === id) : null;

  const [formData, setFormData] = useState<Partial<MarketingCampaign>>(existingCampaign || {
      title: '', subject: '', previewText: '', fromName: 'MasterClean HQ', content: '',
      channel: ChannelType.EMAIL, status: CampaignStatus.DRAFT, segmentId: '', targetClientIds: []
  });

  const [audienceType, setAudienceType] = useState<'SEGMENT' | 'INDIVIDUAL'>(
      existingCampaign?.targetClientIds && existingCampaign.targetClientIds.length > 0 ? 'INDIVIDUAL' : 'SEGMENT'
  );
  
  const [clientSearch, setClientSearch] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!store) return null;

  const handleSave = async (status: CampaignStatus, schedule?: string) => {
      if (!formData.title) {
          alert("Please enter a campaign name");
          return;
      }

      setIsSaving(true);

      const segmentId = audienceType === 'SEGMENT' ? formData.segmentId : '';
      const targetClientIds = audienceType === 'INDIVIDUAL' ? formData.targetClientIds : [];

      const campaign: MarketingCampaign = {
          id: existingCampaign?.id || crypto.randomUUID(),
          companyId: store.currentUser.companyId,
          title: formData.title || 'Untitled',
          subject: formData.subject,
          previewText: formData.previewText,
          fromName: formData.fromName,
          content: formData.content || '',
          channel: formData.channel || ChannelType.EMAIL,
          status: status,
          segmentId: segmentId || '',
          targetClientIds: targetClientIds,
          scheduledDate: schedule,
          sentDate: existingCampaign?.sentDate,
          stats: existingCampaign?.stats || { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
          tags: []
      };

      try {
          let res;
          if (existingCampaign) {
              res = await store.updateCampaign(campaign);
          } else {
              res = await store.addCampaign(campaign);
          }
          
          if (res.error) throw res.error;

          setTimeout(() => {
              navigate('/marketing/campaigns');
          }, 100);
      } catch (error) {
          console.error("Failed to save campaign", error);
          alert("Failed to save campaign. Please try again.");
          setIsSaving(false);
      }
  };

  const toggleClientSelection = (clientId: string) => {
      const current = formData.targetClientIds || [];
      if (current.includes(clientId)) {
          setFormData({ ...formData, targetClientIds: current.filter(id => id !== clientId) });
      } else {
          setFormData({ ...formData, targetClientIds: [...current, clientId] });
      }
  };

  const filteredClients = store.clients.filter((c: any) => 
      c.firstName.toLowerCase().includes(clientSearch.toLowerCase()) || 
      c.lastName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto pb-20">
        {/* UI Omitted for brevity */}
        <button onClick={() => navigate('/marketing/campaigns')} className="flex items-center text-slate-500 hover:text-slate-900 mb-6 font-medium"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
        <div className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold text-slate-900 dark:text-white">{id === 'new' ? 'New Campaign' : 'Edit Campaign'}</h1><div className="flex gap-3"><Button variant="secondary" onClick={() => handleSave(CampaignStatus.DRAFT)} disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Draft</Button><Button onClick={() => setIsScheduleModalOpen(true)} disabled={isSaving}><Send className="w-4 h-4 mr-2" /> Send / Schedule</Button></div></div>
        {/* ... Rest of Campaign Builder ... */}
        <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title="Review & Schedule" footer={<><Button variant="ghost" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button><Button onClick={() => handleSave(scheduleDate ? CampaignStatus.SCHEDULED : CampaignStatus.SENDING, scheduleDate)} className="bg-emerald-600 text-white" disabled={isSaving}>{isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}{scheduleDate ? 'Schedule' : 'Send Now'}</Button></>}>
            <div className="p-4 space-y-4">
                <div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="datetime-local" className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} /></div>
                <p className="text-xs text-slate-500 mt-2">Leave blank to send immediately.</p>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800 text-sm">Sending to <strong>{audienceType === 'SEGMENT' ? 'Audience Segment' : `${formData.targetClientIds?.length || 0} Selected Clients`}</strong>.</div>
            </div>
        </Modal>
    </div>
  );
};