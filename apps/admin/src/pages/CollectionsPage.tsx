import React, { useState, useEffect } from 'react';
import {
  Plus,
  BookmarkCheck,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  Loader2,
  AlertCircle,
  Package,
} from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';
import { Collection, Product } from '@chandrakor/shared-types';

export const CollectionsPage: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
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
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const { data: colls, error } = await supabase
        .from('collections')
        .select('*, collection_products(product_id)')
        .order('display_order', { ascending: true });

      if (colls) {
        const enriched = colls.map((c: any) => ({
          ...c,
          product_count: c.collection_products ? c.collection_products.length : 0,
        }));
        setCollections(enriched as Collection[]);
      }

      const { data: prods } = await supabase
        .from('products')
        .select('id, name, sku, is_active')
        .eq('is_active', true)
        .order('name');
      if (prods) setAllProducts(prods as Product[]);
    } catch (e) {
      console.error('Failed to load collections', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    setSlug('');
    setDescription('');
    setImageUrl('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200');
    setDisplayOrder(collections.length + 1);
    setIsActive(true);
    setSelectedProductIds([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = async (coll: Collection) => {
    setIsEditing(true);
    setCurrentId(coll.id);
    setName(coll.name);
    setSlug(coll.slug);
    setDescription(coll.description || '');
    setImageUrl(coll.image_url || '');
    setDisplayOrder(coll.display_order);
    setIsActive(coll.is_active);

    // Fetch existing assigned products
    const { data: assigned } = await supabase
      .from('collection_products')
      .select('product_id')
      .eq('collection_id', coll.id);

    setSelectedProductIds(assigned ? assigned.map((a: any) => a.product_id) : []);
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
      setFormError('Collection name is required.');
      return;
    }
    if (!slug.trim()) {
      setFormError('Collection slug is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        display_order: Number(displayOrder),
        is_active: isActive,
      };

      let collectionId = currentId;

      if (isEditing && currentId) {
        const { error } = await supabase
          .from('collections')
          .update(payload)
          .eq('id', currentId);
        if (error) throw error;
      } else {
        const { data: newColl, error } = await supabase
          .from('collections')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        collectionId = newColl.id;
      }

      // Sync Products assigned
      if (collectionId) {
        await supabase.from('collection_products').delete().eq('collection_id', collectionId);

        if (selectedProductIds.length > 0) {
          const rows = selectedProductIds.map((pid, idx) => ({
            collection_id: collectionId,
            product_id: pid,
            display_order: idx + 1,
          }));
          await supabase.from('collection_products').insert(rows);
        }
      }

      setIsModalOpen(false);
      await fetchCollections();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save collection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (coll: Collection) => {
    try {
      const { error } = await supabase
        .from('collections')
        .update({ is_active: !coll.is_active })
        .eq('id', coll.id);
      if (error) throw error;
      await fetchCollections();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Curated Collections</h1>
          <p className="text-xs text-slate-500 mt-1">
            Curate thematic saree showcases (Wedding Trousseau, Best Sellers, New Arrivals, Festive).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold rounded shadow flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Collection</span>
        </button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((coll) => (
          <div
            key={coll.id}
            className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 bg-slate-100">
                <img
                  src={coll.image_url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'}
                  alt={coll.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      coll.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {coll.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-bold text-slate-900">{coll.name}</h3>
                  <span className="font-mono text-[10px] text-slate-400">Order: {coll.display_order}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{coll.description}</p>
                <div className="pt-2">
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                    {coll.product_count} Sarees Curated
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleToggleActive(coll)}
                className="text-xs text-slate-600 hover:text-slate-900 font-medium"
              >
                {coll.is_active ? 'Deactivate' : 'Activate'}
              </button>

              <button
                onClick={() => openEditModal(coll)}
                className="px-3 py-1 bg-white border border-slate-200 text-slate-700 hover:border-brand-burgundy rounded text-xs font-semibold"
              >
                Edit & Assign Sarees
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT COLLECTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Collection' : 'Create Collection'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Collection Title *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Wedding Collection"
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
                    placeholder="e.g. wedding-collection"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Collection Cover Image URL
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
                  placeholder="Explain what sarees belong in this collection..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                />
              </div>

              {/* Product Selection Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Sarees to Include ({selectedProductIds.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded p-3 space-y-1.5 bg-slate-50">
                  {allProducts.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-100 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(p.id)}
                        onChange={() => toggleProductSelection(p.id)}
                        className="rounded border-slate-300 text-brand-burgundy focus:ring-brand-burgundy h-4 w-4"
                      />
                      <span className="font-mono text-[10px] text-slate-400">[{p.sku}]</span>
                      <span className="font-medium">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
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

                <div className="flex items-center gap-2">
                  <label htmlFor="display-order-input" className="text-xs text-slate-500">Order:</label>
                  <input
                    id="display-order-input"
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Number(e.target.value))}
                    className="w-16 px-2 py-1 text-xs border border-slate-300 rounded"
                  />
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
                  <span>{isSaving ? 'Saving...' : 'Save Collection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
