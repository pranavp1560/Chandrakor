import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  Percent,
  IndianRupee,
  Edit2,
  Trash2,
  RefreshCw,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';
import { Coupon } from '@chandrakor/shared-types';

export const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: null as number | null,
    usage_limit: null as number | null,
    per_customer_limit: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_active: true,
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (err: any) {
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_order_amount: 0,
      max_discount_amount: null,
      usage_limit: null,
      per_customer_limit: 1,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cp: Coupon) => {
    setEditingCoupon(cp);
    setFormData({
      code: cp.code,
      description: cp.description || '',
      discount_type: cp.discount_type,
      discount_value: Number(cp.discount_value),
      min_order_amount: Number(cp.min_order_amount),
      max_discount_amount: cp.max_discount_amount ? Number(cp.max_discount_amount) : null,
      usage_limit: cp.usage_limit ? Number(cp.usage_limit) : null,
      per_customer_limit: cp.per_customer_limit || 1,
      start_date: cp.start_date ? cp.start_date.split('T')[0] : '',
      end_date: cp.end_date ? cp.end_date.split('T')[0] : '',
      is_active: cp.is_active,
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (cp: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !cp.is_active })
        .eq('id', cp.id);

      if (error) throw error;
      setCoupons((prev) =>
        prev.map((item) => (item.id === cp.id ? { ...item, is_active: !cp.is_active } : item))
      );
    } catch (err: any) {
      alert('Failed to toggle coupon status: ' + err.message);
    }
  };

  const handleDelete = async (cp: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon code "${cp.code}"?`)) return;

    try {
      const { error } = await supabase.from('coupons').delete().eq('id', cp.id);
      if (error) throw error;
      setCoupons((prev) => prev.filter((item) => item.id !== cp.id));
    } catch (err: any) {
      alert('Failed to delete coupon: ' + err.message);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase();
    if (!cleanCode) {
      alert('Please enter a coupon code');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        code: cleanCode,
        description: formData.description.trim() || null,
        discount_type: formData.discount_type,
        discount_value: Number(formData.discount_value),
        min_order_amount: Number(formData.min_order_amount) || 0,
        max_discount_amount: formData.max_discount_amount ? Number(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null,
        per_customer_limit: Number(formData.per_customer_limit) || 1,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        is_active: formData.is_active,
      };

      if (editingCoupon) {
        const { error } = await supabase.from('coupons').update(payload).eq('id', editingCoupon.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('coupons').insert(payload);
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (err: any) {
      alert('Failed to save coupon: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCount = coupons.filter((c) => c.is_active).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usage_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-wide">
            Promotional Coupons & Festive Offers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure percentage or flat price incentives for saree patrons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCoupons}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded shadow-xs"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-wider rounded shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Total Active Coupons</span>
          <span className="text-2xl font-bold font-serif text-emerald-800 mt-1 block">{activeCount}</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Total Redemptions</span>
          <span className="text-2xl font-bold font-serif text-slate-900 mt-1 block">{totalRedemptions}</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded shadow-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Live Campaign Types</span>
          <span className="text-2xl font-bold font-serif text-brand-burgundy mt-1 block">Percentage & Flat INR</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search coupon code or description..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Coupon Code</th>
              <th className="py-3 px-4">Discount Value</th>
              <th className="py-3 px-4">Order Threshold</th>
              <th className="py-3 px-4">Redemptions</th>
              <th className="py-3 px-4">Validity</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-burgundy" />
                  <span>Loading coupons...</span>
                </td>
              </tr>
            ) : filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <Tag className="w-8 h-8 stroke-1 mx-auto mb-2 text-slate-400" />
                  <p className="font-semibold">No promotional coupons found</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Click "Create Coupon" to launch a campaign.</p>
                </td>
              </tr>
            ) : (
              filteredCoupons.map((cp) => (
                <tr key={cp.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-slate-900 tracking-wider text-sm block">
                      {cp.code}
                    </span>
                    {cp.description && (
                      <span className="text-[11px] text-slate-500 block max-w-xs truncate">
                        {cp.description}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {cp.discount_type === 'percentage' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-800">
                        <Percent className="w-3.5 h-3.5" />
                        <span>{cp.discount_value}% Off</span>
                        {cp.max_discount_amount && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            (Upto ₹{Number(cp.max_discount_amount).toLocaleString('en-IN')})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-800">
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span>₹{Number(cp.discount_value).toLocaleString('en-IN')} Flat Off</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    <span>Min. ₹{Number(cp.min_order_amount).toLocaleString('en-IN')}</span>
                  </td>

                  <td className="py-3 px-4 text-slate-600 font-mono">
                    <span className="font-bold text-slate-900">{cp.usage_count || 0}</span>
                    {cp.usage_limit ? ` / ${cp.usage_limit}` : ' (Unlimited)'}
                  </td>

                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap text-[11px]">
                    {cp.end_date ? (
                      <span>Expires {new Date(cp.end_date).toLocaleDateString('en-IN')}</span>
                    ) : (
                      <span className="text-emerald-700 font-medium">Ongoing</span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(cp)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        cp.is_active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {cp.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(cp)}
                        className="p-1.5 text-slate-600 hover:text-brand-burgundy hover:bg-slate-100 rounded"
                        title="Edit Coupon"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cp)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotional Coupon'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Coupon Code <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. DIWALI2026"
                    className="w-full px-3 py-2 font-mono uppercase tracking-wider border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  >
                    <option value="percentage">Percentage Off (%)</option>
                    <option value="fixed">Fixed Amount Off (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Campaign Headline
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. 10% Off on Heritage Katan Silks up to ₹3,000"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {formData.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Minimum Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                  />
                </div>
              </div>

              {formData.discount_type === 'percentage' && (
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Maximum Discount Cap (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_discount_amount || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_discount_amount: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="e.g. 3000 (leaves blank for unlimited)"
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Global Usage Limit (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usage_limit: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    placeholder="e.g. 500 (blank = unlimited)"
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Per Customer Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.per_customer_limit}
                    onChange={(e) => setFormData({ ...formData, per_customer_limit: Number(e.target.value) })}
                    className="w-full px-3 py-2 font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    End Date (Expiry)
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-brand-burgundy focus:ring-brand-burgundy"
                  />
                  <span className="font-semibold text-slate-700">Coupon is Active for Redemptions</span>
                </label>
              </div>

              <div className="pt-3 flex gap-3 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white font-semibold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Coupon</span>}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold uppercase tracking-wider rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
