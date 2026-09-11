import React, { useState, useEffect } from 'react';
import { useLMS } from '../../context/LMSContext';
import { api } from '../../services/api';
import { LTILogo } from '../common/LTILogo';
import { EmailOutboxModal } from './EmailOutboxModal';
import {
  GraduationCap,
  Award,
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Zap,
  KeyRound,
  ShieldCheck,
  RotateCw,
  Inbox,
  BookOpen,
  Activity,
  Check,
  Globe,
  Terminal,
} from 'lucide-react';

export type AuthRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
type AuthMode = 'PASSWORD' | 'EMAIL_CODE';

interface UnifiedAuthCardProps {
  initialRole?: AuthRole;
  onNavigate: (path: string) => void;
}

export const UnifiedAuthCard: React.FC<UnifiedAuthCardProps> = ({
  initialRole = 'STUDENT',
  onNavigate,
}) => {
  const {
    loginStudent,
    loginInstructor,
    loginAdmin,
    registerStudent,
    registerInstructor,
    loginWithEmailCode,
    googleSignIn,
  } = useLMS();

  // Role state
  const [role, setRole] = useState<AuthRole>(initialRole);
  const [mode, setMode] = useState<AuthMode>('PASSWORD');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [requireMfa, setRequireMfa] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);

  // Email code mode states
  const [emailCode, setEmailCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeMessage, setCodeMessage] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  // UI status states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notRegisteredEmail, setNotRegisteredEmail] = useState<string | null>(null);
  const [mismatchPortal, setMismatchPortal] = useState<string | null>(null);
  const [mismatchRole, setMismatchRole] = useState<string | null>(null);
  const [needsVerificationEmail, setNeedsVerificationEmail] = useState<string | null>(null);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);

  // Outbox modal state
  const [showOutbox, setShowOutbox] = useState(false);

  // Load remembered email or bootstrap status
  useEffect(() => {
    const saved = localStorage.getItem(`lti_remembered_email_${role}`);
    if (saved) {
      setEmail(saved);
    } else {
      const globalSaved = localStorage.getItem('lti_last_email');
      if (globalSaved) setEmail(globalSaved);
    }

    if (role === 'ADMIN') {
      api.checkBootstrapStatus()
        .then((status) => {
          if (status.needsBootstrap) setNeedsBootstrap(true);
        })
        .catch(() => {});
    }
  }, [role]);

  // Handle caps lock check
  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const handlePasswordKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  // Submit Password Login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setNotRegisteredEmail(null);
    setMismatchPortal(null);
    setNeedsVerificationEmail(null);
    setLoading(true);

    if (rememberMe && email) {
      localStorage.setItem(`lti_remembered_email_${role}`, email);
      localStorage.setItem('lti_last_email', email);
    }

    try {
      let result: any;
      if (role === 'ADMIN') {
        result = await loginAdmin(email, password, requireMfa ? mfaCode.trim() : undefined);
      } else if (role === 'INSTRUCTOR') {
        result = await loginInstructor(email, password);
      } else {
        result = await loginStudent(email, password);
      }

      if (result?.mfaRequired) {
        setRequireMfa(true);
        setErrorMessage(null);
        setSuccessMessage('Please enter your 6-digit Authenticator MFA code to proceed.');
        return;
      }

      if (result?.verificationRequired) {
        localStorage.setItem('lti_pending_verify_email', email);
        if (result.previewCode) {
          localStorage.setItem('lti_last_preview_code', result.previewCode);
        }
        onNavigate(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      // Dynamically and seamlessly route based on the verified user role
      const userRole = result?.user?.role;
      if (userRole === 'INSTRUCTOR') {
        onNavigate('/instructor/portal');
      } else if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        onNavigate('/admin/portal');
      } else {
        onNavigate('/dashboard');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Authentication failed.';
      setErrorMessage(errMsg);

      if (err.data?.notRegistered) {
        setNotRegisteredEmail(err.data.email || email);
      }

      if (err.data?.verificationRequired || errMsg.toLowerCase().includes('verification')) {
        setNeedsVerificationEmail(email);
        localStorage.setItem('lti_pending_verify_email', email);
        if (err.data?.previewCode) {
          localStorage.setItem('lti_last_preview_code', err.data.previewCode);
          setPreviewCode(err.data.previewCode);
        }
      }

      if (err.data?.correctPortal) {
        setMismatchPortal(err.data.correctPortal);
        setMismatchRole(err.data.accountRole || null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Google 1-Tap Sign-In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn({
        email: email.includes('@gmail.com') ? email : 'palanibalamurugan818@gmail.com',
        name: 'Prof. Palani Balamurugan',
        role: role === 'STUDENT' ? 'STUDENT' : (role === 'ADMIN' ? 'ADMIN' : 'INSTRUCTOR'),
      });
      const target = res.user?.role === 'INSTRUCTOR' ? '/instructor/portal' : (res.user?.role === 'ADMIN' ? '/admin/portal' : '/dashboard');
      onNavigate(target);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Express 1-Click Registration when email not found
  const handleExpressRegister = async (registerAsRole: 'STUDENT' | 'INSTRUCTOR') => {
    if (!email || !password) {
      setErrorMessage('Please provide an email and a password.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    const nameGuess = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    try {
      if (registerAsRole === 'INSTRUCTOR') {
        await registerInstructor({
          name: nameGuess,
          email,
          password: password || 'Password123!',
          department: 'Information Technology',
          specialization: 'Software Engineering',
        });
        setSuccessMessage('Faculty account registered! Entering portal...');
        setTimeout(() => onNavigate('/instructor/portal'), 600);
      } else {
        const res = await registerStudent({
          name: nameGuess,
          email,
          password: password || 'Password123!',
          gradeLevel: 'Undergraduate',
        });
        if (res?.verificationRequired) {
          localStorage.setItem('lti_pending_verify_email', email);
          if (res.previewCode) localStorage.setItem('lti_last_preview_code', res.previewCode);
          onNavigate(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        setSuccessMessage('Student account registered! Entering dashboard...');
        setTimeout(() => onNavigate('/dashboard'), 600);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Send 6-Digit Email Code
  const handleRequestEmailCode = async () => {
    if (!email) {
      setErrorMessage('Please enter your email address first.');
      return;
    }
    setSendingCode(true);
    setErrorMessage(null);
    setCodeMessage(null);

    try {
      const res = await api.requestEmailCode(email);
      setCodeSent(true);
      setCodeMessage(res.message);
      if (res.previewCode) {
        setPreviewCode(res.previewCode);
        setEmailCode(res.previewCode);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch verification code.');
    } finally {
      setSendingCode(false);
    }
  };

  // Submit 6-Digit Email Code Login
  const handleEmailCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !emailCode) {
      setErrorMessage('Please enter both email and the 6-digit access code.');
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginWithEmailCode(email, emailCode);
      setSuccessMessage('Access code verified! Redirecting...');
      const target = res.user?.role === 'INSTRUCTOR' ? '/instructor/portal' : (res.user?.role === 'ADMIN' ? '/admin/portal' : '/dashboard');
      setTimeout(() => onNavigate(target), 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  // Theme configuration
  const roleConfig = {
    STUDENT: {
      label: 'Student Learning Portal',
      icon: GraduationCap,
      accentBg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      glowColor: 'from-amber-400 via-amber-500 to-sky-500',
      buttonBg: 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20',
      subtitle: 'Access syllabus modules, hands-on lab projects, and assessment feedback.',
      submitLabel: 'Sign In as Student',
    },
    INSTRUCTOR: {
      label: 'Faculty & Instructor Portal',
      icon: Award,
      accentBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      glowColor: 'from-emerald-400 via-amber-400 to-emerald-600',
      buttonBg: 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-400/20',
      subtitle: 'Course authoring, automated code evaluation, and cohort performance telemetry.',
      submitLabel: 'Sign In as Faculty',
    },
    ADMIN: {
      label: 'Root Administration Console',
      icon: ShieldAlert,
      accentBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      glowColor: 'from-rose-500 via-amber-500 to-rose-600',
      buttonBg: 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20',
      subtitle: 'Enterprise audit controls, credential rotation, and multi-tenant management.',
      submitLabel: 'Authenticate as Root Admin',
    },
  }[role];

  const CurrentRoleIcon = roleConfig.icon;

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-5xl">
        {/* RESPONSIVE DUAL-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* LEFT COLUMN: INSTITUTIONAL BRANDING & LIVE TELEMETRY (Hidden on small mobile if desired, or compact) */}
          <div className="lg:col-span-5 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500" />
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-3 mb-6">
                <LTILogo size="md" showTagline={false} />
              </div>

              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Cloud LMS Cluster Active</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                  Enterprise-Grade Learning Platform
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Engineered with strict zero-trust authentication, automated syllabus delivery, and accredited evaluation pipelines.
                </p>
              </div>

              {/* Institution Key Metrics */}
              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Full-Stack Curriculum</div>
                    <div className="text-[11px] text-slate-400">Computer Science, Cloud & Distributed Systems</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                  <div className="w-9 h-9 rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Cryptographic Security</div>
                    <div className="text-[11px] text-slate-400">Argon2 Password Hashes • Rotating Bearer JWTs</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                  <div className="w-9 h-9 rounded-xl bg-sky-400/10 flex items-center justify-center text-sky-400 flex-shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Real-Time Evaluation</div>
                    <div className="text-[11px] text-slate-400">Instant quiz grading & code verification</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status Pill */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-mono text-[11px]">Region: asia-southeast1</span>
              </div>
              <button
                type="button"
                onClick={() => setShowOutbox(true)}
                className="text-amber-400 hover:text-amber-300 underline text-xs font-medium inline-flex items-center gap-1"
              >
                <Inbox className="w-3 h-3" /> Test Outbox
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: MAIN AUTHENTICATION INTERFACE */}
          <div className="lg:col-span-7 rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${roleConfig.glowColor}`} />

            <div>
              {/* Header with Title and Current Role Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tight">
                    Sign In
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {roleConfig.subtitle}
                  </p>
                </div>
                <div className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold transition-all ${roleConfig.accentBg}`}>
                  <CurrentRoleIcon className="w-3.5 h-3.5" />
                  <span>{roleConfig.label.split(' ')[0]}</span>
                </div>
              </div>

              {/* 1. ROLE SWITCHER TABS */}
              <div className="mb-5 p-1 bg-slate-950 rounded-2xl border border-slate-800 grid grid-cols-3 gap-1">
                <button
                  id="auth-role-tab-student"
                  type="button"
                  onClick={() => {
                    setRole('STUDENT');
                    setErrorMessage(null);
                    setMismatchPortal(null);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    role === 'STUDENT'
                      ? 'bg-slate-800 text-amber-400 shadow-md border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student</span>
                </button>

                <button
                  id="auth-role-tab-instructor"
                  type="button"
                  onClick={() => {
                    setRole('INSTRUCTOR');
                    setErrorMessage(null);
                    setMismatchPortal(null);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    role === 'INSTRUCTOR'
                      ? 'bg-slate-800 text-emerald-400 shadow-md border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Faculty</span>
                </button>

                <button
                  id="auth-role-tab-admin"
                  type="button"
                  onClick={() => {
                    setRole('ADMIN');
                    setErrorMessage(null);
                    setMismatchPortal(null);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    role === 'ADMIN'
                      ? 'bg-slate-800 text-rose-400 shadow-md border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              </div>

              {/* 2. GOOGLE 1-TAP / SSO BUTTON */}
              <div className="mb-5">
                <button
                  type="button"
                  id="google-sso-login-btn"
                  disabled={googleLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 text-slate-200 text-xs font-bold flex items-center justify-center gap-3 shadow-md transition-all group relative overflow-hidden"
                >
                  {/* Google SVG Icon */}
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {googleLoading ? 'Connecting to Google SSO...' : 'Continue with Google (Palani Balamurugan)'}
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono font-semibold">
                    1-Tap
                  </span>
                </button>
              </div>

              {/* OR DIVIDER */}
              <div className="relative flex py-2 items-center mb-5">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-slate-500 text-[11px] font-mono uppercase tracking-wider">
                  Or continue with credentials
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* 3. AUTH MODE TOGGLE: PASSWORD VS EMAIL CODE */}
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMode('PASSWORD')}
                    className={`text-xs font-bold transition-colors pb-1 border-b-2 ${
                      mode === 'PASSWORD'
                        ? 'text-white border-amber-400'
                        : 'text-slate-400 border-transparent hover:text-slate-300'
                    }`}
                  >
                    Password Sign-In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('EMAIL_CODE')}
                    className={`text-xs font-bold transition-colors pb-1 border-b-2 flex items-center gap-1.5 ${
                      mode === 'EMAIL_CODE'
                        ? 'text-white border-amber-400'
                        : 'text-slate-400 border-transparent hover:text-slate-300'
                    }`}
                  >
                    <span>6-Digit Access Code</span>
                    <span className="text-[9px] px-1 rounded bg-amber-400/20 text-amber-300 font-normal">Passwordless</span>
                  </button>
                </div>
              </div>

              {/* 5. SUCCESS / ERROR / ASSISTANCE BANNERS */}
              {needsBootstrap && role === 'ADMIN' && (
                <div className="mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-200">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    First-Time Root Admin Setup Required
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    No administrator has been initialized yet. Launch the setup wizard to provision credentials.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('/admin/setup')}
                    className="w-full py-2 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors"
                  >
                    Launch Root Admin Setup Wizard →
                  </button>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs space-y-2.5 animate-fadeIn">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1 text-rose-200">
                      <p className="font-semibold">{errorMessage}</p>
                    </div>
                  </div>

                  {/* SMART RECOVERY 1: ACCOUNT NOT REGISTERED */}
                  {notRegisteredEmail && (
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-700 space-y-2">
                      <p className="text-[11px] text-slate-300 font-medium">
                        Instant 1-Click Provisioning for <span className="font-mono text-amber-300">{notRegisteredEmail}</span>:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleExpressRegister(role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT')}
                          className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Register & Sign In as {role === 'INSTRUCTOR' ? 'Faculty' : 'Student'}
                        </button>
                        {role === 'STUDENT' && (
                          <button
                            type="button"
                            onClick={() => handleExpressRegister('INSTRUCTOR')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors"
                          >
                            Register as Faculty
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SMART RECOVERY 2: PORTAL MISMATCH */}
                  {mismatchPortal && (
                    <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
                      <span className="text-[11px] text-slate-300">Account belongs to {mismatchRole || 'another'} portal.</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (mismatchPortal.includes('instructor')) setRole('INSTRUCTOR');
                          else if (mismatchPortal.includes('admin')) setRole('ADMIN');
                          else setRole('STUDENT');
                          setErrorMessage(null);
                          setMismatchPortal(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors"
                      >
                        Switch to {mismatchPortal.includes('instructor') ? 'Faculty' : 'Student'} Tab →
                      </button>
                    </div>
                  )}

                  {/* SMART RECOVERY 3: VERIFICATION REQUIRED */}
                  {needsVerificationEmail && (
                    <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
                      <span className="text-[11px] text-slate-300">Email verification required</span>
                      <button
                        type="button"
                        onClick={() => onNavigate(`/verify-email?email=${encodeURIComponent(needsVerificationEmail)}`)}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors"
                      >
                        Enter 6-Digit Code →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 6. FORM FIELDS */}
              {mode === 'PASSWORD' ? (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="auth-unified-email-input"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@ltitech.edu"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-mono text-slate-300 flex items-center gap-2">
                        <span>Password</span>
                        {capsLockActive && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-sans font-bold animate-pulse">
                            Caps Lock is ON
                          </span>
                        )}
                      </label>
                      <button
                        type="button"
                        onClick={() => onNavigate('/forgot-password')}
                        className="text-[11px] text-amber-400 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        id="auth-unified-password-input"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onKeyDown={handlePasswordKeyDown}
                        onKeyUp={handlePasswordKeyUp}
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

                  {/* MFA Code if 2FA active */}
                  {requireMfa && (
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2 animate-fadeIn">
                      <label className="block text-xs font-mono text-amber-300">
                        6-Digit Authenticator MFA Code
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                        <input
                          type="text"
                          maxLength={8}
                          value={mfaCode}
                          onChange={(e) => setMfaCode(e.target.value)}
                          placeholder="123456"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-amber-400 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span>Remember my email</span>
                    </label>
                    <span className="text-[11px] text-slate-500">256-bit TLS Encrypted</span>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="auth-unified-submit-btn"
                    type="submit"
                    disabled={loading}
                    className={`w-full mt-2 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-60 ${roleConfig.buttonBg}`}
                  >
                    {loading ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>{roleConfig.submitLabel}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* PASSWORDLESS 6-DIGIT EMAIL CODE FORM */
                <form onSubmit={handleEmailCodeSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={sendingCode || !email}
                        onClick={handleRequestEmailCode}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs border border-slate-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 whitespace-nowrap"
                      >
                        {sendingCode ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        <span>{codeSent ? 'Resend' : 'Send Code'}</span>
                      </button>
                    </div>
                  </div>

                  {codeSent && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs">
                        <p className="font-semibold">{codeMessage}</p>
                        {previewCode && (
                          <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                            <span className="text-slate-400 text-[11px]">Development Code:</span>
                            <span className="font-mono text-amber-400 font-bold tracking-widest">{previewCode}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-slate-300 mb-1.5">
                          6-Digit Access Code
                        </label>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            maxLength={6}
                            required
                            value={emailCode}
                            onChange={(e) => setEmailCode(e.target.value)}
                            placeholder="••••••"
                            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-mono tracking-widest focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                      >
                        {loading ? (
                          <>
                            <RotateCw className="w-4 h-4 animate-spin" />
                            <span>Verifying Code...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In with 6-Digit Code</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* 7. REGISTRATION & SHORTCUTS FOOTER */}
            <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-400">
                Need an account?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate(role === 'INSTRUCTOR' ? '/instructor/register' : '/student/register')}
                  className="text-amber-400 hover:underline font-bold"
                >
                  Register as {role === 'INSTRUCTOR' ? 'Faculty' : 'Student'} →
                </button>
              </p>
              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
                <button
                  type="button"
                  onClick={() => onNavigate('/courses')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Browse Courses
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => onNavigate('/verify-email')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Verify Email
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setShowOutbox(true)}
                  className="text-sky-400 hover:underline"
                >
                  Email Outbox
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Outbox Modal for live testing of verification codes */}
      <EmailOutboxModal
        isOpen={showOutbox}
        onClose={() => setShowOutbox(false)}
        onSelectCode={(code, outboxEmail) => {
          setEmail(outboxEmail);
          setEmailCode(code);
          setMode('EMAIL_CODE');
          setCodeSent(true);
          setShowOutbox(false);
        }}
      />
    </div>
  );
};
