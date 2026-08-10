/**
 * components/common/EmptyState.jsx — Consistent empty state card
 */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-slate-400" />
        </div>
      )}
      <h3 className="font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}
