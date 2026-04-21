'use client';

import { FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  Eye,
  EyeOff,
  LayoutDashboard
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if email is passed from signup
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api('/auth/login', { 
        method: "POST",
        body: JSON.stringify(formData) 
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

      useAuthStore.getState().setAuth({
        user: data.user,
        token: data.accessToken,
      });

      router.replace('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      {/* Background Ambience */}
      <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-aqua/10 blur-[130px]" />
      <div className="absolute -bottom-1/4 -right-1/4 h-[800px] w-[800px] rounded-full bg-amber/10 blur-[130px]" />
      
      <div className="relative w-full max-w-md">
        {/* Main Login Card */}
        <div className="group overflow-hidden rounded-[38px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-2xl transition-all duration-500 hover:border-white/20 sm:p-10">
          
          {/* Brand/Logo Area */}
          <div className="mb-10 flex flex-col items-center text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 p-0.5 shadow-xl transition-all duration-700 group-hover:scale-110 group-hover:bg-white/10">
              <ShieldCheck className="h-7 w-7 text-aqua" />
            </div>
            <h1 className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-4xl font-black tracking-tight text-transparent">
              Welcome Back
            </h1>
            <p className="mt-2.5 text-sm text-slate-400">
              Authorized access to OMNIX ∞ Global Systems
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Security Identity</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@akuldravin.com"
                  className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-aqua/50 focus:bg-white/10 focus:ring-4 focus:ring-aqua/10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Access Token</label>
                <Link href="#" className="text-[10px] font-bold text-aqua transition-colors hover:text-white">RECOVER</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-white/5 bg-white/5 py-3.5 pl-11 pr-11 text-sm text-white outline-none transition-all focus:border-aqua/50 focus:bg-white/10 focus:ring-4 focus:ring-aqua/10"
                />
                <button 
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
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
              className="group relative mt-2 w-full overflow-hidden rounded-2xl bg-white py-4 text-sm font-black text-slate-950 shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {loading ? "Signing in..." : "Login"}
              </div>
            </button>
          </form>

          {/* Alternative Actions */}
          <div className="mt-8 grid grid-cols-2 gap-3">
             <button 
              type="button" 
              className="flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 py-2.5 text-[11px] font-bold text-slate-400 transition-all hover:border-white/10 hover:bg-white/10"
            >
              <LayoutDashboard size={14} />
              SYSTEM STATUS
            </button>
            <Link 
              href="/signup" 
              className="flex items-center justify-center gap-2 rounded-xl border border-aqua/20 bg-aqua/5 py-2.5 text-[11px] font-bold text-aqua transition-all hover:bg-aqua/10"
            >
              CREATE CORE ID
            </Link>
          </div>

          {/* Home Link */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-[10px] font-bold tracking-widest text-slate-600 transition-colors hover:text-white">
              RETURN TO HUB
            </Link>
          </div>
        </div>

        {/* System Info Footnote */}
        <p className="mt-10 text-center text-[10px] font-medium leading-relaxed text-slate-700">
          This system is protected by high-level encryption.<br />
          Unauthorized access attempts are logged and reported.
        </p>
      </div>
    </main>
  );
}
