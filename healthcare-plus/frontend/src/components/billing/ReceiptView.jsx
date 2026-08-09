import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Printer, Download, Building2, Calendar, CreditCard } from 'lucide-react';
import * as billingService from '../../services/billing.service';

export default function ReceiptView({ billId, onClose }) {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!billId) return;
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const res = await billingService.getBillReceipt(billId);
        setBill(res.data);
      } catch (err) {
        setError(err.message || 'Failed to load receipt.');
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [billId]);

  if (!billId) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-600" />
            <h3 className="font-semibold text-slate-800">Official Payment Receipt</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading receipt details...</div>
          ) : error ? (
            <div className="py-12 text-center text-red-500">{error}</div>
          ) : bill ? (
            <>
              {/* Receipt Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-800">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold">Payment Verified & Confirmed</div>
                  <div className="text-xs text-emerald-700">Receipt ID: {bill.id}</div>
                </div>
              </div>

              {/* Hospital & Patient Details */}
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-4">
                <div>
                  <span className="text-slate-400 block font-medium uppercase mb-1">Issued By</span>
                  <span className="font-semibold text-slate-800 block text-sm">{bill.hospital?.name || 'HealthCare+ Partner Hospital'}</span>
                  <span className="text-slate-500">{new Date(bill.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium uppercase mb-1">Billed To</span>
                  <span className="font-semibold text-slate-800 block text-sm">{bill.patient?.fullName || 'Patient'}</span>
                  <span className="text-slate-500">{bill.patient?.email}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">Itemization</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                        <th className="p-3">Description</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {bill.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="p-3 font-medium text-slate-900">{item.description}</td>
                          <td className="p-3 text-center">{item.quantity}</td>
                          <td className="p-3 text-right">₹{Number(item.unitPrice).toFixed(2)}</td>
                          <td className="p-3 text-right font-semibold text-slate-900">₹{Number(item.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{Number(bill.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-₹{Number(bill.discount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm text-slate-900">
                  <span>Total Amount Paid</span>
                  <span className="text-cyan-700">₹{Number(bill.total).toFixed(2)}</span>
                </div>
              </div>

              {/* Transaction Ref */}
              {bill.payments?.[0] && (
                <div className="text-[11px] text-slate-400 font-mono space-y-0.5 border-t border-slate-100 pt-3">
                  <div>Razorpay Order: {bill.payments[0].razorpayOrderId}</div>
                  {bill.payments[0].razorpayPaymentId && (
                    <div>Payment ID: {bill.payments[0].razorpayPaymentId}</div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-900 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
