/**
 * components/auth/AuthFormError.jsx — Inline error alert for authentication forms.
 */

const AuthFormError = ({ message, onResendClick }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5 my-4"
    >
      <span className="text-base leading-none">⚠️</span>
      <div className="flex-1">
        <p className="font-medium leading-snug">{message}</p>
        {onResendClick && (
          <button
            type="button"
            onClick={onResendClick}
            className="mt-2 text-xs font-semibold text-red-800 underline hover:text-red-900 focus:outline-none"
          >
            Resend verification email →
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthFormError;
