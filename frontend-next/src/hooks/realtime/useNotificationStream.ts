/**
 * src/hooks/realtime/useNotificationStream.ts
 * WebSocket notification stream hook — Phase 3C Live Event Fabric.
 *
 * Architecture:
 *   - Opens a WebSocket to /ws/notifications with Bearer token auth
 *   - Auto-reconnects with exponential back-off (max 5 retries)
 *   - Surfaces connection state to UI (connected / connecting / error)
 *   - Merges server-pushed notifications into React Query cache
 *   - SSR-safe: no WebSocket instantiation during server render
 *
 * Server contract: each frame is a JSON-serialised NotificationEvent.
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { queryKeys } from '@/lib/query/keys';

// ── Notification event DTO ────────────────────────────────────────────────────
export type NotificationEvent = {
  id:        string;
  severity:  'info' | 'success' | 'warning' | 'ai';
  title:     string;
  message:   string;
  time:      string;         // human-readable e.g. "just now"
  timestamp: string;         // ISO
  read:      boolean;
  href?:     string;
};

// ── Connection state ──────────────────────────────────────────────────────────
export type WsStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';

// ── Hook ──────────────────────────────────────────────────────────────────────
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001';
const MAX_RETRIES = 5;

export function useNotificationStream(options: {
  onNotification?: (event: NotificationEvent) => void;
  enabled?: boolean;
} = {}) {
  const { onNotification, enabled = true } = options;

  const [status, setStatus] = useState<WsStatus>('disconnected');
  const [unreadCount, setUnreadCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const qc = useQueryClient();

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    const token = useAuthStore.getState().token;
    if (!token) return;

    setStatus(retryCountRef.current > 0 ? 'reconnecting' : 'connecting');

    const url = `${WS_BASE}/ws/notifications?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      retryCountRef.current = 0;
      setStatus('connected');
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const notification = JSON.parse(event.data) as NotificationEvent;

        // Merge into React Query cache — optimistic notification update
        qc.setQueryData<NotificationEvent[]>(
          queryKeys.notifications.unread(),
          (prev = []) => [notification, ...prev],
        );

        if (!notification.read) {
          setUnreadCount((n) => n + 1);
        }

        onNotification?.(notification);
      } catch {
        // Malformed frame — silently discard
      }
    };

    ws.onclose = (event) => {
      if (!mountedRef.current) return;
      if (event.wasClean) {
        setStatus('disconnected');
        return;
      }
      // Unexpected close — schedule reconnect
      const delay = Math.min(1000 * 2 ** retryCountRef.current, 30_000);
      retryCountRef.current += 1;
      if (retryCountRef.current > MAX_RETRIES) {
        setStatus('error');
        return;
      }
      setStatus('reconnecting');
      retryTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      setStatus('error');
      ws.close();
    };
  }, [enabled, onNotification, qc]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      retryTimerRef.current && clearTimeout(retryTimerRef.current);
      wsRef.current?.close(1000, 'component unmounted');
    };
  }, [connect]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    qc.setQueryData<NotificationEvent[]>(
      queryKeys.notifications.unread(),
      (prev = []) => prev.map((n) => ({ ...n, read: true })),
    );
  }, [qc]);

  const dismiss = useCallback((id: string) => {
    qc.setQueryData<NotificationEvent[]>(
      queryKeys.notifications.unread(),
      (prev = []) => prev.filter((n) => n.id !== id),
    );
    setUnreadCount((n) => Math.max(0, n - 1));
  }, [qc]);

  return { status, unreadCount, markAllRead, dismiss };
}

// ── BullMQ queue telemetry stream ─────────────────────────────────────────────
export type QueueEvent = {
  queue:     string;
  jobId:     string;
  event:     'active' | 'completed' | 'failed' | 'delayed' | 'progress';
  progress?: number;    // 0–100 for progress events
  timestamp: string;
};

/**
 * useQueueTelemetry — streams BullMQ job events for the observability panel.
 * Phase 3C: connects to /ws/queue-telemetry.
 */
export function useQueueTelemetry(options: {
  queues?: string[];
  onEvent?: (event: QueueEvent) => void;
  enabled?: boolean;
} = {}) {
  const { queues, onEvent, enabled = true } = options;
  const [events, setEvents] = useState<QueueEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!enabled || typeof window === 'undefined') return;

    const token = useAuthStore.getState().token;
    if (!token) return;

    const qFilter = queues?.join(',') ?? '';
    const url = `${WS_BASE}/ws/queue-telemetry?token=${encodeURIComponent(token)}${qFilter ? `&queues=${qFilter}` : ''}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      try {
        const event = JSON.parse(e.data) as QueueEvent;
        setEvents((prev) => [event, ...prev].slice(0, 100)); // keep last 100 events
        onEvent?.(event);
      } catch {
        // ignore malformed frames
      }
    };

    return () => {
      mountedRef.current = false;
      ws.close(1000, 'component unmounted');
    };
  }, [enabled, queues?.join(',')]);  // eslint-disable-line react-hooks/exhaustive-deps

  return { events };
}
