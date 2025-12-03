
import React, { useState, useContext, useEffect } from 'react';
import { StoreContext } from '../../store';
import { UserRole, JobTemplate } from '../../types';
import { 
    Rocket, ChevronLeft, Copy, Wand2, Star, ArrowRight,
    Users, Loader2, RefreshCcw, LogOut
} from 'lucide-react';
import { Button } from '../Button';

const SERVICE_CATEGORIES = [
    "General Maintenance", "Cleaning", "HVAC", "Plumbing", 
    "Electrical", "Lawn Care", "Pest Control", "Mobile Car Detailing", 
    "Handyman Services"
];

export const OnboardingWizard: React.FC = () => {
  const store = useContext(StoreContext);
  const [showErrorActions, setShowErrorActions] = useState(false);
  
  // Timeout for error actions
  useEffect(() => {
      const timer = setTimeout(() => {
          setShowErrorActions(true);
      }, 5000); // Show retry options after 5 seconds of loading
      return () => clearTimeout(timer);
  }, []);

  // SAFETY CHECK: Ensure everything is loaded before rendering
  if (!store || !store.currentUser || !store.settings) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
        </div>
      );
  }

  const { currentUser, settings, updateSettings, completeOnboarding, addJobTemplate, addClient, addUser, logout } = store;
  
  // SAFETY CHECK: If Admin, ensure companyId exists. If Tech, just proceed.
  // This prevents the wizard from trying to insert data with a null company_id
  if (currentUser.role === UserRole.ADMIN && !currentUser.companyId) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center flex-col gap-6 p-4">
            <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Setting up your company...</p>
            
            {showErrorActions && (
                <div className="flex flex-col gap-3 items-center animate-in fade-in duration-500 mt-4">
                    <p className="text-red-500 text-sm">Taking longer than expected.</p>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => window.location.reload()}>
                            <RefreshCcw className="w-4 h-4 mr-2" /> Retry
                        </Button>
                        <Button variant="danger" onClick={logout}>
                            <LogOut className="w-4 h-4 mr-2" /> Logout
                        </Button>
                    </div>
                </div>
            )}
        </div>
      );
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;
  
  const [step, setStep] = useState(settings?.onboardingStep || 1);
  const [aiGenerating, setAiGenerating] = useState(false);

  const [businessInfo, setBusinessInfo] = useState({
      companyName: settings?.companyName || '',
      companyAddress: settings?.companyAddress || '',
      hoursStart: settings?.businessHoursStart || '08:00',
      hoursEnd: settings?.businessHoursEnd || '18:00',
  });

  const [branding, setBranding] = useState({
      primary: settings?.brandColors?.primary || '#10b981',
      secondary: settings?.brandColors?.secondary || '#0f172a',
  });

  const [services, setServices] = useState<{categories: string[], templates: JobTemplate[]}>({
      categories: settings?.serviceCategories || [],
      templates: []
  });

  const [finance, setFinance] = useState({
      taxName: settings?.taxName || 'Sales Tax',
      taxRate: settings?.taxRate || 0,
      paymentMethods: settings?.paymentMethods || [],
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
        {/* Wizard UI */}
        <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[80vh]">
            {/* Steps Rendering Logic */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {step === 1 && (<div className="text-center pt-10"><div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"><Rocket className="w-10 h-10" /></div><h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Company Created!</h1><div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-8 mt-6 relative"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Invite Code</p><div className="text-4xl font-mono font-bold text-slate-900 dark:text-white tracking-widest">{settings.companyCode || '...'}</div><button onClick={() => navigator.clipboard.writeText(settings.companyCode || '')} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-emerald-500"><Copy className="w-5 h-5" /></button></div><Button onClick={handleNext} className="w-full h-12 text-lg">Start Setup</Button></div>)}
                
                {step === 2 && (
                    <div className="max-w-lg mx-auto">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Business Details</h2>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-bold mb-1 dark:text-slate-300">Company Name</label><input className="w-full border rounded-lg p-3 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" value={businessInfo.companyName} onChange={e => setBusinessInfo({...businessInfo, companyName: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold mb-1 dark:text-slate-300">Address / Location</label><input className="w-full border rounded-lg p-3 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" value={businessInfo.companyAddress} onChange={e => setBusinessInfo({...businessInfo, companyAddress: e.target.value})} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold mb-1 dark:text-slate-300">Start Time</label><input type="time" className="w-full border rounded-lg p-3 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" value={businessInfo.hoursStart} onChange={e => setBusinessInfo({...businessInfo, hoursStart: e.target.value})} /></div>
                                <div><label className="block text-sm font-bold mb-1 dark:text-slate-300">End Time</label><input type="time" className="w-full border rounded-lg p-3 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" value={businessInfo.hoursEnd} onChange={e => setBusinessInfo({...businessInfo, hoursEnd: e.target.value})} /></div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="max-w-lg mx-auto">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Services</h2>
                        <div className="flex flex-wrap gap-2 mb-6">
                            {SERVICE_CATEGORIES.map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => setServices(prev => prev.categories.includes(cat) ? {...prev, categories: prev.categories.filter(c => c !== cat)} : {...prev, categories: [...prev.categories, cat]})}
                                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${services.categories.includes(cat) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 4 && (<div className="max-w-lg mx-auto text-center pt-8"><div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6"><Wand2 className="w-8 h-8" /></div><h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">AI Setup</h2><textarea value={aiContext} onChange={e => setAiContext(e.target.value)} className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 resize-none outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white" placeholder="Describe your business services..." /><div className="flex gap-3"><Button variant="secondary" onClick={handleNext} className="w-1/3">Skip</Button><Button onClick={() => { aiGenerateTemplates(); handleNext(); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">Generate <Star className="w-4 h-4 ml-2 fill-current" /></Button></div></div>)}
                
                {step === 5 && (
                    <div className="max-w-lg mx-auto">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Service Templates</h2>
                        <div className="space-y-3">
                            {services.templates.map((tmpl, idx) => (
                                <div key={idx} className="p-4 border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800 rounded-xl flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-emerald-900 dark:text-emerald-100">{tmpl.name}</p>
                                        <p className="text-sm text-emerald-700 dark:text-emerald-300">${tmpl.defaultPrice} • {tmpl.defaultDurationMinutes} mins</p>
                                    </div>
                                    <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                                </div>
                            ))}
                            {services.templates.length === 0 && <p className="text-slate-500 text-center py-4">No templates generated. You can add them later in Settings.</p>}
                        </div>
                    </div>
                )}

                {step === 6 && (
                    <div className="max-w-lg mx-auto">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">First Client</h2>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-bold mb-1 dark:text-slate-300">Client Name</label><input className="w-full border rounded-lg p-3 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" placeholder="e.g. Jane Doe" value={firstClient.name} onChange={e => setFirstClient({...firstClient, name: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold mb-1 dark:text-slate-300">Email (Optional)</label><input className="w-full border rounded-lg p-3 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" placeholder="jane@example.com" value={firstClient.email} onChange={e => setFirstClient({...firstClient, email: e.target.value})} /></div>
                        </div>
                    </div>
                )}

                {step > 6 && (<div className="max-w-lg mx-auto text-center pt-10"><h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Almost Done!</h2><Button onClick={handleFinish} size="lg" className="w-full text-lg shadow-xl shadow-emerald-500/20">Launch Dashboard 🚀</Button></div>)}
            </div>
            {step > 1 && step <= 6 && (<div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0"><button onClick={handleBack} className="flex items-center text-slate-500 font-bold px-4 py-2"><ChevronLeft className="w-4 h-4 mr-1" /> Back</button><Button onClick={handleNext} disabled={aiGenerating}>{aiGenerating ? 'Processing...' : 'Next Step'} <ArrowRight className="w-4 h-4 ml-2" /></Button></div>)}
        </div>
    </div>
  );
};

const CheckCircleIcon = ({className}:{className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
);
