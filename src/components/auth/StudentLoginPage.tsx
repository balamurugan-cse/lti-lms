import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { LTILogo } from '../common/LTILogo';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

interface StudentLoginPageProps {
  onNavigate: (path: string) => void;
}

export const StudentLoginPage: React.FC<StudentLoginPageProps> = ({ onNavigate }) => {
  const { loginStudent } = useLMS();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mismatchPortal, setMismatchPortal] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setMismatchPortal(null);
    setLoading(true);

    try {
      await loginStudent(email, password);
      onNavigate('/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed.');
      if (err.data?.correctPortal) {
        setMismatchPortal(err.data.correctPortal);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Portal Branding Card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

          {/* Logo & Portal Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <LTILogo size="md" showTagline={false} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs font-mono font-semibold mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              Student Learning Portal
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Sign In to Your Account
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Access your enrolled courses, syllabus modules, and assessments.
            </p>
          </div>

          {/* Quick Notice for New Users */}
          <div className="mb-6 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">First time here?</span>
            <button
              type="button"
              onClick={() => onNavigate('/student/register')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 underline"
            >
              Create your Student Account →
            </button>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">{errorMessage}</p>
                {mismatchPortal && (
                  <button
                    type="button"
                    onClick={() => onNavigate(mismatchPortal)}
                    className="mt-2 text-amber-400 underline font-bold block"
                  >
                    Go to {mismatchPortal === '/instructor/login' ? 'Instructor Portal' : 'Admin Portal'} →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="student-login-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset link will be sent to your registered institutional email.')}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="student-login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="student-login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/10 transition-all disabled:opacity-60"
            >
              {loading ? (
                <span>Authenticating with Backend...</span>
              ) : (
                <>
                  <span>Sign In as Student</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              New to LTI Tech LMS?{' '}
              <button
                id="student-goto-register-btn"
                onClick={() => onNavigate('/student/register')}
                className="text-amber-400 hover:underline font-bold"
              >
                Create Student Account
              </button>
            </p>
          </div>
        </div>

        {/* Security & Alternate Portal Disclaimers */}
        <div className="mt-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Encrypted Session • Rate-Limited Authentication</span>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
            <button
              onClick={() => onNavigate('/instructor/login')}
              className="hover:text-amber-400 transition-colors"
            >
              Faculty / Instructor Login
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigate('/admin/login')}
              className="hover:text-amber-400 transition-colors"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
