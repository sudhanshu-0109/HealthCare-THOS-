/**
 * components/common/ConfirmDialog.jsx — Accessible confirmation modal (Phase 16).
 *
 * Props:
 *   open     — boolean: whether the dialog is visible
 *   title    — string: dialog heading (default: 'Are you sure?')
 *   message  — string | ReactNode: descriptive body text
 *   confirmLabel — string: confirm button text (default: 'Confirm')
 *   cancelLabel  — string: cancel button text (default: 'Cancel')
 *   variant  — 'danger' | 'warning' | 'info' (default: 'danger')
 *   onConfirm — fn: called on confirm
 *   onCancel  — fn: called on cancel or backdrop click
 *   loading  — boolean: disable buttons while async action in progress
 */

import { useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, X } from 'lucide-react';

const VARIANT_META = {
  danger:  { icon: AlertTriangle, iconCls: 'text-red-500',    btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500' },
  warning: { icon: AlertTriangle, iconCls: 'text-amber-500',  btn: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400' },
  info:    { icon: Info,          iconCls: 'text-blue-500',   btn: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' },
  success: { icon: CheckCircle,   iconCls: 'text-emerald-500', btn: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' },
};

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) {
  const meta = VARIANT_META[variant] || VARIANT_META.danger;
  const Icon = meta.icon;

  // Trap focus and handle Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', handler);
    // Prevent background scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      id="confirm-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={!loading ? onCancel : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
        {/* Close button */}
        <button
          id="confirm-dialog-close-btn"
          onClick={onCancel}
          disabled={loading}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-6 pt-5">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${meta.iconCls}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                id="confirm-dialog-title"
                className="font-semibold text-slate-900 text-base leading-tight"
              >
                {title}
              </h2>
              {message && (
                <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex gap-3 justify-end">
          <button
            id="confirm-dialog-cancel-btn"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            id="confirm-dialog-confirm-btn"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 ${meta.btn}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading…
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
