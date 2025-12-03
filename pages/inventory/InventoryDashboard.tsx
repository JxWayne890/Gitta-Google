
import React, { useMemo } from 'react';
import { 
  Package, ShoppingCart, AlertTriangle, TrendingUp, 
  BarChart3, DollarSign, Box, ArrowRight 
} from 'lucide-react';
import { InventoryProduct, InventoryRecord, PurchaseOrder, POStatus } from '../../types';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface InventoryDashboardProps {
  products: InventoryProduct[];
  records: InventoryRecord[];
  purchaseOrders: PurchaseOrder[];
}

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ products, records, purchaseOrders }) => {
  
  const metrics = useMemo(() => {
    const totalValue = products.reduce((sum, prod) => {
        const stock = records.filter(r => r.productId === prod.id).reduce((acc, r) => acc + r.quantity, 0);
        return sum + (stock * prod.cost);
    }, 0);

    const lowStockCount = products.filter(prod => {
        const stock = records.filter(r => r.productId === prod.id).reduce((acc, r) => acc + r.quantity, 0);
        return stock <= prod.minStock;
    }).length;

    const pendingPOValue = purchaseOrders
        .filter(po => po.status === POStatus.ORDERED || po.status === POStatus.PARTIAL)
        .reduce((sum, po) => sum + po.total, 0);

    const activePOCount = purchaseOrders.filter(po => po.status === POStatus.ORDERED || po.status === POStatus.PARTIAL).length;

    return { totalValue, lowStockCount, pendingPOValue, activePOCount };
  }, [products, records, purchaseOrders]);

  // Chart Data: Category Distribution
  const categoryData = useMemo(() => {
      const counts: Record<string, number> = {};
      products.forEach(p => {
          counts[p.category] = (counts[p.category] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [products]);

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
        {/* Header */}
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Inventory Overview</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time stock tracking and valuation.</p>
            </div>
            <div className="flex gap-3">
                <Link to="/inventory/orders" className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <ShoppingCart className="w-4 h-4" /> Purchasing
                </Link>
                <Link to="/inventory/stock" className="flex items-center gap-2 bg-slate-900 dark:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors shadow-lg shadow-slate-900/20">
                    <Box className="w-4 h-4" /> Manage Stock
                </Link>
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                        <DollarSign className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Total Inventory Value</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">${metrics.totalValue.toLocaleString()}</h3>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    {metrics.lowStockCount > 0 && (
                        <span className="text-xs font-bold bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full animate-pulse">Action Required</span>
                    )}
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Low Stock Items</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{metrics.lowStockCount}</h3>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        <ShoppingCart className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Active POs</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{metrics.activePOCount}</h3>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                        <Package className="w-5 h-5" />
                    </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Unique SKUs</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{products.length}</h3>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="font-bold text-slate-900 dark:text-white mb-6">Inventory by Category</h3>
                <div className="w-full min-w-0" style={{ height: 256 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" opacity={0.2} />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12, fill: '#64748b', fontWeight: 600}} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Alerts List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-red-50/50 dark:bg-red-900/20 flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" /> Low Stock Alerts
                    </h3>
                    <Link to="/inventory/stock" className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700">View All</Link>
                </div>
                <div className="flex-1 overflow-y-auto p-0">
                    {products.filter(p => {
                        const stock = records.filter(r => r.productId === p.id).reduce((acc, r) => acc + r.quantity, 0);
                        return stock <= p.minStock;
                    }).slice(0, 5).map(prod => {
                        const currentStock = records.filter(r => r.productId === prod.id).reduce((acc, r) => acc + r.quantity, 0);
                        return (
                            <div key={prod.id} className="p-4 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{prod.name}</p>
                                    <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">{currentStock} / {prod.minStock}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 dark:text-slate-400">{prod.sku}</span>
                                    <Link to="/inventory/orders" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Reorder</Link>
                                </div>
                            </div>
                        );
                    })}
                    {metrics.lowStockCount === 0 && (
                        <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                            <Box className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Stock levels are healthy.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
