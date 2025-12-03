
import React from 'react';
import { MarketingAutomation } from '../types';
import { Zap, PlayCircle, PauseCircle, GitBranch, ArrowRight, Plus } from 'lucide-react';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';

interface MarketingAutomationsProps {
  automations: MarketingAutomation[];
}

export const MarketingAutomations: React.FC<MarketingAutomationsProps> = ({ automations }) => {
  return (
    <div className="max-w-7xl mx-auto pb-10">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Automations</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Set up "if this, then that" workflows.</p>
            </div>
            <Link to="/marketing/automations/new"><Button className="shadow-lg shadow-emerald-500/20"><Plus className="w-4 h-4 mr-2" /> Create Workflow</Button></Link>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {automations.map(auto => (
               <div key={auto.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                   <div className="p-6">
                       <div className="flex justify-between items-start mb-4">
                           <div className={`p-2 rounded-lg ${auto.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}><GitBranch className="w-6 h-6" /></div>
                           <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${auto.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{auto.status}</div>
                       </div>
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{auto.title}</h3>
                       <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4"><Zap className="w-3 h-3" /> Trigger: <span className="font-medium text-slate-700 dark:text-slate-300">{auto.trigger}</span></div>
                   </div>
                   <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <Link to={`/marketing/automations/${auto.id}`} className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center gap-1">Edit Workflow <ArrowRight className="w-3 h-3" /></Link>
                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">{auto.status === 'ACTIVE' ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}</button>
                   </div>
               </div>
           ))}
       </div>
    </div>
  );
};
