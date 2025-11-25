
import React, { useState, useMemo } from 'react';
import { Invoice, Client, InvoiceStatus } from '../types';
import { 
  FileText, Check, Clock, AlertCircle, ChevronRight, 
  Mail, CreditCard, Loader2, Plus, Search, Filter, 
  TrendingUp, DollarSign, Calendar, ArrowUpRight, Send, 
  Printer, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { format, isPast, differenceInDays, addDays } from 'date-fns';

interface InvoicesProps {
  invoices: Invoice[];
  clients: Client[];
  onCreateInvoice: (invoice: Invoice) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
}

type InvoiceFilter = 'ALL' | 'PAID' | 'OUTSTANDING' | 'DRAFT' | 'OVERDUE';

export const Invoices: React.FC<InvoicesProps> = ({ invoices, clients, onCreateInvoice, onUpdateInvoice }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  
  // Filters
  const [activeFilter, setActiveFilter] = useState<InvoiceFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'info', direction: 'desc' });

  // Form State
  const [formData, setFormData] = useState({ clientId: '', amount: '250', description: 'Service' });

  // --- FEATURE 1: FINANCIAL DASHBOARD METRICS ---
  const metrics = useMemo(() => {
      const paid = invoices.filter(i => i.status === InvoiceStatus.PAID);
      const overdue = invoices.filter(i => i.status === InvoiceStatus.OVERDUE);
      const outstanding = invoices.filter(i => i.status === InvoiceStatus.SENT || i.status === InvoiceStatus.OVERDUE);
      const drafts = invoices.filter(i => i.status === InvoiceStatus.DRAFT);

      return {
          totalCollected: paid.reduce((sum, i) => sum + i.total, 0),
          totalOverdue: overdue.reduce((sum, i) => sum + i.balanceDue, 0),
          totalOutstanding: outstanding.reduce((sum, i) => sum + i.balanceDue, 0),
          draftCount: drafts.length,
          paidCount: paid.length
      };
  }, [invoices]);

  // --- FILTERING ---
  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
        const client = clients.find(c => c.id === invoice.clientId);
        
        // Search
        const searchString = `${invoice.id} ${client?.firstName || ''} ${client?.lastName || ''} ${client?.companyName || ''}`.toLowerCase();
        if (searchTerm && !searchString.includes(searchTerm.toLowerCase())) return false;

        // Tabs
        if (activeFilter === 'ALL') return true;
        if (activeFilter === 'PAID') return invoice.status === InvoiceStatus.PAID;
        if (activeFilter === 'OUTSTANDING') return invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE;
        if (activeFilter === 'OVERDUE') return invoice.status === InvoiceStatus.OVERDUE;
        if (activeFilter === 'DRAFT') return invoice.status === InvoiceStatus.DRAFT;
        
        return true;
    });
  }, [invoices, clients, activeFilter, searchTerm]);

  // --- SORTING ---
  const sortedInvoices = useMemo(() => {
    let sortable = [...filteredInvoices];
    sortable.sort((a, b) => {
        const clientA = clients.find(c => c.id === a.clientId);
        const clientB = clients.find(c => c.id === b.clientId);
        
        let aVal: any, bVal: any;
        switch (sortConfig.key) {
            case 'info':
                aVal = new Date(a.issuedDate).getTime();
                bVal = new Date(b.issuedDate).getTime();
                break;
            case 'client':
                aVal = `${clientA?.firstName} ${clientA?.lastName}`.toLowerCase();
                bVal = `${clientB?.firstName} ${clientB?.lastName}`.toLowerCase();
                break;
            case 'status':
                 // Weight status for sorting: Overdue > Sent > Draft > Paid
                const rank = { [InvoiceStatus.OVERDUE]: 0, [InvoiceStatus.SENT]: 1, [InvoiceStatus.DRAFT]: 2, [InvoiceStatus.PAID]: 3, [InvoiceStatus.BAD_DEBT]: 4 };
                aVal = rank[a.status];
                bVal = rank[b.status];
                break;
            case 'amount':
                aVal = a.total;
                bVal = b.total;
                break;
            default: return 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
    return sortable;
  }, [filteredInvoices, sortConfig, clients]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Actions
  const handleRowClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailOpen(true);
  };

  const handleSendInvoice = (e: React.MouseEvent, invoice: Invoice) => {
    e.stopPropagation();
    const client = clients.find(c => c.id === invoice.clientId);
    setSendingInvoiceId(invoice.id);
    setTimeout(() => {
        setSendingInvoiceId(null);
        const clientName = client ? `${client.firstName} ${client.lastName}` : 'Client';
        alert(`Invoice #${invoice.id} sent to ${clientName}`);
        if (invoice.status === InvoiceStatus.DRAFT) {
             onUpdateInvoice({ ...invoice, status: InvoiceStatus.SENT });
        }
    }, 1500);
  };

  const handleRecordPayment = (e: React.MouseEvent, invoice: Invoice) => {
      e.stopPropagation();
      const paidInvoice: Invoice = {
          ...invoice,
          status: InvoiceStatus.PAID,
          balanceDue: 0,
          payments: [
              ...invoice.payments,
              {
                  id: `pay-${Date.now()}`,
                  invoiceId: invoice.id,
                  amount: invoice.balanceDue,
                  method: 'CREDIT_CARD',
                  date: new Date().toISOString()
              }
          ]
      };
      onUpdateInvoice(paidInvoice);
  };

  const handleCreateInvoice = () => {
      if (!formData.clientId) return;
      const client = clients.find(c => c.id === formData.clientId);
      if (!client) return;
      
      const amount = parseFloat(formData.amount);
      const newInvoice: Invoice = {
          id: `inv-${Date.now()}`,
          clientId: client.id,
          items: [{ id: `item-${Date.now()}`, description: formData.description, quantity: 1, unitPrice: amount, total: amount }],
          subtotal: amount,
          tax: amount * 0.1,
          total: amount * 1.1,
          balanceDue: amount * 1.1,
          status: InvoiceStatus.DRAFT,
          dueDate: new Date(Date.now() + 86400000 * 14).toISOString(),
          issuedDate: new Date().toISOString(),
          payments: []
      };

      onCreateInvoice(newInvoice);
      setIsCreateModalOpen(false);
      setFormData({ clientId: '', amount: '250', description: 'Service' });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
      switch (status) {
          case InvoiceStatus.PAID:
              return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide"><Check className="w-3 h-3" /> Paid</span>;
          case InvoiceStatus.OVERDUE:
              return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 uppercase tracking-wide"><AlertCircle className="w-3 h-3" /> Overdue</span>;
          case InvoiceStatus.SENT:
              return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide"><Mail className="w-3 h-3" /> Sent</span>;
          default:
              return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide"><FileText className="w-3 h-3" /> Draft</span>;
      }
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 text-emerald-500" /> : <ArrowDown className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Invoices</h1>
            <p className="text-slate-500 mt-1">Track payments, manage billing cycles, and revenue.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4 mr-2" /> Create Invoice
        </Button>
      </div>

      {/* FEATURE 1: FINANCIAL DASHBOARD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Revenue</span>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Collected</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">${metrics.totalCollected.toLocaleString()}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <CreditCard className="w-5 h-5" />
                  </div>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Outstanding</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">${metrics.totalOutstanding.toLocaleString()}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                      <AlertTriangle className="w-5 h-5" />
                  </div>
                  {metrics.totalOverdue > 0 && (
                      <span className="text-[10px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full uppercase">Action Needed</span>
                  )}
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Overdue Amount</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">${metrics.totalOverdue.toLocaleString()}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                      <FileText className="w-5 h-5" />
                  </div>
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Draft Volume</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{metrics.draftCount}</h3>
          </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        
        {/* FEATURE 2: WORKFLOW TABS */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-slate-50/50 items-center justify-between">
            <div className="flex p-1 bg-slate-200/60 rounded-xl self-start sm:self-center">
                {[
                    { id: 'ALL', label: 'All Invoices' },
                    { id: 'OUTSTANDING', label: 'Outstanding' },
                    { id: 'PAID', label: 'Paid' },
                    { id: 'OVERDUE', label: 'Overdue' },
                    { id: 'DRAFT', label: 'Drafts' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveFilter(tab.id as InvoiceFilter)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeFilter === tab.id
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
                 <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search invoices..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900 transition-all text-sm"
                    />
                </div>
                <button className="p-2 border border-slate-200 rounded-xl bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700">
                    <Filter className="w-4 h-4" />
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <tr>
                        <th 
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors group select-none"
                            onClick={() => handleSort('info')}
                        >
                            <div className="flex items-center gap-2">
                                Invoice Info <SortIcon columnKey="info" />
                            </div>
                        </th>
                        <th 
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors group select-none"
                            onClick={() => handleSort('client')}
                        >
                            <div className="flex items-center gap-2">
                                Client <SortIcon columnKey="client" />
                            </div>
                        </th>
                        <th 
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors group select-none"
                            onClick={() => handleSort('status')}
                        >
                            <div className="flex items-center gap-2">
                                Status <SortIcon columnKey="status" />
                            </div>
                        </th>
                        <th 
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 transition-colors group select-none text-right"
                            onClick={() => handleSort('amount')}
                        >
                            <div className="flex items-center justify-end gap-2">
                                Amount & Balance <SortIcon columnKey="amount" />
                            </div>
                        </th>
                        <th className="px-6 py-4 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {sortedInvoices.length === 0 ? (
                         <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p className="font-medium">No invoices found matching your criteria.</p>
                            </td>
                        </tr>
                    ) : (
                        sortedInvoices.map((invoice) => {
                            const client = clients.find(c => c.id === invoice.clientId);
                            const daysOverdue = invoice.status === InvoiceStatus.OVERDUE 
                                ? differenceInDays(new Date(), new Date(invoice.dueDate)) 
                                : 0;

                            return (
                                <tr 
                                    key={invoice.id}
                                    onClick={() => handleRowClick(invoice)}
                                    className="group hover:bg-slate-50/80 cursor-pointer transition-colors duration-150"
                                >
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-slate-100 rounded-lg text-slate-400 shrink-0 border border-slate-200">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">#{invoice.id.slice(-6).toUpperCase()}</p>
                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(invoice.issuedDate), 'MMM d, yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold border border-slate-200">
                                                {client?.firstName[0]}{client?.lastName[0]}
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{client?.firstName} {client?.lastName}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 ml-9 truncate max-w-[200px]">{client?.companyName || client?.email}</p>
                                    </td>

                                    {/* FEATURE 3: INTELLIGENT AGING */}
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex flex-col items-start gap-1.5">
                                            {getStatusBadge(invoice.status)}
                                            
                                            {invoice.status === InvoiceStatus.OVERDUE && daysOverdue > 0 && (
                                                <span className="text-[10px] font-bold text-red-600 flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded">
                                                    <Clock className="w-3 h-3" /> {daysOverdue} days late
                                                </span>
                                            )}
                                            {invoice.status === InvoiceStatus.SENT && (
                                                <span className="text-[10px] text-slate-400">
                                                    Due: {format(new Date(invoice.dueDate), 'MMM d')}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 align-top text-right">
                                        {/* FEATURE 4: RICH DATA ROWS */}
                                        <p className="text-lg font-bold text-slate-900">${invoice.total.toFixed(2)}</p>
                                        {invoice.balanceDue > 0 ? (
                                            <p className="text-xs font-bold text-red-600 mt-0.5">Due: ${invoice.balanceDue.toFixed(2)}</p>
                                        ) : (
                                            <p className="text-xs text-emerald-600 mt-0.5 font-medium">Paid in Full</p>
                                        )}
                                    </td>

                                    {/* FEATURE 5: INLINE QUICK ACTIONS */}
                                    <td className="px-6 py-4 align-middle text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {(invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE) && (
                                                <button 
                                                    onClick={(e) => handleRecordPayment(e, invoice)}
                                                    className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                                                    title="Record Payment"
                                                >
                                                    <CreditCard className="w-4 h-4" />
                                                </button>
                                            )}
                                            {(invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE) && (
                                                <button 
                                                    onClick={(e) => handleSendInvoice(e, invoice)}
                                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="Email Invoice"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                            )}
                                            <div className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </div>

       <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Invoice"
        footer={
            <>
                <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateInvoice}>Generate Invoice</Button>
            </>
        }
      >
          <div className="space-y-4 p-1">
              <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Client</label>
                  <select 
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    value={formData.clientId}
                    onChange={(e) => setFormData(p => ({...p, clientId: e.target.value}))}
                  >
                      <option value="">Select Client...</option>
                      {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                      ))}
                  </select>
              </div>
              <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Service Description</label>
                  <input 
                      value={formData.description}
                      onChange={(e) => setFormData(p => ({...p, description: e.target.value}))}
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      placeholder="e.g. Emergency Plumbing Repair"
                  />
              </div>
              <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Amount ($)</label>
                  <input 
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData(p => ({...p, amount: e.target.value}))}
                      className="w-full border border-slate-200 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
              </div>
          </div>
      </Modal>

      {/* Invoice Detail Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Invoice Details"
      >
          {selectedInvoice && (
              <div className="space-y-6">
                  <div className="flex justify-between items-start pb-6 border-b border-slate-100">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900">Invoice #{selectedInvoice.id.slice(-6).toUpperCase()}</h2>
                        <p className="text-sm text-slate-500 mt-1">Issued on {format(new Date(selectedInvoice.issuedDate), 'MMM d, yyyy')}</p>
                      </div>
                      {getStatusBadge(selectedInvoice.status)}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex justify-between">
                      <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Bill To</p>
                          {(() => {
                              const c = clients.find(client => client.id === selectedInvoice.clientId);
                              return (
                                  <>
                                    <p className="font-bold text-slate-900">{c?.firstName} {c?.lastName}</p>
                                    <p className="text-sm text-slate-600 mt-0.5">{c?.email}</p>
                                    <p className="text-sm text-slate-600">{c?.phone}</p>
                                  </>
                              );
                          })()}
                      </div>
                      <div className="text-right">
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Balance Due</p>
                           <p className={`text-3xl font-bold ${selectedInvoice.balanceDue > 0 ? 'text-red-600' : 'text-slate-900'}`}>${selectedInvoice.balanceDue.toFixed(2)}</p>
                      </div>
                  </div>

                  <table className="w-full text-sm">
                      <thead className="border-b border-slate-200">
                          <tr>
                              <th className="text-left font-semibold text-slate-500 py-3">Description</th>
                              <th className="text-right font-semibold text-slate-500 py-3">Price</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {selectedInvoice.items.length > 0 ? selectedInvoice.items.map(item => (
                              <tr key={item.id}>
                                  <td className="py-4 text-slate-900">{item.description} <span className="text-slate-400 text-xs ml-1">x{item.quantity}</span></td>
                                  <td className="py-4 text-right font-medium text-slate-900">${item.total.toFixed(2)}</td>
                              </tr>
                          )) : (
                              <tr>
                                  <td className="py-4 text-slate-900">Labor & Services</td>
                                  <td className="py-4 text-right font-medium text-slate-900">${selectedInvoice.subtotal.toFixed(2)}</td>
                              </tr>
                          )}
                      </tbody>
                      <tfoot className="border-t border-slate-200">
                          <tr>
                              <td className="py-3 text-slate-600 text-right pr-4">Subtotal</td>
                              <td className="py-3 text-right font-medium">${selectedInvoice.subtotal.toFixed(2)}</td>
                          </tr>
                          <tr>
                              <td className="py-1 text-slate-600 text-right pr-4">Tax</td>
                              <td className="py-1 text-right font-medium">${selectedInvoice.tax.toFixed(2)}</td>
                          </tr>
                           <tr>
                              <td className="py-4 text-slate-900 font-bold text-right pr-4">Total</td>
                              <td className="py-4 text-right font-bold text-slate-900 text-lg">${selectedInvoice.total.toFixed(2)}</td>
                          </tr>
                      </tfoot>
                  </table>

                  <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        disabled={sendingInvoiceId === selectedInvoice.id || selectedInvoice.status === InvoiceStatus.PAID}
                        onClick={(e) => handleSendInvoice(e, selectedInvoice)}
                      >
                          {sendingInvoiceId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                              <>
                                <Mail className="w-4 h-4 mr-2" />
                                {selectedInvoice.status === InvoiceStatus.SENT ? 'Resend' : 'Email Invoice'}
                              </>
                          )}
                      </Button>
                      {selectedInvoice.balanceDue > 0 && (
                         <Button className="flex-1" onClick={(e) => handleRecordPayment(e, selectedInvoice)}>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Record Payment
                         </Button>
                      )}
                  </div>
              </div>
          )}
      </Modal>
    </div>
  );
};
