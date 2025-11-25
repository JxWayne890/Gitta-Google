
import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { User, Job, JobStatus, UserRole } from '../types';
import { Search, Filter, Mail, Phone, Star, ChevronRight, UserPlus, Briefcase, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { StoreContext } from '../store';
import { Modal } from '../components/Modal';

interface TeamListProps {
  users: User[];
  jobs: Job[];
}

export const TeamList: React.FC<TeamListProps> = ({ users, jobs }) => {
  const store = useContext(StoreContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: UserRole.TECHNICIAN,
    color: 'blue'
  });

  const technicians = users.filter(u => u.role === 'TECHNICIAN');

  const getActiveJobCount = (techId: string) => {
    return jobs.filter(j => j.assignedTechIds.includes(techId) && (j.status === JobStatus.IN_PROGRESS || j.status === JobStatus.SCHEDULED)).length;
  };

  const handleSubmit = () => {
    if (!store) return;
    if (!formData.firstName || !formData.lastName || !formData.email) {
        alert("Please fill in all required fields");
        return;
    }

    const newUser: User = {
        id: `user-${Date.now()}`,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        color: formData.color,
        avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
        joinDate: new Date().toISOString().split('T')[0],
        skills: [],
        rating: 5.0,
        status: 'INVITED' // Manually added users start as invited
    };

    store.addUser(newUser);
    setIsModalOpen(false);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', role: UserRole.TECHNICIAN, color: 'blue' });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Team Members</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your field technicians and office staff.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-emerald-500/20">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm mb-8">
        <div className="p-4 flex gap-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl border-b border-slate-100 dark:border-slate-700">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or role..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 bg-white dark:bg-slate-800 hover:shadow-sm transition-all text-sm font-medium">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {technicians.map(tech => {
          const activeJobs = getActiveJobCount(tech.id);
          const isInvited = tech.status === 'INVITED';

          return (
            <Link 
              to={`/team/${tech.id}`} 
              key={tech.id} 
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 overflow-hidden group flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="relative">
                     <img src={tech.avatarUrl} alt={tech.name} className="w-16 h-16 rounded-full border-2 border-slate-100 dark:border-slate-700 group-hover:border-emerald-500 transition-colors object-cover" />
                     <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${isInvited ? 'bg-slate-400' : activeJobs > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-md uppercase tracking-wide">
                        {tech.role}
                     </span>
                     {isInvited && (
                         <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-md uppercase tracking-wide border border-amber-100 dark:border-amber-800">
                            Pending
                         </span>
                     )}
                  </div>
                </div>
                
                <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{tech.name}</h3>
                   {isInvited ? (
                       <p className="text-sm text-amber-600 dark:text-amber-400 mb-4 flex items-center gap-1.5 font-medium">
                           <AlertCircle className="w-3.5 h-3.5" /> Invitation Sent
                       </p>
                   ) : (
                       <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> 
                          <span className="font-bold text-slate-700 dark:text-slate-300">{tech.rating?.toFixed(1) || 'N/A'}</span> Rating
                       </p>
                   )}
                </div>

                <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                   <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {tech.email}
                   </div>
                   <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {tech.phone}
                   </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                   {tech.skills?.slice(0, 3).map(skill => (
                      <span key={skill} className="px-2 py-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded text-[10px] font-medium text-slate-500 dark:text-slate-400">
                         {skill}
                      </span>
                   ))}
                   {(tech.skills?.length || 0) > 3 && (
                      <span className="px-2 py-1 bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 rounded text-[10px] font-medium text-slate-500 dark:text-slate-400">+{tech.skills!.length - 3}</span>
                   )}
                </div>
              </div>
              
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                    <Briefcase className="w-3.5 h-3.5" /> {activeJobs} Active Jobs
                 </div>
                 <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Team Member"
        footer={
            <>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>Add Member</Button>
            </>
        }
      >
          <div className="space-y-4 p-1">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 mb-4">
                  <p className="text-sm text-blue-700 dark:text-blue-300 flex gap-2">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      This creates a profile immediately. They can claim it by signing up with this email address.
                  </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">First Name</label>
                      <input 
                          value={formData.firstName}
                          onChange={(e) => setFormData(p => ({...p, firstName: e.target.value}))}
                          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
                      <input 
                          value={formData.lastName}
                          onChange={(e) => setFormData(p => ({...p, lastName: e.target.value}))}
                          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                  <input 
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({...p, email: e.target.value}))}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
              </div>
              <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                  <input 
                      value={formData.phone}
                      onChange={(e) => setFormData(p => ({...p, phone: e.target.value}))}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Role</label>
                      <select
                          value={formData.role}
                          onChange={(e) => setFormData(p => ({...p, role: e.target.value as UserRole}))}
                          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                          <option value={UserRole.TECHNICIAN}>Technician</option>
                          <option value={UserRole.OFFICE}>Office Staff</option>
                          <option value={UserRole.ADMIN}>Admin</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Color Code</label>
                      <select
                          value={formData.color}
                          onChange={(e) => setFormData(p => ({...p, color: e.target.value}))}
                          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                          <option value="blue">Blue</option>
                          <option value="emerald">Emerald</option>
                          <option value="amber">Amber</option>
                          <option value="rose">Rose</option>
                          <option value="purple">Purple</option>
                      </select>
                  </div>
              </div>
          </div>
      </Modal>
    </div>
  );
};