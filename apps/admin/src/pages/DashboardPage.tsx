import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Layers,
  Boxes,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';
import { Product } from '@chandrakor/shared-types';

interface DashboardMetrics {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  totalCategories: number;
  totalStockUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    totalCategories: 0,
    totalStockUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      setLoading(true);
      try {
        // 1. Products metrics
        const { data: allProds, error: prodErr } = await supabase
          .from('products')
          .select('id, is_active, inventory(*)');

        let total = 0;
        let active = 0;
        let inactive = 0;
        let totalStock = 0;
        let lowStock = 0;
        let outOfStock = 0;

        if (allProds) {
          total = allProds.length;
          allProds.forEach((p: any) => {
            if (p.is_active) active++;
            else inactive++;

            const inv = Array.isArray(p.inventory) ? p.inventory[0] : p.inventory;
            const qty = inv?.quantity_available ?? 0;
            const threshold = inv?.low_stock_threshold ?? 5;

            totalStock += qty;
            if (qty <= 0) outOfStock++;
            else if (qty <= threshold) lowStock++;
          });
        }

        // 2. Categories count
        const { count: catCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true });

        setMetrics({
          totalProducts: total,
          activeProducts: active,
          inactiveProducts: inactive,
          totalCategories: catCount || 0,
          totalStockUnits: totalStock,
          lowStockCount: lowStock,
          outOfStockCount: outOfStock,
        });

        // 3. Recently added products
        const { data: recent } = await supabase
          .from('products')
          .select('*, images:product_images(*), category:categories(*), inventory(*)')
          .order('created_at', { ascending: false })
          .limit(5);

        if (recent) {
          setRecentProducts(recent as Product[]);
        }
      } catch (e) {
        console.error('Failed to load dashboard metrics', e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Welcome to Chandrakor Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time catalog analytics, physical inventory status, and boutique management.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold rounded shadow-sm flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Saree</span>
          </Link>
          <Link
            to="/inventory"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition-colors"
          >
            Adjust Stock
          </Link>
        </div>
      </div>

      {/* Real-time Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Products */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Products
            </span>
            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{metrics.totalProducts}</span>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <span className="text-emerald-700 font-semibold">{metrics.activeProducts} Active</span>
              <span>•</span>
              <span className="text-slate-400">{metrics.inactiveProducts} Inactive</span>
            </div>
          </div>
        </div>

        {/* Total Available Stock */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Available Units
            </span>
            <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{metrics.totalStockUnits}</span>
            <p className="text-[11px] text-slate-500 mt-1">Physical units across all weaves</p>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Low Stock Alert
            </span>
            <div className="w-8 h-8 rounded bg-amber-50 flex items-center justify-center text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-amber-800">{metrics.lowStockCount}</span>
            <p className="text-[11px] text-slate-500 mt-1">Below minimum threshold</p>
          </div>
        </div>

        {/* Total Categories */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Weave Categories
            </span>
            <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{metrics.totalCategories}</span>
            <p className="text-[11px] text-slate-500 mt-1">Active categories & subcategories</p>
          </div>
        </div>
      </div>

      {/* Stock Health & Recently Added Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Added Sarees Table */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recently Added Sarees</h2>
              <p className="text-xs text-slate-500">Latest additions to your live boutique database</p>
            </div>
            <Link
              to="/products"
              className="text-xs text-brand-burgundy font-semibold hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-medium">
                  <th className="pb-2">Saree</th>
                  <th className="pb-2">SKU</th>
                  <th className="pb-2">Price</th>
                  <th className="pb-2">Stock</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentProducts.map((p) => {
                  const img =
                    p.images?.find((i) => i.is_primary)?.image_url ||
                    p.images?.[0]?.image_url ||
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=150';
                  const available = p.inventory?.quantity_available ?? 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 flex items-center gap-3">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-10 h-12 object-cover rounded bg-slate-100 shrink-0"
                        />
                        <span className="font-semibold text-slate-800 line-clamp-1 max-w-[200px]">
                          {p.name}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-slate-500">{p.sku}</td>
                      <td className="py-2.5 font-semibold text-slate-900">
                        ₹{Number(p.selling_price).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            available > 3
                              ? 'bg-emerald-50 text-emerald-800'
                              : available > 0
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-red-50 text-red-800'
                          }`}
                        >
                          {available} units
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.is_active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Operational Shortcuts */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
            Quick Actions
          </h2>

          <div className="space-y-3">
            <Link
              to="/products"
              className="p-3 border border-slate-200 hover:border-brand-burgundy rounded block transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 group-hover:text-brand-burgundy">
                  Add Saree to Vault
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-burgundy" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Upload new Banarasi, Kanjivaram, or Paithani with photography.
              </p>
            </Link>

            <Link
              to="/inventory"
              className="p-3 border border-slate-200 hover:border-brand-burgundy rounded block transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 group-hover:text-brand-burgundy">
                  Log Stock Adjustment
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-burgundy" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Perform atomic restock or damage adjustments with audit notes.
              </p>
            </Link>

            <Link
              to="/banners"
              className="p-3 border border-slate-200 hover:border-brand-burgundy rounded block transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 group-hover:text-brand-burgundy">
                  Configure Homepage Banners
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-burgundy" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Update seasonal hero slides, CTA links, and festival messaging.
              </p>
            </Link>

            <Link
              to="/collections"
              className="p-3 border border-slate-200 hover:border-brand-burgundy rounded block transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 group-hover:text-brand-burgundy">
                  Curate Collections
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-burgundy" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Manage Wedding Trousseau, Best Sellers, and New Arrivals.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
