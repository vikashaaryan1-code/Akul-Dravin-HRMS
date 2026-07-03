'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';

/**
 * useTokenRefresh
 *
 * Auto-refreshes the JWT access token before it expires and keeps the
 * `akul-auth-token` cookie in sync with Zustand for Next.js middleware.
 *
 * Strategy:
 * - Decode the JWT payload to read the `exp` claim (no signature check needed)
 * - Schedule a refresh 60 seconds before expiry
 * - On tab focus/visibility change, re-check the token and refresh if needed
 * - On logout (token cleared), cancel any pending refresh
 * - Keeps the `akul-auth-token` cookie updated so middleware can read it
 *
 * Place this hook in a client component that wraps all authenticated pages
 * (e.g., the platform layout).
 */

interface JwtPayload {
 sub: string;
 exp: number;
 tenantId: string;
 role: string;
 email: string;
}

function decodeJwt(token: string): JwtPayload | null {
 try {
 const parts = token.split('.');
 if (parts.length !== 3) return null;
 return JSON.parse(
 Buffer.from(parts[1], 'base64url').toString('utf-8'),
 ) as JwtPayload;
 } catch {
 return null;
 }
}

/** Set/clear the auth cookie that Next.js middleware reads */
function syncAuthCookie(token: string | null) {
 if (token) {
 const payload = decodeJwt(token);
 const maxAge = payload ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000)) : 3600;
 // SameSite=Strict; Secure is added automatically by the browser for HTTPS
 document.cookie = `akul-auth-token=${token}; max-age=${maxAge}; path=/; SameSite=Strict`;
 } else {
 // Expire the cookie immediately
 document.cookie = 'akul-auth-token=; max-age=0; path=/; SameSite=Strict';
 }
}

/** Returns how many ms until 60s before the token expires, or 0 if already near expiry */
function msUntilRefresh(token: string): number {
 const payload = decodeJwt(token);
 if (!payload?.exp) return 0;
 const expiresInMs = payload.exp * 1000 - Date.now();
 /* Refresh 60 seconds before expiry (minimum 5s lead time) */ return Math.max(0, expiresInMs - 60_000);
}

export function useTokenRefresh() {
 const accessToken = useAuthStore((s) => s.accessToken);
 const setSession = useAuthStore((s) => s.setSession);
 const clearSession = useAuthStore((s) => s.clearSession);
 const user = useAuthStore((s) => s.user);
 const router = useRouter();

 const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const isRefreshing = useRef(false);

 const clearTimer = useCallback(() => {
 if (timerRef.current) {
 clearTimeout(timerRef.current);
 timerRef.current = null;
 }
 }, []);

 const doRefresh = useCallback(async (token: string) => {
 if (isRefreshing.current) return;
 isRefreshing.current = true;

 try {
 const response = await api('/auth/refresh', {
 method: 'POST',
 headers: { Authorization: `Bearer ${token}` },
 });

 if (!response.ok) {
 // Refresh failed — session is invalid, log out
 clearTimer();
 clearSession();
 syncAuthCookie(null);
 router.replace('/login?reason=session_expired');
 return;
 }

 const data = await response.json() as { accessToken: string; expiresIn: number };

 /* Update store with new access token (preserve user object) */ if (user) {
 setSession({ accessToken: data.accessToken, user });
 }
 syncAuthCookie(data.accessToken);
 } catch {
 /* Network error — don't log out, will retry on next visibility change */ } finally {
 isRefreshing.current = false;
 }
 }, [clearSession, clearTimer, router, setSession, user]);

 const scheduleRefresh = useCallback((token: string) => {
 clearTimer();
 const delay = msUntilRefresh(token);

 if (delay <= 0) {
 // Already near expiry — refresh immediately
 void doRefresh(token);
 return;
 }

 timerRef.current = setTimeout(() => {
 void doRefresh(token);
 }, delay);
 }, [clearTimer, doRefresh]);

 // ── Sync cookie whenever token changes ──────────────────────────────────
 useEffect(() => {
 syncAuthCookie(accessToken);

 if (!accessToken) {
 clearTimer();
 return;
 }

 // Check if token is already expired
 const payload = decodeJwt(accessToken);
 if (payload?.exp && payload.exp * 1000 < Date.now()) {
 clearSession();
 syncAuthCookie(null);
 router.replace('/login?reason=session_expired');
 return;
 }

 scheduleRefresh(accessToken);
 return clearTimer;
 }, [accessToken, clearSession, clearTimer, router, scheduleRefresh]);

 // ── Re-check token on tab focus (handles long idle sessions) ───────────
 useEffect(() => {
 const handleVisibilityChange = () => {
 if (document.visibilityState === 'visible' && accessToken) {
 const payload = decodeJwt(accessToken);
 if (!payload?.exp) return;

 const isExpired = payload.exp * 1000 < Date.now();
 const isNearExpiry = (payload.exp * 1000 - Date.now()) < 120_000; /* 2 min */ if (isExpired) {
 clearSession();
 syncAuthCookie(null);
 router.replace('/login?reason=session_expired');
 } else if (isNearExpiry) {
 void doRefresh(accessToken);
 }
 }
 };

 document.addEventListener('visibilitychange', handleVisibilityChange);
 return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
 }, [accessToken, clearSession, doRefresh, router]);

 return null;
}
