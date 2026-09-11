import React, { useState, useEffect } from 'react';
import { LTILogo } from '../common/LTILogo';
import { api } from '../../services/api';
import {
  KeyRound,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (path: string) => void;
  initialStep?: 'REQUEST' | 'RESET';
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onNavigate,
  initialStep = 'REQUEST',
}) => {
  const getParam = (key: string) => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get(key) || '';
    } catch {
      return '';
    }
  };

  const [step, setStep] = useState<'REQUEST' | 'RESET'>(() => {
    const codeParam = getParam('code');
    return codeParam || initialStep === 'RESET' ? 'RESET' : 'REQUEST';
  });

  const [email, setEmail] = useState<string>(() => getParam('email') || '');
  const [code, setCode] = useState<string>(() => getParam('code') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await api.forgotPassword(email.trim());
      setSuccessMessage(res.message || 'If an account exists, a 6-digit password reset code was sent.');
      if (res.previewCode) {
        setSimulatedCode(res.previewCode);
        setCode(res.previewCode);
      }
      setStep('RESET');
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to process reset request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Email address is required.');
      return;
    }

    if (!code.trim() || code.trim().length !== 6) {
      setErrorMessage('Please enter a valid 6-digit reset code.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.resetPassword({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });

      setSuccessMessage(res.message || 'Password successfully updated! Redirecting to sign in...');
      setTimeout(() => {
        onNavigate('/student/login');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password. Verify the 6-digit code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-400 via-amber-400 to-amber-500" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <LTILogo size="md" showTagline={false} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono font-semibold mb-3">
              <KeyRound className="w-3.5 h-3.5" />
              Account Security & Recovery
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {step === 'REQUEST' ? 'Reset Your Password' : 'Set New Password'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              {step === 'REQUEST'
                ? 'Enter your institutional email address and we will send you a 6-digit security code.'
                : 'Enter the 6-digit reset code dispatched to your email and your new password.'}
            </p>
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

          {/* Simulation Pill */}
          {simulatedCode && step === 'RESET' && (
            <div className="mb-6 p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs text-amber-300 flex items-center justify-between gap-3">
              <span className="text-[11px]">
                Dispatched Code: <strong className="font-mono text-white">{simulatedCode}</strong>
              </span>
              <button
                type="button"
                onClick={() => setCode(simulatedCode)}
                className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold text-[10px]"
              >
                Insert Code
              </button>
            </div>
          )}

          {step === 'REQUEST' ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Institutional Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/10 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span>Sending Security Code...</span>
                ) : (
                  <>
                    <span>Send 6-Digit Reset Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono text-slate-300">
                    6-Digit Security Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep('REQUEST')}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCw className="w-3 h-3" /> Resend Code
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  New Password (min 8 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/10 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span>Updating Password...</span>
                ) : (
                  <>
                    <span>Confirm & Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => onNavigate('/student/login')}
              className="text-xs text-slate-400 hover:text-white"
            >
              ← Back to Student Sign In
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Single-use 15-minute token security</span>
        </div>
      </div>
    </div>
  );
};
