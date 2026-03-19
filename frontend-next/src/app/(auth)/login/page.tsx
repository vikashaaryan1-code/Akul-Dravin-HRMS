'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import type { PlatformRole } from '@/types/platform';
import { platformApi } from '@/services/api/platform-api';
import { useAuthStore } from '@/store/auth-store';
import { PLATFORM_ROLE_OPTIONS, toRoleLabel } from '@/utils/platform-config';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const setActiveRole = useAuthStore((state) => state.setActiveRole);

  const [email, setEmail] = useState('admin@akuldravin.com');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState<PlatformRole>('platform-admin');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardLoaded, setCardLoaded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlEmail = params.get('email');
    const urlRole = params.get('role');

    if (urlEmail) setEmail(urlEmail);
    if (urlRole && PLATFORM_ROLE_OPTIONS.some((item) => item.role === urlRole)) {
      setSelectedRole(urlRole as PlatformRole);
    }

    setTimeout(() => setCardLoaded(true), 200);
  }, []);

  const roleHelper = useMemo(() => `Selected workspace: ${toRoleLabel(selectedRole)}`, [selectedRole]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await platformApi.login({ email, password });
      setSession(response);
      setActiveRole(selectedRole);
      
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect === 'job-application') {
        router.push('/job-application');
      } else {
        router.push(`/dashboard?role=${selectedRole}`);
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to login.';
      setError(`${message} You can continue in demo mode.`);
    } finally {
      setSubmitting(false);
    }
  };

  const continueDemo = () => {
    setSession({
      accessToken: 'demo-token',
      user: { id: 'demo-user', email, fullName: 'Demo User', tenantId: null, role: selectedRole },
    });
    setActiveRole(selectedRole);
    
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect === 'job-application') {
      router.push('/job-application');
    } else {
      router.push(`/dashboard?role=${selectedRole}`);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Background iframe showing homepage */}
      <iframe
        src="/"
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20 blur-sm"
        title="Background"
      />
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      <Link
        href="/"
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-[#00f5ff] transition-all hover:text-white hover:[text-shadow:0_0_10px_#00f5ff]"
      >
        <ArrowRight className="rotate-180" size={20} />
        <span className="text-sm font-medium">Back to Home</span>
      </Link>
      
      <div className="relative z-10" style={{ perspective: '1200px' }}>
        <div
          className={`relative w-[650px] h-[420px] rounded-xl border-2 border-[#00f5ff] bg-black/35 backdrop-blur-xl shadow-[0_0_10px_#00f5ff,0_0_20px_#00f5ff,0_0_40px_rgba(0,245,255,0.4),inset_0_0_20px_rgba(0,245,255,0.3)] overflow-hidden transition-all duration-1000 ${
            cardLoaded ? '' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: cardLoaded ? 'rotateY(0deg) rotateX(0deg)' : 'rotateY(-90deg) rotateX(5deg)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'rotateY(5deg) rotateX(3deg)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = cardLoaded ? 'rotateY(0deg) rotateX(0deg)' : 'rotateY(0deg) rotateX(0deg)'}
        >
          <div className="absolute top-0 left-0 w-[55%] h-full bg-gradient-to-br from-[#00f5ff] via-[#00d4e6] to-[#00b8cc] pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 100%)', zIndex: 1 }}>
            <div className="w-full h-full flex items-center justify-center">
              <h1 className="text-3xl font-bold tracking-[10px] text-black [text-shadow:0_0_10px_rgba(0,0,0,0.3)]">WELCOME</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="absolute right-0 top-0 w-[60%] h-full flex flex-col items-center justify-center gap-3 pl-20 pr-8" style={{ zIndex: 2 }}>
            <h2 className="text-2xl font-bold text-white">Login</h2>

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full max-w-[300px] border border-[#00f5ff] bg-transparent px-3 py-1.5 text-sm text-white outline-none transition-all focus:shadow-[0_0_10px_#00f5ff] focus:border-[#00f5ff]"
              placeholder="Username"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full max-w-[300px] border border-[#00f5ff] bg-transparent px-3 py-1.5 text-sm text-white outline-none transition-all focus:shadow-[0_0_10px_#00f5ff] focus:border-[#00f5ff]"
              placeholder="Password"
            />

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as PlatformRole)}
              className="w-full max-w-[300px] border border-[#00f5ff] bg-black/50 px-3 py-1.5 text-sm text-white outline-none transition-all focus:shadow-[0_0_10px_#00f5ff] focus:border-[#00f5ff]"
            >
              {PLATFORM_ROLE_OPTIONS.map((option) => (
                <option key={option.role} value={option.role} className="bg-black">
                  {option.label}
                </option>
              ))}
            </select>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              disabled={submitting}
              className="w-full max-w-[300px] cursor-pointer border-none bg-gradient-to-r from-[#00f5ff] to-[#0066ff] px-8 py-1.5 text-sm text-white shadow-[0_0_10px_#00f5ff,0_0_20px_#00f5ff] transition-all hover:scale-105 hover:shadow-[0_0_20px_#00f5ff,0_0_40px_#00f5ff] disabled:opacity-50"
            >
              {submitting ? 'SIGNING IN...' : 'LOGIN'}
            </button>

            <button
              type="button"
              onClick={continueDemo}
              className="text-xs text-[#00f5ff] underline hover:text-white"
            >
              Continue Demo
            </button>

            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-gray-400">Don't have an account?</span>
              <Link
                href="/signup"
                className="relative font-medium text-[#00f5ff] transition-all hover:text-white hover:[text-shadow:0_0_10px_#00f5ff,0_0_20px_#00f5ff,0_0_30px_#00f5ff] after:absolute after:bottom-[-3px] after:left-0 after:h-[2px] after:w-0 after:bg-[#00f5ff] after:shadow-[0_0_10px_#00f5ff] after:transition-all after:duration-400 hover:after:w-full"
              >
                Create Account
              </Link>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes move {
          0% { transform: translateY(0); }
          100% { transform: translateY(200px); }
        }
        
        iframe {
          transform: scale(1.1);
        }
      `}</style>
    </main>
  );
}
