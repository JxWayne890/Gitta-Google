
import React, { useState } from 'react';
import { PurchaseOrder, Vendor, POStatus, InventoryProduct } from '../../types';
import { FileText, Plus, Calendar, Filter, CheckCircle, AlertCircle, Clock, ChevronRight, Search } from 'lucide-react';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

interface PurchaseOrdersProps {
  orders: PurchaseOrder[];
  vendors: Vendor[];
  products: InventoryProduct[];
  onCreatePO: (po: PurchaseOrder) => void;
}

export const PurchaseOrders: React.FC<PurchaseOrdersProps> = ({ orders, vendors, products, onCreatePO }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const getStatusBadge = (status: POStatus) => {
      const styles = {
          DRAFT: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600',
          ORDERED: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
          PARTIAL: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
          RECEIVED: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
          CANCELLED: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
      };
      return (
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${styles[status]}`}>
              {status}
          </span>
      );
  };

  const filteredOrders = orders.filter(po => statusFilter === 'ALL' || po.status === statusFilter);

  return (
    <div className="max-w-7xl mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Purchase Orders</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage supplier orders and incoming shipments.</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-emerald-500/20">
                <Plus className="w-4 h-4 mr-2" /> Create PO
            </Button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden min-h-[500px]">
            {/* Tabs */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex gap-4 overflow-x-auto">
                {['ALL', POStatus.DRAFT, POStatus.ORDERED, POStatus.RECEIVED].map(status => (
                    <button 
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${statusFilter === status ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                    >
                        {status === 'ALL' ? 'All Orders' : status}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4">PO Number</th>
                            <th className="px-6 py-4">Vendor</th>
                            <th className="px-6 py-4">Date Ordered</th>
                            <th className="px-6 py-4">Expected</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Total</th>
                            <th className="px-6 py-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredOrders.map(po => {
                            const vendor = vendors.find(v => v.id === po.vendorId);
                            return (
                                <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer">
                                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{po.id}</td>
                                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{vendor?.name}</td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(po.orderDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                        {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4">{getStatusBadge(po.status)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">${po.total.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500" />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Simplified Modal for Mockup */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Purchase Order">
            <div className="space-y-4 p-2">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Vendor</label>
                    <select className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700"><option>Select Vendor...</option></select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Expected Date</label>
                    <input type="date" className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700" />
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center text-slate-400 text-sm">
                    Items list configuration would go here...
                </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</Button>
                <Button onClick={() => setIsModalOpen(false)}>Create PO</Button>
            </div>
        </Modal>
    </div>
  );
};
