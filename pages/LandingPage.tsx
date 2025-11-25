
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { 
  CheckCircle2, ArrowRight, Zap, Smartphone, Shield,
  MapPin, CreditCard, Car, Hammer, Home, Wrench, Droplets, TreePine, Check,
  Users, Search, Briefcase, User, Building2, ArrowLeft, Lock, Mail
} from 'lucide-react';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '../components/PublicNavbar';
import { BusinessType, UserRole } from '../types';
import { Modal } from '../components/Modal';
import { StoreContext } from '../store';

// Full industry list for the wizard
const ALL_INDUSTRIES = [
  "Mobile Detailing", "Landscaping", "Lawn Care", "Pressure Washing", "HVAC",
  "Plumbing", "Electrical", "Roofing", "Solar Installation", "Pest Control",
  "Pool Cleaning", "Window Cleaning", "Appliance Repair", "Handyman Services",
  "Painting", "Flooring", "Garage Door Repair", "Junk Removal", "Carpet Cleaning",
  "Tree Service", "Remodeling", "General Contracting", "Fencing", "Gutter Cleaning",
  "Concrete & Masonry", "Auto Glass Repair", "Irrigation & Sprinkler Repair",
  "Towing Service", "Locksmith Service", "Mobile Mechanic", "Chimney Sweeping",
  "Crawlspace & Moisture Control", "Water Damage Restoration", "Mold Remediation",
  "House Cleaning", "Moving Services", "Septic System Service", "Pest Exclusion",
  "Tile & Grout Cleaning", "Vinyl Siding Installation", "Deck Building",
  "Fence Staining", "Power Equipment Repair", "Generator Installation",
  "Carpet Dyeing", "Upholstery Cleaning", "Security System Installation",
  "Home Theater Installation", "Irrigation Winterization", "Commercial Janitorial",
  "Asphalt Paving", "Sealcoating", "Parking Lot Striping", "Snow Removal"
];

const CAROUSEL_INDUSTRIES = [
  "Mobile Detailing", "Landscaping", "Lawn Care", "Pressure Washing", "HVAC",
  "Plumbing", "Electrical", "Roofing", "Solar Installation", "Pest Control",
  "Pool Cleaning", "Window Cleaning", "Appliance Repair", "Handyman Services",
  "Painting", "Flooring", "Garage Door Repair", "Junk Removal", "Carpet Cleaning",
  "Tree Service", "Remodeling & Construction", "Fencing", "Gutter Cleaning",
  "Concrete & Masonry", "Auto Glass Repair", "Towing Services", "Irrigation & Sprinkler Repair"
];

// Helper to map a specific industry string to a broad BusinessType for logic
const getBusinessTypeFromIndustry = (industry: string): BusinessType => {
    const lower = industry.toLowerCase();
    if (lower.includes('detailing') || lower.includes('auto') || lower.includes('towing') || lower.includes('mechanic')) return BusinessType.MOBILE_DETAILING;
    if (lower.includes('landscap') || lower.includes('lawn') || lower.includes('tree') || lower.includes('irrigation')) return BusinessType.LANDSCAPING;
    if (lower.includes('roof') || lower.includes('siding')) return BusinessType.ROOFING;
    if (lower.includes('plumb') || lower.includes('hvac') || lower.includes('electric')) return BusinessType.PLUMBING;
    if (lower.includes('wash') || lower.includes('gutter') || lower.includes('window') || lower.includes('clean')) return BusinessType.PRESSURE_WASHING;
    if (lower.includes('construct') || lower.includes('model') || lower.includes('concrete') || lower.includes('masonry') || lower.includes('fenc')) return BusinessType.CONSTRUCTION;
    return BusinessType.OTHER;
};

// Industry Icon Helper
const getIndustryIcon = (industry: string) => {
    const type = getBusinessTypeFromIndustry(industry);
    switch (type) {
        case BusinessType.MOBILE_DETAILING: return Car;
        case BusinessType.LANDSCAPING: return TreePine;
        case BusinessType.ROOFING: return Home;
        case BusinessType.CONSTRUCTION: return Hammer;
        case BusinessType.PLUMBING: return Wrench;
        case BusinessType.PRESSURE_WASHING: return Droplets;
        default: return Briefcase;
    }
};

