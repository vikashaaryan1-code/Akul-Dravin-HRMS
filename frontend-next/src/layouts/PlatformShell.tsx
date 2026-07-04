'use client';

import type { PropsWithChildren } from 'react';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SideNavigation } from '@/components/navigation/SideNavigation';
import { TopNavigation } from '@/components/navigation/TopNavigation';
import { PlatformRouteBanner } from '@/components/navigation/PlatformRouteBanner';
import { BackToTop } from '@/components/ui/BackToTop';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useRoleFromQuery } from '@/hooks/useRoleFromQuery';
import { useThemeSync } from '@/hooks/useThemeSync';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import { canAccessRoute, toSafePlatformRole } from '@/utils/platform-config';

export function PlatformShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeRole = useUIStore((state) => state.activeRole);
  const setActiveRole = useUIStore((state) => state.setActiveRole);

  const safeRole = toSafePlatformRole(activeRole);

  useThemeSync();
  useRealtimeNotifications();
  useRoleFromQuery();

  useEffect(() => {
    useAuthStore.getState().loadAuth();
  }, []);

  useEffect(() => {
    if (safeRole !== activeRole) {
      setActiveRole(safeRole);
    }
  }, [activeRole, safeRole, setActiveRole]);

  useEffect(() => {
    const safePath = pathname ?? '/dashboard';
    if (!canAccessRoute(safeRole, safePath)) {
      router.replace(`/dashboard?role=${safeRole}`);
    }
  }, [pathname, router, safeRole]);

  return (
    <div className="min-h-screen bg-navy text-white transition-colors relative overflow-hidden font-sans">
      {/* Ambient Dark Theme Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue/10 mix-blend-screen filter blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-aqua/5 mix-blend-screen filter blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 w-full h-full flex flex-col">
        <TopNavigation onMenuClick={() => setSidebarOpen(true)} />
        <div className="mx-auto flex w-full max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <SideNavigation activeRole={safeRole} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="w-full space-y-4 pb-6 lg:ml-72">
            <PlatformRouteBanner />
            {children}
          </main>
        </div>
        <BackToTop />
      </div>
    </div>
  );
}
