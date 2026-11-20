import React, { useState, useEffect } from 'react';
import {
  Plus,
  Image as ImageIcon,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  Loader2,
  AlertCircle,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';
import { Banner } from '@chandrakor/shared-types';

export const BannersPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mobileImageUrl, setMobileImageUrl] = useState('');
  const [buttonText, setButtonText] = useState('Explore Silk Sarees');
  const [buttonLink, setButtonLink] = useState('/shop');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (data) setBanners(data as Banner[]);
    } catch (e) {
      console.error('Failed to load banners', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setTitle('');
    setSubtitle('');
    setImageUrl('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=85&w=1920');
    setMobileImageUrl('');
    setButtonText('Explore Collection');
    setButtonLink('/shop');
    setDisplayOrder(banners.length + 1);
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (banner: Banner) => {
    setIsEditing(true);
    setCurrentId(banner.id);
    setTitle(banner.title);
    setSubtitle(banner.subtitle || '');
    setImageUrl(banner.image_url);
    setMobileImageUrl(banner.mobile_image_url || '');
    setButtonText(banner.button_text || '');
    setButtonLink(banner.button_link || '');
    setDisplayOrder(banner.display_order);
    setIsActive(banner.is_active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Banner title is required.');
      return;
    }
    if (!imageUrl.trim()) {
      setFormError('Desktop image URL is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        image_url: imageUrl.trim(),
        mobile_image_url: mobileImageUrl.trim() || null,
        button_text: buttonText.trim() || null,
        button_link: buttonLink.trim() || null,
        display_order: Number(displayOrder),
        is_active: isActive,
      };

      if (isEditing && currentId) {
        const { error } = await supabase
          .from('banners')
          .update(payload)
          .eq('id', currentId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('banners').insert(payload);
        if (error) throw error;
      }

      setIsModalOpen(false);
      await fetchBanners();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save banner.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (banner: Banner) => {
    if (!confirm(`Are you sure you want to delete banner "${banner.title}"?`)) return;
    try {
      const { error } = await supabase.from('banners').delete().eq('id', banner.id);
      if (error) throw error;
      await fetchBanners();
    } catch (err: any) {
      alert(`Failed to delete banner: ${err.message}`);
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);
      if (error) throw error;
      await fetchBanners();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Homepage Hero Banners</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure dynamic seasonal slides, editorial highlights, and call-to-actions.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold rounded shadow flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Banner</span>
        </button>
      </div>

      {/* Banners List */}
      <div className="space-y-4">
        {banners.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row"
          >
            {/* Image Preview */}
            <div className="md:w-80 h-44 bg-slate-100 relative shrink-0">
              <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded font-mono">
                Order: #{b.display_order}
              </div>
            </div>

            {/* Banner Details */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <h3 className="font-serif text-lg font-bold text-slate-900">{b.title}</h3>
                  <button
                    onClick={() => handleToggleActive(b)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      b.is_active
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {b.is_active ? 'Active on Store' : 'Inactive'}
                  </button>
                </div>
                {b.subtitle && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{b.subtitle}</p>
                )}
                {b.button_text && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-brand-burgundy font-semibold">
                    <span>CTA: {b.button_text}</span>
                    <span className="font-mono text-slate-400">({b.button_link})</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-4">
                <button
                  onClick={() => openEditModal(b)}
                  className="px-3 py-1 bg-white border border-slate-200 hover:border-brand-burgundy text-slate-700 rounded text-xs font-semibold flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Slide</span>
                </button>
                <button
                  onClick={() => handleDelete(b)}
                  className="p-1 text-slate-400 hover:text-red-700 rounded"
                  title="Delete Slide"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT BANNER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Hero Banner' : 'Create Hero Banner'}
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
                  Banner Headline *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Royal Weaves of Banaras"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subtitle / Editorial Note
                </label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Handcrafted in pure katan silk with authentic gold zari kadwa craftsmanship."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Desktop Image URL (1920x1080 recommended) *
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={mobileImageUrl}
                  onChange={(e) => setMobileImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Call To Action Text
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="e.g. Explore Silk Sarees"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CTA Link Destination
                  </label>
                  <input
                    type="text"
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    placeholder="e.g. /shop?category=banarasi-silk"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-brand-burgundy focus:ring-brand-burgundy h-4 w-4"
                  />
                  <span>Active in Storefront Slider</span>
                </label>

                <div className="flex items-center gap-2">
                  <label htmlFor="display-order" className="text-xs text-slate-500">Order:</label>
                  <input
                    id="display-order"
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
                  <span>{isSaving ? 'Saving...' : 'Save Banner'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
