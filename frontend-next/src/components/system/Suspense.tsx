'use client';

import React, { Suspense, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { AppErrorBoundary } from './ErrorBoundary';

/* ── SkeletonBox ───────────────────────────────────────────────────────────── */ interface SkeletonBoxProps {
 className?: string;
 rows?: number;
 style?: React.CSSProperties;
}

export function SkeletonBox({ className = '', rows = 1, style }: SkeletonBoxProps) {
 const reduced = useReducedMotion();
 const pulse = reduced ? '' : 'animate-pulse';

 return (
 <div className={`space-y-3 ${className}`} style={style} aria-busy="true" aria-label="Loading">
 {Array.from({ length: rows }).map((_, i) => (
 <div
 key={i}
 className={`h-4 rounded-lg bg-white/5 ${pulse}`}
 style={{ width: `${85 - i * 12}%` }}
 />
 ))}
 </div>
 );
}

/* ── SkeletonCard ───────────────────────────────────────────────────────────── */ export function SkeletonCard({ className = '' }: { className?: string }) {
 const reduced = useReducedMotion();
 const pulse = reduced ? '' : 'animate-pulse';

 return (
 <div
 className={`surface-raised border-subtle rounded-2xl p-6 space-y-4 ${pulse} ${className}`}
 aria-busy="true"
 aria-label="Loading card"
 >
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 rounded-xl bg-white/5" />
 <div className="flex-1 space-y-2">
 <div className="h-3 rounded bg-white/5 w-1/2" />
 <div className="h-2.5 rounded bg-white/5 w-1/3" />
 </div>
 </div>
 <div className="h-8 rounded-lg bg-white/5 w-2/3" />
 <div className="space-y-2">
 <div className="h-2.5 rounded bg-white/5" />
 <div className="h-2.5 rounded bg-white/5 w-5/6" />
 </div>
 </div>
 );
}

/* ── SkeletonTable ──────────────────────────────────────────────────────────── */ export function SkeletonTable({ rows = 5 }: { rows?: number }) {
 const reduced = useReducedMotion();
 const pulse = reduced ? '' : 'animate-pulse';

 return (
 <div className={`surface-raised border-subtle rounded-2xl overflow-hidden ${pulse}`} aria-busy="true">
 <div className="flex gap-6 px-6 py-3 border-b border-white/5">
 {[40, 25, 20, 15].map((w, i) => (
 <div key={i} className="h-3 rounded bg-white/5" style={{ width: `${w}%` }} />
 ))}
 </div>
 {Array.from({ length: rows }).map((_, i) => (
 <div key={i} className="flex gap-6 px-6 py-4 border-b border-white/[0.03]">
 {[40, 25, 20, 15].map((w, j) => (
 <div key={j} className="h-3 rounded bg-white/[0.04]" style={{ width: `${w}%` }} />
 ))}
 </div>
 ))}
 </div>
 );
}

/* ── SuspenseDashboardBoundary ───────────────────────────────────────────────── */ interface SuspenseDashboardBoundaryProps {
 children: ReactNode;
 fallback?: ReactNode;
 context?: string;
 skeletonType?: 'card' | 'table' | 'box';
 skeletonRows?: number;
}

function DefaultFallback({ type, rows }: { type: 'card' | 'table' | 'box'; rows: number }) {
 if (type === 'table') return <SkeletonTable rows={rows} />;
 if (type === 'card') return (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
 {Array.from({ length: rows }).map((_, i) => <SkeletonCard key={i} />)}
 </div>
 );
 return <SkeletonBox rows={rows} />;
}

/**
 * SuspenseDashboardBoundary
 * Wraps any async dashboard section with Error Boundary + Suspense.
 * Shows a skeleton matching the expected content shape while loading.
 */
export function SuspenseDashboardBoundary({
 children,
 fallback,
 context,
 skeletonType = 'card',
 skeletonRows = 4,
}: SuspenseDashboardBoundaryProps) {
 return (
 <AppErrorBoundary context={context}>
 <Suspense fallback={fallback ?? <DefaultFallback type={skeletonType} rows={skeletonRows} />}>
 {children}
 </Suspense>
 </AppErrorBoundary>
 );
}

/* ── MotionSafe ─────────────────────────────────────────────────────────────── */ interface MotionSafeProps {
 children: ReactNode;
 /** rendered when motion is reduced */
 staticFallback?: ReactNode;
}

/**
 * MotionSafe — wraps animated content.
 * When user has prefers-reduced-motion set, renders staticFallback (or children) without motion.
 */
export function MotionSafe({ children, staticFallback }: MotionSafeProps) {
 const reduced = useReducedMotion();
 if (reduced) return <>{staticFallback ?? children}</>;
 return <>{children}</>;
}
