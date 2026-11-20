import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Copy,
  Edit,
  Archive,
  CheckCircle,
  XCircle,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';
import { Product, Category } from '@chandrakor/shared-types';
import { ImageUploader, UploadedImage } from '../components/ImageUploader';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMrp, setFormMrp] = useState<number>(0);
  const [formSellingPrice, setFormSellingPrice] = useState<number>(0);
  const [formFabric, setFormFabric] = useState('');
  const [formColour, setFormColour] = useState('');
  const [formPattern, setFormPattern] = useState('');
  const [formOccasion, setFormOccasion] = useState('');
  const [formSareeLength, setFormSareeLength] = useState('5.5 Meters');
  const [formBlousePiece, setFormBlousePiece] = useState('Unstitched 0.8m piece included');
  const [formWeightGrams, setFormWeightGrams] = useState<number | ''>('');
  const [formInitialStock, setFormInitialStock] = useState<number>(5);
  const [formLowStockThreshold, setFormLowStockThreshold] = useState<number>(3);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formImages, setFormImages] = useState<UploadedImage[]>([]);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Products & Categories
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data: prods, error: pErr } = await supabase
        .from('products')
        .select('*, category:categories(*), images:product_images(*), inventory(*)')
        .order('created_at', { ascending: false });

      if (prods) setProducts(prods as Product[]);

      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (cats) setCategories(cats as Category[]);
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Auto-generate slug from name if not manually edited
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!isEditing) {
      const slugVal = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormSlug(slugVal);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormName('');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFormSku(`CHK-SR-${randomSuffix}`);
    setFormSlug('');
    setFormCategory(categories[0]?.id || '');
    setFormDescription('');
    setFormMrp(24000);
    setFormSellingPrice(19500);
    setFormFabric('Pure Katan Silk');
    setFormColour('');
    setFormPattern('');
    setFormOccasion('Bridal & Grand Wedding');
    setFormSareeLength('5.5 Meters');
    setFormBlousePiece('Unstitched 0.8m piece included');
    setFormWeightGrams(800);
    setFormInitialStock(5);
    setFormLowStockThreshold(3);
    setFormIsActive(true);
    setFormIsFeatured(false);
    setFormIsBestSeller(false);
    setFormImages([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (product: Product) => {
    setIsEditing(true);
    setCurrentId(product.id);
    setFormName(product.name);
    setFormSku(product.sku);
    setFormSlug(product.slug);
    setFormCategory(product.category_id);
    setFormDescription(product.description || '');
    setFormMrp(Number(product.mrp));
    setFormSellingPrice(Number(product.selling_price));
    setFormFabric(product.fabric || '');
    setFormColour(product.colour || '');
    setFormPattern(product.pattern || '');
    setFormOccasion(product.occasion || '');
    setFormSareeLength(product.saree_length || '5.5 Meters');
    setFormBlousePiece(product.blouse_piece || '');
    setFormWeightGrams(product.weight_grams ?? '');
    const inv = Array.isArray(product.inventory) ? product.inventory[0] : product.inventory;
    setFormInitialStock(inv?.quantity_available ?? 0);
    setFormLowStockThreshold(inv?.low_stock_threshold ?? 3);
    setFormIsActive(product.is_active);
    setFormIsFeatured(product.is_featured);
    setFormIsBestSeller(product.is_best_seller);

    const mappedImgs: UploadedImage[] = (product.images || []).map((img) => ({
      id: img.id,
      image_url: img.image_url,
      alt_text: img.alt_text || '',
      display_order: img.display_order,
      is_primary: img.is_primary,
    }));
    setFormImages(mappedImgs);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Duplicate Product
  const handleDuplicate = async (source: Product) => {
    try {
      const newSku = `${source.sku}-COPY-${Math.floor(100 + Math.random() * 900)}`;
      const newSlug = `${source.slug}-copy-${Math.floor(100 + Math.random() * 900)}`;

      const { data: newProd, error: pErr } = await supabase
        .from('products')
        .insert({
          sku: newSku,
          name: `${source.name} (Duplicate)`,
          slug: newSlug,
          description: source.description,
          category_id: source.category_id,
          mrp: source.mrp,
          selling_price: source.selling_price,
          fabric: source.fabric,
          colour: source.colour,
          pattern: source.pattern,
          occasion: source.occasion,
          saree_length: source.saree_length,
          blouse_piece: source.blouse_piece,
          weight_grams: source.weight_grams,
          is_featured: false,
          is_best_seller: false,
          is_active: false,
        })
        .select()
        .single();

      if (pErr) throw pErr;

      // Duplicate inventory
      const inv = Array.isArray(source.inventory) ? source.inventory[0] : source.inventory;
      const initialStock = inv?.quantity_available || 5;
      await supabase.from('inventory').insert({
        product_id: newProd.id,
        quantity_available: initialStock,
        quantity_reserved: 0,
        low_stock_threshold: inv?.low_stock_threshold || 3,
      });

      // Duplicate images
      if (source.images && source.images.length > 0) {
        const imageInserts = source.images.map((img) => ({
          product_id: newProd.id,
          image_url: img.image_url,
          alt_text: img.alt_text,
          display_order: img.display_order,
          is_primary: img.is_primary,
        }));
        await supabase.from('product_images').insert(imageInserts);
      }

      await fetchProducts();
      alert(`Product duplicated successfully as SKU: ${newSku}`);
    } catch (err: any) {
      console.error('Duplication error:', err);
      alert(`Failed to duplicate product: ${err.message}`);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;
      await fetchProducts();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formName.trim()) {
      setFormError('Product title is required.');
      return;
    }
    if (!formSku.trim()) {
      setFormError('Product SKU is required.');
      return;
    }
    if (!formSlug.trim()) {
      setFormError('Product URL slug is required.');
      return;
    }
    if (!formCategory) {
      setFormError('Please select a weave category.');
      return;
    }
    if (formMrp <= 0) {
      setFormError('MRP must be greater than zero.');
      return;
    }
    if (formSellingPrice <= 0) {
      setFormError('Selling price must be greater than zero.');
      return;
    }
    if (formSellingPrice > formMrp) {
      setFormError('Selling price cannot exceed MRP.');
      return;
    }

    setIsSaving(true);
    try {
      const productPayload = {
        name: formName.trim(),
        sku: formSku.trim().toUpperCase(),
        slug: formSlug.trim().toLowerCase(),
        category_id: formCategory,
        description: formDescription.trim(),
        mrp: formMrp,
        selling_price: formSellingPrice,
        fabric: formFabric.trim(),
        colour: formColour.trim(),
        pattern: formPattern.trim(),
        occasion: formOccasion.trim(),
        saree_length: formSareeLength.trim(),
        blouse_piece: formBlousePiece.trim(),
        weight_grams: formWeightGrams !== '' ? Number(formWeightGrams) : null,
        is_active: formIsActive,
        is_featured: formIsFeatured,
        is_best_seller: formIsBestSeller,
      };

      let productId = currentId;

      if (isEditing && currentId) {
        const { error: updateErr } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', currentId);
        if (updateErr) throw updateErr;

        // Update inventory record
        await supabase
          .from('inventory')
          .update({
            quantity_available: formInitialStock,
            low_stock_threshold: formLowStockThreshold,
          })
          .eq('product_id', currentId);
      } else {
        const { data: newProd, error: insertErr } = await supabase
          .from('products')
          .insert(productPayload)
          .select()
          .single();

        if (insertErr) throw insertErr;
        productId = newProd.id;

        // Create inventory
        await supabase.from('inventory').insert({
          product_id: productId,
          quantity_available: formInitialStock,
          quantity_reserved: 0,
          low_stock_threshold: formLowStockThreshold,
        });

        // Record initial inventory movement
        await supabase.from('inventory_movements').insert({
          product_id: productId,
          movement_type: 'opening_stock',
          quantity_change: formInitialStock,
          notes: 'Opening stock set during product creation',
        });
      }

      // Sync Images
      if (productId) {
        // Delete existing images if editing
        if (isEditing) {
          await supabase.from('product_images').delete().eq('product_id', productId);
        }

        if (formImages.length > 0) {
          const imagesToInsert = formImages.map((img, idx) => ({
            product_id: productId,
            image_url: img.image_url,
            alt_text: img.alt_text || formName,
            display_order: idx + 1,
            is_primary: img.is_primary,
          }));

          await supabase.from('product_images').insert(imagesToInsert);
        }
      }

      setIsModalOpen(false);
      await fetchProducts();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setFormError(err.message || 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Products List
  const filteredProducts = products.filter((p) => {
    // Search
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());

    // Category
    const matchesCategory = !categoryFilter || p.category_id === categoryFilter;

    // Status
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? p.is_active
        : !p.is_active;

    // Stock
    const inv = Array.isArray(p.inventory) ? p.inventory[0] : p.inventory;
    const available = inv?.quantity_available ?? 0;
    const threshold = inv?.low_stock_threshold ?? 5;

    let matchesStock = true;
    if (stockFilter === 'out_of_stock') matchesStock = available <= 0;
    else if (stockFilter === 'low_stock') matchesStock = available > 0 && available <= threshold;
    else if (stockFilter === 'in_stock') matchesStock = available > threshold;

    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  });

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Saree Products Catalog</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your verified collection of pure handloom sarees, pricing, and stock.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold rounded shadow flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by saree or SKU..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="py-1.5 px-3 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:border-brand-burgundy"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parent_id ? `— ${c.name}` : c.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e: any) => setStatusFilter(e.target.value)}
          className="py-1.5 px-3 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:border-brand-burgundy"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        {/* Stock Filter */}
        <select
          value={stockFilter}
          onChange={(e: any) => setStockFilter(e.target.value)}
          className="py-1.5 px-3 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:border-brand-burgundy"
        >
          <option value="all">All Stock Statuses</option>
          <option value="in_stock">Well Stocked</option>
          <option value="low_stock">Low Stock (≤ threshold)</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading products catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No products match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Saree & SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Fabric</th>
                  <th className="py-3 px-4">MRP / Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Badges</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => {
                  const img =
                    product.images?.find((i) => i.is_primary)?.image_url ||
                    product.images?.[0]?.image_url ||
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=150';
                  const inv = Array.isArray(product.inventory) ? product.inventory[0] : product.inventory;
                  const available = inv?.quantity_available ?? 0;
                  const threshold = inv?.low_stock_threshold ?? 5;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Image & Title */}
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={img}
                          alt={product.name}
                          className="w-12 h-14 object-cover rounded bg-slate-100 shrink-0"
                        />
                        <div>
                          <span className="font-semibold text-slate-900 block line-clamp-1 max-w-[220px]">
                            {product.name}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400 block mt-0.5">
                            {product.sku}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-700">
                        {product.category?.name || '—'}
                      </td>

                      {/* Fabric */}
                      <td className="py-3 px-4 text-slate-700">
                        {product.fabric || 'Pure Silk'}
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">
                          ₹{Number(product.selling_price).toLocaleString('en-IN')}
                        </span>
                        {product.mrp > product.selling_price && (
                          <span className="text-[10px] text-slate-400 line-through">
                            ₹{Number(product.mrp).toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            available > threshold
                              ? 'bg-emerald-50 text-emerald-800'
                              : available > 0
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-red-50 text-red-800'
                          }`}
                        >
                          {available} units
                        </span>
                      </td>

                      {/* Badges */}
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {product.is_best_seller && (
                            <span className="text-[9px] bg-brand-burgundy text-white px-1.5 py-0.5 rounded font-bold uppercase">
                              Best Seller
                            </span>
                          )}
                          {product.is_featured && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">
                              Featured
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                            product.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1.5 text-slate-600 hover:text-brand-burgundy rounded hover:bg-slate-100"
                            title="Edit Saree"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(product)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 rounded hover:bg-slate-100"
                            title="Duplicate Saree"
                          >
                            <Copy className="w-3.5 h-3.5" />
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

      {/* ADD / EDIT PRODUCT MODAL DRAWER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-4 sm:p-6">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isEditing ? 'Edit Saree Specifications' : 'Add New Heirloom Saree'}
                </h2>
                <p className="text-xs text-slate-500">
                  Fill in authentic weave details, pricing, and upload multiple photography angles.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scrollable Area */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* SECTION A: Basic Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-burgundy border-b border-slate-100 pb-1">
                  Section A: Basic Saree Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Royal Peacock Blue Handwoven Paithani Saree"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Unique SKU *
                    </label>
                    <input
                      type="text"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                      placeholder="e.g. CHK-PTH-008"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL Slug *
                    </label>
                    <input
                      type="text"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value.toLowerCase())}
                      placeholder="e.g. royal-peacock-blue-paithani"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Weave Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:border-brand-burgundy"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.parent_id ? `— ${c.name}` : c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description & Artisanal Narrative
                    </label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Describe the weave history, zari purity, pallu motifs, and drape craftsmanship..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: Pricing */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-burgundy border-b border-slate-100 pb-1">
                  Section B: Pricing & Discount Verification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Maximum Retail Price (MRP) ₹ *
                    </label>
                    <input
                      type="number"
                      value={formMrp}
                      onChange={(e) => setFormMrp(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy font-semibold"
                      required
                      min={1}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Selling Price ₹ *
                    </label>
                    <input
                      type="number"
                      value={formSellingPrice}
                      onChange={(e) => setFormSellingPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy font-semibold text-brand-burgundy"
                      required
                      min={1}
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                      <span className="text-slate-500 block text-[10px]">Calculated Discount</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        {formMrp > formSellingPrice
                          ? `${Math.round(((formMrp - formSellingPrice) / formMrp) * 100)}% OFF`
                          : 'No Discount'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION C: Saree Attributes */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-burgundy border-b border-slate-100 pb-1">
                  Section C: Fabric & Weave Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Fabric</label>
                    <input
                      type="text"
                      value={formFabric}
                      onChange={(e) => setFormFabric(e.target.value)}
                      placeholder="e.g. Pure Katan Silk"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Colour / Shade</label>
                    <input
                      type="text"
                      value={formColour}
                      onChange={(e) => setFormColour(e.target.value)}
                      placeholder="e.g. Crimson Red with Antique Gold"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Motif / Pattern</label>
                    <input
                      type="text"
                      value={formPattern}
                      onChange={(e) => setFormPattern(e.target.value)}
                      placeholder="e.g. Mor-Bangadi Kadwa Weave"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Occasion</label>
                    <input
                      type="text"
                      value={formOccasion}
                      onChange={(e) => setFormOccasion(e.target.value)}
                      placeholder="e.g. Bridal & Grand Wedding"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Drape Length</label>
                    <input
                      type="text"
                      value={formSareeLength}
                      onChange={(e) => setFormSareeLength(e.target.value)}
                      placeholder="e.g. 5.5 Meters"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Blouse Piece</label>
                    <input
                      type="text"
                      value={formBlousePiece}
                      onChange={(e) => setFormBlousePiece(e.target.value)}
                      placeholder="e.g. Unstitched 0.8m piece included"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (Grams)</label>
                    <input
                      type="number"
                      value={formWeightGrams}
                      onChange={(e) => setFormWeightGrams(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 820"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION D: Inventory & Threshold */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-burgundy border-b border-slate-100 pb-1">
                  Section D: Inventory & Stock Control
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Available Stock Quantity *
                    </label>
                    <input
                      type="number"
                      value={formInitialStock}
                      onChange={(e) => setFormInitialStock(Number(e.target.value))}
                      min={0}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy font-semibold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Low-Stock Warning Threshold *
                    </label>
                    <input
                      type="number"
                      value={formLowStockThreshold}
                      onChange={(e) => setFormLowStockThreshold(Number(e.target.value))}
                      min={0}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy font-semibold"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION E: Visibility Badges */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-burgundy border-b border-slate-100 pb-1">
                  Section E: Catalog Visibility & Badges
                </h3>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded border-slate-300 text-brand-burgundy focus:ring-brand-burgundy h-4 w-4"
                    />
                    <span>Active in Storefront</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formIsFeatured}
                      onChange={(e) => setFormIsFeatured(e.target.checked)}
                      className="rounded border-slate-300 text-brand-burgundy focus:ring-brand-burgundy h-4 w-4"
                    />
                    <span>Featured Heirloom</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formIsBestSeller}
                      onChange={(e) => setFormIsBestSeller(e.target.checked)}
                      className="rounded border-slate-300 text-brand-burgundy focus:ring-brand-burgundy h-4 w-4"
                    />
                    <span>Best Seller Badge</span>
                  </label>
                </div>
              </div>

              {/* SECTION F: Images Upload */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-burgundy border-b border-slate-100 pb-1">
                  Section F: Saree Photography (Supabase Products Storage)
                </h3>
                <ImageUploader images={formImages} onChange={setFormImages} maxFiles={6} />
              </div>

              {/* Form Action Buttons */}
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
                  <span>{isSaving ? 'Saving Saree...' : isEditing ? 'Update Saree' : 'Publish Saree'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
