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
 <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,139,141,0.12),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(232,90,42,0.11),_transparent_40%)] text-slate-900 transition-colors [radial-gradient(circle_at_top_left,_rgba(15,139,141,0.25),_transparent_42%),radial-gradient(circle_at_bottom_right,_rgba(232,90,42,0.18),_transparent_40%)] ">
 <TopNavigation onMenuClick={() => setSidebarOpen(true)} />
 <div className="mx-auto flex w-full max-w-[1500px] gap-4 px-2 py-3 sm:px-3 lg:gap-5 lg:px-4">
 <SideNavigation activeRole={safeRole} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
 <main className="w-full space-y-4 pb-6 lg:ml-72">
 <PlatformRouteBanner />
 {children}
 </main>
 </div>
 <BackToTop />
 </div>
 );
}
