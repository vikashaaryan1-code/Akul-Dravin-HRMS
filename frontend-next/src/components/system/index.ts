/**
 * system/index.ts — CyberGlass 2.0 System Component Registry
 *
 * Single import point for all shared dashboard primitives.
 * Tree-shakes cleanly — only bundle what you import.
 *
 * Usage:
 * import { KpiTile, GlassCard, AreaTrendChart, AppShell } from '@/components/system';
 */

/* ── AppShell / Layout ───────────────────────────────────────────────────────── */ export { AppShell, DashboardLayout } from './AppShell';

/* ── Error & Suspension ──────────────────────────────────────────────────────── */ export { AppErrorBoundary, QueryAwareErrorBoundary } from './ErrorBoundary';
export {
 SuspenseDashboardBoundary,
 SkeletonBox,
 SkeletonCard,
 SkeletonTable,
 MotionSafe,
} from './Suspense';

/* ── Cards & KPI Tiles ───────────────────────────────────────────────────────── */ export { GlassCard, KpiTile, KpiStrip, TrendBadge } from './cards/GlassCard';

/* ── Charts (static — for use in non-critical sections) ─────────────────────── */ export {
 ChartContainer,
 AreaTrendChart,
 BarTrendChart,
 DonutChart,
 SparkLine,
 BRAND_COLORS,
} from './charts/ChartContainer';

/* ── Charts (dynamic — SSR-safe, lazy loaded for heavy dashboard panels) ─────── */ export {
 DynamicAreaChart,
 DynamicBarChart,
 DynamicDonutChart,
} from './charts/DynamicCharts';

/* ── Data Display ────────────────────────────────────────────────────────────── */ export { VirtualTable } from './data-display/VirtualTable';

/* ── Navigation ──────────────────────────────────────────────────────────────── */ export { ExecutiveSidebar } from './navigation/ExecutiveSidebar';
export { TopCommandBar } from './navigation/TopCommandBar';
export { NotificationRail } from './navigation/NotificationRail';
