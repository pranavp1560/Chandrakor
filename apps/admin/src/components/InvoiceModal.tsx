import React, { useRef } from 'react';
import { X, Printer, Download, Sparkles, ShieldCheck } from 'lucide-react';
import { Order, OrderItem } from '@chandrakor/shared-types';

interface InvoiceModalProps {
  order: Order & { items?: OrderItem[]; invoice?: any };
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = order.invoice?.invoice_number || `INV-${new Date(order.created_at).getFullYear()}${String(new Date(order.created_at).getMonth() + 1).padStart(2, '0')}-${order.order_number.replace(/\D/g, '').slice(-4) || '1001'}`;
  const invoiceDate = order.invoice?.created_at ? new Date(order.invoice.created_at) : new Date(order.created_at);

  const shippingAddr = order.shipping_address || {};
  const customerName = order.customer_name || shippingAddr.full_name || shippingAddr.fullName || 'Patron';
  const customerMobile = order.customer_mobile || shippingAddr.mobile || '';
  const addressLine1 = shippingAddr.address_line_1 || shippingAddr.addressLine1 || '';
  const addressLine2 = shippingAddr.address_line_2 || shippingAddr.addressLine2 || '';

  const subtotal = Number(order.subtotal) || 0;
  const discount = Number(order.discount_amount) || 0;
  const shippingFee = Number(order.shipping_charge ?? order.shipping_fee ?? 0);
  const total = Number(order.total_amount) || 0;
  // Saree GST is 5% in India (2.5% CGST + 2.5% SGST)
  const taxableValue = Math.round(total / 1.05);
  const totalGst = total - taxableValue;
  const cgst = (totalGst / 2).toFixed(2);
  const sgst = (totalGst / 2).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-sm border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl print:max-h-none print:shadow-none print:border-none">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-slate-800 text-sm">Tax Invoice Preview</span>
            <span className="font-mono text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
              {invoiceNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-brand-burgundy hover:bg-brand-burgundy-dark text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-8 sm:p-12 text-slate-800 text-xs print:p-6 print:overflow-visible">
          {/* Header */}
          <div className="flex justify-between items-start pb-6 border-b-2 border-brand-burgundy">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-brand-burgundy flex items-center justify-center bg-brand-cream/30">
                  <span className="text-brand-burgundy font-serif font-bold text-base">☾</span>
                </div>
                <div>
                  <h1 className="font-serif text-2xl font-bold tracking-[0.2em] text-brand-burgundy leading-none">
                    CHANDRAKOR
                  </h1>
                  <span className="text-[9px] uppercase tracking-[0.3em] text-slate-500 font-medium block mt-0.5">
                    Heirloom Indian Sarees Private Limited
                  </span>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-600 space-y-0.5">
                <p>Heritage Flagship Store: 108, Kala Ghoda Arts Enclave, Fort, Mumbai 400001</p>
                <p>CIN: U17120MH2026PTC109842 • GSTIN: <strong className="text-slate-800">27AABCU9603R1ZM</strong></p>
                <p>State: Maharashtra (Code: 27) • Support: orders@chandrakor.com | +91 98200 12345</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-brand-cream/60 border border-brand-cream text-brand-burgundy font-serif text-sm font-bold uppercase tracking-wider">
                TAX INVOICE
              </span>
              <div className="mt-2 text-[11px] text-slate-600 space-y-1">
                <p>Invoice No: <strong className="text-slate-900 font-mono">{invoiceNumber}</strong></p>
                <p>Invoice Date: <strong className="text-slate-800">{invoiceDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></p>
                <p>Order Reference: <span className="font-mono text-slate-800">{order.order_number}</span></p>
                <p>Payment Mode: <strong className="uppercase text-brand-burgundy">{order.payment_method}</strong> ({order.payment_status})</p>
              </div>
            </div>
          </div>

          {/* Billed To & Shipped To */}
          <div className="grid grid-cols-2 gap-8 py-6 border-b border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Billed To (Customer Details)
              </span>
              <p className="font-bold text-slate-900 text-sm">{customerName}</p>
              <p className="text-slate-600 mt-0.5">Phone: +91 {customerMobile}</p>
              {order.customer_email && <p className="text-slate-600">Email: {order.customer_email}</p>}
              <p className="text-slate-600 mt-1">
                Place of Supply: {shippingAddr.state || 'Maharashtra'} (State Code: 27)
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Shipped To (Delivery Destination)
              </span>
              <p className="font-semibold text-slate-800">{customerName}</p>
              <p className="text-slate-600 mt-0.5">
                {addressLine1}
                {addressLine2 ? `, ${addressLine2}` : ''}
              </p>
              {shippingAddr.landmark && <p className="text-slate-500 text-[11px]">Landmark: {shippingAddr.landmark}</p>}
              <p className="text-slate-600">
                {shippingAddr.city}, {shippingAddr.state} — {shippingAddr.pincode}
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="py-2.5 w-12 text-center">#</th>
                  <th className="py-2.5">Description of Heirloom Goods</th>
                  <th className="py-2.5 text-center w-24">HSN/SAC</th>
                  <th className="py-2.5 text-center w-16">Qty</th>
                  <th className="py-2.5 text-right w-24">Unit MRP</th>
                  <th className="py-2.5 text-right w-24">Rate (₹)</th>
                  <th className="py-2.5 text-right w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items && order.items.length > 0 ? (
                  order.items.map((it: any, idx: number) => {
                    const unitPrice = Number(it.unit_price) || 0;
                    const mrp = Number(it.mrp) || unitPrice;
                    const lineTotal = Number(it.line_total) || unitPrice * it.quantity;
                    return (
                      <tr key={idx} className="text-xs">
                        <td className="py-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3">
                          <span className="font-semibold text-slate-900 block font-serif text-sm">
                            {it.product_name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            SKU: {it.product_sku || 'CHK-SKU'}
                          </span>
                        </td>
                        <td className="py-3 text-center font-mono text-slate-600">5007</td>
                        <td className="py-3 text-center font-semibold text-slate-900">{it.quantity}</td>
                        <td className="py-3 text-right text-slate-400 font-mono">₹{mrp.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-right font-mono">₹{unitPrice.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-right font-semibold font-mono text-slate-900">
                          ₹{lineTotal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-400">
                      No item rows found for this order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Grand Total */}
          <div className="pt-4 border-t-2 border-slate-200 grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-sm text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">
                  Statutory GST Summary (HSN 5007 — Saree Weaves)
                </span>
                <div className="flex justify-between">
                  <span>Taxable Value:</span>
                  <span className="font-mono">₹{taxableValue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Central GST (CGST @ 2.5%):</span>
                  <span className="font-mono">₹{cgst}</span>
                </div>
                <div className="flex justify-between">
                  <span>State GST (SGST @ 2.5%):</span>
                  <span className="font-mono">₹{sgst}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-slate-200 text-slate-900">
                  <span>Total Tax Included:</span>
                  <span className="font-mono">₹{totalGst.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 space-y-0.5">
                <p>• Goods once sold can be exchanged/returned within 7 calendar days under terms.</p>
                <p>• Certified genuine handloom silk certified under Central Silk Board Silk Mark.</p>
                <p>• This is a computer-generated digital tax invoice and requires no physical signature.</p>
              </div>
            </div>

            <div className="space-y-2 text-right">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal (MRP Total):</span>
                <span className="font-mono font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-800 font-semibold">
                  <span>Promotional Coupon Discount:</span>
                  <span className="font-mono">-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-slate-600">
                <span>Insured Express Shipping:</span>
                <span className="font-mono uppercase font-semibold text-emerald-800 text-[10px]">
                  Complimentary
                </span>
              </div>

              <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t-2 border-brand-burgundy font-serif">
                <span>Invoice Total:</span>
                <span className="text-brand-burgundy font-mono text-lg">
                  ₹{total.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-8 flex flex-col items-end">
                <div className="w-36 border-b border-slate-800 pb-1 text-center">
                  <span className="font-serif italic text-xs text-brand-burgundy font-bold">Chandrakor Heritage</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
                  Authorised Signatory
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
