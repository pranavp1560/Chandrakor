import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  Plus,
  Mail,
  Key,
  Check,
  X,
  Lock,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';
import { AdminProfile, Role } from '@chandrakor/shared-types';
import { useAuth } from '../context/AuthContext';

export const UsersPage: React.FC = () => {
  const { admin: currentAdmin, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRoleId, setNewRoleId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<AdminProfile | null>(null);
  const [editRoleId, setEditRoleId] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchStaffUsers = async () => {
    setLoading(true);
    try {
      // 1. Fetch staff profiles with joined roles
      const { data: adminData, error: adminErr } = await supabase
        .from('admin_profiles')
        .select('*, role:roles(*)')
        .order('created_at', { ascending: true });

      if (adminErr) {
        console.error('Error fetching admin profiles:', adminErr);
      } else if (adminData) {
        setUsers(adminData as AdminProfile[]);
      }

      // 2. Fetch roles
      const { data: rolesData, error: roleErr } = await supabase
        .from('roles')
        .select('*')
        .order('name', { ascending: true });

      if (roleErr) {
        console.error('Error fetching roles:', roleErr);
      } else if (rolesData) {
        setRoles(rolesData as Role[]);
        if (rolesData.length > 0 && !newRoleId) {
          setNewRoleId(rolesData[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load users data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffUsers();
  }, []);

  // Handle Add New Staff User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim() || !newPassword) {
      setFeedback({ type: 'error', message: 'All fields (Name, Email, Password, Role) are required.' });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('create_staff_user', {
        p_email: newEmail.trim().toLowerCase(),
        p_password: newPassword,
        p_full_name: newFullName.trim(),
        p_role_id: newRoleId,
      });

      if (error) {
        throw new Error(error.message);
      }

      setFeedback({
        type: 'success',
        message: `Staff user "${newFullName}" provisioned successfully with role access.`,
      });
      setIsAddModalOpen(false);

      // Reset form
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');

      await fetchStaffUsers();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create staff user.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user: AdminProfile) => {
    setEditingUser(user);
    setEditRoleId(user.role_id);
    setEditIsActive(user.is_active);
  };

  // Handle Update Staff User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('admin_profiles')
        .update({
          role_id: editRoleId,
          is_active: editIsActive,
        })
        .eq('id', editingUser.id);

      if (error) {
        throw new Error(error.message);
      }

      setFeedback({
        type: 'success',
        message: `Staff user "${editingUser.full_name}" updated successfully.`,
      });
      setEditingUser(null);
      await fetchStaffUsers();
      setTimeout(() => setFeedback(null), 5000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update staff user.' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Toggle Active/Suspended
  const handleToggleStatus = async (user: AdminProfile) => {
    if (user.id === currentAdmin?.id) {
      alert('You cannot suspend your own administrative session.');
      return;
    }

    const nextStatus = !user.is_active;
    const confirmMsg = nextStatus
      ? `Re-activate staff account for "${user.full_name}"?`
      : `Suspend staff account for "${user.full_name}"? They will be unable to log in.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const { error } = await supabase
        .from('admin_profiles')
        .update({ is_active: nextStatus })
        .eq('id', user.id);

      if (error) throw error;
      setFeedback({
        type: 'success',
        message: `Account status updated for ${user.full_name}.`,
      });
      await fetchStaffUsers();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update user status.' });
    }
  };

  // Handle Delete/Remove Staff
  const handleDeleteUser = async (user: AdminProfile) => {
    if (user.id === currentAdmin?.id) {
      alert('You cannot remove your own administrator account.');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to revoke access and remove staff user "${user.full_name}" (${user.email})?`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase.from('admin_profiles').delete().eq('id', user.id);
      if (error) throw error;

      setFeedback({
        type: 'success',
        message: `Staff user "${user.full_name}" access has been revoked.`,
      });
      await fetchStaffUsers();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to remove user.' });
    }
  };

  // Metrics
  const totalStaff = users.length;
  const superAdminCount = users.filter((u) => u.role?.name === 'Super Admin').length;
  const activeStaffCount = users.filter((u) => u.is_active).length;
  const managerCount = users.filter((u) => u.role?.name && u.role.name !== 'Super Admin').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-burgundy" />
            <span>Staff Users & Access Control (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage administrative personnel, assign operational roles, and configure system permissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStaffUsers}
            disabled={loading}
            className="p-2 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-50 transition-colors"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-wider rounded-md shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-md text-xs font-medium flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Total Staff Users
          </span>
          <span className="text-2xl font-bold text-slate-900">{totalStaff}</span>
          <span className="text-[10px] text-slate-500 font-medium block mt-1">Provisioned Accounts</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Super Admins
          </span>
          <span className="text-2xl font-bold text-brand-burgundy">{superAdminCount}</span>
          <span className="text-[10px] text-brand-burgundy font-medium block mt-1">Full System Authority</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Department Managers
          </span>
          <span className="text-2xl font-bold text-slate-900">{managerCount}</span>
          <span className="text-[10px] text-slate-500 font-medium block mt-1">Products, Orders, Marketing</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Active Accounts
          </span>
          <span className="text-2xl font-bold text-emerald-700">{activeStaffCount}</span>
          <span className="text-[10px] text-emerald-600 font-medium block mt-1">Authorized for Login</span>
        </div>
      </div>

      {/* Active Staff Users Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Authorized Personnel Directory</h2>
            <p className="text-xs text-slate-500">
              Staff members authenticated to access Chandrakor administration modules
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
            {users.length} Active Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Login Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Provisioned Date</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Loading personnel accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No staff users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const initials = user.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  const isCurrentUser = user.id === currentAdmin?.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-burgundy/10 text-brand-burgundy font-bold flex items-center justify-center shrink-0 text-xs">
                            {initials || 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {user.full_name}
                              {isCurrentUser && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                                  You
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400">UID: {user.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                        {user.email}
                      </td>

                      {/* Assigned Role */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-bold text-[11px] ${
                            user.role?.name === 'Super Admin'
                              ? 'bg-brand-burgundy text-white'
                              : user.role?.name === 'Product Manager'
                              ? 'bg-amber-100 text-amber-900'
                              : user.role?.name === 'Order Manager'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{user.role?.name || 'Administrator'}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={isCurrentUser}
                          className={`px-2.5 py-0.5 rounded font-semibold text-[10px] uppercase transition-all ${
                            user.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          } ${isCurrentUser ? 'cursor-default' : 'cursor-pointer'}`}
                          title={isCurrentUser ? 'Your active session' : 'Click to toggle active/suspended'}
                        >
                          {user.is_active ? 'Active' : 'Suspended'}
                        </button>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(user.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 border border-slate-200 hover:border-brand-burgundy text-slate-600 hover:text-brand-burgundy rounded transition-colors"
                            title="Edit Role / Status"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isCurrentUser && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 border border-slate-200 hover:border-red-300 text-slate-400 hover:text-red-700 rounded transition-colors"
                              title="Revoke Access"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role-Based Access Control Architecture Reference */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-burgundy" />
          <span>Role Permissions & Access Matrix</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 border border-slate-200 rounded-md space-y-2 bg-slate-50/50">
            <span className="font-bold text-brand-burgundy uppercase block">
              Super Admin
            </span>
            <p className="text-slate-600 leading-relaxed">
              Unrestricted full access across Catalog, Inventory, Orders, Customers, Marketing Banners, Settings, and Staff User Management.
            </p>
          </div>

          <div className="p-4 border border-slate-200 rounded-md space-y-2 bg-slate-50/50">
            <span className="font-bold text-slate-900 uppercase block">
              Product & Inventory Manager
            </span>
            <p className="text-slate-600 leading-relaxed">
              Product creation & editing, category management, inventory level adjustments, and saree collections curation.
            </p>
          </div>

          <div className="p-4 border border-slate-200 rounded-md space-y-2 bg-slate-50/50">
            <span className="font-bold text-slate-900 uppercase block">
              Order & Fulfillment Manager
            </span>
            <p className="text-slate-600 leading-relaxed">
              Customer order processing, dispatch status updates, shipment tracking numbers, and invoice generation.
            </p>
          </div>
        </div>
      </div>

      {/* Add New Staff User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-burgundy" />
                <span>Add New Staff User</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kulkarni"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-burgundy outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="staff@chandrakor.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-burgundy outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temporary Login Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-burgundy outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Role *
                </label>
                <select
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs bg-white text-slate-800 focus:ring-1 focus:ring-brand-burgundy outline-none"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {r.description || 'Module Access'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white rounded text-xs font-semibold uppercase tracking-wider shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating User...' : 'Provision User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brand-burgundy" />
                <span>Edit Staff Member: {editingUser.full_name}</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  User Email
                </label>
                <input
                  type="text"
                  disabled
                  value={editingUser.email}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Role
                </label>
                <select
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs bg-white text-slate-800 focus:ring-1 focus:ring-brand-burgundy outline-none"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Status
                </label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      checked={editIsActive}
                      onChange={() => setEditIsActive(true)}
                      className="text-brand-burgundy focus:ring-brand-burgundy"
                    />
                    <span>Active (Allowed Login)</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="editStatus"
                      checked={!editIsActive}
                      onChange={() => setEditIsActive(false)}
                      className="text-brand-burgundy focus:ring-brand-burgundy"
                    />
                    <span>Suspended</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white rounded text-xs font-semibold uppercase tracking-wider shadow-sm transition-all disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
