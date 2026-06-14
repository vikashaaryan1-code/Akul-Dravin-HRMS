'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Rocket,
  User,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Building2,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

// ── Google Icon ──────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

const INDUSTRIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Education',
  'Other',
];

const BACKEND_URL     = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4001/api/v1';
const GOOGLE_AUTH_URL = `${BACKEND_URL}/auth/google`;

export default function SignupPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    companyName: '',
    industry: 'Technology',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api('/auth/register', {
        method: 'POST',
        body:   JSON.stringify(formData),
      });

      if (!response.ok) {
        let message = "Registration failed";
        try {
          const errorData = await response.json();
          message = errorData?.message || message;
        } catch { /* ignored */ }
        throw new Error(message);
      }

      const data = await response.json();

      // If the register API returns credentials, we can auto-login
      if (data.user && data.accessToken) {
        setSession({
          user: data.user,
          accessToken: data.accessToken,
        });

        // Set cookie for middleware
        const parts   = data.accessToken.split('.');
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
        const maxAge  = payload.exp ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000)) : 3600;
        document.cookie = `akul-auth-token=${data.accessToken}; max-age=${maxAge}; path=/; SameSite=Strict`;

        setSuccess(true);
        setTimeout(() => router.replace('/dashboard'), 1500);
      } else {
        setSuccess(true);
        setTimeout(() => router.replace(`/login?email=${encodeURIComponent(formData.email)}`), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = GOOGLE_AUTH_URL;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Dynamic Background Elements */}
      <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-blue-600/10 blur-[130px]" />
      <div className="absolute -bottom-1/4 -right-1/4 h-[800px] w-[800px] rounded-full bg-violet-600/10 blur-[130px]" />

      <div className="relative w-full max-w-xl">
        {/* Registration Card */}
        <div className="group overflow-hidden rounded-[40px] glass-3d-panel p-8 transition-all duration-500 hover:border-white/20 sm:p-10">

          {/* Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 p-0.5 shadow-xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-12 group-hover:bg-blue-500/20">
              <Rocket className="h-7 w-7 text-blue-400" />
            </div>
            <h1 className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-4xl font-black tracking-tight text-transparent">
              Create Core ID
            </h1>
            <p className="mt-2.5 text-sm text-slate-400">
              Join the Akul Dravin ecosystem and scale your enterprise.
            </p>
          </div>

          {!success ? (
            <>
              {/* Google OAuth Button */}
              <button
                type="button"
                id="google-signup"
                onClick={handleGoogleSignup}
                className="group/g mb-6 flex w-full items-center justify-center gap-3 rounded-2xl glass-3d-panel py-3.5 text-sm font-semibold text-white transition-all hover:border-white/20 hover:bg-white/10 active:scale-95"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="mb-6 flex items-center gap-3">
                <div className="flex-1 border-t border-white/5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                  or register with email
                </span>
                <div className="flex-1 border-t border-white/5" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">FullName</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-blue-400/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-400/10"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Work Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@company.com"
                        className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-blue-400/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-400/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Organization Name</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        name="companyName"
                        required
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Acme Corp"
                        className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-blue-400/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-400/10"
                      />
                    </div>
                  </div>

                  {/* Industry */}
                  <div className="space-y-1.5">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Industry</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        className="w-full appearance-none rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-blue-400/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-400/10"
                      >
                        {INDUSTRIES.map((ind) => (
                          <option key={ind} value={ind} className="bg-slate-900 text-white">
                            {ind}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Secure Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-blue-400/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-400/10"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  id="signup-submit"
                  disabled={loading}
                  className="group relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 py-4 text-sm font-black text-white shadow-xl shadow-blue-900/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-2">
                    {loading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Provisioning Workspace…</>
                    ) : (
                      <>Initialize Workspace <ArrowRight className="h-4 w-4" /></>
                    )}
                  </div>
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-black text-white">Registration Successful!</h2>
              <p className="mt-2 text-slate-400">Welcome to Akul Dravin. Redirecting to your workspace...</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 border-t border-white/5 pt-6 text-center text-sm">
            <p className="text-slate-500">
              Already have an enterprise account?{' '}
              <Link href="/login" className="font-bold text-blue-400 hover:text-white transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Security Badges */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-700">
            <ShieldCheck className="h-3 w-3 text-blue-500" />
            SOC2 COMPLIANT
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-700">
            <ShieldCheck className="h-3 w-3 text-blue-500" />
            AES-256 ENCRYPTION
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-700">
            <ShieldCheck className="h-3 w-3 text-blue-500" />
            99.99% SLA
          </div>
        </div>
      </div>
    </main>
  );
}
