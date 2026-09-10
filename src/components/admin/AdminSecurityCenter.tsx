import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useLMS } from '../../context/LMSContext';
import {
  Shield,
  KeyRound,
  Lock,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Sliders,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Globe,
  Trash2,
} from 'lucide-react';

export const AdminSecurityCenter: React.FC = () => {
  const { currentUser, logoutAllSessions } = useLMS();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // MFA Setup State
  const [mfaSetupData, setMfaSetupData] = useState<{
    secret: string;
    otpAuthUri: string;
    recoveryCodes: string[];
    instructions: string;
  } | null>(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // MFA Disable State
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [isDisablingMfa, setIsDisablingMfa] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<any>({
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    minPasswordLength: 10,
    enforceMfaForAdmins: true,
    maintenanceMode: false,
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Load Security Overview
  const fetchOverview = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getAdminSecurityOverview();
      setOverview(data);
      if (data.systemSettings) {
        setSettings(data.systemSettings);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load administrative security center overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  // Handle Session Revocation
  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.revokeAdminSession(sessionId);
      setSuccessMsg('Target session token revoked successfully.');
      await fetchOverview();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to revoke session.');
    }
  };

  // Handle Revoke All Sessions
  const handleRevokeAllSessions = async () => {
    if (!window.confirm('Revoke all active sessions across all devices? You will be prompted to re-authenticate.')) {
      return;
    }
    try {
      await api.revokeAllAdminSessions();
      await logoutAllSessions();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to revoke all sessions.');
    }
  };

  // Start MFA Setup
  const handleStartMfaSetup = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const data = await api.setupMFA();
      setMfaSetupData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate TOTP authenticator secret.');
    }
  };

  // Confirm MFA Code
  const handleConfirmMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaVerifyCode.trim()) return;
    setIsVerifyingMfa(true);
    setErrorMsg(null);
    try {
      await api.verifyMFA(mfaVerifyCode.trim());
      setSuccessMsg('Two-Factor Authentication successfully activated and verified!');
      setMfaSetupData(null);
      setMfaVerifyCode('');
      await fetchOverview();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid 6-digit TOTP code. Ensure your device clock is synchronized.');
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  // Disable MFA
  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) return;
    setIsDisablingMfa(true);
    setErrorMsg(null);
    try {
      await api.disableMFA(disablePassword);
      setSuccessMsg('Two-Factor Authentication has been disabled.');
      setShowDisableModal(false);
      setDisablePassword('');
      await fetchOverview();
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect password.');
    } finally {
      setIsDisablingMfa(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await api.updateAdminSettings(settings);
      setSuccessMsg('Institutional security policies updated successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2 font-mono">
        <span className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping" />
        Auditing security posture and active sessions...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Alert Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            ×
          </button>
        </div>
      )}

      {/* Security Posture Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase">Active Sessions</span>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {overview?.activeSessions?.length || 0}
            </div>
            <span className="text-[11px] text-emerald-400 mt-1 block">Valid Refresh Token Families</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800 text-amber-400">
            <Globe className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase">Your 2FA Status</span>
            <div className="text-xl font-bold text-white mt-1 flex items-center gap-2">
              {overview?.currentUserMfa ? (
                <span className="text-emerald-400 flex items-center gap-1 text-sm font-semibold">
                  <ShieldCheck className="w-4 h-4" /> Enforced & Active
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1 text-sm font-semibold">
                  <AlertTriangle className="w-4 h-4" /> Not Configured
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">RFC 6238 Time-based OTP</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800 text-sky-400">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase">Security Policy</span>
            <div className="text-xl font-bold text-white mt-1">
              {settings.enforceMfaForAdmins ? 'MFA Required' : 'Optional'}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Max {settings.maxLoginAttempts} attempts • {settings.sessionTimeoutMinutes}m TTL
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800 text-rose-400">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2FA / Multi-Factor Authentication Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">Multi-Factor Authentication (MFA / 2FA)</h3>
              <p className="text-xs text-slate-400">
                Protect your privileged administrative account with RFC 6238 time-synchronized one-time passwords.
              </p>
            </div>
          </div>
          <div>
            {overview?.currentUserMfa ? (
              <button
                onClick={() => setShowDisableModal(true)}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-colors"
              >
                Disable 2FA
              </button>
            ) : (
              <button
                onClick={handleStartMfaSetup}
                className="px-3.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-bold hover:bg-amber-300 shadow-md transition-colors"
              >
                Configure Authenticator App →
              </button>
            )}
          </div>
        </div>

        {/* Setup Wizard */}
        {mfaSetupData && (
          <div className="p-5 rounded-xl bg-slate-950 border border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Step 1: Scan QR or Enter Base32 Secret
              </span>
              <button
                onClick={() => setMfaSetupData(null)}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                Cancel Setup
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Add this account to Google Authenticator, Authy, or 1Password. Enter the secret manually or import the URI:
                </p>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Base32 Authenticator Secret Key
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={mfaSetupData.secret}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-xs text-amber-400 selection:bg-amber-400 selection:text-slate-950"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(mfaSetupData.secret);
                        setCopiedSecret(true);
                        setTimeout(() => setCopiedSecret(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Emergency Recovery Codes (Single Use)
                  </label>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 max-h-24 overflow-y-auto font-mono text-[11px] text-slate-300 grid grid-cols-2 gap-1">
                    {mfaSetupData.recoveryCodes.map((code, idx) => (
                      <span key={idx} className="bg-slate-950 px-1.5 py-0.5 rounded text-center">
                        {code}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(mfaSetupData.recoveryCodes.join('\n'));
                      setCopiedCodes(true);
                      setTimeout(() => setCopiedCodes(false), 2000);
                    }}
                    className="mt-1.5 text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                  >
                    {copiedCodes ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCodes ? 'Recovery Codes Copied' : 'Copy All Recovery Codes'}</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Verification */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-amber-300 block mb-1">
                    Step 2: Confirm 6-Digit Code
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Enter the time-based one-time code currently shown in your authenticator app to complete enrollment.
                  </p>

                  <form onSubmit={handleConfirmMfa} className="space-y-3">
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      required
                      value={mfaVerifyCode}
                      onChange={(e) => setMfaVerifyCode(e.target.value)}
                      placeholder="000000"
                      className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-4 py-2.5 text-lg font-mono text-center tracking-widest text-amber-300 focus:outline-none focus:border-amber-400"
                    />

                    <button
                      type="submit"
                      disabled={isVerifyingMfa || mfaVerifyCode.length < 6}
                      className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-colors disabled:opacity-50"
                    >
                      {isVerifyingMfa ? 'Verifying Code...' : 'Activate Two-Factor Authentication'}
                    </button>
                  </form>
                </div>

                <div className="text-[10px] text-slate-500 mt-4 text-center">
                  Once activated, all future administrative sign-ins will require this code.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Sessions & Revocation Management */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Active Administrator Sessions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live token records authenticated in production. Sessions expire automatically or can be immediately terminated.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOverview}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={handleRevokeAllSessions}
              className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Revoke All Sessions
            </button>
          </div>
        </div>

        {overview?.activeSessions?.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
            No active sessions recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300 border border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono">
                <tr>
                  <th className="p-3">Session Token Identifier</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Created</th>
                  <th className="p-3">Expires</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                {overview?.activeSessions?.map((session: any) => (
                  <tr key={session.id} className="hover:bg-slate-900/50">
                    <td className="p-3 font-mono text-[11px] text-slate-300">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-400">
                        {session.token.substring(0, 16)}...
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">{session.ipAddress || '127.0.0.1'}</td>
                    <td className="p-3 text-slate-400">
                      {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 text-slate-400">
                      {new Date(session.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Institutional System Security Policy Settings */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-bold text-white">System Security & Hardening Policies</h3>
            <p className="text-xs text-slate-400">
              Institutional controls enforced in runtime API middleware across all administrative endpoints.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Session Idle Timeout (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="1440"
                value={settings.sessionTimeoutMinutes}
                onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Max Login Attempts Before Lockout
              </label>
              <input
                type="number"
                min="3"
                max="20"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Minimum Password Length
              </label>
              <input
                type="number"
                min="8"
                max="32"
                value={settings.minPasswordLength}
                onChange={(e) => setSettings({ ...settings, minPasswordLength: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enforceMfaForAdmins}
                onChange={(e) => setSettings({ ...settings, enforceMfaForAdmins: e.target.checked })}
                className="rounded border-slate-700 text-amber-400 focus:ring-0 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-white block">
                  Enforce Two-Factor Authentication for All Administrators
                </span>
                <span className="text-[11px] text-slate-400">
                  Denies sign-in to any administrator who has not activated RFC 6238 TOTP.
                </span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="rounded border-slate-700 text-rose-500 focus:ring-0 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-white block">
                  Institutional Maintenance Lock
                </span>
                <span className="text-[11px] text-slate-400">
                  Suspends learner quiz evaluations and student self-enrollments for scheduled system upgrades.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition-colors disabled:opacity-50"
            >
              {isSavingSettings ? 'Saving Policies...' : 'Save Institutional Policies'}
            </button>
          </div>
        </form>
      </div>

      {/* Disable 2FA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="text-sm font-bold text-white">Disable Two-Factor Authentication</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Confirm your current administrator password to remove TOTP protection from this account.
            </p>

            <form onSubmit={handleDisableMfa} className="space-y-3">
              <input
                type="password"
                required
                autoFocus
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDisablingMfa}
                  className="px-4 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs"
                >
                  {isDisablingMfa ? 'Verifying...' : 'Confirm Disable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
