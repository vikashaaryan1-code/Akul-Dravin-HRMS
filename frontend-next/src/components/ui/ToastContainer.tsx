'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Toast, ToastVariant, toastStore } from '../../store/toast-store';

// ── Icon components (inline SVG — no icon package dependency) ─────────────────
const icons: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

const styles: Record<ToastVariant, React.CSSProperties> = {
  success: { background: '#0f172a', borderLeft: '4px solid #22c55e', color: '#f0fdf4' },
  error:   { background: '#0f172a', borderLeft: '4px solid #ef4444', color: '#fef2f2' },
  warning: { background: '#0f172a', borderLeft: '4px solid #f59e0b', color: '#fffbeb' },
  info:    { background: '#0f172a', borderLeft: '4px solid #3b82f6', color: '#eff6ff' },
};

const iconColors: Record<ToastVariant, string> = {
  success: '#22c55e',
  error:   '#ef4444',
  warning: '#f59e0b',
  info:    '#3b82f6',
};

// ── Single Toast item ─────────────────────────────────────────────────────────
function ToastItem({ toast }: { toast: Toast }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slide-in on mount
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => toastStore.remove(toast.id), 300);
  }, [toast.id]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        ...styles[toast.variant],
        display:      'flex',
        alignItems:   'flex-start',
        gap:          '12px',
        padding:      '14px 18px',
        borderRadius: '10px',
        boxShadow:    '0 8px 32px rgba(0,0,0,.4)',
        minWidth:     '300px',
        maxWidth:     '420px',
        cursor:       'pointer',
        userSelect:   'none',
        transition:   'opacity .3s ease, transform .3s ease',
        opacity:      visible ? 1 : 0,
        transform:    visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(.97)',
        willChange:   'opacity, transform',
      }}
      onClick={dismiss}
    >
      {/* Icon */}
      <span style={{ color: iconColors[toast.variant], flexShrink: 0, marginTop: '1px' }}>
        {icons[toast.variant]}
      </span>

      {/* Message */}
      <span style={{
        flex:       1,
        fontSize:   '14px',
        fontWeight: 500,
        lineHeight: '1.5',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        {toast.message}
      </span>

      {/* Close button */}
      <button
        aria-label="Dismiss notification"
        onClick={(e) => { e.stopPropagation(); dismiss(); }}
        style={{
          background: 'transparent',
          border:     'none',
          cursor:     'pointer',
          color:      'rgba(255,255,255,.5)',
          padding:    '0',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ── Toast Container (portal-free fixed positioning) ───────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastStore.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      style={{
        position:      'fixed',
        bottom:        '24px',
        right:         '24px',
        zIndex:        9999,
        display:       'flex',
        flexDirection: 'column',
        gap:           '10px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
