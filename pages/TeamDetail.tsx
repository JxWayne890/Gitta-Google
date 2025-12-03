
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { User, Job, JobStatus } from '../types';
import { 
    Phone, Mail, MapPin, Calendar, Star, Briefcase, Clock, Award, 
    CheckCircle, Activity, ArrowUpRight, CircleDollarSign, ArrowLeft
} from 'lucide-react';
import { Button } from '../components/Button';

interface TeamDetailProps {
  users: User[];
  jobs: Job[];
}

export const TeamDetail: React.FC<TeamDetailProps> = ({ users, jobs }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = users.find(u => u.id === id);
  const [activeTab, setActiveTab] = useState<'schedule' | 'history'>('schedule');

  if (!user) return <div>Team member not found</div>;

  // --- DATA CALCULATION ---
  const techJobs = jobs.filter(j => j.assignedTechIds.includes(user.id));
  const activeJobs = techJobs.filter(j => j.status === JobStatus.IN_PROGRESS || j.status === JobStatus.SCHEDULED).sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const completedJobs = techJobs.filter(j => j.status === JobStatus.COMPLETED).sort((a,b) => new Date(b.end).getTime() - new Date(a.end).getTime());
  
  // Calculate Revenue (Mock calculation based on job items)
  const totalRevenue = completedJobs.reduce((sum, job) => {
      return sum + job.items.reduce((acc, item) => acc + item.total, 0);
  }, 0);

  const utilizationRate = 85; // Mocked percentage

  return (
    <div className="max-w-6xl mx-auto pb-10">
       <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Team
      </button>

       {/* Header Card */}
       <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
             <div className="relative shrink-0">
                <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full border-4 border-slate-50 shadow-sm" />
                <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white ${activeJobs.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
             </div>
             <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
                <p className="text-slate-500 font-medium uppercase tracking-wide text-sm mt-1">{user.role} <span className="mx-2 text-slate-300">|</span> Joined {new Date(user.joinDate || '2023-01-01').toLocaleDateString()}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                   {user.skills?.map(skill => (
                       <span key={skill} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">
                          {skill}
                       </span>
                   ))}
                </div>
             </div>
             <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                 <Button variant="outline" className="w-full justify-center">Edit Profile</Button>
                 <Button className="w-full justify-center">View Calendar</Button>
             </div>
          </div>
       </div>

       {/* VITAL STATS GRID */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
           {/* 1. Revenue Card */}
           <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <CircleDollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Lifetime</span>
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue Generated</p>
               <p className="text-2xl font-bold text-slate-900 mt-1">${totalRevenue.toLocaleString()}</p>
           </div>

           {/* 2. Performance Rating */}
           <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <Star className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Top 10%</span>
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Rating</p>
               <p className="text-2xl font-bold text-slate-900 mt-1">{user.rating?.toFixed(1)} <span className="text-sm text-slate-400 font-normal">/ 5.0</span></p>
           </div>

           {/* 3. Utilization/Efficiency */}
           <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
               <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Activity className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">High</span>
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Utilization</p>
               <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900">{utilizationRate}%</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${utilizationRate}%` }}></div>
                  </div>
               </div>
           </div>

           {/* 4. Contact Info */}
           <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
               <div className="flex items-center gap-3 mb-2">
                   <Phone className="w-4 h-4 text-slate-400" />
                   <span className="text-sm font-medium text-slate-700">{user.phone}</span>
               </div>
               <div className="flex items-center gap-3">
                   <Mail className="w-4 h-4 text-slate-400" />
                   <span className="text-sm font-medium text-slate-700 truncate">{user.email}</span>
               </div>
               <div className="mt-4 pt-4 border-t border-slate-100">
                   <p className="text-xs text-slate-500">
                       <span className="font-bold">Avg Completion:</span> 1h 45m
                   </p>
               </div>
           </div>
       </div>

       {/* CONTENT TABS */}
       <div className="bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[500px]">
           <div className="px-8 border-b border-slate-100">
             <div className="flex gap-8">
                <button
                    onClick={() => setActiveTab('schedule')}
                    className={`py-5 font-medium text-sm border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'schedule' 
                        ? 'border-emerald-500 text-emerald-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Calendar className="w-4 h-4" /> Active Schedule
                    <span className="bg-slate-100 text-slate-600 text-xs py-0.5 px-2 rounded-full ml-1">{activeJobs.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`py-5 font-medium text-sm border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === 'history' 
                        ? 'border-emerald-500 text-emerald-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <CheckCircle className="w-4 h-4" /> Job History
                    <span className="bg-slate-100 text-slate-600 text-xs py-0.5 px-2 rounded-full ml-1">{completedJobs.length}</span>
                </button>
             </div>
           </div>

           <div className="p-6">
               {activeTab === 'schedule' && (
                   <div className="space-y-4">
                       {activeJobs.length === 0 ? (
                           <div className="text-center py-12 text-slate-400">
                               <p>No active jobs assigned.</p>
                           </div>
                       ) : (
                           activeJobs.map(job => (
                               <div key={job.id} className="flex items-center p-4 border border-slate-200 rounded-xl hover:border-emerald-400 transition-all bg-white group">
                                   <div className="w-16 h-16 rounded-lg bg-slate-50 flex flex-col items-center justify-center border border-slate-100 mr-4 shrink-0">
                                       <span className="text-xs font-bold text-slate-400 uppercase">{new Date(job.start).toLocaleString('default', { month: 'short' })}</span>
                                       <span className="text-xl font-bold text-slate-900">{new Date(job.start).getDate()}</span>
                                   </div>
                                   <div className="flex-1">
                                       <div className="flex items-center gap-2 mb-1">
                                           <h3 className="font-bold text-slate-900">{job.title}</h3>
                                           {job.status === JobStatus.IN_PROGRESS && (
                                               <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">IN PROGRESS</span>
                                           )}
                                       </div>
                                       <div className="flex items-center gap-4 text-sm text-slate-500">
                                           <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(job.start).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                                           <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Location ID: {job.propertyId.substring(0,5)}</span>
                                       </div>
                                   </div>
                                   <Link to={`/jobs/${job.id}`} className="p-2 text-slate-300 group-hover:text-emerald-500 transition-colors">
                                       <ArrowUpRight className="w-5 h-5" />
                                   </Link>
                               </div>
                           ))
                       )}
                   </div>
               )}

               {activeTab === 'history' && (
                    <div className="overflow-hidden rounded-xl border border-slate-200">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="p-4">Job Title</th>
                                    <th className="p-4">Date Completed</th>
                                    <th className="p-4">Duration</th>
                                    <th className="p-4 text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {completedJobs.map(job => (
                                    <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-medium text-slate-900">{job.title}</td>
                                        <td className="p-4 text-slate-500">{new Date(job.end).toLocaleDateString()}</td>
                                        <td className="p-4 text-slate-500">2h 15m</td>
                                        <td className="p-4 text-right font-bold text-emerald-600">
                                            ${job.items.reduce((acc, i) => acc + i.total, 0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
               )}
           </div>
       </div>
    </div>
  );
};
