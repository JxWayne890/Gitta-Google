
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNavbar } from '../components/PublicNavbar';
import { Check, X } from 'lucide-react';
import { Button } from '../components/Button';
import { StoreContext } from '../store';

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const store = useContext(StoreContext);
  const { darkMode, toggleDarkMode } = store!;

  const handleAuthAction = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-20 transition-colors duration-200">
      <PublicNavbar onSignIn={handleAuthAction} onGetStarted={handleAuthAction} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <section className="pt-32 pb-16 px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Simple, transparent pricing.</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">No hidden fees. No long-term contracts. Cancel anytime.</p>
      </section>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Starter Plan */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 hover:border-teal-300 dark:hover:border-teal-500 hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Starter</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Perfect for solo detailers just starting out.</p>
              <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$29</span>
                  <span className="text-slate-500 dark:text-slate-400">/mo</span>
              </div>
              <Button variant="outline" className="w-full mb-8 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700" onClick={handleAuthAction}>Start Free Trial</Button>
              <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> 1 User</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> Unlimited Clients</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> Basic Scheduling</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> Invoicing & Payments</li>
                  <li className="flex gap-3 text-slate-400 dark:text-slate-600"><X className="w-5 h-5 shrink-0" /> Marketing Automations</li>
                  <li className="flex gap-3 text-slate-400 dark:text-slate-600"><X className="w-5 h-5 shrink-0" /> Route Optimization</li>
              </ul>
          </div>

          {/* Pro Plan - Highlighted */}
          <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-800 dark:border-slate-700 p-8 relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-teal-500 to-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                  Most Popular
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
              <p className="text-slate-400 text-sm mb-6">For growing businesses with a team.</p>
              <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold text-white">$79</span>
                  <span className="text-slate-400">/mo</span>
              </div>
              <Button className="w-full mb-8 bg-teal-500 hover:bg-teal-400 text-white border-none" onClick={handleAuthAction}>Start Free Trial</Button>
              <ul className="space-y-4 text-sm text-slate-300">
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-400 shrink-0" /> Up to 5 Users</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-400 shrink-0" /> Unlimited Clients & Jobs</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-400 shrink-0" /> Advanced Scheduling</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-400 shrink-0" /> Marketing Campaigns (Email/SMS)</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-400 shrink-0" /> Route Optimization</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-400 shrink-0" /> QuickBooks Sync</li>
              </ul>
          </div>

           {/* Enterprise Plan */}
           <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 hover:border-teal-300 dark:hover:border-teal-500 hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Enterprise</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">For large fleets and franchises.</p>
              <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$199</span>
                  <span className="text-slate-500 dark:text-slate-400">/mo</span>
              </div>
              <Button variant="outline" className="w-full mb-8 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700" onClick={handleAuthAction}>Contact Sales</Button>
              <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> Unlimited Users</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> Multiple Locations</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> Custom Reporting</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> Dedicated Account Manager</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> API Access</li>
                  <li className="flex gap-3"><Check className="w-5 h-5 text-teal-500 shrink-0" /> White Label Options</li>
              </ul>
          </div>
      </div>
    </div>
  );
};
