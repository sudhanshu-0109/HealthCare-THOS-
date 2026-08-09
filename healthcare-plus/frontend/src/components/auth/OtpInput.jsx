/**
 * components/auth/OtpInput.jsx — Professional 6-digit OTP code input component.
 *
 * Supports auto-focus transition, pasting 6-digit codes, and keyboard navigation.
 */

import { useRef, useEffect } from 'react';

const OtpInput = ({ value = '', onChange, disabled = false, error = false }) => {
  const inputRefs = useRef([]);

  // Ensure digits array is always length 6
  const digits = (value + '      ').slice(0, 6).split('');

  useEffect(() => {
    // Focus first input on mount if empty
    if (!value && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, e) => {
    const val = e.target.value;
    if (disabled) return;

    // Handle single character typed
    const lastChar = val.substring(val.length - 1);
    if (!/^\d*$/.test(lastChar)) return;

    const newDigits = [...digits];
    newDigits[index] = lastChar;
    const newCombined = newDigits.join('').trim();

    onChange(newCombined);

    // Auto-advance to next box if digit entered
    if (lastChar && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        // Move back if current box is already empty
        inputRefs.current[index - 1].focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    if (disabled) return;

    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const targetIndex = Math.min(pasted.length, 5);
      if (inputRefs.current[targetIndex]) {
        inputRefs.current[targetIndex].focus();
      }
    }
  };

  return (
    <div className="flex justify-between items-center gap-2 sm:gap-3 my-4">
      {[0, 1, 2, 3, 4, 5].map((idx) => (
        <input
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          disabled={disabled}
          value={digits[idx] === ' ' ? '' : digits[idx]}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className={[
            'w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-bold font-mono rounded-xl border transition',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm',
            error
              ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500'
              : 'border-gray-300 bg-white text-gray-900',
            disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : '',
          ].join(' ')}
          aria-label={`Digit ${idx + 1} of 6`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
