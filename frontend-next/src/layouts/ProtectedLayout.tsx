'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    // We check user in a useEffect to ensure we are on the client side
    // where the auth store state has been rehydrated via loadAuth() in PlatformShell
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    // Prevent rendering protected content while redirecting
    return null; 
  }

  return <>{children}</>;
}
