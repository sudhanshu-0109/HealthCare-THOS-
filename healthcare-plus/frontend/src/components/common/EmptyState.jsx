/**
 * components/common/EmptyState.jsx — Empty state display component.
 *
 * Props:
 *   icon      — Emoji or React node (default: '📭')
 *   title     — Main heading
 *   message   — Descriptive text
 *   action    — Optional: { label: string, onClick: fn } or { label: string, to: string }
 */

import { Link } from 'react-router-dom';

const EmptyState = ({
  icon = '📭',
  title = 'Nothing here yet',
  message = '',
  action = null,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {message && (
        <p className="text-sm text-gray-500 max-w-sm mb-6">{message}</p>
      )}
      {action && (
        action.to ? (
          <Link
            to={action.to}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {action.label}
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
};

export default EmptyState;
