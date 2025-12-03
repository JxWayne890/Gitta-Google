
import React, { useState, useContext } from 'react';
import { StoreContext } from '../../store';
import { UserRole, JobTemplate } from '../../types';
import { 
    Rocket, ChevronLeft, Wand2, ArrowRight,
    Users, Loader2, Clock, Briefcase, CheckCircle, Star
} from 'lucide-react';
import { Button } from '../Button';

const SERVICE_CATEGORIES = [
    "General Maintenance", "Cleaning", "HVAC", "Plumbing", 
    "Electrical", "Lawn Care", "Pest Control", "Mobile Car Detailing", 
    "Handyman Services"
];

export const OnboardingWizard: React.FC = () => {
  const store = useContext(StoreContext);
  
  // Local state for wizard data - resilient against missing store data
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Initialize with sensible defaults, using store data if available
  const [businessInfo, setBusinessInfo] = useState({
      companyName: store?.settings?.companyName || '',
      companyAddress: store?.settings?.companyAddress || '',
      hoursStart: '08:00',
      hoursEnd: '18:00',
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [generatedTemplates, setGeneratedTemplates] = useState<JobTemplate[]>([]);
  const [firstClient, setFirstClient] = useState({ name: '', email: '' });
  const [aiContext, setAiContext] = useState("");

  if (!store || !store.currentUser) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  const { currentUser, settings, updateSettings, completeOnboarding, addJobTemplate, addClient } = store;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  // Non-Admin Welcome Screen
  if (!isAdmin) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center border border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome to the Team!</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    You've joined <strong>{settings?.companyName || 'your company'}</strong>.
                </p>
                <Button onClick={() => completeOnboarding()} className="w-full h-12 text-lg">Go to Dashboard</Button>
            </div>
        </div>
      );
  }

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => Math.max(1, prev - 1));

  const aiGenerateTemplates = async () => {
      setAiGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulating AI delay
      
      const context = aiContext.toLowerCase();
      let suggestions: JobTemplate[] = [];

      if (context.includes("clean") || context.includes("detail")) {
          suggestions.push(
              { id: crypto.randomUUID(), name: "Standard Interior Detail", description: "Vacuum, wipe down, windows.", defaultPrice: 150, defaultDurationMinutes: 120, category: "Detailing" },
              { id: crypto.randomUUID(), name: "Exterior Wash & Wax", description: "Hand wash, clay bar, wax.", defaultPrice: 100, defaultDurationMinutes: 60, category: "Detailing" }
          );
      } else if (context.includes("lawn") || context.includes("landscap")) {
          suggestions.push(
              { id: crypto.randomUUID(), name: "Weekly Mow & Trim", description: "Mowing, edging, and blowing.", defaultPrice: 60, defaultDurationMinutes: 45, category: "Lawn Care" }
          );
      } else {
          suggestions.push(
              { id: crypto.randomUUID(), name: "Standard Service Call", description: "Diagnostic and basic labor.", defaultPrice: 99, defaultDurationMinutes: 60, category: "General" }
          );
      }

      setGeneratedTemplates(suggestions);
      setAiGenerating(false);
  };

  const handleFinish = async () => {
      setIsSubmitting(true);
      try {
          // 1. Save Settings
          await updateSettings({
              companyName: businessInfo.companyName,
              companyAddress: businessInfo.companyAddress,
              businessHoursStart: businessInfo.hoursStart,
              businessHoursEnd: businessInfo.hoursEnd,
              serviceCategories: selectedServices,
              onboardingStep: 99
          });

          // 2. Save Templates
          for (const tmpl of generatedTemplates) {
              await addJobTemplate(tmpl);
          }

          // 3. Create First Client
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

          // 4. Mark Complete
          await completeOnboarding();
          
      } catch (error) {
          console.error("Onboarding failed:", error);
          alert("Something went wrong saving your data. Please try again.");
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[85vh]">
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5">
                <div className="bg-emerald-500 h-1.5 transition-all duration-500" style={{ width: `${(step / 6) * 100}%` }}></div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                
                {/* STEP 1: WELCOME & COMPANY INFO */}
                {step === 1 && (
                    <div className="max-w-lg mx-auto text-center pt-8">
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <Rocket className="w-10 h-10" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Let's set up your business</h1>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">We'll get your account ready in just a few steps.</p>
                        
                        <div className="text-left space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Company Name</label>
                                <input 
                                    className="w-full border rounded-lg p-3 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" 
                                    value={businessInfo.companyName} 
                                    onChange={e => setBusinessInfo({...businessInfo, companyName: e.target.value})}
                                    placeholder="e.g. Acme Services"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Address / City</label>
                                <input 
                                    className="w-full border rounded-lg p-3 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" 
                                    value={businessInfo.companyAddress} 
                                    onChange={e => setBusinessInfo({...businessInfo, companyAddress: e.target.value})}
                                    placeholder="e.g. Lubbock, TX"
                                />
                            </div>
                        </div>
                        
                        <div className="mt-8">
                            <Button onClick={handleNext} className="w-full h-12 text-lg">Next Step</Button>
                        </div>
                    </div>
                )}

                {/* STEP 2: HOURS */}
                {step === 2 && (
                    <div className="max-w-lg mx-auto">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Clock className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Business Hours</h2>
                            <p className="text-slate-500 dark:text-slate-400">Set your default availability for scheduling.</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">Start Time</label>
                                <input type="time" className="w-full border rounded-lg p-3 bg-white dark:bg-slate-800 dark:border-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" value={businessInfo.hoursStart} onChange={e => setBusinessInfo({...businessInfo, hoursStart: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">End Time</label>
                                <input type="time" className="w-full border rounded-lg p-3 bg-white dark:bg-slate-800 dark:border-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" value={businessInfo.hoursEnd} onChange={e => setBusinessInfo({...businessInfo, hoursEnd: e.target.value})} />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: SERVICES */}
                {step === 3 && (
                    <div className="max-w-lg mx-auto">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">What do you do?</h2>
                            <p className="text-slate-500 dark:text-slate-400">Select categories that fit your business.</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                            {SERVICE_CATEGORIES.map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => setSelectedServices(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                                    className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${selectedServices.includes(cat) ? 'bg-purple-600 text-white border-purple-600 shadow-md transform scale-105' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 4: AI TEMPLATES */}
                {step === 4 && (
                    <div className="max-w-lg mx-auto text-center">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Wand2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">AI Service Setup</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">Describe your services (e.g. "We do pressure washing and window cleaning") and I'll generate pricing templates for you.</p>
                        
                        <textarea 
                            value={aiContext} 
                            onChange={e => setAiContext(e.target.value)} 
                            className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl mb-6 resize-none outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white text-sm" 
                            placeholder="e.g. I run a detailing business. We offer interior details for $150 and exterior washes for $50." 
                        />
                        
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={handleNext} className="w-1/3">Skip</Button>
                            <Button onClick={() => { aiGenerateTemplates(); handleNext(); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                                Generate Services <Star className="w-4 h-4 ml-2 fill-current" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* STEP 5: REVIEW TEMPLATES */}
                {step === 5 && (
                    <div className="max-w-lg mx-auto">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">Your Service Menu</h2>
                        <div className="space-y-3 mb-8">
                            {generatedTemplates.length > 0 ? generatedTemplates.map((tmpl, idx) => (
                                <div key={idx} className="p-4 border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800 rounded-xl flex justify-between items-center animate-in fade-in slide-in-from-bottom-2" style={{animationDelay: `${idx * 100}ms`}}>
                                    <div>
                                        <p className="font-bold text-emerald-900 dark:text-emerald-100">{tmpl.name}</p>
                                        <p className="text-sm text-emerald-700 dark:text-emerald-300">${tmpl.defaultPrice} • {tmpl.defaultDurationMinutes} mins</p>
                                    </div>
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                            )) : (
                                <p className="text-center text-slate-500 italic py-8">No templates generated. You can add them manually later.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 6: FIRST CLIENT */}
                {step === 6 && (
                    <div className="max-w-lg mx-auto">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add your first client</h2>
                            <p className="text-slate-500 dark:text-slate-400">Optional: Add a client to get started quickly.</p>
                        </div>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Client Name</label><input className="w-full border rounded-lg p-3 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" placeholder="e.g. Jane Doe" value={firstClient.name} onChange={e => setFirstClient({...firstClient, name: e.target.value})} /></div>
                            <div><label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-300">Email</label><input className="w-full border rounded-lg p-3 bg-slate-50 dark:bg-slate-900 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" placeholder="jane@example.com" value={firstClient.email} onChange={e => setFirstClient({...firstClient, email: e.target.value})} /></div>
                        </div>
                    </div>
                )}

            </div>

            {/* Navigation Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
                {step > 1 ? (
                    <button onClick={handleBack} className="flex items-center text-slate-500 font-bold px-4 py-2 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </button>
                ) : <div></div>}

                {step < 6 ? (
                    <Button onClick={handleNext} disabled={aiGenerating}>
                        {aiGenerating ? 'Processing...' : 'Next Step'} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button onClick={handleFinish} size="lg" className="shadow-xl shadow-emerald-500/20" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Launch Dashboard 🚀'}
                    </Button>
                )}
            </div>
        </div>
    </div>
  );
};
