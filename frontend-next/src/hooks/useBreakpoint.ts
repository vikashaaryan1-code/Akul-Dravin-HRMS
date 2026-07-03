'use client';

/**
 * hooks/useBreakpoint.ts
 * SSR-safe responsive breakpoint hooks for mobile executive UX optimisation.
 *
 * Usage:
 * const { isMobile, isTablet, isDesktop } = useBreakpoint();
 * const width = useWindowWidth();
 */

import { useState, useEffect, useCallback } from 'react';

const BREAKPOINTS = {
 sm: 640,
 md: 768,
 lg: 1024,
 xl: 1280,
 '2xl': 1536,
} as const;

type BreakpointKey = keyof typeof BREAKPOINTS;

/* ── useWindowWidth — SSR safe ───────────────────────────────────────────────── */ export function useWindowWidth(): number {
 const [width, setWidth] = useState(0); // 0 = SSR / unknown

 useEffect(() => {
 if (typeof window === 'undefined') return;
 setWidth(window.innerWidth);

 let frame: number;
 const handler = () => {
 cancelAnimationFrame(frame);
 frame = requestAnimationFrame(() => setWidth(window.innerWidth));
 };

 window.addEventListener('resize', handler, { passive: true });
 return () => {
 window.removeEventListener('resize', handler);
 cancelAnimationFrame(frame);
 };
 }, []);

 return width;
}

/* ── useBreakpoint — resolved semantic flags ─────────────────────────────────── */ export function useBreakpoint() {
 const width = useWindowWidth();

 return {
 width,
 /** < 640px */
 isMobile: width > 0 && width < BREAKPOINTS.sm,
 /** 640–767px */
 isSmall: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
 /** 768–1023px */
 isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
 /** 1024–1279px */
 isDesktop: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
 /** ≥ 1280px */
 isWide: width >= BREAKPOINTS.xl,
 /** < 1024px — sidebar should collapse */
 isNarrow: width > 0 && width < BREAKPOINTS.lg,
 /** SSR guard — width not yet measured */
 isUnknown: width === 0,
 /** Utility: is width >= given breakpoint */
 gte: (bp: BreakpointKey) => width >= BREAKPOINTS[bp],
 lt: (bp: BreakpointKey) => width > 0 && width < BREAKPOINTS[bp],
 };
}

/* ── useMobileNav — sidebar open/close state with body scroll lock ───────────── */ export function useMobileNav() {
 const [open, setOpen] = useState(false);
 const { isNarrow } = useBreakpoint();

 // Auto-close when viewport grows past narrow threshold
 useEffect(() => {
 if (!isNarrow && open) setOpen(false);
 }, [isNarrow, open]);

 // Body scroll lock while nav is open on mobile
 useEffect(() => {
 if (typeof document === 'undefined') return;
 if (open) {
 document.body.style.overflow = 'hidden';
 } else {
 document.body.style.overflow = '';
 }
 return () => { document.body.style.overflow = ''; };
 }, [open]);

 const toggle = useCallback(() => setOpen((o) => !o), []);
 const close = useCallback(() => setOpen(false), []);

 return { open, toggle, close, isNarrow };
}

/* ── useTouchDevice — pointer capability detection ───────────────────────────── */ export function useTouchDevice(): boolean {
 const [isTouch, setIsTouch] = useState(false);

 useEffect(() => {
 if (typeof window === 'undefined') return;
 setIsTouch(
 window.matchMedia('(hover: none) and (pointer: coarse)').matches
 );
 }, []);

 return isTouch;
}
