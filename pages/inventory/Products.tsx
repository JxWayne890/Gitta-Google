
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
          id: `prod-${Date.now()}`,
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Product Master Data</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage SKUs, pricing, and item details.</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-emerald-500/20">
                <Plus className="w-4 h-4 mr-2" /> New Product
            </Button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products by Name or SKU..." 
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-all text-sm placeholder:text-slate-400"
                    />
                </div>
                <button className="p-2 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600">
                    <Filter className="w-4 h-4" />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4">Product Details</th>
                            <th className="px-6 py-4">SKU / Category</th>
                            <th className="px-6 py-4">Supplier</th>
                            <th className="px-6 py-4 text-right">Cost</th>
                            <th className="px-6 py-4 text-right">Price</th>
                            <th className="px-6 py-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredProducts.map(product => (
                            <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{product.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{product.brand}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded w-fit mb-1">{product.sku}</span>
                                        <span className="text-slate-500 dark:text-slate-400 text-xs">{product.category}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-slate-600 dark:text-slate-300">{vendors.find(v => v.id === product.supplierId)?.name || '-'}</span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-slate-600 dark:text-slate-300">
                                    ${product.cost.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                                    ${product.price.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Add New Product"
            footer={
                <>
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Save Product</Button>
                </>
            }
        >
            <div className="space-y-4 p-1">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">SKU</label>
                        <input className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                            value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. CHEM-001"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Barcode</label>
                        <div className="relative">
                            <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Scan..." />
                        </div>
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Product Name</label>
                    <input className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                        value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Category</label>
                        <select className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                        >
                            <option value="Chemicals">Chemicals</option>
                            <option value="Tools">Tools</option>
                            <option value="Consumables">Consumables</option>
                            <option value="Protection">Protection</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Brand</label>
                        <input className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                            value={formData.brand || ''} onChange={e => setFormData({...formData, brand: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cost ($)</label>
                        <input type="number" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                            value={formData.cost || ''} onChange={e => setFormData({...formData, cost: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Price ($)</label>
                        <input type="number" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                            value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Min Stock</label>
                        <input type="number" className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
                            value={formData.minStock || ''} onChange={e => setFormData({...formData, minStock: parseFloat(e.target.value)})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Preferred Vendor</label>
                    <select className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})}
                    >
                        <option value="">Select Vendor...</option>
                        {vendors.map(v => (
                            <option key={v.id} value={v.id}>{v.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </Modal>
    </div>
  );
};
