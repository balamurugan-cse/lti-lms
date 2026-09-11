import React, { useState, useEffect, useRef } from 'react';
import { useLMS } from '../../context/LMSContext';
import { LTILogo } from '../common/LTILogo';
import { api } from '../../services/api';
import {
  Mail,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Inbox,
} from 'lucide-react';

interface VerifyEmailPageProps {
  onNavigate: (path: string) => void;
  initialEmail?: string;
  initialCode?: string;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({
  onNavigate,
  initialEmail,
  initialCode,
}) => {
  const { setCurrentUser, refreshCourses } = useLMS();

  // Parse query params if available
  const getParam = (key: string) => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get(key) || '';
    } catch {
      return '';
    }
  };

  const [email, setEmail] = useState<string>(() => {
    return initialEmail || getParam('email') || localStorage.getItem('lti_pending_verify_email') || '';
  });

  const [digits, setDigits] = useState<string[]>(() => {
    const fromParam = initialCode || getParam('code') || localStorage.getItem('lti_last_preview_code') || '';
    if (fromParam && fromParam.length === 6) {
      return fromParam.split('');
    }
    return ['', '', '', '', '', ''];
  });

  const [simulatedCode, setSimulatedCode] = useState<string | null>(() => {
    return localStorage.getItem('lti_last_preview_code') || null;
  });

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Auto-verify if 6 digits are loaded from direct link query param
  useEffect(() => {
    const codeFromQuery = getParam('code');
    const emailFromQuery = getParam('email');
    if (codeFromQuery && codeFromQuery.length === 6 && emailFromQuery) {
      handleVerify(codeFromQuery, emailFromQuery);
    }
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    const numeric = val.replace(/\D/g, '');
    const newDigits = [...digits];

    if (numeric.length > 1) {
      // User pasted multi-character code
      const pasted = numeric.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();

      if (pasted.length === 6) {
        handleVerify(pasted.join(''), email);
      }
      return;
    }

    newDigits[index] = numeric;
    setDigits(newDigits);

    if (numeric && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const completeCode = newDigits.join('');
    if (completeCode.length === 6 && !newDigits.includes('')) {
      handleVerify(completeCode, email);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = ['', '', '', '', '', ''];
    pasted.split('').forEach((char, i) => {
      newDigits[i] = char;
    });
    setDigits(newDigits);

    if (pasted.length === 6) {
      handleVerify(pasted, email);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleVerify = async (codeToVerify: string, targetEmail: string) => {
    if (!targetEmail.trim()) {
      setErrorMessage('Please provide your student email address.');
      return;
    }

    if (codeToVerify.length !== 6) {
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await api.verifyEmail({
        email: targetEmail.trim(),
        code: codeToVerify,
      });

      setSuccessMessage('Email verified successfully! Activating your student workspace...');
      localStorage.removeItem('lti_pending_verify_email');
      localStorage.removeItem('lti_last_preview_code');

      if (res.user) {
        setCurrentUser(res.user);
      }
      await refreshCourses();

      setTimeout(() => {
        onNavigate('/dashboard');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed. The code may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email.trim()) {
      setErrorMessage('Please enter your email address to receive a code.');
      return;
    }

    setResending(true);
    setErrorMessage(null);

    try {
      const res = await api.resendVerificationCode(email.trim());
      setSuccessMessage(res.message || 'A new verification code has been dispatched to your email.');
      if (res.previewCode) {
        setSimulatedCode(res.previewCode);
        localStorage.setItem('lti_last_preview_code', res.previewCode);
      }
      setResendCooldown(30);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  const handleAutoFillPreview = () => {
    if (simulatedCode && simulatedCode.length === 6) {
      const arr = simulatedCode.split('');
      setDigits(arr);
      handleVerify(simulatedCode, email);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-sky-400 to-amber-500" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <LTILogo size="md" showTagline={false} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 text-xs font-mono font-semibold mb-3">
              <Mail className="w-3.5 h-3.5" />
              Student Email Verification
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Check Your Inbox
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              We sent a 6-digit security code to your email to verify your student identity.
            </p>
          </div>

          {/* Email Badge / Field */}
          <div className="mb-6 p-3 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <Inbox className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="bg-transparent text-xs text-slate-200 font-mono focus:outline-none w-full placeholder-slate-600"
              />
            </div>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider flex-shrink-0">
              Recipient
            </span>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Simulated / Test Mode Helper Pill */}
          {simulatedCode && (
            <div className="mb-6 p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs text-amber-300 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span className="text-[11px]">
                  Generated Code: <strong className="font-mono text-white tracking-wider">{simulatedCode}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoFillPreview}
                className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-bold transition-colors"
              >
                Auto-fill & Submit
              </button>
            </div>
          )}

          {/* 6-Digit Code Input Fields */}
          <div className="mb-6">
            <label className="block text-xs font-mono text-slate-300 mb-2.5 text-center">
              Enter 6-Digit Verification Code
            </label>
            <div className="flex justify-between gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  id={`verify-code-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 sm:w-13 sm:h-14 bg-slate-950 border border-slate-700/80 rounded-xl text-center text-xl font-bold font-mono text-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner"
                />
              ))}
            </div>
          </div>

          {/* Verify Button */}
          <button
            id="verify-email-submit-btn"
            type="button"
            disabled={loading || digits.join('').length !== 6}
            onClick={() => handleVerify(digits.join(''), email)}
            className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/10 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Verifying Code...</span>
            ) : (
              <>
                <span>Activate Student Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Resend Section */}
          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Didn&apos;t receive the code?</span>
            <button
              type="button"
              disabled={resending || resendCooldown > 0}
              onClick={handleResendCode}
              className="text-amber-400 hover:text-amber-300 font-bold disabled:opacity-50 disabled:hover:text-amber-400 flex items-center gap-1.5"
            >
              <RotateCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </button>
          </div>

          {/* Return Links */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => onNavigate('/student/login')}
              className="text-[11px] text-slate-500 hover:text-slate-300 underline"
            >
              ← Back to Student Sign In
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Institutional 256-bit Encrypted Verification</span>
        </div>
      </div>
    </div>
  );
};
