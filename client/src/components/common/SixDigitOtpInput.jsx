import React, { useRef } from 'react';

/**
 * SixDigitOtpInput — 6 individual digit box inputs for professional OTP verification.
 * Features:
 * - 6 separate digit boxes
 * - High-contrast text for dark/light themes
 * - Auto-advance focus to next box
 * - Backspace backward navigation
 * - Full 6-digit paste support
 * - Numeric keyboard triggers for mobile
 * - NO "123456" placeholder text
 */
const SixDigitOtpInput = ({ value = '', onChange, disabled = false }) => {
  const inputsRef = useRef([]);

  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      onChange(nextDigits.join(''));
      return;
    }

    if (val.length > 1) {
      const pasted = val.slice(0, 6);
      onChange(pasted);
      const nextIndex = Math.min(pasted.length, 5);
      inputsRef.current[nextIndex]?.focus();
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = val.slice(-1);
    const newOtp = nextDigits.join('');
    onChange(newOtp);

    if (index < 5 && val) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedData) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, 5);
      inputsRef.current[nextIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 my-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          disabled={disabled}
          value={digits[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-extrabold font-mono rounded-xl border-2 transition-all outline-none text-gray-900 bg-white shadow-sm ${
            digits[index]
              ? 'border-amber-500 bg-amber-50/40 text-black font-black ring-2 ring-amber-400/30 scale-[1.02]'
              : 'border-gray-300 hover:border-amber-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30'
          }`}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
};

export default SixDigitOtpInput;
