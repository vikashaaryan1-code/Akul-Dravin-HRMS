'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import type { PlatformRole } from '@/types/platform';
import { PLATFORM_ROLE_OPTIONS } from '@/utils/platform-config';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<PlatformRole>('company-admin');
  const [submitted, setSubmitted] = useState(false);
  const [cardLoaded, setCardLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setCardLoaded(true), 200);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      router.push(`/login?email=${encodeURIComponent(email)}&role=${role}`);
    }, 800);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05070d] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(0,245,255,0.03)_1px,_transparent_1px)] bg-[length:40px_40px] animate-[move_20s_linear_infinite]" />
      
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-[#00f5ff] transition-all hover:text-white hover:[text-shadow:0_0_10px_#00f5ff]"
      >
        <CheckCircle2 className="rotate-180" size={20} />
        <span className="text-sm font-medium">Back</span>
      </Link>
      
      <div className="relative" style={{ perspective: '1200px' }}>
        <div
          className="relative w-[650px] h-[480px] rounded-xl border-2 border-[#00f5ff] bg-black/35 backdrop-blur-xl shadow-[0_0_10px_#00f5ff,0_0_20px_#00f5ff,0_0_40px_rgba(0,245,255,0.4),inset_0_0_20px_rgba(0,245,255,0.3)] overflow-hidden transition-all duration-1000"
          style={{
            transformStyle: 'preserve-3d',
            transform: cardLoaded ? 'rotateY(0deg) rotateX(0deg)' : 'rotateY(-90deg) rotateX(5deg)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'rotateY(5deg) rotateX(3deg)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = cardLoaded ? 'rotateY(0deg) rotateX(0deg)' : 'rotateY(0deg) rotateX(0deg)'}
        >
          <div className="absolute top-0 left-0 w-[55%] h-full bg-gradient-to-br from-[#00f5ff] via-[#00d4e6] to-[#00b8cc] pointer-events-none" style={{ clipPath: 'polygon(0 0, 100% 0, 70% 100%, 0 100%)', zIndex: 1 }}>
            <div className="w-full h-full flex items-center justify-center">
              <h1 className="text-3xl font-bold tracking-[10px] text-black [text-shadow:0_0_10px_rgba(0,0,0,0.3)]">JOIN US</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="absolute right-0 top-0 w-[60%] h-full flex flex-col items-center justify-center gap-2 pl-16 pr-8" style={{ zIndex: 2 }}>
            <h2 className="text-xl font-bold text-white">Create Account</h2>

            <div className="flex w-full max-w-[350px] gap-2">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-1/2 border border-[#00f5ff] bg-transparent px-2 py-1 text-xs text-white outline-none transition-all focus:shadow-[0_0_10px_#00f5ff] focus:border-[#00f5ff]"
                placeholder="First Name"
                required
              />
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-1/2 border border-[#00f5ff] bg-transparent px-2 py-1 text-xs text-white outline-none transition-all focus:shadow-[0_0_10px_#00f5ff] focus:border-[#00f5ff]"
                placeholder="Last Name"
                required
              />
            </div>

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full max-w-[350px] border border-[#00f5ff] bg-transparent px-2 py-1.5 text-sm text-white outline-none transition-all focus:shadow-[0_0_10px_#00f5ff] focus:border-[#00f5ff]"
              placeholder="Email"
              type="email"
              required
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full max-w-[350px] border border-[#00f5ff] bg-transparent px-2 py-1.5 text-sm text-white outline-none transition-all focus:shadow-[0_0_10px_#00f5ff] focus:border-[#00f5ff]"
              placeholder="Password"
              required
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value as PlatformRole)}
              className="w-full max-w-[350px] border border-[#00f5ff] bg-black/50 px-2 py-1.5 text-sm text-white outline-none transition-all focus:shadow-[0_0_10px_#00f5ff] focus:border-[#00f5ff]"
            >
              {PLATFORM_ROLE_OPTIONS.map((option) => (
                <option key={option.role} value={option.role} className="bg-black">
                  {option.label}
                </option>
              ))}
            </select>

            {submitted && (
              <p className="flex items-center gap-2 text-xs text-green-400">
                <CheckCircle2 size={14} />
                Redirecting to login...
              </p>
            )}

            <button
              disabled={submitted}
              className="w-full max-w-[350px] cursor-pointer border-none bg-gradient-to-r from-[#00f5ff] to-[#0066ff] px-8 py-2 text-white shadow-[0_0_10px_#00f5ff,0_0_20px_#00f5ff] transition-all hover:scale-105 hover:shadow-[0_0_20px_#00f5ff,0_0_40px_#00f5ff] disabled:opacity-50"
            >
              {submitted ? 'CREATING...' : 'CREATE ACCOUNT'}
            </button>

            <div className="mt-1 flex items-center gap-2 text-sm">
              <span className="text-gray-400">Already have an account?</span>
              <Link
                href="/login"
                className="relative font-medium text-[#00f5ff] transition-all hover:text-white hover:[text-shadow:0_0_10px_#00f5ff,0_0_20px_#00f5ff,0_0_30px_#00f5ff] after:absolute after:bottom-[-3px] after:left-0 after:h-[2px] after:w-0 after:bg-[#00f5ff] after:shadow-[0_0_10px_#00f5ff] after:transition-all after:duration-400 hover:after:w-full"
              >
                Login
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
      `}</style>
    </main>
  );
}
