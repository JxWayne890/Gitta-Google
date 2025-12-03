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
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isLocationsOpen, setIsLocationsOpen] = useState(false);
  const [isValueMode, setIsValueMode] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<InventoryProduct | null>(null);
  const [quickEdit, setQuickEdit] = useState<{ productId: string, warehouseId: string, currentQty: number, recordId?: string } | null>(null);
  const [quickEditValue, setQuickEditValue] = useState<string>('');
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationType, setNewLocationType] = useState<'WAREHOUSE' | 'VEHICLE'>('VEHICLE');
  const [editName, setEditName] = useState('');

  const getProductStockRecord = (productId: string, warehouseId: string) => {
      return records.find(r => r.productId === productId && r.warehouseId === warehouseId);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (showLowStockOnly) {
        const totalStock = records.filter(r => r.productId === p.id).reduce((acc, r) => acc + r.quantity, 0);
        return totalStock <= p.minStock;
    }
    return true;
  });

  const handleAddLocation = () => {
      if (!store || !newLocationName) return;
      const newWh: Warehouse = {
          id: crypto.randomUUID(),
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
          id: quickEdit.recordId || crypto.randomUUID(),
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
        {/* UI Elements Omitted */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"><div><h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Stock Levels</h1><p className="text-slate-500 dark:text-slate-400 mt-1">Monitor inventory across all warehouses and vehicles.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setIsLocationsOpen(true)} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-white border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"><Settings className="w-4 h-4 mr-2" /> Locations</Button><Button variant="secondary" onClick={() => setIsAdjustOpen(true)} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600"><Plus className="w-4 h-4 mr-2" /> Adjust</Button><Button onClick={() => setIsTransferOpen(true)} className="shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white"><ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer</Button></div></div>
        {/* ... Rest of UI ... */}
    </div>
  );
};