/**
 * system/charts/DynamicCharts.tsx
 * Dynamic (lazy) wrappers for heavy Recharts-based chart components.
 *
 * Use these instead of static imports in heavy dashboard panels to:
 *   - eliminate SSR hydration cost
 *   - enable route-level code splitting
 *   - keep TTI low for initial dashboard render
 *   - fall back gracefully to skeleton during load
 *
 * Usage:
 *   import { DynamicAreaChart } from '@/components/system';
 *   // identical API to AreaTrendChart — just deferred
 */

import dynamic from 'next/dynamic';
import { SkeletonBox } from '../Suspense';
import type { ComponentProps } from 'react';
import type { AreaTrendChart, BarTrendChart, DonutChart } from './ChartContainer';

const chartSkeleton = (height = 240) => (
  <div style={{ height }} className="w-full">
    <SkeletonBox className="w-full h-full rounded-2xl" />
  </div>
);

/**
 * DynamicAreaChart — lazy AreaTrendChart.
 * Identical props API to AreaTrendChart.
 */
export const DynamicAreaChart = dynamic<ComponentProps<typeof AreaTrendChart>>(
  () => import('./ChartContainer').then((m) => ({ default: m.AreaTrendChart })),
  {
    ssr: false,
    loading: () => chartSkeleton(240),
  },
);

/**
 * DynamicBarChart — lazy BarTrendChart.
 */
export const DynamicBarChart = dynamic<ComponentProps<typeof BarTrendChart>>(
  () => import('./ChartContainer').then((m) => ({ default: m.BarTrendChart })),
  {
    ssr: false,
    loading: () => chartSkeleton(220),
  },
);

/**
 * DynamicDonutChart — lazy DonutChart.
 */
export const DynamicDonutChart = dynamic<ComponentProps<typeof DonutChart>>(
  () => import('./ChartContainer').then((m) => ({ default: m.DonutChart })),
  {
    ssr: false,
    loading: () => chartSkeleton(240),
  },
);
