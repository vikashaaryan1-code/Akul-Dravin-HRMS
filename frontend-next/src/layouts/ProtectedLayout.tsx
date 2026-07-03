'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
 const [isHydrated, setIsHydrated] = useState(false);
 const user = useAuthStore((s) => s.user);
 const router = useRouter();

 useEffect(() => {
 // Check if store has already hydrated
 if (useAuthStore.persist.hasHydrated()) {
 setIsHydrated(true);
 } else {
 const unsub = useAuthStore.persist.onFinishHydration(() => {
 setIsHydrated(true);
 });
 return () => unsub();
 }
 }, []);

 useEffect(() => {
 if (isHydrated && !user) {
 router.push("/login");
 }
 }, [isHydrated, user, router]);

 if (!isHydrated) {
 return (
 <div className="flex min-h-screen items-center justify-center bg-[#02060f]">
 <div className="relative">
 <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200/30 border-t-aqua" />
 </div>
 </div>
 );
 }

 if (!user) {
 return null;
 }

 return <>{children}</>;
}
