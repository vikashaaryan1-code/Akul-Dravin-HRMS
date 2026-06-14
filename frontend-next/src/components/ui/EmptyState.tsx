'use client';

import React from 'react';

interface EmptyStateProps {
  /** Primary message, e.g. "No employees yet" */
  title:       string;
  /** Supporting text, e.g. "Click + Add Employee to get started" */
  description?: string;
  /** Optional CTA button */
  action?:     React.ReactNode;
  /** Optional icon — defaults to an inbox SVG */
  icon?:       React.ReactNode;
}

const defaultIcon = (
  <svg
    width="48" height="48" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.2"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ opacity: 0.35 }}
  >
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      style={{
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '56px 24px',
        textAlign:      'center',
        gap:            '16px',
        color:          'var(--color-muted, #94a3b8)',
      }}
    >
      <span style={{ display: 'block' }}>{icon ?? defaultIcon}</span>
      <p style={{
        margin: 0,
        fontSize: '15px',
        fontWeight: 600,
        color: 'var(--color-foreground, #e2e8f0)',
      }}>
        {title}
      </p>
      {description && (
        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

interface SkeletonProps {
  rows?:  number;
  height?: number | string;
}

export function SkeletonRows({ rows = 5, height = 52 }: SkeletonProps) {
  return (
    <div role="status" aria-label="Loading…" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          style={{
            height:       typeof height === 'number' ? `${height}px` : height,
            borderRadius: '8px',
            background:   'linear-gradient(90deg, rgba(255,255,255,.04) 0%, rgba(255,255,255,.08) 50%, rgba(255,255,255,.04) 100%)',
            backgroundSize: '200% 100%',
            animation:    `skeleton-shimmer 1.4s ease infinite ${i * 0.1}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
