/**
 * components/common/Button.jsx — Reusable button component.
 *
 * Props:
 *   variant  — 'primary' | 'secondary' | 'danger' | 'ghost' (default: 'primary')
 *   size     — 'sm' | 'md' | 'lg' (default: 'md')
 *   loading  — Boolean: shows spinner and disables (default: false)
 *   disabled — Boolean
 *   type     — 'button' | 'submit' | 'reset' (default: 'button')
 *   ...rest  — Any other button props (onClick, id, etc.)
 */

import Loader from './Loader';

const variants = {
  primary:   'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
  danger:    'bg-red-600 hover:bg-red-700 text-white border-transparent',
  ghost:     'bg-transparent hover:bg-gray-100 text-gray-600 border-transparent',
};

const sizes = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-6 py-3',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  children,
  className = '',
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg border',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading && <Loader size="sm" />}
      {children}
    </button>
  );
};

export default Button;
