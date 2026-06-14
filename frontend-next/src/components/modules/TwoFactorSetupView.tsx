'use client';

import { useState, useEffect } from 'react';
import { Shield, Smartphone, CheckCircle2, Copy, Eye, EyeOff, KeyRound, AlertCircle, RefreshCw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { PageTitle } from '@/components/ui/PageTitle';

const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001'}/api/v1`;

function authHeader() {
  return { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('hrms_token') ?? '' : ''}` };
}

type SetupState = 'idle' | 'setup' | 'verify' | 'enabled' | 'loading';

interface TotpSetupData {
  qrCode: string;           // data:image/png;base64,... from backend
  manualKey: string;        // plain-text TOTP key for manual entry
  backupCodes: string[];
}

export function TwoFactorSetupView() {
  const [state, setState] = useState<SetupState>('idle');
  const [setup, setSetup] = useState<TotpSetupData | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean | null>(null);

  // Check current 2FA status on mount
  useEffect(() => {
    fetch(`${API}/auth-hardening/2fa/status`, { headers: authHeader() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setIs2FAEnabled(data.enabled ?? false);
      })
      .catch(() => {});
  }, []);

  const startSetup = async () => {
    setState('loading');
    setError('');
    try {
      const res = await fetch(`${API}/auth-hardening/2fa/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      if (!res.ok) throw new Error('Failed to initialize 2FA setup');
      const data = await res.json();
      setSetup(data);
      setState('setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
      setState('idle');
    }
  };

  const verifyAndEnable = async () => {
    if (code.length !== 6) { setError('Enter the 6-digit code from your authenticator app'); return; }
    setState('loading');
    setError('');
    try {
      const res = await fetch(`${API}/auth-hardening/2fa/verify-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? 'Invalid code — please try again');
      }
      setIs2FAEnabled(true);
      setSuccess('Two-factor authentication has been successfully enabled!');
      setState('enabled');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setState('setup');
    }
  };

  const disable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This reduces your account security.')) return;
    setState('loading');
    try {
      const res = await fetch(`${API}/auth-hardening/2fa/disable`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (!res.ok) throw new Error('Failed to disable 2FA');
      setIs2FAEnabled(false);
      setSetup(null);
      setState('idle');
      setSuccess('2FA has been disabled.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA');
      setState(is2FAEnabled ? 'enabled' : 'idle');
    }
  };

  const copyBackupCodes = () => {
    if (!setup?.backupCodes) return;
    navigator.clipboard.writeText(setup.backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const currentState = is2FAEnabled ? 'enabled' : state;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-rise">
      <PageTitle title="Two-Factor Authentication" description="Add an extra layer of security to your account using an authenticator app." />

      {/* Status Banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
        is2FAEnabled
          ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10'
          : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10'
      }`}>
        <Shield className={`h-5 w-5 shrink-0 ${is2FAEnabled ? 'text-emerald-600' : 'text-amber-600'}`} />
        <div>
          <p className={`text-sm font-semibold ${is2FAEnabled ? 'text-emerald-800 dark:text-emerald-200' : 'text-amber-800 dark:text-amber-200'}`}>
            {is2FAEnabled ? '2FA is Active' : '2FA is Not Enabled'}
          </p>
          <p className="text-xs text-slate-500">
            {is2FAEnabled
              ? 'Your account is protected with time-based one-time passwords (TOTP).'
              : 'Enable 2FA to protect your account from unauthorized access.'}
          </p>
        </div>
        {is2FAEnabled && <CheckCircle2 className="h-5 w-5 text-emerald-500 ml-auto shrink-0" />}
      </div>

      {/* Error / Success messages */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{success}
        </div>
      )}

      {/* ── Not yet set up ──────────────────────────────────────────────── */}
      {!is2FAEnabled && currentState === 'idle' && (
        <GlassCard>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">Set Up Authenticator App</p>
              <p className="text-sm text-slate-500 mt-1">
                Use Google Authenticator, Authy, Microsoft Authenticator, or any TOTP-compatible app.
              </p>
              <div className="mt-4 space-y-2 text-xs text-slate-500">
                {['Install an authenticator app on your phone', 'Scan the QR code we generate', 'Enter the 6-digit code to verify'].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                    {step}
                  </div>
                ))}
              </div>
              <button onClick={startSetup} disabled={state === 'loading'}
                className="mt-5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2">
                {state === 'loading' ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Setting up...</> : <><Shield className="h-3.5 w-3.5" />Enable 2FA</>}
              </button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* ── QR Code + Manual Key ────────────────────────────────────────── */}
      {!is2FAEnabled && currentState === 'setup' && setup && (
        <>
          <GlassCard>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Step 1 — Scan QR Code</p>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* QR Code */}
              <div className="flex-shrink-0">
                {setup.qrCode ? (
                  <img src={setup.qrCode} alt="TOTP QR Code" className="h-40 w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-2" />
                ) : (
                  <div className="h-40 w-40 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 text-xs text-center p-3">
                    QR code requires backend connection
                  </div>
                )}
              </div>

              {/* Manual key */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 mb-2">Can't scan? Enter this key manually:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 tracking-widest overflow-hidden">
                    {showKey ? setup.manualKey : '•'.repeat(setup.manualKey?.length ?? 32)}
                  </code>
                  <button onClick={() => setShowKey(s => !s)} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 transition">
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Account: <span className="font-mono">AKUL DRAVIN HRMS</span> · Algorithm: SHA1 · Period: 30s
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Step 2 — Verify Code</p>
            <p className="text-xs text-slate-500 mb-4">Enter the 6-digit code currently shown in your authenticator app:</p>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                placeholder="000000"
                className="flex-1 px-4 py-3 text-2xl font-mono text-center tracking-[0.5em] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
              <button onClick={verifyAndEnable} disabled={code.length !== 6 || state === 'loading'}
                className="px-5 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition whitespace-nowrap">
                {state === 'loading' ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </GlassCard>
        </>
      )}

      {/* ── 2FA Enabled — Backup Codes ──────────────────────────────────── */}
      {is2FAEnabled && setup?.backupCodes && (
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Backup Recovery Codes</p>
            <button onClick={copyBackupCodes} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition">
              <Copy className="h-3.5 w-3.5" />{copiedCodes ? 'Copied!' : 'Copy all'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">Save these codes somewhere safe. Each can only be used once if you lose access to your authenticator.</p>
          <div className="grid grid-cols-2 gap-1.5">
            {setup.backupCodes.map((c, i) => (
              <code key={i} className="px-3 py-1.5 text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 text-center tracking-widest">{c}</code>
            ))}
          </div>
        </GlassCard>
      )}

      {/* ── Disable 2FA ─────────────────────────────────────────────────── */}
      {is2FAEnabled && (
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-slate-400" /> Disable 2FA
              </p>
              <p className="text-xs text-slate-500 mt-0.5">This will make your account less secure.</p>
            </div>
            <button onClick={disable2FA} disabled={state === 'loading'}
              className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition">
              {state === 'loading' ? 'Processing...' : 'Disable 2FA'}
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
