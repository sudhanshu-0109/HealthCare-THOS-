/**
 * components/common/StatusBadge.jsx — Reusable status chip with color mapping
 */
const STATUS_STYLES = {
  // Appointment
  SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
  NO_SHOW: 'bg-orange-50 text-orange-600 border-orange-200',
  IN_PROGRESS: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  // Payment
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-red-50 text-red-600 border-red-200',
  REFUNDED: 'bg-purple-50 text-purple-600 border-purple-200',
  // Lab
  REQUESTED: 'bg-blue-50 text-blue-700 border-blue-200',
  PAYMENT_PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PAYMENT_COMPLETED: 'bg-teal-50 text-teal-700 border-teal-200',
  SAMPLE_PENDING: 'bg-violet-50 text-violet-700 border-violet-200',
  SAMPLE_COLLECTED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  TESTING: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  REPORT_READY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  // Pharmacy
  ORDER_RECEIVED: 'bg-blue-50 text-blue-700 border-blue-200',
  PREPARING: 'bg-amber-50 text-amber-700 border-amber-200',
  READY: 'bg-teal-50 text-teal-700 border-teal-200',
  COLLECTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  // Emergency
  SEARCHING: 'bg-amber-50 text-amber-700 border-amber-200',
  DRIVER_ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200',
  EN_ROUTE: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  ARRIVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  // Generic
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-slate-100 text-slate-500 border-slate-200',
  INVITED: 'bg-violet-50 text-violet-600 border-violet-200',
  DEACTIVATED: 'bg-red-50 text-red-600 border-red-200',
};

const STATUS_LABELS = {
  PAYMENT_PENDING: 'Payment Pending',
  PAYMENT_COMPLETED: 'Payment Done',
  SAMPLE_PENDING: 'Sample Pending',
  SAMPLE_COLLECTED: 'Sample Collected',
  REPORT_READY: 'Report Ready',
  ORDER_RECEIVED: 'Received',
  IN_PROGRESS: 'In Progress',
  DRIVER_ASSIGNED: 'Driver Found',
  EN_ROUTE: 'En Route',
  NO_SHOW: 'No Show',
};

export default function StatusBadge({ status, size = 'sm' }) {
  if (!status) return null;
  const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-500 border-slate-200';
  const label = STATUS_LABELS[status] || status.replace(/_/g, ' ');
  const sizeClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
  return (
    <span className={`inline-flex items-center rounded-full border font-medium capitalize ${style} ${sizeClass}`}>
      {label.charAt(0).toUpperCase() + label.slice(1).toLowerCase().replace(/_/g, ' ')}
    </span>
  );
}
