
import React, { useState, useContext, useEffect } from 'react';
import { StoreContext } from '../store';
import { X, Mail, Lock, User, Loader2, AlertCircle, Building2, Users, CheckCircle, Copy } from 'lucide-react';
import { Button } from './Button';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const store = useContext(StoreContext);
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  
  // Signup Sub-mode: Initialize as null so nothing is pre-selected
  const [signupMode, setSignupMode] = useState<'create' | 'join' | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCompanyCode, setCreatedCompanyCode] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    joinCode: ''
  });

  // Sync mode with defaultMode when modal opens or prop changes
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setSignupMode(null); // Reset sub-mode
      setError(null); // Clear errors
    }
  }, [isOpen, defaultMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!store) throw new Error("App state not initialized");

      if (mode === 'login') {
        const { error } = await store.login(formData.email, formData.password);
        if (error) throw error;
        onClose();
      } else {
        if (!formData.fullName) throw new Error("Full Name is required");
        
        // Validation: Ensure user has selected a mode
        if (!signupMode) {
            throw new Error("Please select whether you are starting a New Company or joining an existing Team.");
        }

        if (signupMode === 'join' && !formData.joinCode) throw new Error("Company Code is required to join a team");
        
        const res = await store.signup(
            formData.email, 
            formData.password, 
            formData.fullName, 
            signupMode, 
            formData.joinCode
        );
        
        if (res.error) throw res.error;

        // If a new company was created, show the code
        if (res.companyCode) {
            setCreatedCompanyCode(res.companyCode);
            // DO NOT close modal, show success screen
        } else {
            onClose();
        }
      }
    } catch (err: any) {
      // Display the actual error message from Supabase/Store
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
      if (createdCompanyCode) {
          navigator.clipboard.writeText(createdCompanyCode);
          // Optional: could show copied toast
      }
  };

  const handleFinish = () => {
      onClose();
      setCreatedCompanyCode(null);
  };

  // --- SUCCESS VIEW (NEW COMPANY) ---
  if (createdCompanyCode) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Company Created!</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Your account is ready. Share this invite code with your team members so they can join your company.
                </p>

                <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-6 flex flex-col items-center justify-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Company Invite Code</span>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl font-mono font-bold text-slate-900 dark:text-white tracking-widest">{createdCompanyCode}</span>
                        <button onClick={handleCopyCode} className="text-slate-400 hover:text-emerald-500 transition-colors" title="Copy">
                            <Copy className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <Button onClick={handleFinish} className="w-full h-12 text-lg">
                    Go to Dashboard
                </Button>
            </div>
        </div>
      );
  }

  // --- STANDARD FORM VIEW ---
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              {mode === 'login' ? 'Enter your credentials to access your account' : 'Manage your field service business'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* SIGNUP TYPE SELECTION */}
            {mode === 'signup' && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                        type="button"
                        onClick={() => setSignupMode('create')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${signupMode === 'create' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <Building2 className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase">New Company</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSignupMode('join')}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${signupMode === 'join' ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <Users className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase">Join Team</span>
                    </button>
                </div>
            )}

            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* JOIN CODE INPUT */}
            {mode === 'signup' && signupMode === 'join' && (
                <div className="space-y-1 pt-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Company Join Code</label>
                    <input 
                        type="text" 
                        required
                        value={formData.joinCode}
                        onChange={e => setFormData({...formData, joinCode: e.target.value.toUpperCase()})}
                        maxLength={7}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 dark:text-white font-mono text-center tracking-widest uppercase"
                        placeholder="ENTER-CODE"
                    />
                    <p className="text-[10px] text-slate-400 text-center">Ask your admin for the 7-character Company ID found in Settings.</p>
                </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 text-base shadow-lg shadow-teal-500/20 mt-4" 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : mode === 'login' ? (
                'Log In'
              ) : signupMode === 'create' ? (
                'Create Company'
              ) : signupMode === 'join' ? (
                'Join Team'
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button onClick={() => setMode('signup')} className="font-bold text-teal-600 hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="font-bold text-teal-600 hover:underline">
                  Log in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
