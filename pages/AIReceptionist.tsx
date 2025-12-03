
import React from 'react';
import { Bot, Mic, Phone, MessageSquare, Settings, Calendar } from 'lucide-react';
import { Button } from '../components/Button';

export const AIReceptionist: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">AI Receptionist</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Configure your AI agent to handle calls and messages 24/7.</p>
        </div>
        <Button className="shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white">
          <Settings className="w-4 h-4 mr-2" /> Configure Agent
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 relative">
                   <Bot className="w-8 h-8" />
                   <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                </div>
                <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white">Agent Status: Online</h3>
                   <p className="text-slate-500 dark:text-slate-400 text-sm">Handling calls and messages.</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">24</p>
                <p className="text-xs font-bold text-slate-400 uppercase">Calls Today</p>
             </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white">Recent Interactions</h3>
             </div>
             <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {[1, 2, 3, 4].map((i) => (
                   <div key={i} className="p-4 flex gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer">
                      <div className="mt-1">
                         {i % 2 === 0 ? <Phone className="w-5 h-5 text-blue-500" /> : <MessageSquare className="w-5 h-5 text-emerald-500" />}
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between mb-1">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{i % 2 === 0 ? 'Incoming Call' : 'SMS Inquiry'}</p>
                            <span className="text-xs text-slate-400">10 mins ago</span>
                         </div>
                         <p className="text-sm text-slate-600 dark:text-slate-400">Client asked about pricing for ceramic coating. Agent provided quote estimate.</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-6">
           {/* Capabilities */}
           <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-2xl p-6 shadow-lg border dark:border-slate-700">
              <h3 className="font-bold text-lg mb-4">Capabilities</h3>
              <ul className="space-y-3">
                 <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><Mic className="w-3 h-3" /></div>
                    Answer Phone Calls
                 </li>
                 <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><Calendar className="w-3 h-3" /></div>
                    Book Appointments
                 </li>
                 <li className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><MessageSquare className="w-3 h-3" /></div>
                    Respond to SMS
                 </li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
};
