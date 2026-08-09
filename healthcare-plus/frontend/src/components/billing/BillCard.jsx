import React from 'react';
import { Calendar, Pill, FlaskConical, CheckCircle2, Clock, XCircle, ChevronRight, FileText } from 'lucide-react';

const SOURCE_ICONS = {
  APPOINTMENT: Calendar,
  PHARMACY_ORDER: Pill,
  LAB_REQUEST: FlaskConical,
};

const SOURCE_LABELS = {
  APPOINTMENT: 'Doctor Appointment',
  PHARMACY_ORDER: 'Pharmacy Order',
  LAB_REQUEST: 'Lab Tests',
};

const STATUS_BADGES = {
  PAID: { label: 'Paid', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  UNPAID: { label: 'Unpaid', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  CANCELLED: { label: 'Cancelled', bg: 'bg-slate-50 text-slate-600 border-slate-200', icon: XCircle },
};

export default function BillCard({ bill, onViewReceipt, onPayNow }) {
  const Icon = SOURCE_ICONS[bill.sourceType] || FileText;
  const statusInfo = STATUS_BADGES[bill.status] || STATUS_BADGES.UNPAID;
  const StatusIcon = statusInfo.icon;

  const dateStr = new Date(bill.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left: Icon & Details */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-cyan-50 rounded-xl text-cyan-600 shrink-0">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900">
                {SOURCE_LABELS[bill.sourceType] || bill.sourceType}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusInfo.bg}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {statusInfo.label}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 mt-1">
              {bill.hospital?.name || 'Healthcare+ Hospital'} • {dateStr}
            </p>

            {/* Bill items summary */}
            {bill.items && bill.items.length > 0 && (
              <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                {bill.items.slice(0, 2).map((item, i) => (
                  <div key={i} className="line-clamp-1">
                    • {item.description} ({item.quantity}x ₹{Number(item.unitPrice).toFixed(2)})
                  </div>
                ))}
                {bill.items.length > 2 && (
                  <div className="text-slate-400 font-medium">
                    +{bill.items.length - 2} more item(s)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Price & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
          <div className="text-left sm:text-right">
            <div className="text-xs text-slate-400 uppercase font-medium">Total Amount</div>
            <div className="text-lg font-bold text-slate-900">
              ₹{Number(bill.total).toFixed(2)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {bill.status === 'UNPAID' && onPayNow && (
              <button
                onClick={() => onPayNow(bill)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium text-sm rounded-lg transition-colors shadow-xs"
              >
                Pay Now
              </button>
            )}

            <button
              onClick={() => onViewReceipt(bill.id)}
              className="p-2 text-slate-600 hover:text-cyan-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="View Full Receipt"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
