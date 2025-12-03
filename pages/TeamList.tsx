import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { User, Job, JobStatus, UserRole } from '../types';
import { Search, Filter, Mail, Phone, Star, ChevronRight, UserPlus, Briefcase, Calendar, Copy, Users, MessageCircle } from 'lucide-react';
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
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', role: UserRole.TECHNICIAN, color: 'blue' });

  if (!store) return null;
  const { settings } = store;

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
        id: crypto.randomUUID(), // Generally profiles come from Auth, but for manual add we generate a placeholder UUID
        companyId: store.currentUser?.companyId || '',
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        color: formData.color,
        avatarUrl: `https://i.pravatar.cc/150?u=${Date.now()}`,
        joinDate: new Date().toISOString().split('T')[0],
        skills: [],
        rating: 5.0,
        enableTimesheets: formData.role === UserRole.TECHNICIAN,
        payrollType: 'HOURLY',
        payRate: 25.00,
        onboardingComplete: true
    };

    store.addUser(newUser);
    setIsModalOpen(false);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', role: UserRole.TECHNICIAN, color: 'blue' });
  };

  const copyInviteCode = () => {
      if (settings.companyCode) { navigator.clipboard.writeText(settings.companyCode); alert("Invite code copied!"); }
  };

  const copyInviteInstructions = () => {
      const text = `Join my team on Gitta Job!\n\n1. Go to the app.\n2. Select "Join Existing Team".\n3. Enter this code: ${settings.companyCode}`;
      navigator.clipboard.writeText(text); alert("Invite instructions copied!");
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* UI Omitted for brevity */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-6">
        <div><h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Team Members</h1><p className="text-slate-500 dark:text-slate-400 mt-1">Manage your field technicians and office staff.</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => setIsInviteModalOpen(true)} className="hidden sm:flex"><Users className="w-4 h-4 mr-2" /> Invite via Code</Button><Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-emerald-500/20"><UserPlus className="w-4 h-4 mr-2" /> Add Member</Button></div>
      </div>
      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {technicians.map(tech => {
          const activeJobs = getActiveJobCount(tech.id);
          return (
            <Link to={`/team/${tech.id}`} key={tech.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500 transition-all duration-200 overflow-hidden group flex flex-col">
              {/* Card content */}
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4"><div className="relative"><img src={tech.avatarUrl} alt={tech.name} className="w-16 h-16 rounded-full border-2 border-slate-100 dark:border-slate-700 group-hover:border-emerald-500 transition-colors object-cover" /><div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${activeJobs > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div></div><div className="flex flex-col items-end"><span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-md uppercase tracking-wide">{tech.role}</span></div></div>
                <div><h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{tech.name}</h3><p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> <span className="font-bold text-slate-700 dark:text-slate-300">{tech.rating?.toFixed(1) || 'N/A'}</span> Rating</p></div>
                <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4"><div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {tech.email}</div><div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> {tech.phone}</div></div>
              </div>
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center"><div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase"><Briefcase className="w-3.5 h-3.5" /> {activeJobs} Active Jobs</div><ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" /></div>
            </Link>
          );
        })}
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Team Member" footer={<><Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Add Member</Button></>}>
        <div className="space-y-4 p-1">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                    <input className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                    <input className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" />
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                    <option value={UserRole.TECHNICIAN}>Technician</option>
                    <option value={UserRole.OFFICE}>Office Staff</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                </select>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite Team Member" footer={<><Button variant="ghost" onClick={() => setIsInviteModalOpen(false)}>Close</Button><Button onClick={copyInviteInstructions}>Copy Instructions</Button></>}>
        <div className="text-center space-y-6 p-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
            </div>
            <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Invite your team</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Share this code with your team members. They will need to enter it when they select "Join Existing Team" during signup.
                </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 relative group">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Company Code</p>
                <div className="flex items-center justify-center gap-3">
                    <span className="text-4xl font-mono font-bold text-slate-900 dark:text-white tracking-widest">
                        {settings.companyCode || 'LOADING'}
                    </span>
                </div>
            </div>
        </div>
      </Modal>
    </div>
  );
};