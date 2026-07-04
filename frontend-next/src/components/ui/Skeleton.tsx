import React from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkeletonProps {
  /** Tailwind class for width (e.g. 'w-full', 'w-32') */
  width?: string;
  /** Tailwind class for height (e.g. 'h-4', 'h-10') */
  height?: string;
  /** Rounded corners */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Additional Tailwind classes */
  className?: string;
}

interface SkeletonTextProps {
  /** Number of lines to render */
  lines?: number;
  /** Whether last line is shorter (natural paragraph look) */
  lastLineShort?: boolean;
  className?: string;
}

interface SkeletonCardProps {
  /** Show avatar at top */
  showAvatar?: boolean;
  /** Number of text lines */
  lines?: number;
  /** Show action buttons at bottom */
  showActions?: boolean;
  className?: string;
}

interface SkeletonTableProps {
  /** Number of table rows */
  rows?: number;
  /** Number of columns */
  cols?: number;
  className?: string;
}

interface SkeletonStatProps {
  /** Number of stat cards */
  count?: number;
  className?: string;
}

// ─── Base Skeleton ─────────────────────────────────────────────────────────

/**
 * Base skeleton shimmer block.
 *
 * @example
 * <Skeleton width="w-48" height="h-4" rounded="md" />
 */
export function Skeleton({
  width = 'w-full',
  height = 'h-4',
  rounded = 'lg',
  className = '',
}: SkeletonProps) {
  const roundedClass = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      aria-hidden="true"
      className={[
        'relative overflow-hidden bg-white/5',
        roundedClass,
        width,
        height,
        className,
      ].join(' ')}
    >
      {/* Shimmer sweep */}
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]
          bg-gradient-to-r from-transparent via-white/8 to-transparent"
      />
    </div>
  );
}

// ─── Skeleton Text ─────────────────────────────────────────────────────────

/**
 * Multi-line text skeleton that mimics paragraph blocks.
 *
 * @example
 * <SkeletonText lines={3} lastLineShort />
 */
export function SkeletonText({
  lines = 3,
  lastLineShort = true,
  className = '',
}: SkeletonTextProps) {
  return (
    <div
      role="status"
      aria-label="Loading text…"
      className={['space-y-2', className].join(' ')}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="h-3.5"
          width={lastLineShort && i === lines - 1 ? 'w-3/4' : 'w-full'}
          rounded="md"
        />
      ))}
      <span className="sr-only">Loading…</span>
    </div>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────

/**
 * Card-shaped skeleton for employee cards, project tiles, etc.
 *
 * @example
 * <SkeletonCard showAvatar lines={2} showActions />
 */
export function SkeletonCard({
  showAvatar = false,
  lines = 3,
  showActions = false,
  className = '',
}: SkeletonCardProps) {
  return (
    <div
      role="status"
      aria-label="Loading card…"
      className={[
        'rounded-2xl border border-white/8 bg-white/3 backdrop-blur-md p-6 space-y-4',
        className,
      ].join(' ')}
    >
      {showAvatar && (
        <div className="flex items-center gap-3">
          <Skeleton width="w-10" height="h-10" rounded="full" />
          <div className="flex-1 space-y-2">
            <Skeleton height="h-3.5" width="w-1/2" />
            <Skeleton height="h-3" width="w-1/3" />
          </div>
        </div>
      )}

      <SkeletonText lines={lines} />

      {showActions && (
        <div className="flex gap-2 pt-2">
          <Skeleton height="h-9" width="w-24" rounded="xl" />
          <Skeleton height="h-9" width="w-20" rounded="xl" />
        </div>
      )}

      <span className="sr-only">Loading…</span>
    </div>
  );
}

// ─── Skeleton Table ────────────────────────────────────────────────────────

/**
 * Table skeleton for data tables and data grids.
 *
 * @example
 * <SkeletonTable rows={5} cols={4} />
 */
export function SkeletonTable({
  rows = 5,
  cols = 4,
  className = '',
}: SkeletonTableProps) {
  return (
    <div
      role="status"
      aria-label="Loading table…"
      className={['rounded-2xl border border-white/8 overflow-hidden', className].join(' ')}
    >
      {/* Header */}
      <div className="bg-white/5 px-4 py-3 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height="h-3" width="w-2/3" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="border-t border-white/5 px-4 py-4 grid gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              height="h-3.5"
              width={colIdx === 0 ? 'w-full' : colIdx === cols - 1 ? 'w-16' : 'w-3/4'}
            />
          ))}
        </div>
      ))}

      <span className="sr-only">Loading table data…</span>
    </div>
  );
}

// ─── Skeleton Stat Grid ────────────────────────────────────────────────────

/**
 * Grid of stat/metric card skeletons.
 *
 * @example
 * <SkeletonStatGrid count={4} />
 */
export function SkeletonStatGrid({
  count = 4,
  className = '',
}: SkeletonStatProps) {
  return (
    <div
      role="status"
      aria-label="Loading statistics…"
      className={['grid grid-cols-2 lg:grid-cols-4 gap-4', className].join(' ')}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/8 bg-white/3 backdrop-blur-md p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton width="w-8" height="h-8" rounded="lg" />
            <Skeleton width="w-16" height="h-5" rounded="full" />
          </div>
          <Skeleton height="h-7" width="w-24" />
          <Skeleton height="h-3" width="w-3/4" />
        </div>
      ))}
      <span className="sr-only">Loading statistics…</span>
    </div>
  );
}

// ─── Skeleton Dashboard ────────────────────────────────────────────────────

/**
 * Full dashboard skeleton for the platform loading state.
 * Shows stat grid + table + chart placeholders.
 */
export function SkeletonDashboard() {
  return (
    <div role="status" aria-label="Loading dashboard…" className="space-y-6 p-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width="w-48" height="h-7" />
          <Skeleton width="w-72" height="h-4" />
        </div>
        <Skeleton width="w-32" height="h-10" rounded="xl" />
      </div>

      {/* Stat cards */}
      <SkeletonStatGrid count={4} />

      {/* Two-column: chart + table */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4">
          <Skeleton width="w-40" height="h-5" />
          <Skeleton width="w-full" height="h-64" rounded="xl" />
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4">
          <Skeleton width="w-32" height="h-5" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton width="w-8" height="h-8" rounded="full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton height="h-3.5" />
                  <Skeleton height="h-3" width="w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <SkeletonTable rows={6} cols={5} />

      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}
