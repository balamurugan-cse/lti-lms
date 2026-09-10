import React, { useState, useEffect, useCallback } from 'react';
import { useLMS } from '../../context/LMSContext';
import { api } from '../../services/api';
import { Role, User } from '../../types';
import { Shield, Lock, ShieldAlert, ArrowLeft, RefreshCw, KeyRound, LogOut } from 'lucide-react';

export interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  /** Allowed roles. Defaults to ['ADMIN', 'SUPER_ADMIN'] */
  requiredRoles?: Role[];
  /** Optional granular RBAC permissions required (e.g. 'USER_MANAGE', 'SECURITY_MANAGE') */
  requiredPermissions?: string[];
  /** Custom fallback component if access is denied */
  fallback?: React.ReactNode;
}

type VerificationStatus = 'verifying' | 'authorized' | 'unauthenticated' | 'forbidden' | 'error';

/**
 * ProtectedAdminRoute
 *
 * Authoritative security wrapper that verifies the active authenticated state
 * and user role against the backend session before rendering any admin-related components.
 * Prevents unauthorized client rendering or execution of administrative logic.
 */
export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  children,
  requiredRoles = ['ADMIN', 'SUPER_ADMIN'],
  requiredPermissions = [],
  fallback,
}) => {
  const { currentUser, setCurrentUser, isLoadingAuth, navigate, logout } = useLMS();

  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [denialReason, setDenialReason] = useState<string>('');
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);

  const verifyBackendSession = useCallback(async () => {
    setIsRevalidating(true);
    setDenialReason('');

    // 1. Check if an access token exists
    const token = api.getAccessToken();
    if (!token) {
      setStatus('unauthenticated');
      setDenialReason('No active authentication token found. An administrator session is required.');
      setIsRevalidating(false);
      return;
    }

    try {
      // 2. Authoritative verification with the backend session (/api/v1/auth/me)
      const res = await api.getMe();
      const verifiedUser = res.user;

      if (!verifiedUser) {
        setStatus('unauthenticated');
        setDenialReason('Backend session validation failed. Please authenticate again.');
        setIsRevalidating(false);
        return;
      }

      // Synchronize client context with authoritative backend session user
      setSessionUser(verifiedUser);
      if (!currentUser || currentUser.id !== verifiedUser.id || currentUser.role !== verifiedUser.role) {
        setCurrentUser(verifiedUser);
      }

      // 3. Check Account Status (Active vs Suspended / Deactivated)
      if (verifiedUser.status === 'SUSPENDED') {
        setStatus('forbidden');
        setDenialReason('Your administrative account has been suspended. Please contact institutional security.');
        setIsRevalidating(false);
        return;
      }
      if (verifiedUser.status === 'DEACTIVATED') {
        setStatus('forbidden');
        setDenialReason('Your account has been permanently deactivated.');
        setIsRevalidating(false);
        return;
      }

      // 4. Authoritative User Role Check from Backend Session
      const hasRequiredRole = requiredRoles.includes(verifiedUser.role as Role);
      if (!hasRequiredRole) {
        setStatus('forbidden');
        setDenialReason(
          `Your session is authenticated as ${verifiedUser.role} (${verifiedUser.email}). Administrative console access requires verified ${requiredRoles.join(
            ' or '
          )} credentials.`
        );
        setIsRevalidating(false);
        return;
      }

      // 5. Granular RBAC Permissions Check (if required by the view)
      if (requiredPermissions.length > 0 && verifiedUser.role !== 'SUPER_ADMIN') {
        const userPerms: string[] = verifiedUser.permissions || [];
        const missingPerms = requiredPermissions.filter((p) => !userPerms.includes(p));
        if (missingPerms.length > 0) {
          setStatus('forbidden');
          setDenialReason(
            `Your administrator account lacks the following required permission clearance: ${missingPerms.join(
              ', '
            )}.`
          );
          setIsRevalidating(false);
          return;
        }
      }

      // Verified and Authorized!
      setStatus('authorized');
    } catch (err: any) {
      console.warn('Backend admin session verification error:', err);
      // Session expired, revoked or invalid
      api.clearTokens();
      setCurrentUser(null);
      setStatus('unauthenticated');
      setDenialReason(err.message || 'Session expired or revoked by security policy.');
    } finally {
      setIsRevalidating(false);
    }
  }, [currentUser, requiredRoles, requiredPermissions, setCurrentUser]);

  useEffect(() => {
    if (!isLoadingAuth) {
      verifyBackendSession();
    }
  }, [isLoadingAuth, verifyBackendSession]);

  // Case 1: Verifying backend session claims
  if (status === 'verifying' || isLoadingAuth) {
    return (
      <div
        className="py-24 text-center max-w-md mx-auto space-y-4"
        role="status"
        aria-live="polite"
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
          <Shield className="w-7 h-7 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white tracking-tight">Verifying Administrative Clearance</h3>
          <p className="text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Validating cryptographically signed backend session claims...
          </p>
        </div>
      </div>
    );
  }

  // Custom fallback if provided and not authorized
  if (fallback && status !== 'authorized') {
    return <>{fallback}</>;
  }

  // Case 2: Unauthenticated — No active session or token expired
  if (status === 'unauthenticated') {
    return (
      <div className="py-20 text-center max-w-lg mx-auto space-y-5 px-4" role="alert">
        <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded border border-amber-400/20">
            401 Unauthorized
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Privileged Authentication Required
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            {denialReason ||
              'Access to administrative consoles and security subsystems requires an active session with verified administrator credentials.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/admin/login')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Administrator Sign In
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 text-slate-300 font-semibold text-xs border border-slate-800 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Learner Dashboard
          </button>
        </div>

        <div className="pt-4 border-t border-slate-900 text-[11px] text-slate-500 font-mono">
          Security Policy: Zero-Trust Administrative Perimeter Enforced
        </div>
      </div>
    );
  }

  // Case 3: Forbidden — Authenticated with invalid role (e.g. student or instructor attempting admin access)
  if (status === 'forbidden') {
    return (
      <div className="py-20 text-center max-w-lg mx-auto space-y-5 px-4" role="alert">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400 shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span>403 Forbidden</span>
            <span>•</span>
            <span>Role Violation</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Privileged Access Restricted
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            {denialReason}
          </p>
        </div>

        {sessionUser && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-left max-w-md mx-auto">
            <div className="text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-1">
              Active Session Claims
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-200 font-medium truncate">{sessionUser.email}</span>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-800 text-amber-400 border border-slate-700">
                {sessionUser.role}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </button>
          <button
            onClick={async () => {
              await logout();
              navigate('/admin/login');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Switch to Admin Account
          </button>
          <button
            onClick={verifyBackendSession}
            disabled={isRevalidating}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white text-xs border border-slate-800 transition-colors flex items-center justify-center gap-1.5"
            title="Re-check clearance with backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRevalidating ? 'animate-spin' : ''}`} />
            Recheck
          </button>
        </div>
      </div>
    );
  }

  // Case 4: Authorized — Render admin components safely
  return <>{children}</>;
};
