import React, { useState, useEffect } from 'react';
import {
  Plus,
  Layers,
  Edit,
  Trash2,
  AlertCircle,
  X,
  Loader2,
  FolderTree,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';
import { Category } from '@chandrakor/shared-types';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*, products:products(id)')
        .order('display_order', { ascending: true });

      if (data) {
        const enriched = data.map((c: any) => ({
          ...c,
          product_count: c.products ? c.products.length : 0,
        }));
        setCategories(enriched as Category[]);
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = (parent?: Category) => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800');
    setParentId(parent ? parent.id : '');
    setDisplayOrder(categories.length + 1);
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setIsEditing(true);
    setCurrentId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    setImageUrl(cat.image_url || '');
    setParentId(cat.parent_id || '');
    setDisplayOrder(cat.display_order);
    setIsActive(cat.is_active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const slugVal = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(slugVal);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Category name is required.');
      return;
    }
    if (!slug.trim()) {
      setFormError('Category slug is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        parent_id: parentId ? parentId : null,
        display_order: Number(displayOrder),
        is_active: isActive,
      };

      if (isEditing && currentId) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', currentId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (error) throw error;
      }

      setIsModalOpen(false);
      await fetchCategories();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSafe = async (cat: Category) => {
    if ((cat.product_count ?? 0) > 0) {
      alert(
        `Cannot delete "${cat.name}": There are ${cat.product_count} saree products assigned to this category. Please reassign the products first, or mark this category as Inactive/Archived.`
      );
      return;
    }

    const hasSubcats = categories.some((c) => c.parent_id === cat.id);
    if (hasSubcats) {
      alert(`Cannot delete "${cat.name}": Please delete or reassign its subcategories first.`);
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete the category "${cat.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('categories').delete().eq('id', cat.id);
      if (error) throw error;
      await fetchCategories();
    } catch (err: any) {
      alert(`Failed to delete category: ${err.message}`);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !cat.is_active })
        .eq('id', cat.id);
      if (error) throw error;
      await fetchCategories();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Group into hierarchical tree
  const topLevelCategories = categories.filter((c) => !c.parent_id);
  const getSubcategories = (parentCatId: string) =>
    categories.filter((c) => c.parent_id === parentCatId);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Weave Categories Hierarchy</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure primary saree families (Silk, Cotton, Designer) and sub-enclaves (Banarasi, Kanjivaram, Paithani).
          </p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold rounded shadow flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Primary Category</span>
        </button>
      </div>

      {/* Categories Tree Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading weave hierarchy...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {topLevelCategories.map((topCat) => {
              const subcats = getSubcategories(topCat.id);
              return (
                <div key={topCat.id} className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors">
                  {/* Top Level Category Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={topCat.image_url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=150'}
                        alt={topCat.name}
                        className="w-12 h-12 object-cover rounded bg-slate-100 shrink-0 border border-slate-200"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-base font-bold text-slate-900">
                            {topCat.name}
                          </h3>
                          <span className="font-mono text-[10px] text-slate-400">/{topCat.slug}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{topCat.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-auto">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                        {topCat.product_count} products
                      </span>

                      <button
                        onClick={() => handleToggleActive(topCat)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          topCat.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {topCat.is_active ? 'Active' : 'Inactive'}
                      </button>

                      <button
                        onClick={() => openCreateModal(topCat)}
                        className="px-2.5 py-1 text-xs text-brand-burgundy hover:bg-brand-burgundy/10 rounded font-medium flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Subcategory</span>
                      </button>

                      <button
                        onClick={() => openEditModal(topCat)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 rounded"
                        title="Edit Category"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteSafe(topCat)}
                        className="p-1.5 text-slate-400 hover:text-red-700 rounded"
                        title="Safe Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories indented list */}
                  {subcats.length > 0 && (
                    <div className="pl-6 sm:pl-14 pt-2 border-t border-slate-100 space-y-2">
                      {subcats.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between py-1.5 px-3 bg-slate-50/80 rounded border border-slate-200/60"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-sm">↳</span>
                            <span className="text-xs font-semibold text-slate-800">{sub.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">({sub.slug})</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-500">
                              {sub.product_count} products
                            </span>

                            <button
                              onClick={() => handleToggleActive(sub)}
                              className={`px-1.5 py-0.2 rounded-full text-[9px] font-semibold ${
                                sub.is_active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {sub.is_active ? 'Active' : 'Inactive'}
                            </button>

                            <button
                              onClick={() => openEditModal(sub)}
                              className="p-1 text-slate-500 hover:text-slate-800"
                            >
                              <Edit className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => handleDeleteSafe(sub)}
                              className="p-1 text-slate-400 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-4 sm:p-6">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Category' : 'Create Category'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Banarasi Silk"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="e.g. banarasi-silk"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Parent Category (Leave empty for top-level)
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:border-brand-burgundy"
                >
                  <option value="">No Parent (Primary Weave Family)</option>
                  {topLevelCategories
                    .filter((c) => c.id !== currentId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Header Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Heritage notes about this weave..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-slate-300 text-brand-burgundy focus:ring-brand-burgundy h-4 w-4"
                    />
                    <span>Active in Storefront</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-wider rounded shadow flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isSaving ? 'Saving...' : 'Save Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
