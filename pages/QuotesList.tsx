
import React, { useState, useMemo } from 'react';
import { Quote, Client, QuoteStatus } from '../types';
import { 
  FileText, Calendar, DollarSign, CheckCircle, XCircle, Send, Plus, 
  Search, Filter, TrendingUp, Clock, AlertTriangle, MoreHorizontal, 
  ArrowUpRight, MapPin, Percent, Briefcase, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronDown
} from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { formatDistanceToNow, isPast, addDays, isBefore } from 'date-fns';
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
  
  // Dropdown State for Status
  const [activeStatusDropdown, setActiveStatusDropdown] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
      clientId: '',
      amount: '500',
      description: 'Service Estimate'
  });

  // --- FEATURE 1: PIPELINE METRICS ---
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

  // --- FILTERING ---
  const filteredQuotes = useMemo(() => {
      return quotes.filter(quote => {
          const client = clients.find(c => c.id === quote.clientId);
          
          // Search
          const searchLower = searchQuery.toLowerCase();
          const matchesSearch = 
            quote.id.toLowerCase().includes(searchLower) ||
            client?.firstName.toLowerCase().includes(searchLower) ||
            client?.lastName.toLowerCase().includes(searchLower) ||
            client?.companyName?.toLowerCase().includes(searchLower);
          
          if (!matchesSearch) return false;

          // Filter Tabs
          if (activeFilter === 'ALL') return true;
          if (activeFilter === 'DRAFT') return quote.status === QuoteStatus.DRAFT;
          if (activeFilter === 'SENT') return quote.status === QuoteStatus.SENT;
          if (activeFilter === 'APPROVED') return quote.status === QuoteStatus.APPROVED || quote.status === QuoteStatus.CONVERTED;
          if (activeFilter === 'ARCHIVED') return quote.status === QuoteStatus.DECLINED;
          
          return true;
      });
  }, [quotes, clients, activeFilter, searchQuery]);

  // --- SORTING ---
  const sortedQuotes = useMemo(() => {
      let sortable = [...filteredQuotes];
      sortable.sort((a, b) => {
          const clientA = clients.find(c => c.id === a.clientId);
          const clientB = clients.find(c => c.id === b.clientId);
          
          let aVal: any, bVal: any;
          switch (sortConfig.key) {
              case 'details':
                  aVal = new Date(a.issuedDate).getTime();
                  bVal = new Date(b.issuedDate).getTime();
                  break;
              case 'client':
                  aVal = `${clientA?.firstName} ${clientA?.lastName}`.toLowerCase();
                  bVal = `${clientB?.firstName} ${clientB?.lastName}`.toLowerCase();
                  break;
              case 'status':
                  aVal = a.status;
                  bVal = b.status;
                  break;
              case 'value':
                  aVal = a.total;
                  bVal = b.total;
                  break;
              case 'date':
                  aVal = new Date(a.issuedDate).getTime();
                  bVal = new Date(b.issuedDate).getTime();
                  break;
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
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleStatusChange = (quote: Quote, newStatus: QuoteStatus) => {
      onUpdateQuote({ ...quote, status: newStatus });
      setActiveStatusDropdown(null);
  };

  const getStatusBadge = (quote: Quote) => {
    const status = quote.status;
    const baseClasses = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wide cursor-pointer select-none hover:opacity-80 transition-opacity";
    
    let content;
    let colorClasses;

    switch (status) {
      case QuoteStatus.APPROVED: 
      case QuoteStatus.CONVERTED:
        colorClasses = "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800";
        content = <><CheckCircle className="w-3 h-3" /> Approved</>;
        break;
      case QuoteStatus.SENT: 
        colorClasses = "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
        content = <><Send className="w-3 h-3" /> Sent</>;
        break;
      case QuoteStatus.DRAFT: 
        colorClasses = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600";
        content = <><FileText className="w-3 h-3" /> Draft</>;
        break;
      case QuoteStatus.DECLINED: 
        colorClasses = "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800";
        content = <><XCircle className="w-3 h-3" /> Declined</>;
        break;
      default: 
        return null;
    }

    return (
        <div className="relative">
            <span 
                onClick={(e) => { e.stopPropagation(); setActiveStatusDropdown(activeStatusDropdown === quote.id ? null : quote.id); }}
                className={`${baseClasses} ${colorClasses}`}
            >
                {content} <ChevronDown className="w-3 h-3 ml-1" />
            </span>
            
            {activeStatusDropdown === quote.id && (
                <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setActiveStatusDropdown(null); }}></div>
                    <div className="absolute left-0 top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-20 py-1 animate-in fade-in zoom-in-95 duration-150">
                        {[QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.APPROVED, QuoteStatus.DECLINED].map(s => (
                            <button
                                key={s}
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(quote, s); }}
                                className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 ${s === status ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-600 dark:text-slate-300'}`}
                            >
                                {s === QuoteStatus.APPROVED && <CheckCircle className="w-3 h-3" />}
                                {s === QuoteStatus.SENT && <Send className="w-3 h-3" />}
                                {s === QuoteStatus.DRAFT && <FileText className="w-3 h-3" />}
                                {s === QuoteStatus.DECLINED && <XCircle className="w-3 h-3" />}
                                {s.charAt(0) + s.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </>
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
          id: `quote-${Date.now()}`,
          clientId: client.id,
          propertyId: client.properties[0].id,
          items: [
              { id: `item-${Date.now()}`, description: formData.description, quantity: 1, unitPrice: total, total: total }
          ],
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Quotes</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Create estimates, track approvals, and secure new business.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-emerald-500/20">
          <Plus className="w-4 h-4 mr-2" /> New Quote
        </Button>
      </div>

      {/* FEATURE 1: PIPELINE METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                      <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full uppercase">Potential</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Pipeline</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">${metrics.pipelineValue.toLocaleString()}</h3>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                      <Briefcase className="w-5 h-5" />
                  </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Active Quotes</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{metrics.activeCount}</h3>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <Percent className="w-5 h-5" />
                  </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Win Rate</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{metrics.winRate.toFixed(1)}%</h3>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                      <DollarSign className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase">Closed</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Secured Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">${metrics.wonValue.toLocaleString()}</h3>
          </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
         
         {/* FEATURE 2: STATUS TABS & SEARCH */}
         <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-4 bg-slate-50/50 dark:bg-slate-800/50 items-center justify-between">
            <div className="flex p-1 bg-slate-200/60 dark:bg-slate-700 rounded-xl self-start sm:self-center">
                {(['ALL', 'DRAFT', 'SENT', 'APPROVED', 'ARCHIVED'] as const).map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeFilter === filter 
                            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50'
                        }`}
                    >
                        {filter === 'ALL' ? 'All Quotes' : filter.charAt(0) + filter.slice(1).toLowerCase()}
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
                        placeholder="Search quotes..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all text-sm placeholder-slate-400"
                    />
                </div>
                <button className="p-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200">
                    <Filter className="w-4 h-4" />
                </button>
            </div>
         </div>

         {/* FEATURE 3: RICH LIST CARDS */}
         <div className="flex-1 overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <tr>
                        <th 
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700 transition-colors group select-none"
                            onClick={() => handleSort('details')}
                        >
                            <div className="flex items-center gap-2">
                                Quote Details <SortIcon columnKey="details" />
                            </div>
                        </th>
                        <th 
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700 transition-colors group select-none"
                            onClick={() => handleSort('client')}
                        >
                            <div className="flex items-center gap-2">
                                Client & Property <SortIcon columnKey="client" />
                            </div>
                        </th>
                        <th 
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700 transition-colors group select-none"
                            onClick={() => handleSort('status')}
                        >
                            <div className="flex items-center gap-2">
                                Status & Timeline <SortIcon columnKey="status" />
                            </div>
                        </th>
                        <th 
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700 transition-colors group select-none text-right"
                            onClick={() => handleSort('value')}
                        >
                            <div className="flex items-center justify-end gap-2">
                                Total Value <SortIcon columnKey="value" />
                            </div>
                        </th>
                        <th className="px-6 py-4 w-10"></th>
                    </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {sortedQuotes.length === 0 ? (
                     <tr>
                         <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="font-medium">No quotes found matching your criteria.</p>
                         </td>
                     </tr>
                  ) : (
                    sortedQuotes.map(quote => {
                        const client = clients.find(c => c.id === quote.clientId);
                        const property = client?.properties.find(p => p.id === quote.propertyId);
                        const isExpiringSoon = !isPast(new Date(quote.expiryDate)) && isBefore(new Date(quote.expiryDate), addDays(new Date(), 3));
                        const isExpired = isPast(new Date(quote.expiryDate)) && quote.status === QuoteStatus.SENT;

                        return (
                            <tr key={quote.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                                <td className="px-6 py-4 align-top">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-400 dark:text-slate-500 shrink-0 border border-slate-200 dark:border-slate-600">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">#{quote.id.slice(-6).toUpperCase()}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">{quote.items[0]?.description || 'General Service'}</p>
                                            {quote.items.length > 1 && (
                                                <p className="text-xs text-slate-400 mt-1">+{quote.items.length - 1} more items</p>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4 align-top">
                                    <div className="flex items-center gap-3 mb-1.5">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center text-xs font-bold border border-slate-200 dark:border-slate-600">
                                            {client?.firstName[0]}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{client?.firstName} {client?.lastName}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                        <span className="truncate max-w-[180px]">{property?.address.street}, {property?.address.city}</span>
                                    </div>
                                </td>

                                {/* FEATURE 4: EXPIRY & STATUS */}
                                <td className="px-6 py-4 align-top">
                                    <div className="flex flex-col gap-2 items-start">
                                        {getStatusBadge(quote)}
                                        
                                        <div className="flex items-center gap-2 text-xs mt-1">
                                            {isExpired ? (
                                                <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                                                    <AlertTriangle className="w-3 h-3" /> Expired
                                                </span>
                                            ) : isExpiringSoon && quote.status === QuoteStatus.SENT ? (
                                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                                                    <Clock className="w-3 h-3" /> Expiring Soon
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 dark:text-slate-500">
                                                    Exp: {new Date(quote.expiryDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4 align-top text-right">
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">${quote.total.toFixed(2)}</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Includes Tax</p>
                                </td>

                                {/* FEATURE 5: QUICK ACTIONS */}
                                <td className="px-6 py-4 align-middle text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {quote.status === QuoteStatus.DRAFT && (
                                            <button 
                                                className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
                                                title="Send to Client"
                                                onClick={() => onUpdateQuote({ ...quote, status: QuoteStatus.SENT })}
                                            >
                                                <Send className="w-4 h-4" />
                                            </button>
                                        )}
                                        {quote.status === QuoteStatus.SENT && (
                                            <>
                                             <button 
                                                className="p-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded-lg transition-colors"
                                                title="Mark Approved"
                                                onClick={() => onUpdateQuote({ ...quote, status: QuoteStatus.APPROVED })}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button 
                                                className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-800 rounded-lg transition-colors"
                                                title="Mark Declined"
                                                onClick={() => onUpdateQuote({ ...quote, status: QuoteStatus.DECLINED })}
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                            </>
                                        )}
                                        {quote.status === QuoteStatus.APPROVED && (
                                            <button 
                                                className="p-2 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                title="Convert to Job"
                                                onClick={() => alert("Job creation workflow would start here.")}
                                            >
                                                <Briefcase className="w-4 h-4" />
                                            </button>
                                        )}
                                        <Link to="#" className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                            <ArrowUpRight className="w-4 h-4" />
                                        </Link>
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Quote"
        footer={
            <>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit}>Create Quote</Button>
            </>
        }
      >
          <div className="space-y-4 p-1">
              <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Client</label>
                  <select 
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
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
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Service Title</label>
                  <input 
                      value={formData.description}
                      onChange={(e) => setFormData(p => ({...p, description: e.target.value}))}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="e.g. Full House Exterior Wash"
                  />
              </div>
              <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Estimated Amount ($)</label>
                  <input 
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData(p => ({...p, amount: e.target.value}))}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
              </div>
          </div>
      </Modal>
    </div>
  );
};
