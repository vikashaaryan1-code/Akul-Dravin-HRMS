'use client';

import React, { type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  Tooltip, XAxis, YAxis, CartesianGrid,
  type TooltipProps,
} from 'recharts';
import { SkeletonBox } from '../Suspense';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BRAND_COLORS = {
  gold:  '#F2AA3B',
  aqua:  '#0F8B8D',
  ember: '#E85A2A',
  jade:  '#10B981',
  mist:  '#6E7B90',
} as const;

type BrandColor = keyof typeof BRAND_COLORS;

const CHART_GRID_COLOR = 'rgba(255,255,255,0.04)';
const CHART_AXIS_COLOR = 'rgba(255,255,255,0.2)';
const TICK_STYLE = { fill: '#6E7B90', fontSize: 11, fontWeight: 600 };

// ── ChartTooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="surface-raised border-subtle rounded-xl px-3 py-2.5 shadow-glass text-xs">
      {label && <p className="text-slate-400 mb-1.5 font-semibold">{label}</p>}
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} aria-hidden="true" />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-black text-white">{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ── ChartContainer ────────────────────────────────────────────────────────────
interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  height?: number;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

/**
 * ChartContainer — Wraps all chart types with consistent header, loading, and empty states.
 */
export function ChartContainer({
  title, subtitle, height = 280, loading = false, empty = false,
  emptyMessage = 'No data for this period', children, className = '', action,
}: ChartContainerProps) {
  if (loading) {
    return (
      <div className={`surface-raised border-subtle rounded-2xl p-6 ${className}`}>
        {title && <div className="mb-4"><SkeletonBox rows={2} /></div>}
        <div style={{ height }} className="animate-pulse bg-white/[0.03] rounded-xl" aria-busy="true" aria-label="Loading chart" />
      </div>
    );
  }

  return (
    <div className={`surface-raised border-subtle rounded-2xl p-6 flex flex-col gap-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4">
          {title && (
            <div>
              <p className="text-sm font-black text-white tracking-tight">{title}</p>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          )}
          {action}
        </div>
      )}
      {empty ? (
        <div className="flex items-center justify-center text-slate-600 text-xs font-semibold" style={{ height }}>
          {emptyMessage}
        </div>
      ) : (
        <div style={{ height }}>{children}</div>
      )}
    </div>
  );
}

// ── AreaTrendChart ────────────────────────────────────────────────────────────
interface AreaTrendChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: { key: string; label: string; color?: BrandColor }[];
  title?: string;
  subtitle?: string;
  height?: number;
  loading?: boolean;
  className?: string;
}

export function AreaTrendChart({ data, xKey, series, title, subtitle, height = 280, loading, className }: AreaTrendChartProps) {
  const reduced = useReducedMotion();
  return (
    <ChartContainer title={title} subtitle={subtitle} height={height} loading={loading} empty={!data.length} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BRAND_COLORS[s.color ?? 'gold']} stopOpacity={0.3} />
                <stop offset="95%" stopColor={BRAND_COLORS[s.color ?? 'gold']} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
          <XAxis dataKey={xKey} tick={TICK_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={BRAND_COLORS[s.color ?? 'gold']}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              isAnimationActive={!reduced}
              animationDuration={600}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// ── BarTrendChart ─────────────────────────────────────────────────────────────
interface BarTrendChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: { key: string; label: string; color?: BrandColor }[];
  title?: string;
  subtitle?: string;
  height?: number;
  loading?: boolean;
  stacked?: boolean;
  className?: string;
}

export function BarTrendChart({ data, xKey, series, title, subtitle, height = 280, loading, stacked, className }: BarTrendChartProps) {
  const reduced = useReducedMotion();
  return (
    <ChartContainer title={title} subtitle={subtitle} height={height} loading={loading} empty={!data.length} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={18} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} />
          <XAxis dataKey={xKey} tick={TICK_STYLE} axisLine={false} tickLine={false} />
          <YAxis tick={TICK_STYLE} axisLine={false} tickLine={false} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={BRAND_COLORS[s.color ?? 'aqua']}
              radius={[4, 4, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
              isAnimationActive={!reduced}
              animationDuration={500}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// ── DonutChart ────────────────────────────────────────────────────────────────
interface DonutChartProps {
  data: { name: string; value: number; color?: BrandColor }[];
  title?: string;
  subtitle?: string;
  height?: number;
  loading?: boolean;
  className?: string;
  innerLabel?: string;
}

export function DonutChart({ data, title, subtitle, height = 280, loading, className, innerLabel }: DonutChartProps) {
  const reduced = useReducedMotion();
  return (
    <ChartContainer title={title} subtitle={subtitle} height={height} loading={loading} empty={!data.length} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={3}
            dataKey="value"
            isAnimationActive={!reduced}
            animationDuration={700}
            label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, i) => (
              <Cell
                key={`cell-${i}`}
                fill={BRAND_COLORS[entry.color ?? 'gold']}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// ── SparkLine ─────────────────────────────────────────────────────────────────
interface SparkLineProps {
  data: number[];
  color?: BrandColor;
  height?: number;
  width?: number;
}

export function SparkLine({ data, color = 'gold', height = 40, width = 100 }: SparkLineProps) {
  const reduced = useReducedMotion();
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <LineChart width={width} height={height} data={chartData}>
      <Line
        type="monotone"
        dataKey="v"
        stroke={BRAND_COLORS[color]}
        strokeWidth={1.5}
        dot={false}
        isAnimationActive={!reduced}
        animationDuration={500}
      />
    </LineChart>
  );
}

// ── BRAND_COLORS export for other chart consumers ────────────────────────────
export { BRAND_COLORS };
