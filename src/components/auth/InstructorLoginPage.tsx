import React, { useState } from 'react';
import { useLMS } from '../../context/LMSContext';
import { LTILogo } from '../common/LTILogo';
import {
  BookOpen,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface InstructorLoginPageProps {
  onNavigate: (path: string) => void;
}

export const InstructorLoginPage: React.FC<InstructorLoginPageProps> = ({ onNavigate }) => {
  const { loginInstructor } = useLMS();
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
      await loginInstructor(email, password);
      onNavigate('/instructor/portal');
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
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

          <div className="text-center mb-8">
            <div className="flex justify-center mb-3">
              <LTILogo size="md" showTagline={false} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-semibold mb-2">
              <Award className="w-3.5 h-3.5" />
              Faculty & Instructor Portal
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Instructor Authentication
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Curriculum authoring, assignment grading, and student analytics.
            </p>
          </div>

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
                    Go to {mismatchPortal === '/student/login' ? 'Student Portal' : 'Admin Portal'} →
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1.5">
                Instructor Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="instructor-login-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="instructor@institution.edu"
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
                  onClick={() => alert('Faculty password resets are managed through the institutional directory.')}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Reset assistance
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="instructor-login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
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
              id="instructor-login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-60"
            >
              {loading ? (
                <span>Verifying Faculty Credentials...</span>
              ) : (
                <>
                  <span>Sign In as Instructor</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              New faculty member?{' '}
              <button
                onClick={() => onNavigate('/instructor/register')}
                className="text-amber-400 hover:underline font-bold"
              >
                Register Faculty Profile
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Faculty RBAC Restricted • Audit Logged</span>
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
              onClick={() => onNavigate('/courses')}
              className="hover:text-amber-400 transition-colors"
            >
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
