import React, { useState, useContext, useEffect } from 'react';
import { StoreContext } from '../../store';
import { UserRole, JobTemplate } from '../../types';
import { 
    Rocket, ChevronLeft, Copy, Wand2, Star, ArrowRight,
    Users
} from 'lucide-react';
import { Button } from '../Button';

const SERVICE_CATEGORIES = [
    "General Maintenance", "Cleaning", "HVAC", "Plumbing", 
    "Electrical", "Lawn Care", "Pest Control", "Mobile Car Detailing", 
    "Handyman Services"
];

export const OnboardingWizard: React.FC = () => {
  const store = useContext(StoreContext);
  const { currentUser, settings, updateSettings, completeOnboarding, addJobTemplate, addClient, addUser } = store;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  
  const [step, setStep] = useState(settings.onboardingStep || 1);
  const [aiGenerating, setAiGenerating] = useState(false);

  const [businessInfo, setBusinessInfo] = useState({
      companyName: settings.companyName || '',
      companyAddress: settings.companyAddress || '',
      hoursStart: settings.businessHoursStart || '08:00',
      hoursEnd: settings.businessHoursEnd || '18:00',
  });

  const [branding, setBranding] = useState({
      primary: settings.brandColors?.primary || '#10b981',
      secondary: settings.brandColors?.secondary || '#0f172a',
  });

  const [services, setServices] = useState<{categories: string[], templates: JobTemplate[]}>({
      categories: settings.serviceCategories || [],
      templates: []
  });

  const [finance, setFinance] = useState({
      taxName: settings.taxName || 'Sales Tax',
      taxRate: settings.taxRate || 0,
      paymentMethods: settings.paymentMethods || [],
  });

  const [aiContext, setAiContext] = useState("");
  const [firstClient, setFirstClient] = useState({ name: '', email: '' });

  useEffect(() => {
      if (isAdmin && step > (settings.onboardingStep || 1)) {
          updateSettings({ onboardingStep: step });
      }
  }, [step]);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => Math.max(1, prev - 1));

  const aiGenerateTemplates = async () => {
      setAiGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const context = aiContext.toLowerCase();
      let suggestions: JobTemplate[] = [];

      if (context.includes("clean") || context.includes("detail")) {
          suggestions.push(
              { id: crypto.randomUUID(), name: "Standard Interior Detail", description: "Vacuum, wipe down, windows.", defaultPrice: 150, defaultDurationMinutes: 120, category: "Detailing" },
              { id: crypto.randomUUID(), name: "Exterior Wash & Wax", description: "Hand wash, clay bar, wax.", defaultPrice: 100, defaultDurationMinutes: 60, category: "Detailing" }
          );
      } else {
          suggestions.push(
              { id: crypto.randomUUID(), name: "Standard Service Call", description: "Diagnostic and basic labor.", defaultPrice: 99, defaultDurationMinutes: 60, category: "General" }
          );
      }

      setServices(prev => ({ ...prev, templates: suggestions }));
      setAiGenerating(false);
  };

  const handleFinish = async () => {
      if (isAdmin) {
          await updateSettings({
              companyName: businessInfo.companyName,
              companyAddress: businessInfo.companyAddress,
              businessHoursStart: businessInfo.hoursStart,
              businessHoursEnd: businessInfo.hoursEnd,
              brandColors: branding,
              serviceCategories: services.categories,
              taxName: finance.taxName,
              taxRate: Number(finance.taxRate),
              paymentMethods: finance.paymentMethods,
              onboardingStep: 9
          });

          for (const tmpl of services.templates) {
              await addJobTemplate(tmpl);
          }

          if (firstClient.name) {
              await addClient({
                  id: crypto.randomUUID(),
                  firstName: firstClient.name.split(' ')[0],
                  lastName: firstClient.name.split(' ')[1] || '',
                  email: firstClient.email,
                  phone: '',
                  companyName: '',
                  billingAddress: { street: '', city: '', state: '', zip: '' },
                  properties: [{ id: crypto.randomUUID(), clientId: '', address: { street: 'Main St', city: '', state: '', zip: '' } }],
                  tags: ['New'],
                  createdAt: new Date().toISOString()
              });
          }
      }
      await completeOnboarding();
  };

  if (!isAdmin) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome!</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    You've joined <strong>{settings.companyName}</strong>.
                </p>
                <Button onClick={() => completeOnboarding()} className="w-full h-12 text-lg">Go to Dashboard</Button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        {/* Wizard UI Omitted */}
        <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[80vh]">
            {/* Steps Rendering Logic */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {step === 1 && (<div className="text-center pt-10"><div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"><Rocket className="w-10 h-10" /></div><h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Company Created!</h1><div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-8 mt-6 relative"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Invite Code</p><div className="text-4xl font-mono font-bold text-slate-900 dark:text-white tracking-widest">{settings.companyCode || '...'}</div><button onClick={() => navigator.clipboard.writeText(settings.companyCode || '')} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-emerald-500"><Copy className="w-5 h-5" /></button></div><Button onClick={handleNext} className="w-full h-12 text-lg">Start Setup</Button></div>)}
                {/* ... Steps 2 to 6 ... */}
                {step === 4 && (<div className="max-w-lg mx-auto text-center pt-8"><div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6"><Wand2 className="w-8 h-8" /></div><h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">AI Setup</h2><textarea value={aiContext} onChange={e => setAiContext(e.target.value)} className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 resize-none" placeholder="Describe your business..." /><div className="flex gap-3"><Button variant="secondary" onClick={handleNext} className="w-1/3">Skip</Button><Button onClick={() => { aiGenerateTemplates(); handleNext(); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">Generate <Star className="w-4 h-4 ml-2 fill-current" /></Button></div></div>)}
                {/* ... */}
                {step > 6 && (<div className="max-w-lg mx-auto text-center pt-10"><h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Almost Done!</h2><Button onClick={handleFinish} size="lg" className="w-full text-lg shadow-xl shadow-emerald-500/20">Launch Dashboard 🚀</Button></div>)}
            </div>
            {step > 1 && step <= 6 && (<div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0"><button onClick={handleBack} className="flex items-center text-slate-500 font-bold px-4 py-2"><ChevronLeft className="w-4 h-4 mr-1" /> Back</button><Button onClick={handleNext} disabled={aiGenerating}>{aiGenerating ? 'Processing...' : 'Next Step'} <ArrowRight className="w-4 h-4 ml-2" /></Button></div>)}
        </div>
    </div>
  );
};