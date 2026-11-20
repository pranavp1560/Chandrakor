import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Filter,
  Eye,
  Truck,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCcw,
  Calendar,
  ExternalLink,
  ChevronDown,
  Loader2,
  RefreshCw,
  Phone,
  User,
  MapPin,
} from 'lucide-react';
import { supabase } from '@chandrakor/supabase-client';
import { Order, OrderStatus, PaymentStatus } from '@chandrakor/shared-types';
import { InvoiceModal } from '../components/InvoiceModal';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // Selected Order for Invoice Modal
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);

  // Shipment Modal State
  const [shipmentModalOrder, setShipmentModalOrder] = useState<Order | null>(null);
  const [courierName, setCourierName] = useState('Blue Dart');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [shipmentNotes, setShipmentNotes] = useState('');
  const [isSavingShipment, setIsSavingShipment] = useState(false);

  // Cancel Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested cancellation');
  const [isCancelling, setIsCancelling] = useState(false);

  // Action status message
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch orders from Supabase
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mapped: Order[] = (data || []).map((o: any) => ({
        ...o,
        status: o.order_status || o.status,
      }));
      setOrders(mapped);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setActionFeedback({ type: 'error', message: err.message || 'Failed to fetch orders' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Fetch full details of an order (items, shipment, status history)
  const openOrderDetails = async (order: Order) => {
    setIsDetailsLoading(true);
    const initial = {
      ...order,
      status: order.order_status || order.status,
    };
    setSelectedOrder(initial);

    try {
      const [itemsRes, shipmentRes, historyRes, invoiceRes] = await Promise.all([
        supabase.from('order_items').select('*').eq('order_id', order.id),
        supabase.from('shipments').select('*').eq('order_id', order.id).maybeSingle(),
        supabase.from('order_status_history').select('*').eq('order_id', order.id).order('created_at', { ascending: false }),
        supabase.from('invoices').select('*').eq('order_id', order.id).maybeSingle(),
      ]);

      setSelectedOrder({
        ...initial,
        items: itemsRes.data || [],
        shipment: shipmentRes.data || null,
        history: historyRes.data || [],
        invoice: invoiceRes.data || null,
      });
    } catch (e) {
      console.error('Error fetching order full details:', e);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  // Open Invoice Preview
  const handleOpenInvoice = async (order: Order) => {
    try {
      const [itemsRes, invoiceRes] = await Promise.all([
        supabase.from('order_items').select('*').eq('order_id', order.id),
        supabase.from('invoices').select('*').eq('order_id', order.id).maybeSingle(),
      ]);

      setInvoiceOrder({
        ...order,
        status: order.order_status || order.status,
        items: itemsRes.data || [],
        invoice: invoiceRes.data || null,
      });
    } catch (e) {
      console.error('Error preparing invoice:', e);
    }
  };

  // Update order status directly
  const handleUpdateOrderStatus = async (newStatus: OrderStatus, notes?: string) => {
    if (!selectedOrder) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: newStatus })
        .eq('id', selectedOrder.id);

      if (error) throw error;

      // Add to status history
      await supabase.from('order_status_history').insert({
        order_id: selectedOrder.id,
        previous_status: selectedOrder.order_status || selectedOrder.status,
        new_status: newStatus,
        notes: notes || `Status updated to ${newStatus} by admin`,
      });

      setActionFeedback({ type: 'success', message: `Order status updated to ${newStatus}` });
      setSelectedOrder({ ...selectedOrder, status: newStatus, order_status: newStatus });
      fetchOrders();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  // Save Manual Shipment Details via RPC
  const handleSaveShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipmentModalOrder) return;

    if (!trackingNumber.trim()) {
      alert('Please enter a courier tracking / AWB number');
      return;
    }

    setIsSavingShipment(true);
    try {
      const autoTrackingUrl =
        trackingUrl.trim() ||
        (courierName === 'Blue Dart'
          ? `https://www.bluedart.com/tracking?handler=tnt&action=custtrack&trackid=${trackingNumber.trim()}`
          : courierName === 'Delhivery'
          ? `https://www.delhivery.com/track/package/${trackingNumber.trim()}`
          : courierName === 'DTDC'
          ? `https://www.dtdc.in/tracking/tracking_results.asp?strCnno=${trackingNumber.trim()}`
          : `https://www.indiapost.gov.in/_layouts/15/dpt.cpt.urltracking/tracking.aspx?TrackingNumber=${trackingNumber.trim()}`);

      const { data, error } = await supabase.rpc('save_shipment_details', {
        p_order_id: shipmentModalOrder.id,
        p_courier_name: courierName,
        p_tracking_number: trackingNumber.trim(),
        p_tracking_url: autoTrackingUrl,
        p_dispatch_date: dispatchDate,
        p_expected_delivery: expectedDeliveryDate || null,
        p_notes: shipmentNotes.trim() || null,
      });

      if (error) throw error;

      setActionFeedback({
        type: 'success',
        message: `Shipment booked for ${shipmentModalOrder.order_number}. Courier: ${courierName}`,
      });
      setShipmentModalOrder(null);
      setTrackingNumber('');
      setTrackingUrl('');
      setShipmentNotes('');

      if (selectedOrder && selectedOrder.id === shipmentModalOrder.id) {
        openOrderDetails({ ...selectedOrder, status: 'shipped' });
      }
      fetchOrders();
    } catch (err: any) {
      alert('Failed to save shipment details: ' + err.message);
    } finally {
      setIsSavingShipment(false);
    }
  };

  // Cancel order via atomic RPC
  const handleCancelOrder = async () => {
    if (!cancelModalOrder) return;

    setIsCancelling(true);
    try {
      const { data, error } = await supabase.rpc('cancel_order_atomic', {
        p_order_id: cancelModalOrder.id,
        p_reason: cancelReason.trim() || 'Admin cancelled order',
      });

      if (error) throw error;

      setActionFeedback({
        type: 'success',
        message: `Order ${cancelModalOrder.order_number} has been cancelled and stock reservations reversed.`,
      });
      setCancelModalOrder(null);
      if (selectedOrder && selectedOrder.id === cancelModalOrder.id) {
        setSelectedOrder({ ...selectedOrder, status: 'cancelled' });
      }
      fetchOrders();
    } catch (err: any) {
      alert('Failed to cancel order: ' + err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer_mobile.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ord.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || ord.payment_method === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Calculate stats
  const totalOrdersCount = orders.length;
  const pendingCodCount = orders.filter((o) => o.status === 'pending_confirmation').length;
  const processingCount = orders.filter((o) => o.status === 'confirmed' || o.status === 'processing' || o.status === 'packed').length;
  const shippedCount = orders.filter((o) => o.status === 'shipped').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-wide">
            Order Fulfillment & Shipping
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time customer orders, COD confirmation, inventory reconciliation, and courier tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="px-3.5 py-2 bg-white border border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-medium rounded shadow-xs transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Banner */}
      {actionFeedback && (
        <div
          className={`p-3.5 rounded text-xs flex items-center justify-between ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{actionFeedback.message}</span>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-500 hover:text-slate-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-4 bg-white border rounded shadow-xs cursor-pointer transition-all ${
            statusFilter === 'all' ? 'border-brand-burgundy ring-2 ring-brand-burgundy/10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Orders</span>
          <span className="text-xl font-bold font-serif text-slate-900 mt-1 block">{totalOrdersCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('pending_confirmation')}
          className={`p-4 bg-white border rounded shadow-xs cursor-pointer transition-all ${
            statusFilter === 'pending_confirmation' ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Pending COD</span>
          <span className="text-xl font-bold font-serif text-amber-900 mt-1 block">{pendingCodCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('processing')}
          className={`p-4 bg-white border rounded shadow-xs cursor-pointer transition-all ${
            statusFilter === 'processing' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">In Processing</span>
          <span className="text-xl font-bold font-serif text-blue-900 mt-1 block">{processingCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('shipped')}
          className={`p-4 bg-white border rounded shadow-xs cursor-pointer transition-all ${
            statusFilter === 'shipped' ? 'border-sky-500 ring-2 ring-sky-500/10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">In Transit</span>
          <span className="text-xl font-bold font-serif text-sky-900 mt-1 block">{shippedCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('delivered')}
          className={`p-4 bg-white border rounded shadow-xs cursor-pointer transition-all ${
            statusFilter === 'delivered' ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Delivered</span>
          <span className="text-xl font-bold font-serif text-emerald-900 mt-1 block">{deliveredCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('cancelled')}
          className={`p-4 bg-white border rounded shadow-xs cursor-pointer transition-all ${
            statusFilter === 'cancelled' ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">Cancelled</span>
          <span className="text-xl font-bold font-serif text-rose-900 mt-1 block">{cancelledCount}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order #, customer, mobile..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-300 rounded bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending_confirmation">Pending Confirmation (COD)</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Payment:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-2 py-1.5 text-xs border border-slate-300 rounded bg-white"
            >
              <option value="all">All Methods</option>
              <option value="upi">UPI</option>
              <option value="card">Cards</option>
              <option value="netbanking">Net Banking</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200 rounded shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Order Reference</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-burgundy" />
                    <span>Loading live orders from Supabase...</span>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 stroke-1 mx-auto mb-2 text-slate-400" />
                    <p className="font-semibold">No orders matching your criteria</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try clearing filters or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => openOrderDetails(ord)}
                        className="font-mono font-bold text-brand-burgundy hover:underline text-left block"
                      >
                        {ord.order_number}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {new Date(ord.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(ord.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{ord.customer_name}</span>
                      <span className="text-slate-500 font-mono text-[11px]">+91 {ord.customer_mobile}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <span>{ord.shipping_address?.city || 'India'}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {ord.shipping_address?.pincode || ''}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-serif font-bold text-slate-900">
                      ₹{Number(ord.total_amount).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold uppercase text-slate-700 block">
                        {ord.payment_method}
                      </span>
                      <span
                        className={`inline-block px-1.5 py-0.2 text-[9px] uppercase font-bold rounded ${
                          ord.payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.payment_status === 'failed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ord.payment_status}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          (ord.status || ord.order_status) === 'delivered'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : (ord.status || ord.order_status) === 'shipped'
                            ? 'bg-sky-100 text-sky-900 border border-sky-200'
                            : (ord.status || ord.order_status) === 'cancelled'
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : (ord.status || ord.order_status) === 'pending_confirmation'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}
                      >
                        {(ord.status || ord.order_status || 'pending').replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openOrderDetails(ord)}
                          className="p-1.5 text-slate-600 hover:text-brand-burgundy hover:bg-slate-100 rounded transition-colors"
                          title="View Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenInvoice(ord)}
                          className="p-1.5 text-slate-600 hover:text-brand-burgundy hover:bg-slate-100 rounded transition-colors"
                          title="Print Tax Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {ord.status !== 'shipped' && ord.status !== 'delivered' && ord.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setShipmentModalOrder(ord);
                              setTrackingNumber('');
                            }}
                            className="p-1.5 text-sky-700 hover:bg-sky-50 rounded transition-colors"
                            title="Dispatch & Ship"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-lg font-bold text-brand-burgundy">
                    {selectedOrder.order_number}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${
                      selectedOrder.status === 'delivered'
                        ? 'bg-emerald-100 text-emerald-900'
                        : selectedOrder.status === 'shipped'
                        ? 'bg-sky-100 text-sky-900'
                        : selectedOrder.status === 'cancelled'
                        ? 'bg-rose-100 text-rose-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {selectedOrder.status.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenInvoice(selectedOrder)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-medium rounded flex items-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Invoice</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
              {/* Customer & Shipping Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded">
                <div>
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">
                    Customer Information
                  </span>
                  <p className="font-semibold text-slate-800 text-sm">{selectedOrder.customer_name}</p>
                  <p className="text-slate-600 mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>+91 {selectedOrder.customer_mobile}</span>
                  </p>
                  {selectedOrder.customer_email && (
                    <p className="text-slate-600 text-[11px] mt-0.5">{selectedOrder.customer_email}</p>
                  )}
                </div>

                <div>
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block mb-1">
                    Shipping Destination ({selectedOrder.shipping_address?.addressType || 'Home'})
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedOrder.shipping_address?.addressLine1}
                    {selectedOrder.shipping_address?.addressLine2 ? `, ${selectedOrder.shipping_address.addressLine2}` : ''}
                    {selectedOrder.shipping_address?.landmark ? ` (Landmark: ${selectedOrder.shipping_address.landmark})` : ''}
                    <br />
                    {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.state} — {selectedOrder.shipping_address?.pincode}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block">
                  Purchased Heirloom Sarees
                </span>
                <div className="border border-slate-200 rounded divide-y divide-slate-100">
                  {selectedOrder.items?.map((it: any, idx: number) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {it.product_image && (
                          <img
                            src={it.product_image}
                            alt={it.product_name}
                            className="w-12 h-14 object-cover rounded bg-slate-100"
                          />
                        )}
                        <div>
                          <span className="font-semibold text-slate-800 block font-serif text-sm">
                            {it.product_name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            SKU: {it.product_sku} • Qty: {it.quantity}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold font-serif text-sm text-slate-900">
                          ₹{(Number(it.unit_price) * it.quantity).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          @ ₹{Number(it.unit_price).toLocaleString('en-IN')} each
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{Number(selectedOrder.subtotal).toLocaleString('en-IN')}</span>
                </div>
                {Number(selectedOrder.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">-₹{Number(selectedOrder.discount_amount).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Pan-India Insured Express Shipping:</span>
                  <span className="font-mono uppercase font-semibold text-emerald-800 text-[10px]">Complimentary</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST (5% Included):</span>
                  <span className="font-mono">₹{Number(selectedOrder.tax_amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200 font-serif">
                  <span>Total Payable:</span>
                  <span className="text-brand-burgundy font-mono text-base">
                    ₹{Number(selectedOrder.total_amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Courier Shipment Details if present */}
              {selectedOrder.shipment && (
                <div className="p-4 bg-sky-50 border border-sky-200 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-sky-700" />
                      <span>Shipment Details</span>
                    </span>
                    {selectedOrder.shipment.tracking_url && (
                      <a
                        href={selectedOrder.shipment.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-sky-700 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Open Courier Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Courier:</span>
                      <span className="font-semibold">{selectedOrder.shipment.courier_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Tracking / AWB:</span>
                      <span className="font-mono font-bold select-all">{selectedOrder.shipment.tracking_number}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Dispatch Date:</span>
                      <span>{selectedOrder.shipment.dispatch_date}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Workflow Action Buttons */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block">
                  Workflow State Transitions
                </span>

                <div className="flex flex-wrap gap-2">
                  {selectedOrder.status === 'pending_confirmation' && (
                    <button
                      onClick={() => handleUpdateOrderStatus('confirmed', 'COD order phone verified by staff')}
                      className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded font-medium flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm Verified COD Order</span>
                    </button>
                  )}

                  {selectedOrder.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateOrderStatus('processing')}
                      className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded font-medium flex items-center gap-1.5 shadow-xs"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Start Quality Check & Processing</span>
                    </button>
                  )}

                  {selectedOrder.status === 'processing' && (
                    <button
                      onClick={() => handleUpdateOrderStatus('packed')}
                      className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded font-medium flex items-center gap-1.5 shadow-xs"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>Mark Packed in Heirloom Box</span>
                    </button>
                  )}

                  {(selectedOrder.status === 'packed' || selectedOrder.status === 'confirmed' || selectedOrder.status === 'processing') && (
                    <button
                      onClick={() => {
                        setShipmentModalOrder(selectedOrder);
                        setTrackingNumber('');
                      }}
                      className="px-3.5 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded font-medium flex items-center gap-1.5 shadow-xs"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Dispatch & Enter Courier Tracking</span>
                    </button>
                  )}

                  {selectedOrder.status === 'shipped' && (
                    <button
                      onClick={() => handleUpdateOrderStatus('delivered', 'Confirmed doorstep delivery')}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-medium flex items-center gap-1.5 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Doorstep Delivered</span>
                    </button>
                  )}

                  {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                    <button
                      onClick={() => setCancelModalOrder(selectedOrder)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded font-medium flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Order & Reverse Inventory</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shipment Modal */}
      {shipmentModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-700" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Dispatch Shipment for {shipmentModalOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setShipmentModalOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShipment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Courier Company <span className="text-rose-600">*</span>
                </label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                >
                  <option value="Blue Dart">Blue Dart Express</option>
                  <option value="Delhivery">Delhivery Surface/Express</option>
                  <option value="DTDC">DTDC Courier</option>
                  <option value="India Post Speed Post">India Post (Speed Post)</option>
                  <option value="Shadowfax">Shadowfax</option>
                  <option value="Ecom Express">Ecom Express</option>
                  <option value="Self Delivery / Concierge">Self Delivery / Concierge</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tracking Number / Airway Bill (AWB) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 5432987612"
                  className="w-full px-3 py-2 font-mono text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Custom Tracking URL (Optional)
                </label>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="Leave blank to use default carrier tracking URL"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Dispatch Date
                  </label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Shipment Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={shipmentNotes}
                  onChange={(e) => setShipmentNotes(e.target.value)}
                  placeholder="e.g. Tamper-evident heirloom bag, insurance cover confirmed"
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isSavingShipment}
                  className="flex-1 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-semibold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2"
                >
                  {isSavingShipment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Save & Mark Shipped</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShipmentModalOrder(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold uppercase tracking-wider rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-sm pb-2 border-b border-slate-200">
              <AlertTriangle className="w-5 h-5" />
              <span>Cancel Order {cancelModalOrder.order_number}?</span>
            </div>

            <p className="text-slate-600 leading-relaxed">
              This action will mark the order as <strong>cancelled</strong> and trigger the atomic database RPC to release reserved stock or restore inventory quantities.
            </p>

            <div>
              <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Reason for Cancellation <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Specify reason..."
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-burgundy"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-2"
              >
                {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Confirm Cancellation</span>}
              </button>
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold uppercase tracking-wider rounded transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Printable Modal */}
      {invoiceOrder && (
        <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}
    </div>
  );
};