// Helper Component for Industry Items
const IndustryItem: React.FC<{ name: string }> = ({ name }) => {
  const firstSpaceIndex = name.indexOf(' ');
  const firstWord = firstSpaceIndex === -1 ? name : name.substring(0, firstSpaceIndex);
  const rest = firstSpaceIndex === -1 ? '' : name.substring(firstSpaceIndex);

  return (
    <span className="text-xl md:text-2xl tracking-tight cursor-default hover:text-teal-600 transition-colors duration-300 flex-shrink-0">
      <span className="font-black text-slate-800 uppercase">{firstWord}</span>
      <span className="font-light text-slate-600">{rest}</span>
    </span>
  );
};

// --- STATE TYPES ---
type AuthMode = 'NONE' | 'SIGN_IN' | 'SIGN_UP' | 'ONBOARDING';

interface OnboardingState {
    step: number;
    industry: string | null;
    businessName: string;
    phone: string;
    technicians: string[]; 
}

interface SignUpState {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export const LandingPage: React.FC = () => {
  const store = useContext(StoreContext);
  const { login, signUp, darkMode, toggleDarkMode } = store!;

  // Hero State
  const [currentText, setCurrentText] = useState("Mobile Detailing");
  const [isAnimating, setIsAnimating] = useState(false);
  const [sequence, setSequence] = useState<string[]>([]);
  
  // --- MODAL & FLOW STATE ---
  const [authMode, setAuthMode] = useState<AuthMode>('NONE');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [signUpData, setSignUpData] = useState<SignUpState>({
      firstName: '',
      lastName: '',
      email: '',
      password: ''
  });

  const [onboardingData, setOnboardingData] = useState<OnboardingState>({
      step: 1,
      industry: null,
      businessName: '',
      phone: '',
      technicians: []
  });

  // Inputs
  const [industrySearch, setIndustrySearch] = useState('');
  const [techInput, setTechInput] = useState('');
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // --- HANDLERS ---

  const handleOpenSignIn = () => { setAuthError(null); setAuthMode('SIGN_IN'); };
  const handleOpenSignUp = () => { setAuthError(null); setAuthMode('SIGN_UP'); };
  const handleCloseModal = () => setAuthMode('NONE');

  const handleSignInSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError(null);
      if (!signInEmail || !signInPassword) {
          setAuthError('Email and password are required.');
          return;
      }
      setIsLoading(true);
      const { error } = await login(signInEmail, signInPassword);
      setIsLoading(false);
      if (error) {
          setAuthError(error.message || 'Failed to sign in');
      }
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (signUpData.firstName && signUpData.email && signUpData.password) {
          // Move to onboarding
          setAuthMode('ONBOARDING');
      } else {
          setAuthError('Please fill in all fields.');
      }
  };

  // Onboarding Handlers
  const filteredIndustries = useMemo(() => {
      if (!industrySearch) return ALL_INDUSTRIES;
      return ALL_INDUSTRIES.filter(i => i.toLowerCase().includes(industrySearch.toLowerCase()));
  }, [industrySearch]);

  const handleAddTech = () => {
      if (techInput.trim()) {
          setOnboardingData(prev => ({ ...prev, technicians: [...prev.technicians, techInput.trim()] }));
          setTechInput('');
      }
  };

  const handleRemoveTech = (index: number) => {
      setOnboardingData(prev => ({
          ...prev,
          technicians: prev.technicians.filter((_, i) => i !== index)
      }));
  };

  const handleNextStep = () => setOnboardingData(prev => ({ ...prev, step: prev.step + 1 }));
  const handlePrevStep = () => setOnboardingData(prev => ({ ...prev, step: prev.step - 1 }));

  const handleCompleteOnboarding = async () => {
      if (onboardingData.industry) {
          setIsLoading(true);
          const mappedType = getBusinessTypeFromIndustry(onboardingData.industry);
          const userData = {
              name: `${signUpData.firstName} ${signUpData.lastName}`,
              businessName: onboardingData.businessName,
              industry: onboardingData.industry,
              phone: onboardingData.phone,
              role: UserRole.ADMIN,
              businessType: mappedType,
              // Ideally technicians would be created as user records here too, but we'll skip for simplicity
          };
          
          const { error } = await signUp(signUpData.email, signUpData.password, userData);
          setIsLoading(false);
          
          if (error) {
              setAuthError(error.message || 'Failed to create account');
          }
          // If success, auth listener in Store handles the rest
      }
  };

