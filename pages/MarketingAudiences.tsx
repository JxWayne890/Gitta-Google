
import React from 'react';
import { AudienceSegment } from '../types';
import { Users, Filter, UserPlus, MoreHorizontal } from 'lucide-react';
import { Button } from '../components/Button';

interface MarketingAudiencesProps {
  segments: AudienceSegment[];
}

export const MarketingAudiences: React.FC<MarketingAudiencesProps> = ({ segments }) => {
  return (
    <div className="max-w-7xl mx-auto pb-10">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Audiences</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Segment your clients to send relevant, targeted messages.</p>
            </div>
            <Button className="shadow-lg shadow-emerald-500/20">
                <UserPlus className="w-4 h-4 mr-2" /> Create Segment
            </Button>
       </div>

       <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
           <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                   <tr>
                       <th className="px-6 py-4">Segment Name</th>
                       <th className="px-6 py-4">Type</th>
                       <th className="px-6 py-4">Contacts</th>
                       <th className="px-6 py-4">Criteria</th>
                       <th className="px-6 py-4">Last Updated</th>
                       <th className="px-6 py-4 w-10"></th>
                   </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                   {segments.map(seg => (
                       <tr key={seg.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors">
                           <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                   <div className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg">
                                       <Users className="w-5 h-5" />
                                   </div>
                                   <span className="font-bold text-slate-900 dark:text-white">{seg.name}</span>
                               </div>
                           </td>
                           <td className="px-6 py-4">
                               <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${seg.type === 'DYNAMIC' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}>
                                   {seg.type}
                               </span>
                           </td>
                           <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                               {seg.count.toLocaleString()}
                           </td>
                           <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                               {seg.criteria ? (
                                   <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded border border-slate-100 dark:border-slate-700 w-fit">
                                       <Filter className="w-3 h-3 text-slate-400" />
                                       <span className="font-mono text-xs">{seg.criteria}</span>
                                   </div>
                               ) : (
                                   <span className="text-slate-400 italic">All Contacts</span>
                               )}
                           </td>
                           <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                               {seg.lastUpdated}
                           </td>
                           <td className="px-6 py-4 text-right">
                               <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                   <MoreHorizontal className="w-4 h-4" />
                               </button>
                           </td>
                       </tr>
                   ))}
               </tbody>
           </table>
       </div>
    </div>
  );
};
