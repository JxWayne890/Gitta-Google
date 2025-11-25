
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
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    street: '',
    city: '',
    state: '',
    zip: '',
  });

  // --- 1. HELPER: Client Stats Calculation ---
  const getClientStats = (clientId: string) => {
    const clientInvoices = invoices.filter(i => i.clientId === clientId);
    const clientJobs = jobs.filter(j => j.clientId === clientId);
    
    const ltv = clientInvoices
        .filter(i => i.status === InvoiceStatus.PAID)
        .reduce((sum, i) => sum + i.total, 0);
        
    const balance = clientInvoices
        .filter(i => i.status === InvoiceStatus.OVERDUE || i.status === InvoiceStatus.SENT)
        .reduce((sum, i) => sum + i.balanceDue, 0);
        
    const lastJob = clientJobs
        .filter(j => j.status === JobStatus.COMPLETED)
        .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())[0];

    const nextJob = clientJobs
        .filter(j => j.status === JobStatus.SCHEDULED || j.status === JobStatus.IN_PROGRESS)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0];
        
    return { ltv, balance, lastJob, nextJob, jobCount: clientJobs.length };
  };

  // --- 2. DATA: Aggregates ---
  const totalRevenue = invoices.filter(i => i.status === InvoiceStatus.PAID).reduce((sum, i) => sum + i.total, 0);
  const totalDebt = invoices.filter(i => i.status === InvoiceStatus.OVERDUE).reduce((sum, i) => sum + i.balanceDue, 0);
  const totalActive = clients.filter(c => jobs.some(j => j.clientId === c.id && (j.status === JobStatus.SCHEDULED || j.status === JobStatus.IN_PROGRESS))).length;

  // --- 3. FILTERING LOGIC ---
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
        const stats = getClientStats(client.id);
        
        // Search Logic
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
            client.firstName.toLowerCase().includes(searchLower) ||
            client.lastName.toLowerCase().includes(searchLower) ||
            (client.companyName && client.companyName.toLowerCase().includes(searchLower)) ||
            client.email.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;

        // Tab/Filter Logic
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'VIP') return stats.ltv > 2000; // Mock threshold
        if (activeFilter === 'DEBTORS') return stats.balance > 0;
        if (activeFilter === 'LEADS') return stats.jobCount === 0;
        
        return true;
    });
  }, [clients, jobs, invoices, activeFilter, searchQuery]);

  // --- 4. SORTING LOGIC ---
  const sortedClients = useMemo(() => {
      let sortable = [...filteredClients];
      if (sortConfig !== null) {
          sortable.sort((a, b) => {
              const statsA = getClientStats(a.id);
              const statsB = getClientStats(b.id);
              let aValue: any, bValue: any;

              switch (sortConfig.key) {
                  case 'name':
                      aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
                      bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
                      break;
                  case 'contact':
                      aValue = a.email.toLowerCase();
                      bValue = b.email.toLowerCase();
                      break;
                  case 'history':
                      // Prioritize next job for sorting, or last job if no next job
                      const dateA = statsA.nextJob ? new Date(statsA.nextJob.start).getTime() : (statsA.lastJob ? new Date(statsA.lastJob.end).getTime() : 0);
                      const dateB = statsB.nextJob ? new Date(statsB.nextJob.start).getTime() : (statsB.lastJob ? new Date(statsB.lastJob.end).getTime() : 0);
                      aValue = dateA;
                      bValue = dateB;
                      break;
                  case 'financial':
                      // Sort by LTV primarily
                      aValue = statsA.ltv;
                      bValue = statsB.ltv;
                      break;
                  default:
                      return 0;
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
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
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
      billingAddress: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
      },
      properties: [
        {
          id: `prop-${Date.now()}`,
          clientId: '', // Will be set by backend or ignored if ID generation strategy differs, but usually handled by consistent ID
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          },
          accessInstructions: 'Gate code: N/A'
        }
      ],
      tags: ['New'],
      createdAt: new Date().toISOString(),
    };
    // Correct clientId in property
    newClient.properties[0].clientId = newClient.id;

    onAddClient(newClient);
    setIsModalOpen(false);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', companyName: '', street: '', city: '', state: '', zip: '' });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
      if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
      return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 text-emerald-500" /> : <ArrowDown className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Clients</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage customer relationships, properties, and history.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-emerald-500/20">
          <UserPlus className="w-4 h-4 mr-2" />
          New Client
        </Button>
      </div>

      {/* FEATURE 1: METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase">Total</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Client Base</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{clients.length}</h3>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                  </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Active Engagements</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{totalActive}</h3>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                      <Wallet className="w-5 h-5" />
                  </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Lifetime Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">${(totalRevenue / 1000).toFixed(1)}k</h3>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                      <AlertCircle className="w-5 h-5" />
                  </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Outstanding Debt</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">${totalDebt.toLocaleString()}</h3>
          </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        {/* FEATURE 2: SEARCH & SEGMENTS TOOLBAR */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4 bg-slate-50/50 dark:bg-slate-800/50 items-center justify-between">
            
            {/* Tabs */}
            <div className="flex p-1 bg-slate-200/60 dark:bg-slate-700 rounded-xl self-start sm:self-center">
                {(['ALL', 'VIP', 'DEBTORS', 'LEADS'] as const).map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeFilter === filter 
                            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'
                        }`}
                    >
                        {filter === 'ALL' ? 'All Clients' : filter === 'VIP' ? 'VIP' : filter === 'DEBTORS' ? 'Owing' : 'Leads'}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
                 <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search clients..." 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all text-sm placeholder-slate-400"
                    />
                </div>
                <button className="p-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200">
                    <Filter className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* FEATURE 3: RICH LIST VIEW */}
        <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <tr>
                        <th 
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700 transition-colors group select-none"
                            onClick={() => handleSort('name')}
                        >
                            <div className="flex items-center gap-2">
                                Client Details <SortIcon columnKey="name" />
                            </div>
                        </th>
                        <th 
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700 transition-colors group select-none"
                            onClick={() => handleSort('contact')}
                        >
                            <div className="flex items-center gap-2">
                                Contact <SortIcon columnKey="contact" />
                            </div>
                        </th>
                        <th 
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700 transition-colors group select-none"
                            onClick={() => handleSort('history')}
                        >
                            <div className="flex items-center gap-2">
                                Service History <SortIcon columnKey="history" />
                            </div>
                        </th>
                        <th 
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700 transition-colors group select-none"
                            onClick={() => handleSort('financial')}
                        >
                            <div className="flex items-center gap-2">
                                Financial Health <SortIcon columnKey="financial" />
                            </div>
                        </th>
                        <th className="px-6 py-4 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {sortedClients.map((client) => {
                        const stats = getClientStats(client.id);
                        const isVIP = stats.ltv > 2000;
                        
                        return (
                        <tr key={client.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                            <td className="px-6 py-4 align-top">
                                <Link to={`/clients/${client.id}`} className="flex items-start gap-4 group-hover:text-emerald-800 dark:group-hover:text-emerald-400">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border shrink-0 ${isVIP ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 border-amber-200' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}>
                                        {isVIP ? <Star className="w-5 h-5" /> : `${client.firstName[0]}${client.lastName[0]}`}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-slate-900 dark:text-white text-base">{client.firstName} {client.lastName}</p>
                                            {isVIP && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-1.5 rounded font-bold uppercase">VIP</span>}
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{client.companyName || 'Residential'}</p>
                                        <div className="flex gap-1 mt-1.5">
                                            {client.tags.slice(0,2).map(tag => (
                                                <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            </td>

                            {/* FEATURE 5: ACTION ORIENTED CONTACT */}
                            <td className="px-6 py-4 align-top">
                                <div className="space-y-1.5">
                                    <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                        <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                        {client.email}
                                    </a>
                                    <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                        <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                        {client.phone}
                                    </a>
                                    <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <MapPin className="w-3.5 h-3.5 mt-1 text-slate-400 dark:text-slate-500" />
                                        <span className="truncate max-w-[150px] text-xs text-slate-500 dark:text-slate-400">
                                            {client.billingAddress.city}, {client.billingAddress.state}
                                        </span>
                                    </div>
                                </div>
                            </td>

                            {/* FEATURE 3: LAST/NEXT JOB CONTEXT */}
                            <td className="px-6 py-4 align-top">
                                <div className="space-y-3">
                                    {stats.nextJob ? (
                                        <div className="flex items-start gap-2">
                                            <Calendar className="w-3.5 h-3.5 mt-0.5 text-emerald-500" />
                                            <div>
                                                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Next: {new Date(stats.nextJob.start).toLocaleDateString()}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{stats.nextJob.title}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
                                            <Calendar className="w-3.5 h-3.5" /> No upcoming jobs
                                        </div>
                                    )}

                                    {stats.lastJob && (
                                        <div className="flex items-start gap-2 opacity-75">
                                            <Clock className="w-3.5 h-3.5 mt-0.5 text-slate-400" />
                                            <div>
                                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Last: {new Date(stats.lastJob.end).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </td>

                            {/* FEATURE 4: FINANCIAL HEALTH */}
                            <td className="px-6 py-4 align-top">
                                <div className="space-y-1">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Lifetime Value</p>
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">${stats.ltv.toLocaleString()}</p>
                                    </div>
                                    {stats.balance > 0 ? (
                                        <div className="bg-red-50 dark:bg-red-900/20 p-1.5 rounded-lg border border-red-100 dark:border-red-800 inline-block mt-1">
                                            <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Due: ${stats.balance.toLocaleString()}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded inline-block">
                                            Paid in Full
                                        </div>
                                    )}
                                </div>
                            </td>

                            <td className="px-6 py-4 text-right align-middle">
                                <Link to={`/clients/${client.id}`} className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all inline-block">
                                    <ChevronRight className="w-5 h-5" />
                                </Link>
                            </td>
                        </tr>
                        );
                    })}
                </tbody>
            </table>
            
            {sortedClients.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No clients found matching your criteria.</p>
                </div>
            )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Client"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save Client</Button>
          </>
        }
      >
        <div className="space-y-5 p-1">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">First Name</label>
              <input name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="John" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Last Name</label>
              <input name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Doe" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Company (Optional)</label>
            <input name="companyName" value={formData.companyName} onChange={handleInputChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Acme Corp" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <input name="email" value={formData.email} onChange={handleInputChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone</label>
              <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="(555) 123-4567" />
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-700 pt-5">
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Address</h4>
            <div className="space-y-4">
               <input name="street" value={formData.street} onChange={handleInputChange} className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Street Address" />
               <div className="grid grid-cols-3 gap-4">
                 <input name="city" value={formData.city} onChange={handleInputChange} className="col-span-1 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="City" />
                 <input name="state" value={formData.state} onChange={handleInputChange} className="col-span-1 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="State" />
                 <input name="zip" value={formData.zip} onChange={handleInputChange} className="col-span-1 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Zip" />
               </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
