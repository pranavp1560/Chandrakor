import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, CheckCircle, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';

export const SettingsPage: React.FC = () => {
  const [storeName, setStoreName] = useState('Chandrakor');
  const [tagline, setTagline] = useState('Heirloom Handcrafted Indian Sarees');
  const [supportEmail, setSupportEmail] = useState('contact@chandrakor.com');
  const [supportPhone, setSupportPhone] = useState('+91 98200 12345');
  const [address, setAddress] = useState('108 Heritage Boulevard, Kala Ghoda, Mumbai 400001, Maharashtra, India');
  const [announcementMsg, setAnnouncementMsg] = useState('Complimentary Pan-India Express Shipping & Insured Heirloom Delivery on all orders');
  const [announcementActive, setAnnouncementActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('store_settings').select('*');
        if (data) {
          data.forEach((s) => {
            if (s.setting_key === 'store_profile') {
              setStoreName(s.setting_value.store_name || 'Chandrakor');
              setTagline(s.setting_value.tagline || '');
              setSupportEmail(s.setting_value.support_email || '');
              setSupportPhone(s.setting_value.support_phone || '');
              setAddress(s.setting_value.address || '');
            } else if (s.setting_key === 'announcement_bar') {
              setAnnouncementMsg(s.setting_value.message || '');
              setAnnouncementActive(s.setting_value.is_active ?? true);
            }
          });
        }
      } catch (e) {
        console.error('Failed to load store settings', e);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // 1. Update store profile
      const { error: profErr } = await supabase
        .from('store_settings')
        .update({
          setting_value: {
            store_name: storeName.trim(),
            tagline: tagline.trim(),
            support_email: supportEmail.trim(),
            support_phone: supportPhone.trim(),
            address: address.trim(),
            currency: 'INR',
            currency_symbol: '₹',
            tax_percentage: 5,
          },
        })
        .eq('setting_key', 'store_profile');

      if (profErr) throw profErr;

      // 2. Update announcement bar
      const { error: annErr } = await supabase
        .from('store_settings')
        .update({
          setting_value: {
            is_active: announcementActive,
            message: announcementMsg.trim(),
            link: '/shop',
          },
        })
        .eq('setting_key', 'announcement_bar');

      if (annErr) throw annErr;

      setSuccessMsg('Store settings saved successfully and updated live across the storefront.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update store settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Boutique & Store Settings</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure business metadata, top announcement ticker, and boutique contact information.
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Brand Information */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-burgundy border-b border-slate-100 pb-1">
            Store Profile & Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Support Phone</label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Boutique Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
              />
            </div>
          </div>
        </div>

        {/* Announcement Bar */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-brand-burgundy border-b border-slate-100 pb-1">
            Top Announcement Bar
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Announcement Ticker Message
              </label>
              <input
                type="text"
                value={announcementMsg}
                onChange={(e) => setAnnouncementMsg(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:border-brand-burgundy"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={announcementActive}
                onChange={(e) => setAnnouncementActive(e.target.checked)}
                className="rounded border-slate-300 text-brand-burgundy focus:ring-brand-burgundy h-4 w-4"
              />
              <span>Display Announcement Bar on Customer Storefront</span>
            </label>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-wider rounded shadow flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{saving ? 'Saving Settings...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
