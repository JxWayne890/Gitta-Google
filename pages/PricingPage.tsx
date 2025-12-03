
import React, { useState } from 'react';
import { PublicNavbar } from '../components/PublicNavbar';
import { Check, X } from 'lucide-react';
import { Button } from '../components/Button';
import { AuthModal } from '../components/AuthModal';

interface PricingPageProps {
  onLogin?: any;
}

export const PricingPage: React.FC<PricingPageProps> = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  const openAuth = (mode: 'login' | 'signup' = 'signup') => {
      setAuthMode(mode);
      setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <PublicNavbar onOpenAuth={openAuth} />
      
      <section className="pt-32 pb-16 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Simple, transparent pricing.</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">No hidden fees. No long-term contracts. Cancel anytime.</p>
      </section>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:border-teal-300 hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
              <p className="text-slate-500 text-sm mb-6">Perfect for solo detailers just starting out.</p>
              <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold text-slate-900">$29</span>
                  <span className="text-slate-500">/mo</span>
              </div>
              <Button variant="outline" className="w-full mb-8" onClick={() => openAuth('signup')}>Start Free Trial</Button>
              <ul className="space-y-4 text-sm">
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> 1 User</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> Unlimited Clients</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> Basic Scheduling</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> Invoicing & Payments</li>
                  <li className="flex gap-3 text-slate-400"><X className="w-5 h-5 shrink-0" /> Marketing Automations</li>
              </ul>
          </div>

          {/* Pro Plan - Highlighted */}
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-8 relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                  Most Popular
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
              <p className="text-slate-400 text-sm mb-6">For growing businesses with a team.</p>
              <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold text-white">$79</span>
                  <span className="text-slate-400">/mo</span>
              </div>
              <Button className="w-full mb-8 bg-teal-500 hover:bg-teal-400 text-white border-none" onClick={() => openAuth('signup')}>Start Free Trial</Button>
              <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-400 shrink-0" /> Up to 5 Users</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-400 shrink-0" /> Unlimited Clients & Jobs</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-400 shrink-0" /> Advanced Scheduling</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-400 shrink-0" /> Marketing Campaigns (Email/SMS)</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-400 shrink-0" /> Route Optimization</li>
              </ul>
          </div>

           {/* Enterprise Plan */}
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 hover:border-teal-300 hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <p className="text-slate-500 text-sm mb-6">For large fleets and franchises.</p>
              <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold text-slate-900">$199</span>
                  <span className="text-slate-500">/mo</span>
              </div>
              <Button variant="outline" className="w-full mb-8" onClick={() => openAuth('signup')}>Contact Sales</Button>
              <ul className="space-y-4 text-sm">
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> Unlimited Users</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> Multiple Locations</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> Custom Reporting</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> Dedicated Account Manager</li>
              </ul>
          </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} defaultMode={authMode} />
    </div>
  );
};
