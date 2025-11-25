
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Client, Job, Quote, Invoice, JobStatus } from '../types';
import { Phone, MapPin, Tag, Plus, ArrowUpRight, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

interface ClientDetailProps {
  clients: Client[];
  jobs: Job[];
  quotes: Quote[];
  invoices: Invoice[];
  onUpdateClient: (client: Client) => void;
  onAddJob: (job: Job) => void;
}

export const ClientDetail: React.FC<ClientDetailProps> = ({ clients, jobs, quotes, invoices, onUpdateClient, onAddJob }) => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'quotes' | 'invoices'>('overview');
  
  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);

  const client = clients.find((c) => c.id === id);

  // Form States
  const [editForm, setEditForm] = useState<Partial<Client>>({});
  const [jobForm, setJobForm] = useState({ title: '', description: '', date: '', time: '09:00' });

  if (!client) return <div>Client not found</div>;

  const clientJobs = jobs.filter(j => j.clientId === client.id).sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
  const clientInvoices = invoices.filter(i => i.clientId === client.id).sort((a, b) => new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime());

  const totalRevenue = clientInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const outstandingBalance = clientInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  const getStatusColor = (status: string) => {
      // Simple dot colors
      const colors: Record<string, string> = {
        COMPLETED: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
        PAID: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
        APPROVED: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
        IN_PROGRESS: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800',
        SCHEDULED: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
        SENT: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
        OVERDUE: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800',
      };
      return colors[status] || 'text-slate-600 bg-slate-50 dark:bg-slate-700 border-slate-100 dark:border-slate-600';
  };

  const handleOpenEdit = () => {
      setEditForm({ ...client });
      setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
      if (editForm.id) {
          onUpdateClient(editForm as Client);
          setIsEditModalOpen(false);
      }
  };

  const handleCreateJob = () => {
      const start = new Date(`${jobForm.date}T${jobForm.time}`);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); 

      const newJob: Job = {
          id: `job-${Date.now()}`,
          clientId: client.id,
          propertyId: client.properties[0].id,
          assignedTechIds: [],
          title: jobForm.title,
          description: jobForm.description,
          start: start.toISOString(),
          end: end.toISOString(),
          status: JobStatus.SCHEDULED,
          priority: 'MEDIUM',
          items: [],
          checklists: [
             { id: 'cl-1', label: 'Standard Safety Check', isCompleted: false },
             { id: 'cl-2', label: 'Perform Service', isCompleted: false }
          ],
          photos: [],
          notes: ''
      };
      onAddJob(newJob);
      setIsJobModalOpen(false);
      setJobForm({ title: '', description: '', date: '', time: '09:00' });
      setActiveTab('jobs'); 
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <Link to="/clients" className="mb-6 inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium text-sm transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Clients
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shrink-0 shadow-lg shadow-slate-200 dark:shadow-none">
                {client.firstName[0]}{client.lastName[0]}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{client.firstName} {client.lastName}</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400 mt-2 text-sm">
                        {client.companyName && <span className="font-semibold text-slate-700 dark:text-slate-300">{client.companyName}</span>}
                        <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
                        <a href={`mailto:${client.email}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{client.email}</a>
                        <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
                        <span>{client.phone}</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <Button variant="outline" onClick={handleOpenEdit} className="dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">Edit Profile</Button>
                <Button onClick={() => setIsJobModalOpen(true)}>+ New Job</Button>
            </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Lifetime Revenue</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Outstanding</p>
            <p className={`text-2xl font-bold ${outstandingBalance > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                ${outstandingBalance.toLocaleString()}
            </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Jobs</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{clientJobs.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Properties</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{client.properties.length}</p>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm min-h-[500px]">
         <div className="border-b border-slate-100 dark:border-slate-700 px-8">
             <div className="flex gap-8">
                {(['overview', 'jobs', 'quotes', 'invoices'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-5 font-medium text-sm capitalize border-b-2 transition-all ${
                            activeTab === tab 
                            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
             </div>
         </div>
         
         <div className="p-8">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="col-span-2 space-y-8">
                         <section>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Properties
                            </h3>
                            <div className="grid gap-4">
                                {client.properties.map((prop, idx) => (
                                    <div key={prop.id} className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-500 transition-all group bg-slate-50/50 dark:bg-slate-700/30 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white text-lg">
                                                    {prop.address.street}
                                                </p>
                                                <p className="text-slate-500 dark:text-slate-400">
                                                    {prop.address.city}, {prop.address.state} {prop.address.zip}
                                                </p>
                                            </div>
                                            {idx === 0 && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">MAIN</span>}
                                        </div>
                                        {prop.accessInstructions && (
                                            <div className="mt-4 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-800 inline-block">
                                                <span className="font-bold">Access:</span> {prop.accessInstructions}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        <section>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Phone className="w-4 h-4" /> Details
                            </h3>
                            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-6 border border-slate-100 dark:border-slate-700 space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Email</p>
                                    <p className="font-medium text-slate-900 dark:text-white break-all">{client.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Phone</p>
                                    <p className="font-medium text-slate-900 dark:text-white">{client.phone}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Billing Address</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {client.billingAddress.street}<br/>
                                        {client.billingAddress.city}, {client.billingAddress.state}
                                    </p>
                                </div>
                            </div>
                        </section>
                        
                        <section>
                             <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Tag className="w-4 h-4" /> Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {client.tags.map(tag => (
                                    <span key={tag} className="px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 shadow-sm">
                                        {tag}
                                    </span>
                                ))}
                                <button className="px-3 py-1.5 border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 rounded-lg text-xs hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors">
                                    <Plus className="w-3 h-3" /> Add
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {/* JOBS TAB */}
            {activeTab === 'jobs' && (
                <div>
                    {clientJobs.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-slate-50 dark:bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 dark:text-slate-500">
                                <Tag className="w-8 h-8" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400">No jobs found for this client.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="p-4">Job Title</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {clientJobs.map(job => (
                                        <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 group transition-colors">
                                            <td className="p-4">
                                                <Link to={`/jobs/${job.id}`} className="font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2">
                                                    {job.title}
                                                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                            </td>
                                            <td className="p-4 text-slate-500 dark:text-slate-400">
                                                {new Date(job.start).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(job.status)}`}>
                                                    {job.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-slate-900 dark:text-white">
                                                ${job.items.reduce((acc, i) => acc + i.total, 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* INVOICES TAB */}
            {activeTab === 'invoices' && (
                <div>
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-4">Invoice #</th>
                                    <th className="p-4">Due Date</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Balance</th>
                                    <th className="p-4 text-right">Total</th>
                                </tr>
                            </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {clientInvoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="p-4 font-semibold text-slate-900 dark:text-white">
                                            #{inv.id.toUpperCase()}
                                        </td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400">
                                            {new Date(inv.dueDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                             <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(inv.status)}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className={`p-4 text-right font-medium ${inv.balanceDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                            ${inv.balanceDue.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-right font-bold text-slate-900 dark:text-white">
                                            ${inv.total.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                        </table>
                    </div>
                </div>
            )}
         </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Client Profile"
        footer={
            <>
                <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
            </>
        }
      >
          <div className="space-y-4 p-1">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">First Name</label>
                    <input 
                        value={editForm.firstName || ''} 
                        onChange={(e) => setEditForm(p => ({...p, firstName: e.target.value}))}
                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
                    <input 
                        value={editForm.lastName || ''} 
                        onChange={(e) => setEditForm(p => ({...p, lastName: e.target.value}))}
                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                <input 
                    value={editForm.email || ''} 
                    onChange={(e) => setEditForm(p => ({...p, email: e.target.value}))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                <input 
                    value={editForm.phone || ''} 
                    onChange={(e) => setEditForm(p => ({...p, phone: e.target.value}))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Company</label>
                <input 
                    value={editForm.companyName || ''} 
                    onChange={(e) => setEditForm(p => ({...p, companyName: e.target.value}))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
            </div>
          </div>
      </Modal>

      {/* New Job Modal */}
      <Modal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        title={`New Job for ${client.firstName}`}
        footer={
            <>
                <Button variant="ghost" onClick={() => setIsJobModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateJob}>Create Job</Button>
            </>
        }
      >
          <div className="space-y-4 p-1">
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Job Title</label>
                <input 
                    placeholder="e.g. Weekly Maintenance"
                    value={jobForm.title}
                    onChange={(e) => setJobForm(p => ({...p, title: e.target.value}))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Description</label>
                <textarea 
                    placeholder="Details about the job..."
                    value={jobForm.description}
                    onChange={(e) => setJobForm(p => ({...p, description: e.target.value}))}
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 h-24 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Date</label>
                    <input 
                        type="date"
                        value={jobForm.date}
                        onChange={(e) => setJobForm(p => ({...p, date: e.target.value}))}
                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Time</label>
                    <input 
                        type="time"
                        value={jobForm.time}
                        onChange={(e) => setJobForm(p => ({...p, time: e.target.value}))}
                        className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
            </div>
          </div>
      </Modal>
    </div>
  );
};
