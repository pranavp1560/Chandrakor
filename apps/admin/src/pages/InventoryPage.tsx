import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  AlertTriangle,
  History,
  Plus,
  Minus,
  RefreshCw,
  X,
  Loader2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';
import { Product, InventoryMovement } from '@chandrakor/shared-types';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Adjust Stock Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantityChange, setQuantityChange] = useState<number>(1);
  const [isAddition, setIsAddition] = useState<boolean>(true);
  const [movementType, setMovementType] = useState<string>('restock');
  const [notes, setNotes] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // History Drawer State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*), inventory(*), images:product_images(*)')
        .order('name');

      if (data) setProducts(data as Product[]);
    } catch (e) {
      console.error('Failed to load inventory', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openAdjustModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantityChange(1);
    setIsAddition(true);
    setMovementType('restock');
    setNotes('');
    setReferenceId('');
    setAdjustError(null);
    setIsAdjustModalOpen(true);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setAdjustError(null);

    const change = isAddition ? Math.abs(quantityChange) : -Math.abs(quantityChange);
    if (change === 0) {
      setAdjustError('Quantity change cannot be zero.');
      return;
    }

    const currentQty = selectedProduct.inventory?.quantity_available ?? 0;
    if (currentQty + change < 0) {
      setAdjustError(`Cannot deduct ${Math.abs(change)} units: Current physical stock is only ${currentQty}.`);
      return;
    }

    setIsAdjusting(true);
    try {
      // Call the atomic adjust_stock RPC function
      const { data, error } = await supabase.rpc('adjust_stock', {
        p_product_id: selectedProduct.id,
        p_quantity_change: change,
        p_movement_type: movementType,
        p_notes: notes.trim() || null,
        p_reference_type: 'manual',
        p_reference_id: referenceId.trim() || null,
      });

      if (error) throw error;

      setIsAdjustModalOpen(false);
      await fetchInventory();
    } catch (err: any) {
      console.error('Stock adjustment error:', err);
      setAdjustError(err.message || 'Failed to adjust stock.');
    } finally {
      setIsAdjusting(false);
    }
  };

  const openHistoryDrawer = async (product: Product) => {
    setHistoryProduct(product);
    setIsHistoryOpen(true);
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });

      if (data) setMovements(data as InventoryMovement[]);
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());

    const available = p.inventory?.quantity_available ?? 0;
    const threshold = p.inventory?.low_stock_threshold ?? 5;

    let matchesStatus = true;
    if (statusFilter === 'out_of_stock') matchesStatus = available <= 0;
    else if (statusFilter === 'low_stock') matchesStatus = available > 0 && available <= threshold;
    else if (statusFilter === 'in_stock') matchesStatus = available > threshold;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Physical Stock & Inventory Vault</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track available stock, threshold warnings, and atomic inventory movement history.
          </p>
        </div>
        <button
          onClick={fetchInventory}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Balances</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by saree weave or SKU..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e: any) => setStatusFilter(e.target.value)}
          className="py-1.5 px-3 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:border-brand-burgundy"
        >
          <option value="all">All Inventory Statuses</option>
          <option value="in_stock">Well Stocked</option>
          <option value="low_stock">Low Stock Warning</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading stock records...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No inventory records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Saree & SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Available Units</th>
                  <th className="py-3 px-4">Reserved</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Stock Health</th>
                  <th className="py-3 px-4 text-right">Stock Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const img =
                    p.images?.find((i) => i.is_primary)?.image_url ||
                    p.images?.[0]?.image_url ||
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=150';
                  const available = p.inventory?.quantity_available ?? 0;
                  const reserved = p.inventory?.quantity_reserved ?? 0;
                  const threshold = p.inventory?.low_stock_threshold ?? 5;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={img}
                          alt={p.name}
                          className="w-10 h-12 object-cover rounded bg-slate-100 shrink-0"
                        />
                        <div>
                          <span className="font-semibold text-slate-900 block line-clamp-1 max-w-[220px]">
                            {p.name}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                            {p.sku}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {p.category?.name || '—'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 text-sm">
                          {available}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {reserved}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {threshold}
                      </td>

                      <td className="py-3 px-4">
                        {available <= 0 ? (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold text-[10px] uppercase">
                            Out of Stock
                          </span>
                        ) : available <= threshold ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px] uppercase flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px] uppercase">
                            Optimal
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openAdjustModal(p)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-brand-burgundy hover:text-white text-slate-700 rounded text-xs font-medium transition-colors"
                          >
                            Adjust Stock
                          </button>
                          <button
                            onClick={() => openHistoryDrawer(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded"
                            title="View Movement Audit History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADJUST STOCK MODAL */}
      {isAdjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Adjust Physical Stock</h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedProduct.sku} • {selectedProduct.name}
                </p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="p-6 space-y-4">
              {adjustError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{adjustError}</span>
                </div>
              )}

              {/* Current Stock Banner */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                <span className="text-xs text-slate-600">Current Available Stock:</span>
                <span className="font-bold text-base text-slate-900">
                  {selectedProduct.inventory?.quantity_available ?? 0} units
                </span>
              </div>

              {/* Action Type (Add / Deduct) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjustment Direction
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddition(true);
                      setMovementType('restock');
                    }}
                    className={`py-2 text-xs font-semibold rounded border flex items-center justify-center gap-1.5 ${
                      isAddition
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Restock / Add Units</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddition(false);
                      setMovementType('damaged');
                    }}
                    className={`py-2 text-xs font-semibold rounded border flex items-center justify-center gap-1.5 ${
                      !isAddition
                        ? 'bg-red-50 border-red-500 text-red-800'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Deduct / Remove Units</span>
                  </button>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity Units *
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantityChange}
                  onChange={(e) => setQuantityChange(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                  required
                />
              </div>

              {/* Reason / Movement Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audit Reason *
                </label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:border-brand-burgundy"
                  required
                >
                  <option value="restock">Loom Restock / Fresh Weave Receipt</option>
                  <option value="manual_adjustment">Vault Count Correction / Manual Audit</option>
                  <option value="damaged">Damaged / Flawed Fabric Removal</option>
                  <option value="audit">Boutique Display Sample</option>
                </select>
              </div>

              {/* Reference ID & Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference ID (Optional)
                </label>
                <input
                  type="text"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="e.g. PO-8492 or WEAVER-RECEIPT-14"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audit Notes / Reason
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Explain why this stock change was performed..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-6 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-wider rounded shadow flex items-center gap-2"
                >
                  {isAdjusting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isAdjusting ? 'Executing RPC...' : 'Commit Stock Change'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVEMENT HISTORY DRAWER */}
      {isHistoryOpen && historyProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsHistoryOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Stock Movement Audit Log</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {historyProduct.sku} • {historyProduct.name}
                  </p>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {loadingHistory ? (
                  <div className="p-8 text-center text-xs text-slate-400">Loading audit trail...</div>
                ) : movements.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No movement records recorded yet.
                  </div>
                ) : (
                  movements.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 border border-slate-200 rounded text-xs space-y-1.5 bg-slate-50/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 capitalize">
                          {m.movement_type.replace('_', ' ')}
                        </span>
                        <span
                          className={`font-bold flex items-center gap-0.5 ${
                            m.quantity_change > 0 ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {m.quantity_change > 0 ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                          </span>
                        </span>
                      </div>
                      {m.notes && <p className="text-slate-600 italic">"{m.notes}"</p>}
                      {m.reference_id && (
                        <p className="font-mono text-[10px] text-slate-400">
                          Ref: {m.reference_id}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                        {new Date(m.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
