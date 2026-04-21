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
  Briefcase
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

const ROLES = [
  { value: 'PLATFORM_ADMIN', label: 'Platform Admin' },
  { value: 'ORG_ADMIN', label: 'Organization Admin' },
  { value: 'EMPLOYEE', label: 'Employee' },
];

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let message = "Invalid credentials";
    
        try {
          const errorData = await response.json();
          message = errorData?.message || message;
        } catch {
          // fallback if response is not JSON
        }
    
        throw new Error(message);
      }

      const data = await response.json();
      
      // If the register API returns credentials, we can auto-login
      if (data.user && data.accessToken) {
        useAuthStore.getState().setAuth({
          user: data.user,
          token: data.accessToken,
        });
        setSuccess(true);
        setTimeout(() => router.replace('/dashboard'), 1500);
      } else {
        // Otherwise redirect to login
        setSuccess(true);
        setTimeout(() => router.replace(`/login?email=${encodeURIComponent(formData.email)}`), 2000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message || "Something went wrong");
    } finally {
      setLoading(false);
    }
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
      <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-aqua/10 blur-[120px]" />
      <div className="absolute -bottom-1/4 -right-1/4 h-[800px] w-[800px] rounded-full bg-ember/10 blur-[120px]" />
      
      <div className="relative w-full max-w-lg">
        {/* Registration Card */}
        <div className="group overflow-hidden rounded-[40px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:border-white/20 sm:p-10">
          
          {/* Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-aqua via-aqua to-blue-500 p-0.5 shadow-lg shadow-aqua/20 transition-transform duration-500 group-hover:rotate-12">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950/80 backdrop-blur-xl">
                <Rocket className="h-8 w-8 text-aqua" />
              </div>
            </div>
            <h1 className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-4xl font-black tracking-tight text-transparent">
              Create Account
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Join the OMNIX ∞ ecosystem and scale your enterprise.
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">FullName</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-aqua/50 focus:bg-white/10 focus:ring-4 focus:ring-aqua/10"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-aqua/50 focus:bg-white/10 focus:ring-4 focus:ring-aqua/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-aqua/50 focus:bg-white/10 focus:ring-4 focus:ring-aqua/10"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">Enterprise Role</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-aqua/50 focus:bg-white/10 focus:ring-4 focus:ring-aqua/10"
                  >
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value} className="bg-slate-900 text-white">
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-400 p-2 rounded text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-aqua to-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-aqua/20 transition-all hover:scale-[1.02] hover:shadow-aqua/30 active:scale-95 disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-2">
                  {loading ? "Initializing Access..." : "Initialize Access"}
                </div>
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-aqua/20 text-aqua">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-white">Registration Successful!</h2>
              <p className="mt-2 text-slate-400">Welcome to OMNIX ∞. Redirecting your workspace...</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 border-t border-white/5 pt-6 text-center text-sm">
            <p className="text-slate-500">
              Already have an enterprise account?{' '}
              <Link href="/login" className="font-bold text-aqua hover:text-aqua/80">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Floating Badges */}
        <div className="mt-8 flex justify-center gap-6">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            <CheckCircle2 className="h-3 w-3 text-aqua" />
            GDPR COMPLIANT
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            <CheckCircle2 className="h-3 w-3 text-aqua" />
            256-BIT ENCRYPTION
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            <CheckCircle2 className="h-3 w-3 text-aqua" />
            99.9% UPTIME
          </div>
        </div>
      </div>
    </main>
  );
}
