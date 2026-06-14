'use client';

/**
 * system/data-display/VirtualTable.tsx
 * High-performance virtualised table using @tanstack/react-virtual.
 *
 * Renders only visible rows — safe for 10,000+ row datasets.
 * Designed for:
 *   - Employee list (HRMS Intelligence)
 *   - Payslip register (Payroll Control Tower)
 *   - Audit log (Governance Center)
 *   - Notification feed
 *
 * Features:
 *   - Column-based type system (sortable, width, align, render)
 *   - Server-side sort callbacks (no client sort for large sets)
 *   - Sticky header
 *   - Row selection (checkbox or row-click)
 *   - Loading overlay
 *   - Empty state
 *   - Accessible: aria-sort, aria-rowcount, aria-colcount
 *
 * NOTE: @tanstack/react-virtual must be installed:
 *   npm install @tanstack/react-virtual
 */

import React, { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUp, ArrowDown, ArrowUpDown, Loader2 } from 'lucide-react';
import { SkeletonBox } from '../Suspense';

// ── Column definition ─────────────────────────────────────────────────────────
export type SortDirection = 'asc' | 'desc' | null;

export type ColumnDef<TRow> = {
  /** Unique key matching a TRow field or a virtual key */
  key: string;
  /** Header label */
  label: string;
  /** Width hint — CSS value e.g. '120px', '1fr', 'auto' */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Allow column to be sorted */
  sortable?: boolean;
  /** Custom cell renderer — defaults to String(value) */
  render?: (row: TRow, index: number) => React.ReactNode;
};

export type VirtualTableProps<TRow> = {
  /** All rows — virtualiser handles rendering */
  rows: TRow[];
  /** Column definitions */
  columns: ColumnDef<TRow>[];
  /** Unique key extractor per row */
  rowKey: (row: TRow) => string;
  /** Current sort state */
  sortKey?: string;
  sortDir?: SortDirection;
  /** Called when a sortable column header is clicked */
  onSort?: (key: string, dir: SortDirection) => void;
  /** Called on row click */
  onRowClick?: (row: TRow) => void;
  /** Selected row keys (for multi-select highlight) */
  selectedKeys?: Set<string>;
  /** Row height in px — consistent height needed for virtualiser accuracy */
  rowHeight?: number;
  /** Visible container height in px */
  containerHeight?: number;
  /** Show loading skeleton overlay */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Extra class names on the outer container */
  className?: string;
};

const DEFAULT_ROW_HEIGHT = 48;
const DEFAULT_CONTAINER_HEIGHT = 480;

// ── Sort icon ─────────────────────────────────────────────────────────────────
function SortIcon({ active, dir }: { active: boolean; dir: SortDirection }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 text-slate-700" aria-hidden="true" />;
  if (dir === 'asc')  return <ArrowUp   className="h-3 w-3 text-gold"  aria-hidden="true" />;
  return                     <ArrowDown  className="h-3 w-3 text-gold"  aria-hidden="true" />;
}

// ── VirtualTable ──────────────────────────────────────────────────────────────
export function VirtualTable<TRow>({
  rows,
  columns,
  rowKey,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  selectedKeys,
  rowHeight = DEFAULT_ROW_HEIGHT,
  containerHeight = DEFAULT_CONTAINER_HEIGHT,
  loading = false,
  emptyMessage = 'No records found.',
  className = '',
}: VirtualTableProps<TRow>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,   // render 8 extra rows above/below viewport for smooth scroll
  });

  const handleHeaderClick = useCallback(
    (col: ColumnDef<TRow>) => {
      if (!col.sortable || !onSort) return;
      const isSameKey = sortKey === col.key;
      const nextDir: SortDirection = isSameKey
        ? sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc'
        : 'asc';
      onSort(col.key, nextDir);
    },
    [onSort, sortKey, sortDir],
  );

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent, row: TRow) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onRowClick?.(row);
      }
    },
    [onRowClick],
  );

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`relative rounded-2xl overflow-hidden border border-white/5 ${className}`} aria-busy="true" aria-label="Loading table data">
        <div className="flex items-center justify-center gap-2 py-6 border-b border-white/5 bg-void/80">
          <Loader2 className="h-4 w-4 text-gold animate-spin" aria-hidden="true" />
          <span className="text-xs text-slate-500">Loading…</span>
        </div>
        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonBox key={i} className="h-10 w-full rounded-xl" style={{ opacity: 1 - i * 0.1 }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div className={`rounded-2xl border border-white/5 flex items-center justify-center ${className}`} style={{ height: containerHeight }}>
        <p className="text-sm text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  // ── Grid template columns ─────────────────────────────────────────────────
  const gridTemplate = columns.map((c) => c.width ?? '1fr').join(' ');

  return (
    <div
      className={`rounded-2xl border border-white/5 overflow-hidden ${className}`}
      role="table"
      aria-rowcount={rows.length}
      aria-colcount={columns.length}
    >
      {/* Sticky header */}
      <div
        role="rowgroup"
        className="sticky top-0 z-10 bg-[#0A0A0F] border-b border-white/5"
      >
        <div
          role="row"
          className="grid px-4 py-3"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {columns.map((col) => {
            const isActive = sortKey === col.key;
            const ariaSortVal: React.AriaAttributes['aria-sort'] = isActive
              ? sortDir === 'asc' ? 'ascending' : sortDir === 'desc' ? 'descending' : 'none'
              : undefined;

            return (
              <div
                key={col.key}
                role="columnheader"
                aria-sort={ariaSortVal}
                className={`flex items-center gap-1.5 text-[10px] font-black text-slate-600 uppercase tracking-wide select-none ${
                  col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''
                } ${col.sortable ? 'cursor-pointer hover:text-slate-300 transition-colors' : ''}`}
                onClick={() => handleHeaderClick(col)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && col.sortable) handleHeaderClick(col);
                }}
                tabIndex={col.sortable ? 0 : undefined}
                aria-label={col.sortable ? `Sort by ${col.label}` : col.label}
              >
                {col.label}
                {col.sortable && <SortIcon active={isActive} dir={isActive ? (sortDir ?? null) : null} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Virtualised body */}
      <div
        ref={parentRef}
        role="rowgroup"
        style={{ height: containerHeight, overflowY: 'auto' }}
        className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
      >
        {/* Total height spacer */}
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            const key = rowKey(row);
            const isSelected = selectedKeys?.has(key) ?? false;

            return (
              <div
                key={key}
                role="row"
                aria-rowindex={virtualRow.index + 1}
                aria-selected={onRowClick ? isSelected : undefined}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  height: rowHeight,
                }}
                className={`flex items-center px-4 border-b border-white/[0.03] transition-colors ${
                  isSelected ? 'bg-gold/5' : 'hover:bg-white/[0.025]'
                } ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(e) => handleRowKeyDown(e, row)}
                tabIndex={onRowClick ? 0 : undefined}
              >
                {/* Apply grid inline — need second style prop workaround */}
                <div
                  className="grid w-full h-full items-center"
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      role="cell"
                      className={`text-xs truncate pr-3 ${
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {col.render
                        ? col.render(row, virtualRow.index)
                        : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer row count */}
      <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-slate-700">
          {rows.length.toLocaleString()} {rows.length === 1 ? 'record' : 'records'}
        </span>
        <span className="text-[10px] text-slate-700">Virtualised · only visible rows rendered</span>
      </div>
    </div>
  );
}
