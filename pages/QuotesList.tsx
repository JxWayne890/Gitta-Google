import React, { useState, useMemo, useEffect } from 'react';
import { Quote, Client, QuoteStatus } from '../types';
import { 
  FileText, Calendar, DollarSign, CheckCircle, XCircle, Send, Plus, 
  Search, Filter, TrendingUp, Clock, AlertTriangle, MoreHorizontal, 
  ArrowUpRight, MapPin, Percent, Briefcase, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { formatDistanceToNow, isPast, addDays, isBefore, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

interface QuotesListProps {
  quotes: Quote[];
  clients: Client[];
  onAddQuote: (quote: Quote) => void;
  onUpdateQuote: (quote: Quote) => void;
}

type QuoteFilter = 'ALL' | 'DRAFT' | 'SENT' | 'APPROVED' | 'ARCHIVED';

export const QuotesList: React.FC<QuotesListProps> = ({ quotes, clients, onAddQuote, onUpdateQuote }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<QuoteFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
      clientId: '',
      amount: '500',
      description: 'Service Estimate'
  });

  useEffect(() => {
    const handleClickOutside = () => setOpenStatusMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const metrics = useMemo(() => {
      const activeQuotes = quotes.filter(q => q.status === QuoteStatus.SENT || q.status === QuoteStatus.DRAFT);
      const pipelineValue = activeQuotes.reduce((sum, q) => sum + q.total, 0);
      const wonQuotes = quotes.filter(q => q.status === QuoteStatus.APPROVED || q.status === QuoteStatus.CONVERTED);
      const wonValue = wonQuotes.reduce((sum, q) => sum + q.total, 0);
      const lostQuotes = quotes.filter(q => q.status === QuoteStatus.DECLINED);
      const totalDecided = wonQuotes.length + lostQuotes.length;
      const winRate = totalDecided > 0 ? (wonQuotes.length / totalDecided) * 100 : 0;
      return { pipelineValue, wonValue, activeCount: activeQuotes.length, winRate };
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
      return quotes.filter(quote => {
          const client = clients.find(c => c.id === quote.clientId);
          const searchLower = searchQuery.toLowerCase();
          const matchesSearch = 
            quote.id.toLowerCase().includes(searchLower) ||
            client?.firstName.toLowerCase().includes(searchLower) ||
            client?.lastName.toLowerCase().includes(searchLower) ||
            client?.companyName?.toLowerCase().includes(searchLower);
          
          if (!matchesSearch) return false;
          if (activeFilter === 'ALL') return true;
          if (activeFilter === 'DRAFT') return quote.status === QuoteStatus.DRAFT;
          if (activeFilter === 'SENT') return quote.status === QuoteStatus.SENT;
          if (activeFilter === 'APPROVED') return quote.status === QuoteStatus.APPROVED || quote.status === QuoteStatus.CONVERTED;
          if (activeFilter === 'ARCHIVED') return quote.status === QuoteStatus.DECLINED;
          return true;
      });
  }, [quotes, clients, activeFilter, searchQuery]);

  const sortedQuotes = useMemo(() => {
      let sortable = [...filteredQuotes];
      sortable.sort((a, b) => {
          const clientA = clients.find(c => c.id === a.clientId);
          const clientB = clients.find(c => c.id === b.clientId);
          let aVal: any, bVal: any;
          switch (sortConfig.key) {
              case 'details': aVal = new Date(a.issuedDate).getTime(); bVal = new Date(b.issuedDate).getTime(); break;
              case 'client': aVal = `${clientA?.firstName} ${clientA?.lastName}`.toLowerCase(); bVal = `${clientB?.firstName} ${clientB?.lastName}`.toLowerCase(); break;
              case 'status': aVal = a.status; bVal = b.status; break;
              case 'value': aVal = a.total; bVal = b.total; break;
              case 'date': aVal = new Date(a.issuedDate).getTime(); bVal = new Date(b.issuedDate).getTime(); break;
              default: return 0;
          }
          if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
      return sortable;
  }, [filteredQuotes, sortConfig, clients]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleStatusUpdate = (quote: Quote, newStatus: QuoteStatus) => {
      const updatedQuote = { ...quote, status: newStatus };
      onUpdateQuote(updatedQuote);
      setOpenStatusMenuId(null);
  };

  const getStatusBadge = (quote: Quote) => {
    const status = quote.status;
    let badgeContent;
    switch (status) {
      case QuoteStatus.APPROVED: case QuoteStatus.CONVERTED: badgeContent = (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 uppercase tracking-wide"><CheckCircle className="w-3 h-3" /> Approved</span>); break;
      case QuoteStatus.SENT: badgeContent = (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 uppercase tracking-wide"><Send className="w-3 h-3" /> Sent</span>); break;
      case QuoteStatus.DRAFT: badgeContent = (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 uppercase tracking-wide"><FileText className="w-3 h-3" /> Draft</span>); break;
      case QuoteStatus.DECLINED: badgeContent = (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 uppercase tracking-wide"><XCircle className="w-3 h-3" /> Declined</span>); break;
      default: badgeContent = null;
    }
    return (
        <div className="relative inline-block">
            <button onClick={(e) => { e.stopPropagation(); setOpenStatusMenuId(openStatusMenuId === quote.id ? null : quote.id); }} className="hover:opacity-80 transition-opacity focus:outline-none flex items-center gap-1">{badgeContent} <ChevronDown className="w-3 h-3 text-slate-400" /></button>
            {openStatusMenuId === quote.id && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="py-1">
                        <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(quote, QuoteStatus.DRAFT); }} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400"></div> Draft</button>
                        <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(quote, QuoteStatus.SENT); }} className="w-full text-left px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Sent</button>
                        <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(quote, QuoteStatus.APPROVED); }} className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Approved</button>
                        <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(quote, QuoteStatus.DECLINED); }} className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Declined</button>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const handleSubmit = () => {
      if (!formData.clientId) return;
      const client = clients.find(c => c.id === formData.clientId);
      if (!client) return;

      const total = parseFloat(formData.amount);
      const newQuote: Quote = {
          id: crypto.randomUUID(),
          clientId: client.id,
          propertyId: client.properties[0].id,
          items: [{ id: crypto.randomUUID(), description: formData.description, quantity: 1, unitPrice: total, total: total }],
          subtotal: total,
          tax: total * 0.1,
          total: total * 1.1,
          status: QuoteStatus.DRAFT,
          issuedDate: new Date().toISOString(),
          expiryDate: new Date(Date.now() + 86400000 * 7).toISOString()
      };

      onAddQuote(newQuote);
      setIsModalOpen(false);
      setFormData({ clientId: '', amount: '500', description: 'Service Estimate' });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 text-emerald-500" /> : <ArrowDown className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Quotes</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Create estimates, track approvals, and secure new business.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-emerald-500/20"><Plus className="w-4 h-4 mr-2" /> New Quote</Button>
      </div>

      {/* Metrics ... */}
      {/* Table ... */}
      
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
         {/* Filter Header ... */}
         <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('details')}>Quote Details <SortIcon columnKey="details" /></th>
                        <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('client')}>Client & Property <SortIcon columnKey="client" /></th>
                        <th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('status')}>Status & Timeline <SortIcon columnKey="status" /></th>
                        <th className="px-6 py-4 cursor-pointer text-right" onClick={() => handleSort('value')}>Total Value <SortIcon columnKey="value" /></th>
                        <th className="px-6 py-4 w-10"></th>
                    </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {sortedQuotes.map(quote => {
                        const client = clients.find(c => c.id === quote.clientId);
                        const property = client?.properties.find(p => p.id === quote.propertyId);
                        const isExpired = isPast(parseISO(quote.expiryDate)) && quote.status === QuoteStatus.SENT;

                        return (
                            <tr key={quote.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group">
                                <td className="px-6 py-4 align-top">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 dark:text-slate-500 shrink-0 border border-slate-200 dark:border-slate-700"><FileText className="w-5 h-5" /></div>
                                        <div><p className="font-bold text-slate-900 dark:text-white text-sm">#{quote.id.slice(0, 8).toUpperCase()}</p><p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">{quote.items[0]?.description || 'General Service'}</p></div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <div className="flex items-center gap-3 mb-1.5"><div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center text-xs font-bold border border-slate-200 dark:border-slate-700">{client?.firstName[0]}</div><span className="text-sm font-bold text-slate-700 dark:text-slate-300">{client?.firstName} {client?.lastName}</span></div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><MapPin className="w-3 h-3 text-slate-400" /><span className="truncate max-w-[180px]">{property?.address.street}, {property?.address.city}</span></div>
                                </td>
                                <td className="px-6 py-4 align-top">
                                    <div className="flex flex-col gap-2 items-start">{getStatusBadge(quote)}
                                        <div className="flex items-center gap-2 text-xs mt-1">{isExpired ? (<span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded"><AlertTriangle className="w-3 h-3" /> Expired</span>) : (<span className="text-slate-400 dark:text-slate-500">Exp: {new Date(quote.expiryDate).toLocaleDateString()}</span>)}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 align-top text-right"><p className="text-lg font-bold text-slate-900 dark:text-white">${quote.total.toFixed(2)}</p><p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Includes Tax</p></td>
                                <td className="px-6 py-4 align-middle text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {quote.status === QuoteStatus.DRAFT && (<button className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors" title="Send to Client" onClick={() => { handleStatusUpdate(quote, QuoteStatus.SENT); alert(`Quote #${quote.id.slice(0,8)} sent!`); }}><Send className="w-4 h-4" /></button>)}
                                        {quote.status === QuoteStatus.SENT && (<button className="p-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors" title="Approve & Convert" onClick={() => { handleStatusUpdate(quote, QuoteStatus.APPROVED); alert(`Quote #${quote.id.slice(0,8)} converted to job!`); }}><CheckCircle className="w-4 h-4" /></button>)}
                                        <Link to="#" className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><ArrowUpRight className="w-4 h-4" /></Link>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
               </tbody>
            </table>
         </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Quote" footer={<><Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Create Quote</Button></>}>
          <div className="space-y-4 p-1">
              <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Client</label><select className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.clientId} onChange={(e) => setFormData(p => ({...p, clientId: e.target.value}))}><option value="">Select Client...</option>{clients.map(c => (<option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>))}</select></div>
              <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Service Title</label><input value={formData.description} onChange={(e) => setFormData(p => ({...p, description: e.target.value}))} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="e.g. Full House Exterior Wash" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Estimated Amount ($)</label><input type="number" value={formData.amount} onChange={(e) => setFormData(p => ({...p, amount: e.target.value}))} className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" /></div>
          </div>
      </Modal>
    </div>
  );
};