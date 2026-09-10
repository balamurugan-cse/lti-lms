import React, { useState, useEffect } from 'react';
import { useLMS } from '../../context/LMSContext';
import { api } from '../../services/api';
import { LTILogo } from '../common/LTILogo';
import {
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  Terminal,
} from 'lucide-react';

interface AdminLoginPageProps {
  onNavigate: (path: string) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onNavigate }) => {
  const { loginAdmin } = useLMS();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mismatchPortal, setMismatchPortal] = useState<string | null>(null);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);

  useEffect(() => {
    // Check if initial admin bootstrap is required
    api.checkBootstrapStatus()
      .then((status) => {
        if (status.needsBootstrap) {
          setNeedsBootstrap(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setMismatchPortal(null);
    setLoading(true);

    try {
      await loginAdmin(email, password);
      onNavigate('/admin-portal');
    } catch (err: any) {
      setErrorMessage(err.message || 'Administrative authentication failed.');
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
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

          {/* Logo & Portal Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <LTILogo size="md" showTagline={false} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono font-semibold mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Root Administration Console
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Administrative Sign In
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Restricted to authorized system directors and DevSecOps personnel.
            </p>
          </div>

          {/* First-time Admin Notice */}
          {needsBootstrap && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-200">
                <Terminal className="w-4 h-4 text-amber-400" />
                First-Time Bootstrap Required
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                The production database is empty. No default admin accounts exist. You can run <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400 font-mono">npm run create-admin</code> via CLI or provision the root administrator now.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('/admin/setup')}
                className="mt-1 w-full py-2 px-3 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-amber-300 transition-colors"
              >
                Launch Root Admin Setup Wizard →
              </button>
            </div>
          )}

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
                    Go to {mismatchPortal === '/student/login' ? 'Student Portal' : 'Instructor Portal'} →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="admin-login-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@institution.edu"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-slate-300">
                  Password
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Argon2id / bcrypt Verified
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="admin-login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
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

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-60"
            >
              {loading ? (
                <span>Verifying Privileged Session...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Authenticate to Root Console</span>
                </>
              )}
            </button>
          </form>

          {/* First time setup option */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <button
              onClick={() => onNavigate('/admin/setup')}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center justify-center gap-1.5 mx-auto"
            >
              <Terminal className="w-3.5 h-3.5" />
              First-Time Administrator Setup Wizard
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>Strict RBAC • Zero Trust Architecture • IP Audit Logged</span>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
            <button
              onClick={() => onNavigate('/student/login')}
              className="hover:text-amber-400 transition-colors"
            >
              Student Portal
            </button>
            <span>•</span>
            <button
              onClick={() => onNavigate('/instructor/login')}
              className="hover:text-amber-400 transition-colors"
            >
              Faculty Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