  // Setup Hero Sequence
  useEffect(() => {
    const others = CAROUSEL_INDUSTRIES.filter(t => t !== "Mobile Detailing");
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    setSequence(["Mobile Detailing", ...others]);
  }, []);

  // Hero Animation Loop
  useEffect(() => {
    if (sequence.length === 0) return;
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentText((prev) => {
            const currIdx = sequence.indexOf(prev);
            return sequence[(currIdx + 1) % sequence.length];
        });
        setIsAnimating(false);
      }, 500); 
    }, 2000);
    return () => clearInterval(interval);
  }, [sequence]);

  // Hero Font Sizing
  const getDynamicFontSize = (text: string) => {
    if (text.length > 25) return "text-3xl sm:text-4xl md:text-6xl";
    if (text.length > 14) return "text-4xl sm:text-5xl md:text-7xl";
    return "text-5xl sm:text-6xl md:text-8xl";
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 dark:bg-slate-950 dark:text-white transition-colors duration-200">
      
      <PublicNavbar onSignIn={handleOpenSignIn} onGetStarted={handleOpenSignUp} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      {/* --- HERO SECTION --- */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-6 overflow-hidden relative bg-white dark:bg-slate-950 transition-colors duration-200">
        {/* Background Decorative Blurs */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-br from-teal-100 to-slate-200 dark:from-teal-900/20 dark:to-slate-800/20 rounded-full blur-3xl opacity-40 -z-10"></div>
        
        <div className="max-w-[90rem] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wide mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
            New: AI Marketing Automations
          </div>
          
          <h1 className="font-extrabold text-slate-900 dark:text-white tracking-tight mb-8 mx-auto leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 fill-mode-both delay-100 flex flex-col items-center w-full">
            
            {/* ROW 1 */}
            <span className="text-4xl sm:text-5xl md:text-7xl block mb-2 md:mb-4">
              The All-In-One CRM for
            </span>

            {/* ROW 2: Dynamic Rotating Text */}
            <span className="flex items-center justify-center h-[1.2em] w-full overflow-visible px-2 md:px-4 my-1 md:my-2">
               <span 
                  className={`
                    block text-center whitespace-nowrap transition-all duration-500 ease-in-out transform
                    text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-400 pb-2
                    ${isAnimating ? 'opacity-0 translate-y-4 blur-sm scale-95' : 'opacity-100 translate-y-0 blur-0 scale-100'}
                    ${getDynamicFontSize(currentText)}
                  `}
               >
                  {currentText}
               </span>
            </span>

            {/* ROW 3 */}
            <span className="text-4xl sm:text-5xl md:text-7xl block mt-2 md:mt-4">
              Empires.
            </span>

          </h1>
          
          <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both delay-200">
            Stop juggling spreadsheets and lost leads. Schedule jobs, track crews, invoice customers, and automate your growth from one beautiful dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-in fade-in slide-in-from-bottom-10 duration-700 fill-mode-both delay-300">
             <Button size="lg" onClick={handleOpenSignUp} className="h-14 px-8 text-lg shadow-2xl shadow-teal-600/20 hover:shadow-teal-600/30 hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
             </Button>
             <Link to="/features" className="flex items-center justify-center h-14 px-8 rounded-lg border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all w-full sm:w-auto">
                View Features
             </Link>
          </div>

          {/* --- DASHBOARD PREVIEW --- */}
          <div className="relative max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 fill-mode-both delay-500 group z-10">
              {/* Laptop Frame */}
              <div className="relative bg-slate-900 rounded-t-[2rem] p-4 pb-0 shadow-2xl ring-1 ring-white/10">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-800 rounded-b-xl flex items-center justify-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-900"></div>
                 </div>
                 
                 {/* Screen Content */}
                 <div className="bg-slate-50 rounded-t-xl overflow-hidden aspect-[16/10] relative border-t border-x border-slate-200/50">
                    <div className="absolute left-0 top-0 bottom-0 w-48 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col p-4 gap-4">
                        <div className="h-8 w-8 bg-teal-600 rounded-lg mb-4"></div>
                        <div className="h-4 w-24 bg-slate-800 rounded"></div>
                        <div className="h-4 w-32 bg-slate-800 rounded"></div>
                        <div className="h-4 w-20 bg-slate-800 rounded"></div>
                        <div className="h-4 w-28 bg-slate-800 rounded"></div>
                    </div>
                    <div className="absolute left-0 md:left-48 top-0 right-0 bottom-0 bg-[#f8fafc] p-6 flex flex-col gap-6 overflow-hidden">
                        <div className="flex justify-between items-center">
                            <div className="space-y-2">
                                <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
                                <div className="h-4 w-64 bg-slate-100 rounded-lg"></div>
                            </div>
                            <div className="flex gap-3">
                                <div className="h-10 w-10 bg-white rounded-lg shadow-sm"></div>
                                <div className="h-10 w-32 bg-teal-500 rounded-lg shadow-sm"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-xl shadow-sm h-32 border border-slate-100"><div className="h-8 w-8 bg-emerald-100 rounded-lg mb-3"></div><div className="h-4 w-20 bg-slate-100 rounded mb-2"></div><div className="h-8 w-32 bg-slate-200 rounded"></div></div>
                            <div className="bg-white p-4 rounded-xl shadow-sm h-32 border border-slate-100"><div className="h-8 w-8 bg-blue-100 rounded-lg mb-3"></div><div className="h-4 w-20 bg-slate-100 rounded mb-2"></div><div className="h-8 w-32 bg-slate-200 rounded"></div></div>
                            <div className="bg-white p-4 rounded-xl shadow-sm h-32 border border-slate-100"><div className="h-8 w-8 bg-amber-100 rounded-lg mb-3"></div><div className="h-4 w-20 bg-slate-100 rounded mb-2"></div><div className="h-8 w-32 bg-slate-200 rounded"></div></div>
                        </div>
                        <div className="flex gap-6 flex-1">
                            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
                                <div className="h-5 w-32 bg-slate-100 rounded mb-4"></div>
                                {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-lg border border-slate-100 w-full"></div>)}
                            </div>
                            <div className="w-64 bg-white rounded-xl shadow-sm border border-slate-100 p-4 hidden lg:block">
                                <div className="h-5 w-24 bg-slate-100 rounded mb-4"></div>
                                <div className="h-32 bg-teal-50 rounded-full w-32 mx-auto mb-4"></div>
                            </div>
                        </div>
                    </div>
                 </div>
              </div>
              <div className="h-4 bg-slate-800 rounded-b-[2rem] mx-10 opacity-50 shadow-xl"></div>
          </div>
          
          {/* --- INDUSTRY CAROUSEL SECTION --- */}
          <div className="mt-24 border-t border-slate-100 dark:border-slate-800 pt-12 w-full overflow-hidden relative z-0">
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-10 text-center">Designed for the modern service entrepreneur</p>
              <div className="relative w-full overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white dark:from-slate-950 to-transparent z-10 pointer-events-none"></div>
                  <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white dark:from-slate-950 to-transparent z-10 pointer-events-none"></div>
                  <div className="flex animate-marquee group-hover:[animation-play-state:paused] w-max">
                      <div className="flex gap-16 px-8 shrink-0">{CAROUSEL_INDUSTRIES.map((ind, i) => <IndustryItem key={`set1-${i}`} name={ind} />)}</div>
                      <div className="flex gap-16 px-8 shrink-0">{CAROUSEL_INDUSTRIES.map((ind, i) => <IndustryItem key={`set2-${i}`} name={ind} />)}</div>
                  </div>
              </div>
              <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { animation: marquee 120s linear infinite; }`}</style>
          </div>
        </div>
      </section>

      {/* --- SIGN IN MODAL --- */}
      <Modal isOpen={authMode === 'SIGN_IN'} onClose={handleCloseModal} title="Welcome Back">
          <div className="p-4">
              {authError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                      {authError}
                  </div>
              )}
              <form onSubmit={handleSignInSubmit} className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Address</label>
                      <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                              type="email" 
                              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                              placeholder="you@company.com"
                              value={signInEmail}
                              onChange={(e) => setSignInEmail(e.target.value)}
                              autoFocus
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Password</label>
                      <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                              type="password" 
                              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                              placeholder="••••••••"
                              value={signInPassword}
                              onChange={(e) => setSignInPassword(e.target.value)}
                          />
                      </div>
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full h-12 text-base bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-700 dark:border-none text-white">
                      {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
              </form>
              <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  Don't have an account? <button onClick={handleOpenSignUp} className="text-teal-600 dark:text-teal-400 font-bold hover:underline">Sign Up</button>
              </div>
          </div>
      </Modal>

      {/* --- SIGN UP MODAL --- */}
      <Modal isOpen={authMode === 'SIGN_UP'} onClose={handleCloseModal} title="Create Account">
          <div className="p-4">
              {authError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                      {authError}
                  </div>
              )}
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">First Name</label>
                          <input 
                              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                              placeholder="John"
                              value={signUpData.firstName}
                              onChange={(e) => setSignUpData(p => ({ ...p, firstName: e.target.value }))}
                              required
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Last Name</label>
                          <input 
                              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                              placeholder="Doe"
                              value={signUpData.lastName}
                              onChange={(e) => setSignUpData(p => ({ ...p, lastName: e.target.value }))}
                              required
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Address</label>
                      <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                              type="email"
                              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                              placeholder="you@company.com"
                              value={signUpData.email}
                              onChange={(e) => setSignUpData(p => ({ ...p, email: e.target.value }))}
                              required
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Password</label>
                      <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                              type="password" 
                              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                              placeholder="••••••••"
                              value={signUpData.password}
                              onChange={(e) => setSignUpData(p => ({ ...p, password: e.target.value }))}
                              required
                          />
                      </div>
                  </div>
                  <Button type="submit" className="w-full h-12 text-base bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20 border-transparent">
                      Continue
                  </Button>
              </form>
              <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  Already have an account? <button onClick={handleOpenSignIn} className="text-slate-900 dark:text-white font-bold hover:underline">Sign In</button>
              </div>
          </div>
      </Modal>

      {/* --- ONBOARDING WIZARD MODAL --- */}
      <Modal
        isOpen={authMode === 'ONBOARDING'}
        onClose={() => {}} // Prevent closing without finishing
        title=""
      >
          <div className="p-2 min-h-[60vh] flex flex-col">
              {authError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
                      {authError}
                  </div>
              )}
              {/* Progress Bar */}
              <div className="flex items-center justify-between mb-8 px-1">
                  <div className="flex gap-2">
                      {[1, 2, 3, 4].map(s => (
                          <div key={s} className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${s <= onboardingData.step ? 'bg-teal-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                      ))}
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Step {onboardingData.step} of 4</span>
              </div>

              {/* STEP 1: INDUSTRY SELECTION */}
              {onboardingData.step === 1 && (
                  <div className="flex-1 flex flex-col">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">What's your industry?</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-6">We'll customize your job forms and assets based on this.</p>
                      
                      <div className="relative mb-4">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                              autoFocus
                              type="text"
                              placeholder="Search industries..."
                              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                              value={industrySearch}
                              onChange={(e) => setIndustrySearch(e.target.value)}
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[400px] custom-scrollbar pr-1">
                          {filteredIndustries.map(industry => {
                              const Icon = getIndustryIcon(industry);
                              const isSelected = onboardingData.industry === industry;
                              return (
                                  <button
                                      key={industry}
                                      onClick={() => setOnboardingData(prev => ({ ...prev, industry }))}
                                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 aspect-[4/3] ${isSelected ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 shadow-inner' : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:border-teal-200 dark:hover:border-teal-800 hover:bg-white dark:hover:bg-slate-800'}`}
                                  >
                                      <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'}`} />
                                      <span className="text-xs font-bold text-center leading-tight">{industry}</span>
                                      {isSelected && <div className="mt-1 text-teal-600 dark:text-teal-400"><Check className="w-3 h-3" /></div>}
                                  </button>
                              );
                          })}
                          {filteredIndustries.length === 0 && (
                              <div className="col-span-2 py-8 text-center text-slate-400">
                                  <p className="text-sm">No industries found.</p>
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {/* STEP 2: BUSINESS DETAILS */}
              {onboardingData.step === 2 && (
                  <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Business Profile</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8">Tell us about your company.</p>
                      
                      <div className="space-y-4">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Company Name</label>
                              <div className="relative">
                                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                  <input 
                                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                      placeholder="e.g. Acme Services"
                                      value={onboardingData.businessName}
                                      onChange={(e) => setOnboardingData(prev => ({ ...prev, businessName: e.target.value }))}
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Business Phone</label>
                              <input 
                                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                  placeholder="(555) 123-4567"
                                  value={onboardingData.phone}
                                  onChange={(e) => setOnboardingData(prev => ({ ...prev, phone: e.target.value }))}
                              />
                          </div>
                      </div>
                  </div>
              )}

              {/* STEP 3: TEAM SETUP */}
              {onboardingData.step === 3 && (
                  <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 text-center">Add your team</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8">Do you have technicians? Add them now or skip.</p>
                      
                      <div className="flex gap-2 mb-6">
                          <input 
                              className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                              placeholder="Technician Name"
                              value={techInput}
                              onChange={(e) => setTechInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddTech()}
                          />
                          <button 
                              onClick={handleAddTech}
                              className="bg-slate-900 dark:bg-teal-600 text-white px-4 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-teal-700"
                          >
                              Add
                          </button>
                      </div>

                      <div className="space-y-2">
                          {onboardingData.technicians.length === 0 && (
                              <div className="text-center py-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                                  <Users className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                                  <p className="text-sm text-slate-400 dark:text-slate-500">No technicians added yet.</p>
                                  <p className="text-xs text-slate-300 dark:text-slate-600">You can always add them later.</p>
                              </div>
                          )}
                          {onboardingData.technicians.map((tech, i) => (
                              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 animate-in slide-in-from-left-2">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full flex items-center justify-center font-bold text-xs">
                                          {tech.charAt(0)}
                                      </div>
                                      <span className="font-medium text-slate-700 dark:text-slate-200">{tech}</span>
                                  </div>
                                  <button onClick={() => handleRemoveTech(i)} className="text-slate-400 hover:text-red-500">
                                      <Check className="w-4 h-4 rotate-45" />
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* STEP 4: CONFIRMATION */}
              {onboardingData.step === 4 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
                      <div className="w-20 h-20 bg-teal-50 dark:bg-teal-900/20 rounded-full flex items-center justify-center text-teal-600 dark:text-teal-400 mb-6 animate-bounce">
                          <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">You're all set!</h2>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
                          We've configured your dashboard for <strong className="text-slate-800 dark:text-slate-200">{onboardingData.industry}</strong>.
                          Your assets will be tracked as <strong className="text-slate-800 dark:text-slate-200">{getBusinessTypeFromIndustry(onboardingData.industry!) === BusinessType.MOBILE_DETAILING ? 'Vehicles' : 'Properties'}</strong>.
                      </p>
                      
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 w-full text-left space-y-2 mb-8">
                          <div className="flex justify-between text-sm">
                              <span className="text-slate-500 dark:text-slate-400">Business:</span>
                              <span className="font-bold text-slate-900 dark:text-white">{onboardingData.businessName || 'My Business'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-slate-500 dark:text-slate-400">Admin:</span>
                              <span className="font-bold text-slate-900 dark:text-white">{signUpData.firstName} {signUpData.lastName}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                              <span className="text-slate-500 dark:text-slate-400">Team Size:</span>
                              <span className="font-bold text-slate-900 dark:text-white">{onboardingData.technicians.length + 1}</span>
                          </div>
                      </div>
                  </div>
              )}

              {/* Navigation Footer */}
              <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  {onboardingData.step > 1 ? (
                      <button 
                          onClick={handlePrevStep}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold flex items-center gap-1"
                      >
                          <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                  ) : (
                      <div></div>
                  )}

                  <Button 
                      size="lg" 
                      onClick={onboardingData.step === 4 ? handleCompleteOnboarding : handleNextStep}
                      disabled={onboardingData.step === 1 && !onboardingData.industry || isLoading}
                      className="shadow-lg shadow-teal-500/20 bg-teal-600 hover:bg-teal-700 text-white border-transparent"
                  >
                      {isLoading ? 'Creating...' : (onboardingData.step === 4 ? 'Go to Dashboard' : 'Continue')} 
                      {onboardingData.step !== 4 && !isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
