import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Users, Lock, Check, Sparkles, Key } from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';
import { AdminProfile, Role } from '@chandrakor/shared-types';

export const AdminsPage: React.FC = () => {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      setLoading(true);
      try {
        const { data: adminData } = await supabase
          .from('admin_profiles')
          .select('*, role:roles(*)');
        if (adminData) setAdmins(adminData as AdminProfile[]);

        const { data: rolesData } = await supabase.from('roles').select('*');
        if (rolesData) setRoles(rolesData as Role[]);
      } catch (e) {
        console.error('Failed to load staff profiles', e);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Staff Administration & Access Control (RBAC)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Role-Based Access Control enforced at PostgreSQL Row-Level Security layer.
        </p>
      </div>

      {/* Active Administrators Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Authorized Staff Personnel</h2>
            <p className="text-xs text-slate-500">Personnel authorized to operate Chandrakor business modules</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
            {admins.length} Staff Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Staff Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Provisioned Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((adm) => (
                <tr key={adm.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-burgundy/10 text-brand-burgundy font-bold flex items-center justify-center text-xs">
                      {adm.full_name.charAt(0)}
                    </div>
                    <span>{adm.full_name}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{adm.email}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-brand-burgundy/10 text-brand-burgundy font-bold rounded text-[11px]">
                      {adm.role?.name || 'Super Admin'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                      {adm.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(adm.created_at).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Matrix Reference */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900">
          Role-Based Access Control Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-slate-200 rounded space-y-2">
            <span className="text-xs font-bold text-brand-burgundy uppercase block">
              1. Super Admin
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unrestricted full access across catalog, inventory, pricing, banners, staff management, and database RPC triggers.
            </p>
          </div>

          <div className="p-4 border border-slate-200 rounded space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase block">
              2. Product Manager
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Product CRUD, category management, inventory adjustments, and collection curation.
            </p>
          </div>

          <div className="p-4 border border-slate-200 rounded space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase block">
              3. Marketing Manager
            </span>
            <p className="text-xs text-slate-500 leading-relaxed">
              Homepage hero banners, promotional collections, and merchandising visibility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
