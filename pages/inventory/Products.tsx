import React, { useState } from 'react';
import { InventoryProduct, Vendor } from '../../types';
import { Package, Search, Plus, Filter, MoreHorizontal, Barcode } from 'lucide-react';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';

interface ProductsProps {
  products: InventoryProduct[];
  vendors: Vendor[];
  onAddProduct: (product: InventoryProduct) => void;
}

export const Products: React.FC<ProductsProps> = ({ products, vendors, onAddProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<InventoryProduct>>({
      trackSerial: false,
      minStock: 5
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = () => {
      if(!formData.name || !formData.sku) return;
      
      const newProduct: InventoryProduct = {
          id: crypto.randomUUID(),
          sku: formData.sku!,
          name: formData.name!,
          category: formData.category || 'General',
          brand: formData.brand || '',
          description: formData.description || '',
          unit: formData.unit || 'Each',
          cost: Number(formData.cost) || 0,
          price: Number(formData.price) || 0,
          minStock: Number(formData.minStock) || 0,
          trackSerial: formData.trackSerial || false,
          supplierId: formData.supplierId
      };
      onAddProduct(newProduct);
      setIsModalOpen(false);
      setFormData({ trackSerial: false, minStock: 5 });
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
        {/* UI Elements Omitted */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"><div><h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Product Master Data</h1><p className="text-slate-500 dark:text-slate-400 mt-1">Manage SKUs, pricing, and item details.</p></div><Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-emerald-500/20"><Plus className="w-4 h-4 mr-2" /> New Product</Button></div>
        {/* ... Table ... */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Product" footer={<><Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button><Button onClick={handleSubmit}>Save Product</Button></>}>
            <div className="space-y-4 p-1">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Name</label>
                        <input className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Microfiber Towel" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">SKU</label>
                        <input className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="MF-001" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                        <input className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Cleaning" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Brand</label>
                        <input className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="Generic" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Cost ($)</label>
                        <input type="number" className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" value={formData.cost || ''} onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Price ($)</label>
                        <input type="number" className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Stock</label>
                        <input type="number" className="w-full border rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" value={formData.minStock || ''} onChange={e => setFormData({...formData, minStock: parseFloat(e.target.value)})} />
                    </div>
                </div>
            </div>
        </Modal>
    </div>
  );
};