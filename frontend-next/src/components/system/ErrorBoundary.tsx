'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';

interface ErrorBoundaryState {
 hasError: boolean;
 error: Error | null;
}

interface ErrorBoundaryProps {
 children: ReactNode;
 fallback?: ReactNode;
 onError?: (error: Error, info: React.ErrorInfo) => void;
 context?: string;
}

/**
 * AppErrorBoundary — CyberGlass 2.0
 * Catches render errors with a branded, non-breaking fallback UI.
 * Includes retry mechanism and contextual labeling for telemetry.
 * On retry: also resets the React Query error state via QueryErrorResetBoundary.
 */
export class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
 constructor(props: ErrorBoundaryProps) {
 super(props);
 this.state = { hasError: false, error: null };
 }

 static getDerivedStateFromError(error: Error): ErrorBoundaryState {
 return { hasError: true, error };
 }

 override componentDidCatch(error: Error, info: React.ErrorInfo) {
 this.props.onError?.(error, info);
 /* Future: ship to Sentry / OpenTelemetry */ if (process.env.NODE_ENV === 'development') {
 console.error(`[ErrorBoundary:${this.props.context ?? 'unknown'}]`, error, info);
 }
 }

 handleRetry = (resetQuery?: () => void) => {
 resetQuery?.(); // reset React Query error state
 this.setState({ hasError: false, error: null }); /* reset boundary */ };

 override render() {
 if (this.state.hasError) {
 if (this.props.fallback) return this.props.fallback;

 return (
 <QueryErrorResetBoundary>
 {({ reset }) => (
 <div
 role="alert"
 aria-live="assertive"
 className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-ember/20 bg-ember/5 p-10 text-center min-h-[200px]"
 >
 <div className="h-12 w-12 rounded-xl bg-ember/10 border border-ember/20 flex items-center justify-center">
 <AlertTriangle className="h-6 w-6 text-ember" aria-hidden="true" />
 </div>
 <div>
 <p className="text-sm font-black text-white">
 {this.props.context ? `${this.props.context} failed to load` : 'Something went wrong'}
 </p>
 <p className="text-xs text-slate-500 mt-1 max-w-xs">
 {process.env.NODE_ENV === 'development' && this.state.error
 ? this.state.error.message
 : 'An unexpected error occurred. Retry or contact support.'}
 </p>
 </div>
 <button
 onClick={() => this.handleRetry(reset)}
 className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-xs font-bold text-navy hover:bg-white/10 transition-colors duration-200"
 aria-label="Retry loading this section"
 >
 <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
 Retry
 </button>
 </div>
 )}
 </QueryErrorResetBoundary>
 );
 }

 return this.props.children;
 }
}

/**
 * QueryAwareErrorBoundary — functional wrapper that composes
 * QueryErrorResetBoundary + AppErrorBoundary for use in Suspense trees.
 *
 * Usage:
 * <QueryAwareErrorBoundary context="Payroll Chart">
 * <Suspense fallback={<Skeleton />}>
 * <PayrollTrendChart />
 * </Suspense>
 * </QueryAwareErrorBoundary>
 */
export function QueryAwareErrorBoundary({
 children,
 context,
}: {
 children: ReactNode;
 context?: string;
}) {
 return (
 <QueryErrorResetBoundary>
 {({ reset }) => (
 <AppErrorBoundary context={context} onError={() => reset()}>
 {children}
 </AppErrorBoundary>
 )}
 </QueryErrorResetBoundary>
 );
}
