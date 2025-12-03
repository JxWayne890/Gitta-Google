import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Client, Job, Invoice, InvoiceStatus, JobStatus } from '../types';
import { 
    Phone, Mail, MapPin, Search, Filter, ChevronRight, UserPlus, 
    Users, TrendingUp, AlertCircle, Wallet, Calendar, Clock, Star,
    ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

interface ClientsListProps {
  clients: Client[];
  jobs: Job[];
  invoices: Invoice[];
  onAddClient: (client: Client) => void;
}

type ClientFilter = 'ALL' | 'VIP' | 'DEBTORS' | 'LEADS';

export const ClientsList: React.FC<ClientsListProps> = ({ clients, jobs, invoices, onAddClient }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ClientFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', companyName: '', street: '', city: '', state: '', zip: '',
  });

  const getClientStats = (clientId: string) => {
    const clientInvoices = invoices.filter(i => i.clientId === clientId);
    const clientJobs = jobs.filter(j => j.clientId === clientId);
    const ltv = clientInvoices.filter(i => i.status === InvoiceStatus.PAID).reduce((sum, i) => sum + i.total, 0);
    const balance = clientInvoices.filter(i => i.status === InvoiceStatus.OVERDUE || i.status === InvoiceStatus.SENT).reduce((sum, i) => sum + i.balanceDue, 0);
    const lastJob = clientJobs.filter(j => j.status === JobStatus.COMPLETED).sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())[0];
    const nextJob = clientJobs.filter(j => j.status === JobStatus.SCHEDULED || j.status === JobStatus.IN_PROGRESS).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
    return { ltv, balance, lastJob, nextJob, jobCount: clientJobs.length };
  };

  const totalRevenue = invoices.filter(i => i.status === InvoiceStatus.PAID).reduce((sum, i) => sum + i.total, 0);
  const totalDebt = invoices.filter(i => i.status === InvoiceStatus.OVERDUE).reduce((sum, i) => sum + i.balanceDue, 0);
  const totalActive = clients.filter(c => jobs.some(j => j.clientId === c.id && (j.status === JobStatus.SCHEDULED || j.status === JobStatus.IN_PROGRESS))).length;

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
        const stats = getClientStats(client.id);
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = client.firstName.toLowerCase().includes(searchLower) || client.lastName.toLowerCase().includes(searchLower) || (client.companyName && client.companyName.toLowerCase().includes(searchLower)) || client.email.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'VIP') return stats.ltv > 2000;
        if (activeFilter === 'DEBTORS') return stats.balance > 0;
        if (activeFilter === 'LEADS') return stats.jobCount === 0;
        return true;
    });
  }, [clients, jobs, invoices, activeFilter, searchQuery]);

  const sortedClients = useMemo(() => {
      let sortable = [...filteredClients];
      if (sortConfig !== null) {
          sortable.sort((a, b) => {
              const statsA = getClientStats(a.id);
              const statsB = getClientStats(b.id);
              let aValue: any, bValue: any;
              switch (sortConfig.key) {
                  case 'name': aValue = `${a.firstName} ${a.lastName}`.toLowerCase(); bValue = `${b.firstName} ${b.lastName}`.toLowerCase(); break;
                  case 'contact': aValue = a.email.toLowerCase(); bValue = b.email.toLowerCase(); break;
                  case 'history': 
                      const dateA = statsA.nextJob ? new Date(statsA.nextJob.start).getTime() : (statsA.lastJob ? new Date(statsA.lastJob.end).getTime() : 0);
                      const dateB = statsB.nextJob ? new Date(statsB.nextJob.start).getTime() : (statsB.lastJob ? new Date(statsB.lastJob.end).getTime() : 0);
                      aValue = dateA; bValue = dateB; break;
                  case 'financial': aValue = statsA.ltv; bValue = statsB.ltv; break;
                  default: return 0;
              }
              if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
              if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }
      return sortable;
  }, [filteredClients, sortConfig, invoices, jobs]);

  const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
      setSortConfig({ key, direction });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const newClient: Client = {
      id: crypto.randomUUID(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      companyName: formData.companyName,
      billingAddress: { street: formData.street, city: formData.city, state: formData.state, zip: formData.zip },
      properties: [{ id: crypto.randomUUID(), clientId: '', address: { street: formData.street, city: formData.city, state: formData.state, zip: formData.zip }, accessInstructions: 'Gate code: N/A' }],
      tags: ['New'],
      createdAt: new Date().toISOString(),
    };
    // Fix property client id reference
    newClient.properties[0].clientId = newClient.id;
    
    onAddClient(newClient);
    setIsModalOpen(false);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', companyName: '', street: '', city: '', state: '', zip: '' });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
      if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
      return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 text-emerald-500" /> : <ArrowDown className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"><div><h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Clients</h1><p className="text-slate-500 dark:text-slate-400 mt-1">Manage customer relationships, properties, and history.</p></div><Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-emerald-500/20"><UserPlus className="w-4 h-4 mr-2" /> New Client</Button></div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('name')}>Client Details <SortIcon columnKey="name" /></th>
                        <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('contact')}>Contact <SortIcon columnKey="contact" /></th>
                        <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('history')}>Service History <SortIcon columnKey="history" /></th>
                        <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('financial')}>Financial Health <SortIcon columnKey="financial" /></th>
                        <th className="px-6 py-4 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {sortedClients.map((client) => {
                        const stats = getClientStats(client.id);
                        const isVIP = stats.ltv > 2000;
                        return (
                        <tr key={client.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                            <td className="px-6 py-4 align-top">
                                <Link to={`/clients/${client.id}`} className="flex items-start gap-4 group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border shrink-0 ${isVIP ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 border-amber-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>{isVIP ? <Star className="w-5 h-5" /> : `${client.firstName[0]}${client.lastName[0]}`}</div>
                                    <div><div className="flex items-center gap-2"><p className="font-bold text-slate-900 dark:text-white text-base">{client.firstName} {client.lastName}</p>{isVIP && <span className="text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 rounded font-bold uppercase">VIP</span>}</div><p className="text-sm text-slate-500 dark:text-slate-400">{client.companyName || 'Residential'}</p></div>
                                </Link>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {client.email}</div>
                                    <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {client.phone}</div>
                                    <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {client.billingAddress.city}</div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 text-sm">
                                    <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> Last: <span className="text-slate-900 dark:text-white font-medium">{stats.lastJob ? new Date(stats.lastJob.end).toLocaleDateString() : 'Never'}</span></div>
                                    <div className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Next: <span className="text-slate-900 dark:text-white font-medium">{stats.nextJob ? new Date(stats.nextJob.start).toLocaleDateString() : 'None'}</span></div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 text-sm">
                                    <div className="flex justify-between items-center gap-4"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> LTV</span><span className="font-bold text-emerald-600 dark:text-emerald-400">${stats.ltv.toLocaleString()}</span></div>
                                    <div className="flex justify-between items-center gap-4"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Wallet className="w-3 h-3" /> Due</span><span className={`font-bold ${stats.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-600'}`}>${stats.balance.toLocaleString()}</span></div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right align-middle"><Link to={`/clients/${client.id}`} className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all inline-block"><ChevronRight className="w-5 h-5" /></Link></td>
                        </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Client" footer={<><Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Save Client</Button></>}>
        <div className="space-y-4 p-1">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                    <input name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="John" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                    <input name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Doe" />
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Name <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Business Name" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                    <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="john@example.com" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                    <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="(555) 555-5555" />
                </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Property Address</h4>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
                    <input name="street" value={formData.street} onChange={handleInputChange} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="123 Main St" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">City</label>
                        <input name="city" value={formData.city} onChange={handleInputChange} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="City" />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">State</label>
                        <input name="state" value={formData.state} onChange={handleInputChange} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="State" />
                    </div>
                    <div className="col-span-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Zip Code</label>
                        <input name="zip" value={formData.zip} onChange={handleInputChange} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Zip" />
                    </div>
                </div>
            </div>
        </div>
      </Modal>
    </div>
  );
};