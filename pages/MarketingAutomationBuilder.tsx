import React, { useState, useContext } from 'react';
import { StoreContext } from '../store';
import { useParams, useNavigate } from 'react-router-dom';
import { MarketingAutomation, AutomationTriggerType, AutomationActionType } from '../types';
import { ArrowLeft, Save, Zap, Plus, Trash2, Mail } from 'lucide-react';
import { Button } from '../components/Button';

export const MarketingAutomationBuilder: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useContext(StoreContext);
  const existingAuto = id && id !== 'new' ? store.marketingAutomations.find((a: any) => a.id === id) : null;

  const [formData, setFormData] = useState<Partial<MarketingAutomation>>(existingAuto || {
      title: 'New Automation', trigger: 'JOB_COMPLETED', triggerConfig: {}, actions: [], status: 'PAUSED', stats: { active: 0, completed: 0, revenue: 0 }
  });

  const handleSave = () => {
      const auto: MarketingAutomation = {
          id: existingAuto?.id || crypto.randomUUID(),
          title: formData.title || 'Untitled',
          trigger: formData.trigger!,
          triggerConfig: formData.triggerConfig,
          actions: formData.actions || [],
          status: formData.status || 'PAUSED',
          stats: formData.stats || { active: 0, completed: 0, revenue: 0 },
          steps: (formData.actions || []).length
      };
      store.addAutomation(auto); 
      navigate('/marketing/automations');
  };

  const addAction = (type: AutomationActionType) => {
      const newAction = { type, config: { emailSubject: 'New Message', emailBody: 'Hello...' } };
      setFormData(p => ({ ...p, actions: [...(p.actions || []), newAction] }));
  };

  const removeAction = (index: number) => {
      setFormData(p => ({ ...p, actions: p.actions?.filter((_, i) => i !== index) }));
  };

  const updateActionConfig = (index: number, key: string, value: string) => {
      const actions = [...(formData.actions || [])];
      actions[index] = { ...actions[index], config: { ...actions[index].config, [key]: value } };
      setFormData(p => ({ ...p, actions }));
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
        {/* UI Elements Omitted for brevity */}
        <button onClick={() => navigate('/marketing/automations')} className="flex items-center text-slate-500 hover:text-slate-900 mb-6 font-medium"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Workflow Builder</h1>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700"><Save className="w-4 h-4 mr-2" /> Save Workflow</Button>
        </div>
        {/* ... Rest of Builder ... */}
    </div>
  );
};