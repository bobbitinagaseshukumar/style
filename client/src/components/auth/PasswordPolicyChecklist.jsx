import React from 'react';
import { FiCheck, FiShield } from 'react-icons/fi';

/**
 * Validates a password against dynamic admin password policy
 */
export const validatePasswordPolicy = (password, policy = {}) => {
  const pwd = password || '';
  const minLen = parseInt(policy.minLength) || 6;
  const errors = [];

  const checks = {
    length: pwd.length >= minLen,
    uppercase: !policy.requireUppercase || /[A-Z]/.test(pwd),
    lowercase: !policy.requireLowercase || /[a-z]/.test(pwd),
    numbers: !policy.requireNumbers || /\d/.test(pwd),
    symbols: !policy.requireSymbols || /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    custom: {},
  };

  if (!checks.length) errors.push(`Must be at least ${minLen} characters`);
  if (policy.requireUppercase && !checks.uppercase) errors.push('Must contain at least 1 capital / uppercase letter (A-Z)');
  if (policy.requireLowercase && !checks.lowercase) errors.push('Must contain at least 1 lowercase letter (a-z)');
  if (policy.requireNumbers && !checks.numbers) errors.push('Must contain at least 1 numeric digit (0-9)');
  if (policy.requireSymbols && !checks.symbols) errors.push('Must contain at least 1 special character (!@#$%^&*)');

  if (Array.isArray(policy.customRules)) {
    policy.customRules.filter(r => r && r.enabled).forEach(rule => {
      let passed = true;
      if (rule.pattern) {
        try {
          passed = new RegExp(rule.pattern).test(pwd);
        } catch (e) {
          passed = true;
        }
      }
      checks.custom[rule.id || rule.name] = passed;
      if (!passed) {
        errors.push(rule.message || rule.name || 'Does not meet custom password requirement');
      }
    });
  }

  const isValid = errors.length === 0;
  return { isValid, errors, checks };
};

/**
 * Visual Checklist Component rendered below password input
 */
const PasswordPolicyChecklist = ({ password = '', policy = {}, isDark = false }) => {
  const { checks } = validatePasswordPolicy(password, policy);
  const minLen = parseInt(policy.minLength) || 6;

  return (
    <div className={`p-3 rounded-xl border text-[11px] space-y-1.5 transition-all ${
      isDark ? 'bg-black/40 border-white/10 text-gray-300' : 'bg-gray-50/90 border-gray-200 text-charcoal-800'
    }`}>
      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-amber-500 mb-1">
        <FiShield className="w-3.5 h-3.5" />
        <span>Password Requirements</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {/* Min Length */}
        <div className={`flex items-center gap-1.5 ${checks.length ? 'text-emerald-500 font-semibold' : 'text-gray-400'}`}>
          {checks.length ? <FiCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> : <span className="w-3 h-3 rounded-full border border-gray-400 inline-block shrink-0" />}
          <span>At least {minLen} characters</span>
        </div>

        {/* Uppercase / Capital */}
        {policy.requireUppercase && (
          <div className={`flex items-center gap-1.5 ${checks.uppercase ? 'text-emerald-500 font-semibold' : 'text-gray-400'}`}>
            {checks.uppercase ? <FiCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> : <span className="w-3 h-3 rounded-full border border-gray-400 inline-block shrink-0" />}
            <span>At least 1 Capital letter (A-Z)</span>
          </div>
        )}

        {/* Lowercase */}
        {policy.requireLowercase && (
          <div className={`flex items-center gap-1.5 ${checks.lowercase ? 'text-emerald-500 font-semibold' : 'text-gray-400'}`}>
            {checks.lowercase ? <FiCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> : <span className="w-3 h-3 rounded-full border border-gray-400 inline-block shrink-0" />}
            <span>At least 1 Lowercase letter (a-z)</span>
          </div>
        )}

        {/* Numbers */}
        {policy.requireNumbers && (
          <div className={`flex items-center gap-1.5 ${checks.numbers ? 'text-emerald-500 font-semibold' : 'text-gray-400'}`}>
            {checks.numbers ? <FiCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> : <span className="w-3 h-3 rounded-full border border-gray-400 inline-block shrink-0" />}
            <span>At least 1 Number (0-9)</span>
          </div>
        )}

        {/* Symbols */}
        {policy.requireSymbols && (
          <div className={`flex items-center gap-1.5 ${checks.symbols ? 'text-emerald-500 font-semibold' : 'text-gray-400'}`}>
            {checks.symbols ? <FiCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> : <span className="w-3 h-3 rounded-full border border-gray-400 inline-block shrink-0" />}
            <span>At least 1 Special symbol (!@#$)</span>
          </div>
        )}

        {/* Custom Rules */}
        {Array.isArray(policy.customRules) && policy.customRules.filter(r => r && r.enabled).map((rule) => {
          const passed = checks.custom[rule.id || rule.name];
          return (
            <div key={rule.id || rule.name} className={`flex items-center gap-1.5 ${passed ? 'text-emerald-500 font-semibold' : 'text-gray-400'}`}>
              {passed ? <FiCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" /> : <span className="w-3 h-3 rounded-full border border-gray-400 inline-block shrink-0" />}
              <span>{rule.message || rule.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordPolicyChecklist;
