
import React, { useState } from 'react';
import { PublicNavbar } from '../components/PublicNavbar';
import { Button } from '../components/Button';
import { AuthModal } from '../components/AuthModal';
import { 
  Calendar, MapPin, Users, MessageCircle, 
  CreditCard, Smartphone, ArrowRight, Zap, 
  CheckCircle, BarChart3, Shield, Clock 
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FeaturesPageProps {
  onLogin?: any;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = () => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  const openAuth = (mode: 'login' | 'signup' = 'signup') => {
      setAuthMode(mode);
      setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <PublicNavbar onOpenAuth={openAuth} />
      
      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Built specifically for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-slate-600">Service Pros.</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-3xl mx-auto mb-10">
            We don't just handle scheduling. We handle your entire business lifecycle, from the moment a lead contacts you to the moment money hits your bank account.
          </p>
        </div>
      </section>

      {/* FEATURE 1: SCHEDULING */}
      <section className="py-20 px-6 bg-white overflow-hidden border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 relative">
              {/* Visual Representation */}
              <div className="relative bg-slate-900 p-2 rounded-3xl shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-white rounded-2xl overflow-hidden h-[400px] flex flex-col">
                      <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                          <div className="flex gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-400"></div>
                              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                              <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          </div>
                          <div className="text-xs font-bold text-slate-400 uppercase">Dispatch View</div>
                      </div>
                      <div className="p-4 grid grid-cols-4 gap-4 h-full">
                          <div className="col-span-1 border-r border-slate-100 pr-2 space-y-3">
                              <div className="h-8 w-full bg-slate-100 rounded"></div>
                              <div className="h-8 w-full bg-slate-100 rounded"></div>
                              <div className="h-8 w-full bg-slate-100 rounded"></div>
                          </div>
                          <div className="col-span-3 relative">
                               {/* Mock Jobs */}
                               <div className="absolute top-4 left-2 right-20 h-16 bg-teal-50 border-l-4 border-teal-500 rounded p-2 shadow-sm">
                                   <div className="h-2 w-20 bg-teal-200 rounded mb-2"></div>
                                   <div className="h-2 w-32 bg-teal-100 rounded"></div>
                               </div>
                               <div className="absolute top-24 left-10 right-4 h-20 bg-blue-50 border-l-4 border-blue-500 rounded p-2 shadow-sm">
                                   <div className="h-2 w-24 bg-blue-200 rounded mb-2"></div>
                                   <div className="h-2 w-40 bg-blue-100 rounded"></div>
                               </div>
                               <div className="absolute top-48 left-0 right-32 h-14 bg-amber-50 border-l-4 border-amber-500 rounded p-2 shadow-sm">
                                   <div className="h-2 w-16 bg-amber-200 rounded mb-2"></div>
                                   <div className="h-2 w-24 bg-amber-100 rounded"></div>
                               </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="lg:w-1/2">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Smart Dispatching & Scheduling</h2>
            <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Drag-and-drop jobs onto your calendar and let our system handle the rest. We automatically check for conflicts, calculate drive times, and optimize routes.
            </p>
            <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle className="w-5 h-5 text-teal-500" />
                    Real-time conflict detection
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle className="w-5 h-5 text-teal-500" />
                    Map-based dispatching view
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle className="w-5 h-5 text-teal-500" />
                    Automated appointment reminders
                </li>
            </ul>
          </div>
        </div>
      </section>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} defaultMode={authMode} />
    </div>
  );
};
