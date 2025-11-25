
import React, { useState, useContext } from 'react';
import { InventoryProduct, InventoryRecord, Warehouse } from '../../types';
import { 
    Box, ArrowRightLeft, Plus, Settings, Search, Truck, Building2, 
    Save, Edit2, Trash2, DollarSign, History, AlertCircle, X, 
    Check, TrendingUp, Filter 
} from 'lucide-react';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { StoreContext } from '../../store';

interface StockLevelsProps {
  products: InventoryProduct[];
  records: InventoryRecord[];
  warehouses: Warehouse[];
  onUpdateStock: (record: InventoryRecord) => void;
}

export const StockLevels: React.FC<StockLevelsProps> = ({ products, records, warehouses, onUpdateStock }) => {
  const store = useContext(StoreContext);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal States
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isLocationsOpen, setIsLocationsOpen] = useState(false);
  
  // Feature States
  const [isValueMode, setIsValueMode] = useState(false); // Feature 1: Valuation View
  const [showLowStockOnly, setShowLowStockOnly] = useState(false); // Feature 3: Low Stock Filter
  const [historyProduct, setHistoryProduct] = useState<InventoryProduct | null>(null); // Feature 2: History

  // Quick Edit State
  const [quickEdit, setQuickEdit] = useState<{ productId: string, warehouseId: string, currentQty: number, recordId?: string } | null>(null);
  const [quickEditValue, setQuickEditValue] = useState<string>('');

  // Manage Locations State
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationType, setNewLocationType] = useState<'WAREHOUSE' | 'VEHICLE'>('VEHICLE');
  const [editName, setEditName] = useState('');

  // Helper to get record
  const getProductStockRecord = (productId: string, warehouseId: string) => {
      return records.find(r => r.productId === productId && r.warehouseId === warehouseId);
  };

  // Filter Logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (showLowStockOnly) {
        const totalStock = records.filter(r => r.productId === p.id).reduce((acc, r) => acc + r.quantity, 0);
        return totalStock <= p.minStock;
    }
    return true;
  });

  // --- HANDLERS ---

  const handleAddLocation = () => {
      if (!store || !newLocationName) return;
      const newWh: Warehouse = {
          id: `wh-${Date.now()}`,
          name: newLocationName,
          type: newLocationType
      };
      store.addWarehouse(newWh);
      setNewLocationName('');
  };

  const handleUpdateLocation = (id: string) => {
      if (!store || !editName) return;
      const wh = warehouses.find(w => w.id === id);
      if (wh) {
          store.updateWarehouse({ ...wh, name: editName });
      }
      setEditingLocationId(null);
      setEditName('');
  };

  const openQuickEdit = (productId: string, warehouseId: string, currentQty: number, recordId?: string) => {
      setQuickEdit({ productId, warehouseId, currentQty, recordId });
      setQuickEditValue(currentQty.toString());
  };

  const saveQuickEdit = () => {
      if (!quickEdit || !store) return;
      
      const newQty = parseInt(quickEditValue);
      if (isNaN(newQty)) return;

      const newRecord: InventoryRecord = {
          id: quickEdit.recordId || `rec-${Date.now()}`,
          productId: quickEdit.productId,
          warehouseId: quickEdit.warehouseId,
          quantity: newQty,
          lastUpdated: new Date().toISOString(),
          lastUpdatedBy: store.currentUser.id
      };

      onUpdateStock(newRecord);
      setQuickEdit(null);
  };

  return (
    <div className="max-w-full mx-auto pb-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Stock Levels</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor inventory across all warehouses and vehicles.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsLocationsOpen(true)} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <Settings className="w-4 h-4 mr-2" /> Locations
                </Button>
                <Button variant="secondary" onClick={() => setIsAdjustOpen(true)} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600">
                    <Plus className="w-4 h-4 mr-2" /> Adjust
                </Button>
                <Button onClick={() => setIsTransferOpen(true)} className="shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white">
                    <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer
                </Button>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-250px)]">
            {/* Toolbar & Filters */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter by Product..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all text-sm placeholder:text-slate-400"
                    />
                </div>

                {/* Feature Controls */}
                <div className="flex gap-2 w-full md:w-auto">
                    <button 
                        onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border ${showLowStockOnly ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-300'}`}
                    >
                        <AlertCircle className="w-4 h-4" />
                        Low Stock Only
                    </button>
                    
                    <button 
                        onClick={() => setIsValueMode(!isValueMode)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border ${isValueMode ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-300'}`}
                    >
                        {isValueMode ? <DollarSign className="w-4 h-4" /> : <Box className="w-4 h-4" />}
                        {isValueMode ? 'Value View' : 'Qty View'}
                    </button>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-slate-800">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-4 py-3 border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 min-w-[250px] sticky left-0 z-20">Product</th>
                            <th className="px-4 py-3 border-b border-r border-slate-200 dark:border-slate-700 text-center bg-slate-50 dark:bg-slate-800 w-24">Total</th>
                            {warehouses.map(wh => (
                                <th key={wh.id} className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 text-center min-w-[140px] bg-slate-50 dark:bg-slate-800">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="truncate max-w-[120px]">{wh.name}</span>
                                        <span className="text-[9px] opacity-70 font-normal flex items-center gap-1">
                                            {wh.type === 'VEHICLE' ? <Truck className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                                            {wh.type}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredProducts.map(prod => {
                            const totalStock = records.filter(r => r.productId === prod.id).reduce((acc, r) => acc + r.quantity, 0);
                            const isLow = totalStock <= prod.minStock;

                            return (
                                <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                    {/* Product Info Column */}
                                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-700 sticky left-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 z-10">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                                    {prod.name}
                                                    {isLow && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{prod.sku}</div>
                                            </div>
                                            <button 
                                                onClick={() => setHistoryProduct(prod)}
                                                className="p-1.5 text-slate-300 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                                title="View Movement History"
                                            >
                                                <History className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>

                                    {/* Total Column (Read-only) */}
                                    <td className="px-4 py-3 border-r border-slate-100 dark:border-slate-700 text-center bg-slate-50/30 dark:bg-slate-700/30">
                                        {isValueMode ? (
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                                ${(totalStock * prod.cost).toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className={`font-bold text-lg ${isLow ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                                {totalStock}
                                            </span>
                                        )}
                                    </td>

                                    {/* Warehouse Columns (Editable) */}
                                    {warehouses.map(wh => {
                                        const record = getProductStockRecord(prod.id, wh.id);
                                        const qty = record?.quantity || 0;
                                        
                                        // Determine user info if relevant
                                        let trackingInfo = null;
                                        if (!isValueMode && qty <= prod.minStock && wh.type === 'VEHICLE') {
                                            const assignedUser = store?.users.find(u => u.id === wh.assignedUserId);
                                            const lastUser = store?.users.find(u => u.id === record?.lastUpdatedBy);
                                            
                                            if (assignedUser || lastUser) {
                                                trackingInfo = (
                                                    <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 leading-tight">
                                                        {assignedUser && <div>Driver: {assignedUser.name.split(' ')[0]}</div>}
                                                        {lastUser && <div>Last: {lastUser.name.split(' ')[0]}</div>}
                                                    </div>
                                                );
                                            }
                                        }

                                        return (
                                            <td 
                                                key={wh.id} 
                                                onClick={() => !isValueMode && openQuickEdit(prod.id, wh.id, qty, record?.id)}
                                                className={`px-4 py-3 text-center border-r border-slate-100 dark:border-slate-700 last:border-0 transition-colors cursor-pointer ${isValueMode ? 'cursor-default' : 'hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20'}`}
                                            >
                                                <div className="flex flex-col items-center justify-center">
                                                    {isValueMode ? (
                                                        <span className={`text-xs ${qty === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-400'}`}>
                                                            ${(qty * prod.cost).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className={`text-sm font-medium ${qty === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'} ${qty <= prod.minStock && qty > 0 ? 'text-red-600 dark:text-red-400 font-bold' : ''}`}>
                                                                {qty}
                                                            </span>
                                                            {trackingInfo}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Quick Edit Modal */}
        {quickEdit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm" onClick={() => setQuickEdit(null)}>
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-64 p-4 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Update Stock</h3>
                        <button onClick={() => setQuickEdit(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                        <button 
                            onClick={() => setQuickEditValue((prev) => String(Math.max(0, parseInt(prev || '0') - 1)))}
                            className="w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold"
                        >-</button>
                        <input 
                            autoFocus
                            type="number" 
                            value={quickEditValue}
                            onChange={(e) => setQuickEditValue(e.target.value)}
                            className="flex-1 border-2 border-slate-900 dark:border-slate-500 rounded-lg p-1.5 text-center font-bold text-lg text-slate-900 dark:text-white bg-transparent focus:outline-none"
                        />
                        <button 
                            onClick={() => setQuickEditValue((prev) => String(parseInt(prev || '0') + 1))}
                            className="w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold"
                        >+</button>
                    </div>

                    <Button onClick={saveQuickEdit} className="w-full bg-slate-900 dark:bg-emerald-600 text-white hover:bg-slate-800 dark:hover:bg-emerald-700 h-9">
                        <Check className="w-4 h-4 mr-1" /> Save
                    </Button>
                </div>
            </div>
        )}

        {/* History Modal (Feature 2) */}
        <Modal isOpen={!!historyProduct} onClose={() => setHistoryProduct(null)} title="Stock Movement History">
            <div className="p-1">
                {historyProduct && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 flex gap-4 items-center">
                        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-600">
                            <Box className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white">{historyProduct.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{historyProduct.sku}</p>
                        </div>
                    </div>
                )}
                
                <div className="space-y-3">
                    {/* Mock History Data Generator for Visual */}
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-start gap-3 p-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${i % 2 === 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>
                                {i % 2 === 0 ? <ArrowRightLeft className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {i % 2 === 0 ? 'Transferred to Tech Van 1' : 'Restocked Main Warehouse'}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {i === 1 ? '2 hours ago' : `${i} days ago`} by <span className="font-semibold">Admin</span>
                                </p>
                            </div>
                            <div className={`text-sm font-bold ${i % 2 === 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {i % 2 === 0 ? '-2' : '+50'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>

        {/* Transfer Stock Modal */}
        <Modal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} title="Transfer Stock">
            <div className="space-y-4 p-2">
                <div className="flex flex-col md:flex-row items-center gap-4 justify-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                    <div className="text-center w-full">
                        <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">From</p>
                        <select className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm font-bold text-black dark:text-white shadow-sm focus:ring-2 focus:ring-slate-400 outline-none">
                            {warehouses.map(wh => (
                                <option key={wh.id} value={wh.id}>{wh.name}</option>
                            ))}
                        </select>
                    </div>
                    <ArrowRightLeft className="text-slate-400 shrink-0 rotate-90 md:rotate-0" />
                    <div className="text-center w-full">
                        <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">To</p>
                        <select className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm font-bold text-black dark:text-white shadow-sm focus:ring-2 focus:ring-slate-400 outline-none" defaultValue={warehouses.find(w => w.type === 'VEHICLE')?.id}>
                            {warehouses.map(wh => (
                                <option key={wh.id} value={wh.id}>{wh.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">Product</label>
                    <select className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-black dark:text-white focus:ring-2 focus:ring-slate-400 outline-none">
                        <option>Select Product...</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">Quantity</label>
                    <input type="number" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-black dark:text-white focus:ring-2 focus:ring-slate-400 outline-none" placeholder="0" />
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsTransferOpen(false)} className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</Button>
                <Button onClick={() => setIsTransferOpen(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white">Complete Transfer</Button>
            </div>
        </Modal>

        {/* Adjust Stock Modal */}
        <Modal isOpen={isAdjustOpen} onClose={() => setIsAdjustOpen(false)} title="Adjust Stock">
             <div className="space-y-4 p-2">
                <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">Location</label>
                    <select className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-black dark:text-white focus:ring-2 focus:ring-slate-400 outline-none">
                        {warehouses.map(wh => (
                            <option key={wh.id} value={wh.id}>{wh.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">Product</label>
                    <select className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-black dark:text-white focus:ring-2 focus:ring-slate-400 outline-none">
                        <option>Select Product...</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">New Quantity</label>
                    <input type="number" className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-black dark:text-white focus:ring-2 focus:ring-slate-400 outline-none" placeholder="0" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-1">Reason</label>
                    <select className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-black dark:text-white focus:ring-2 focus:ring-slate-400 outline-none">
                        <option>Cycle Count Correction</option>
                        <option>Damaged / Expired</option>
                        <option>Theft / Loss</option>
                        <option>Found Inventory</option>
                    </select>
                </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsAdjustOpen(false)} className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</Button>
                <Button onClick={() => setIsAdjustOpen(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white">Save Adjustment</Button>
            </div>
        </Modal>

        {/* Manage Locations Modal */}
        <Modal isOpen={isLocationsOpen} onClose={() => setIsLocationsOpen(false)} title="Manage Locations">
            <div className="space-y-6 p-2">
                
                {/* Add New */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Add New Location</h4>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <input 
                                type="text" 
                                placeholder="Location Name (e.g. Tech Van 4)" 
                                value={newLocationName}
                                onChange={(e) => setNewLocationName(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-black dark:text-white focus:ring-2 focus:ring-slate-400 outline-none"
                            />
                        </div>
                        <select 
                            value={newLocationType}
                            onChange={(e) => setNewLocationType(e.target.value as any)}
                            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-black dark:text-white focus:ring-2 focus:ring-slate-400 outline-none w-32"
                        >
                            <option value="VEHICLE">Vehicle</option>
                            <option value="WAREHOUSE">Warehouse</option>
                        </select>
                        <Button onClick={handleAddLocation} className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700">
                            Add
                        </Button>
                    </div>
                </div>

                {/* List */}
                <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Existing Locations</h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {warehouses.map(wh => (
                            <div key={wh.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg group hover:border-slate-300 dark:hover:border-slate-600">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${wh.type === 'VEHICLE' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'}`}>
                                        {wh.type === 'VEHICLE' ? <Truck className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                                    </div>
                                    
                                    {editingLocationId === wh.id ? (
                                        <input 
                                            autoFocus
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="flex-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm text-black dark:text-white focus:outline-none focus:border-emerald-500"
                                        />
                                    ) : (
                                        <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{wh.name}</span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {editingLocationId === wh.id ? (
                                        <button onClick={() => handleUpdateLocation(wh.id)} className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100">
                                            <Save className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button onClick={() => { setEditingLocationId(wh.id); setEditName(wh.name); }} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <Button variant="secondary" onClick={() => setIsLocationsOpen(false)} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600">Done</Button>
            </div>
        </Modal>
    </div>
  );
};
