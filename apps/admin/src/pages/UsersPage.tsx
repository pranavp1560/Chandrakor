import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  ExternalLink,
  X,
  Check,
  Calendar,
  CreditCard,
  Building,
  UserCheck,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';
import { Customer, CustomerAddress, Order } from '@chandrakor/shared-types';

interface CustomerWithDetails extends Customer {
  addresses?: CustomerAddress[];
  orders?: Order[];
  order_count?: number;
  total_spent?: number;
}

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<CustomerWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'buyers' | 'leads'>('all');

  // Modal states
  const [selectedUser, setSelectedUser] = useState<CustomerWithDetails | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New User Form State
  const [newFullName, setNewFullName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddressLine1, setNewAddressLine1] = useState('');
  const [newAddressLine2, setNewAddressLine2] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('Maharashtra');
  const [newPincode, setNewPincode] = useState('');
  const [newAddressType, setNewAddressType] = useState<'home' | 'office'>('home');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          addresses:customer_addresses(*),
          orders:orders(id, order_number, total_amount, status, created_at, payment_method)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching customers:', error);
      } else if (data) {
        const enhancedUsers: CustomerWithDetails[] = data.map((cust: any) => {
          const orders = cust.orders || [];
          const totalSpent = orders.reduce(
            (sum: number, o: any) => sum + (o.status !== 'cancelled' ? Number(o.total_amount || 0) : 0),
            0
          );
          return {
            ...cust,
            orders,
            order_count: orders.length,
            total_spent: totalSpent,
          };
        });
        setUsers(enhancedUsers);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newMobile.trim()) {
      alert('Please provide full name and mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Insert customer
      const { data: customerData, error: custErr } = await supabase
        .from('customers')
        .insert({
          full_name: newFullName.trim(),
          mobile: newMobile.trim(),
          email: newEmail.trim() || null,
        })
        .select()
        .single();

      if (custErr || !customerData) {
        throw new Error(custErr?.message || 'Failed to create customer');
      }

      // 2. If address provided, insert address
      if (newAddressLine1.trim() && newCity.trim() && newPincode.trim()) {
        await supabase.from('customer_addresses').insert({
          customer_id: customerData.id,
          full_name: newFullName.trim(),
          mobile: newMobile.trim(),
          address_line_1: newAddressLine1.trim(),
          address_line_2: newAddressLine2.trim() || null,
          city: newCity.trim(),
          state: newState.trim(),
          pincode: newPincode.trim(),
          address_type: newAddressType,
        });
      }

      setFeedbackMsg({ type: 'success', text: `User "${newFullName}" successfully registered.` });
      setIsAddModalOpen(false);

      // Reset form
      setNewFullName('');
      setNewMobile('');
      setNewEmail('');
      setNewAddressLine1('');
      setNewAddressLine2('');
      setNewCity('');
      setNewPincode('');

      await fetchUsers();
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to register user.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.mobile.includes(searchQuery) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.addresses && u.addresses.some((a) => a.city.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    if (filterType === 'buyers') return (u.order_count || 0) > 0;
    if (filterType === 'leads') return (u.order_count || 0) === 0;
    return true;
  });

  // Calculate high-level metrics
  const totalCustomers = users.length;
  const activeBuyers = users.filter((u) => (u.order_count || 0) > 0).length;
  const totalRevenue = users.reduce((acc, u) => acc + (u.total_spent || 0), 0);
  const avgCustomerLTV = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-burgundy" />
            <span>Users & Customers Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Directory of registered clients, addresses, order history, and customer lifetime value (LTV)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
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
            <span>Register New User</span>
          </button>
        </div>
      </div>

      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-md text-xs font-medium flex items-center justify-between border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="underline font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Total Registered Users
          </span>
          <span className="text-2xl font-bold text-slate-900">{totalCustomers}</span>
          <span className="text-[10px] text-emerald-600 font-medium block mt-1">Direct Client Database</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Active Shoppers
          </span>
          <span className="text-2xl font-bold text-slate-900">{activeBuyers}</span>
          <span className="text-[10px] text-brand-burgundy font-medium block mt-1">
            {totalCustomers > 0 ? Math.round((activeBuyers / totalCustomers) * 100) : 0}% Conversion Rate
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Lifetime Revenue
          </span>
          <span className="text-2xl font-bold text-brand-burgundy">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 font-medium block mt-1">Cumulative Delivered/Paid</span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Average LTV
          </span>
          <span className="text-2xl font-bold text-slate-900">
            ₹{avgCustomerLTV.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 font-medium block mt-1">Revenue per Customer</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, email, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-brand-burgundy focus:border-brand-burgundy outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500">Filter:</span>
          <select
            value={filterType}
            onChange={(e: any) => setFilterType(e.target.value)}
            className="border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-700 bg-white outline-none focus:ring-1 focus:ring-brand-burgundy"
          >
            <option value="all">All Users ({users.length})</option>
            <option value="buyers">Buyers with Orders ({activeBuyers})</option>
            <option value="leads">New Leads (0 Orders) ({totalCustomers - activeBuyers})</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Mobile / Contact</th>
                <th className="py-3 px-4">Default City</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Lifetime Spend</th>
                <th className="py-3 px-4">Registration</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Loading Chandrakor users database...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const defaultAddress = user.addresses?.[0];
                  const initials = user.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-burgundy/10 text-brand-burgundy font-bold flex items-center justify-center shrink-0 text-xs">
                            {initials || 'U'}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight">
                              {user.full_name}
                            </span>
                            <span className="text-[11px] text-slate-400">ID: {user.id.substring(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.mobile}</span>
                        </div>
                        {user.email ? (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{user.email}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No email linked</span>
                        )}
                      </td>

                      {/* City / State */}
                      <td className="py-3 px-4">
                        {defaultAddress ? (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {defaultAddress.city}, {defaultAddress.state}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No address on file</span>
                        )}
                      </td>

                      {/* Orders Count */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                            (user.order_count || 0) > 0
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {user.order_count || 0} order(s)
                        </span>
                      </td>

                      {/* Lifetime Spend */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{(user.total_spent || 0).toLocaleString('en-IN')}
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
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="px-2.5 py-1 text-xs border border-slate-200 hover:border-brand-burgundy text-slate-700 hover:text-brand-burgundy rounded transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-burgundy text-white font-bold flex items-center justify-center text-sm">
                  {selectedUser.full_name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedUser.full_name}</h3>
                  <span className="text-xs text-slate-400">Customer ID: {selectedUser.id}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Contact Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Mobile Phone</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-brand-burgundy" />
                    {selectedUser.mobile}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Email Address</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-brand-burgundy" />
                    {selectedUser.email || 'None Provided'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Customer Since</span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-burgundy" />
                    {new Date(selectedUser.created_at).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Saved Addresses */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-brand-burgundy" />
                  <span>Saved Addresses ({selectedUser.addresses?.length || 0})</span>
                </h4>
                {selectedUser.addresses && selectedUser.addresses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedUser.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-3 bg-white border border-slate-200 rounded-md text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{addr.full_name}</span>
                          <span className="text-[10px] uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                            {addr.address_type}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          {addr.address_line_1}
                          {addr.address_line_2 && `, ${addr.address_line_2}`}
                          <br />
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        <span className="text-[11px] text-slate-500 block pt-1">Phone: {addr.mobile}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-400">
                    No delivery addresses stored yet.
                  </div>
                )}
              </div>

              {/* Order History */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-brand-burgundy" />
                  <span>Order History ({selectedUser.orders?.length || 0})</span>
                </h4>
                {selectedUser.orders && selectedUser.orders.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Order Number</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Method</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedUser.orders.map((ord: any) => (
                          <tr key={ord.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              #{ord.order_number}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {new Date(ord.created_at).toLocaleDateString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  ord.status === 'delivered'
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : ord.status === 'cancelled'
                                    ? 'bg-red-50 text-red-800'
                                    : 'bg-amber-50 text-amber-800'
                                }`}
                              >
                                {ord.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 uppercase text-[10px]">
                              {ord.payment_method || 'Online'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              ₹{Number(ord.total_amount).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-400">
                    This customer has not placed any orders yet.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-slate-200 rounded text-xs font-semibold text-slate-700 hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-brand-burgundy" />
                <span>Register New Customer / Client</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ananya Roy"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-burgundy outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={newMobile}
                    onChange={(e) => setNewMobile(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-burgundy outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="ananya@example.com (optional)"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-burgundy outline-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Initial Shipping Address (Optional)
                </span>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Address Line 1 (Flat, House, Building)"
                      value={newAddressLine1}
                      onChange={(e) => setNewAddressLine1(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-burgundy outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City (e.g. Mumbai)"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-burgundy outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-burgundy outline-none"
                    />
                  </div>
                </div>
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
                  {isSubmitting ? 'Registering...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
