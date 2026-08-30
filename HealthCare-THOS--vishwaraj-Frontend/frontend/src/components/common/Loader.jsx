/**
 * components/common/Loader.jsx — Spinner loading indicator.
 *
 * Props:
 *   size   — 'sm' | 'md' | 'lg' (default: 'md')
 *   label  — Optional accessible text (default: 'Loading...')
 *   full   — Boolean: fill the viewport height (default: false)
 */

const sizeMap = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
};

const Loader = ({ size = 'md', label = 'Loading...', full = false }) => {
  const spinner = (
    <div
      role="status"
      aria-label={label}
      className="flex flex-col items-center gap-3"
    >
      <div
        className={`${sizeMap[size]} rounded-full border-blue-200 border-t-blue-600 animate-spin`}
      />
      <span className="sr-only">{label}</span>
    </div>
  );

  if (full) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Loader;
