'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Zap, Clock, Server, Cpu, MemoryStick,
  Wifi, AlertTriangle, CheckCircle2, XCircle,
  TrendingUp, TrendingDown, RefreshCw, BarChart3,
  BrainCircuit, Users, ArrowUpRight,
} from 'lucide-react';
import {
  KpiStrip, AreaTrendChart, BarTrendChart,
  GlassCard, SuspenseDashboardBoundary,
} from '@/components/system';
import { useQueueTelemetry } from '@/hooks/realtime/useNotificationStream';

// ── DTO-shaped mock data ──────────────────────────────────────────────────────
const OBS_KPIS = [
  { label: 'API P95 Latency',   value: '84ms',   trend: -8.2,  icon: Clock,     iconColor: 'text-jade' },
  { label: 'Queue Throughput',  value: '2,841/m', trend: 12.1, icon: Zap,       iconColor: 'text-gold' },
  { label: 'Error Rate (1h)',   value: '0.12%',   trend: -18,  icon: AlertTriangle, iconColor: 'text-aqua' },
  { label: 'Active Tenants',    value: '47',      trend: 4.3,  icon: Users,     iconColor: 'text-ember' },
];

const API_LATENCY_TREND = [
  { time: '00:00', p50: 42, p95: 91, p99: 182 },
  { time: '04:00', p50: 38, p95: 84, p99: 171 },
  { time: '08:00', p50: 61, p95: 128, p99: 244 },
  { time: '12:00', p50: 78, p95: 162, p99: 318 },
  { time: '16:00', p50: 69, p95: 141, p99: 276 },
  { time: '20:00', p50: 52, p95: 108, p99: 211 },
  { time: '23:00', p50: 44, p95: 89,  p99: 178 },
];

const QUEUE_THROUGHPUT = [
  { queue: 'payroll',   processed: 1842, failed: 3,  delayed: 12 },
  { queue: 'notif',     processed: 9420, failed: 8,  delayed: 4  },
  { queue: 'ai-jobs',   processed: 412,  failed: 1,  delayed: 7  },
  { queue: 'provision', processed: 238,  failed: 0,  delayed: 2  },
  { queue: 'reports',   processed: 94,   failed: 2,  delayed: 5  },
];

const AI_TOKEN_TREND = [
  { day: 'Mon', input: 182400, output: 84200 },
  { day: 'Tue', input: 194200, output: 91800 },
  { day: 'Wed', input: 201800, output: 97400 },
  { day: 'Thu', input: 188600, output: 88200 },
  { day: 'Fri', input: 221400, output: 102800 },
  { day: 'Sat', input: 142800, output: 64200 },
  { day: 'Sun', input: 118400, output: 52100 },
];

type ServiceHealth = 'healthy' | 'degraded' | 'down';
const SERVICE_HEALTH_STYLE: Record<ServiceHealth, { dot: string; badge: string; label: string }> = {
  healthy:  { dot: 'bg-jade',  badge: 'bg-jade/15  text-jade  border-jade/20',  label: 'Healthy'  },
  degraded: { dot: 'bg-gold',  badge: 'bg-gold/15  text-gold  border-gold/20',  label: 'Degraded' },
  down:     { dot: 'bg-ember', badge: 'bg-ember/15 text-ember border-ember/20', label: 'Down'     },
};

const SERVICES = [
  { name: 'API Gateway',      status: 'healthy'  as ServiceHealth, uptime: 99.98, latency: '28ms',  instances: 4  },
  { name: 'Auth Service',     status: 'healthy'  as ServiceHealth, uptime: 99.99, latency: '12ms',  instances: 2  },
  { name: 'Payroll Worker',   status: 'healthy'  as ServiceHealth, uptime: 99.94, latency: '142ms', instances: 3  },
  { name: 'AI Inference',     status: 'degraded' as ServiceHealth, uptime: 98.42, latency: '840ms', instances: 2  },
  { name: 'Notification Bus', status: 'healthy'  as ServiceHealth, uptime: 99.97, latency: '8ms',   instances: 2  },
  { name: 'Report Engine',    status: 'healthy'  as ServiceHealth, uptime: 99.81, latency: '380ms', instances: 1  },
  { name: 'WebSocket Hub',    status: 'healthy'  as ServiceHealth, uptime: 99.96, latency: '4ms',   instances: 2  },
  { name: 'File Storage',     status: 'healthy'  as ServiceHealth, uptime: 100,   latency: '18ms',  instances: 1  },
];

const WORKER_NODES = [
  { node: 'worker-01', cpu: 42, mem: 61, jobs: 184, status: 'healthy'  as ServiceHealth },
  { node: 'worker-02', cpu: 78, mem: 74, jobs: 291, status: 'degraded' as ServiceHealth },
  { node: 'worker-03', cpu: 31, mem: 48, jobs: 142, status: 'healthy'  as ServiceHealth },
  { node: 'worker-04', cpu: 18, mem: 39, jobs: 88,  status: 'healthy'  as ServiceHealth },
];

// ── Live Queue Feed ───────────────────────────────────────────────────────────
function LiveQueueFeed({ enabled }: { enabled: boolean }) {
  const { events } = useQueueTelemetry({ enabled, queues: ['payroll', 'ai-jobs', 'notif'] });

  const EVENT_STYLE = {
    completed: 'text-jade',
    active:    'text-aqua',
    failed:    'text-ember',
    delayed:   'text-gold',
    progress:  'text-slate-400',
  };

  return (
    <GlassCard className="p-5 flex flex-col gap-3 max-h-[320px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-jade" aria-hidden="true" />
          <p className="text-sm font-black text-white">Live Queue Telemetry</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${enabled ? 'bg-jade animate-pulse' : 'bg-slate-700'}`} aria-hidden="true" />
          <span className="text-[10px] text-slate-600">{enabled ? 'Connected' : 'Mocked'}</span>
        </div>
      </div>

      <div className="overflow-y-auto space-y-1 flex-1" role="log" aria-label="Queue event stream" aria-live="polite">
        {events.length === 0 ? (
          // Seed with mock events when WS not connected
          [
            { queue: 'payroll',  jobId: 'j-8821', event: 'completed', timestamp: new Date(Date.now() - 2000).toISOString()  },
            { queue: 'ai-jobs',  jobId: 'j-8820', event: 'active',    timestamp: new Date(Date.now() - 6000).toISOString()  },
            { queue: 'notif',    jobId: 'j-8819', event: 'completed', timestamp: new Date(Date.now() - 11000).toISOString() },
            { queue: 'payroll',  jobId: 'j-8818', event: 'delayed',   timestamp: new Date(Date.now() - 18000).toISOString() },
            { queue: 'ai-jobs',  jobId: 'j-8817', event: 'failed',    timestamp: new Date(Date.now() - 24000).toISOString() },
          ].map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] font-mono py-1 border-b border-white/[0.03]">
              <span className="text-slate-700 w-16 shrink-0">{new Date(e.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <span className="text-slate-600 w-20 shrink-0">{e.queue}</span>
              <span className="text-slate-500 shrink-0">{e.jobId}</span>
              <span className={`font-black capitalize ${EVENT_STYLE[e.event as keyof typeof EVENT_STYLE]}`}>{e.event}</span>
            </div>
          ))
        ) : (
          <AnimatePresence initial={false}>
            {events.slice(0, 50).map((e, i) => (
              <motion.div
                key={`${e.jobId}-${e.timestamp}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-[10px] font-mono py-1 border-b border-white/[0.03]"
              >
                <span className="text-slate-700 w-16 shrink-0">{new Date(e.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                <span className="text-slate-600 w-20 shrink-0">{e.queue}</span>
                <span className="text-slate-500 shrink-0">{e.jobId}</span>
                <span className={`font-black capitalize ${EVENT_STYLE[e.event as keyof typeof EVENT_STYLE]}`}>{e.event}</span>
                {e.progress !== undefined && (
                  <span className="text-slate-600">{e.progress}%</span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </GlassCard>
  );
}

// ── Service Health Grid ───────────────────────────────────────────────────────
function ServiceHealthGrid() {
  return (
    <GlassCard className="p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Server className="h-4 w-4 text-aqua" aria-hidden="true" />
        <p className="text-sm font-black text-white">Service Health</p>
      </div>
      <div className="space-y-2" role="list" aria-label="Service health status">
        {SERVICES.map((svc) => {
          const s = SERVICE_HEALTH_STYLE[svc.status];
          return (
            <div key={svc.name} role="listitem" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group">
              <span className={`h-2 w-2 rounded-full shrink-0 ${s.dot} ${svc.status === 'degraded' ? 'animate-pulse' : ''}`} aria-hidden="true" />
              <p className="flex-1 text-xs font-bold text-white">{svc.name}</p>
              <div className="flex items-center gap-3 text-[10px] shrink-0">
                <span className="text-slate-600">{svc.latency}</span>
                <span className="text-slate-700">·</span>
                <span className="text-slate-600">{svc.instances}x</span>
                <span className="text-slate-700">·</span>
                <span className={`font-black ${svc.uptime >= 99.9 ? 'text-jade' : svc.uptime >= 99 ? 'text-gold' : 'text-ember'}`}>
                  {svc.uptime}%
                </span>
              </div>
              <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity ${s.badge}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ── Worker Node Panel ─────────────────────────────────────────────────────────
function WorkerNodePanel() {
  return (
    <GlassCard className="p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Cpu className="h-4 w-4 text-ember" aria-hidden="true" />
        <p className="text-sm font-black text-white">Worker Nodes</p>
      </div>
      <div className="space-y-4" role="list" aria-label="Worker node metrics">
        {WORKER_NODES.map((node) => {
          const s = SERVICE_HEALTH_STYLE[node.status];
          return (
            <div key={node.node} role="listitem" className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
                  <span className="font-bold text-white font-mono">{node.node}</span>
                </div>
                <span className="text-slate-600">{node.jobs} jobs/m</span>
              </div>
              {/* CPU bar */}
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-slate-700 w-8 shrink-0">CPU</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/5" aria-hidden="true">
                  <div
                    className={`h-full rounded-full ${node.cpu > 70 ? 'bg-ember' : node.cpu > 50 ? 'bg-gold' : 'bg-jade'}`}
                    style={{ width: `${node.cpu}%` }}
                    role="progressbar" aria-valuenow={node.cpu} aria-valuemin={0} aria-valuemax={100} aria-label={`${node.node} CPU usage`}
                  />
                </div>
                <span className="text-slate-500 w-8 text-right font-black">{node.cpu}%</span>
              </div>
              {/* Mem bar */}
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-slate-700 w-8 shrink-0">MEM</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/5" aria-hidden="true">
                  <div
                    className={`h-full rounded-full ${node.mem > 80 ? 'bg-ember' : node.mem > 60 ? 'bg-gold' : 'bg-aqua'}`}
                    style={{ width: `${node.mem}%` }}
                    role="progressbar" aria-valuenow={node.mem} aria-valuemin={0} aria-valuemax={100} aria-label={`${node.node} memory usage`}
                  />
                </div>
                <span className="text-slate-500 w-8 text-right font-black">{node.mem}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ── ObservabilityDashboard ────────────────────────────────────────────────────
/**
 * ObservabilityDashboard — Phase 4 Priority 1
 * Operational telemetry: API latency percentiles, queue throughput,
 * AI token consumption, service health registry, worker node vitals,
 * live queue event stream (WebSocket-backed in Phase 3C).
 *
 * Data: DTO-shaped mock — Phase 3C wires to Prometheus/metrics endpoints.
 */
export function ObservabilityDashboard() {
  const [wsEnabled] = useState(false); // Phase 3C: set true when WS gateway live

  return (
    <section aria-labelledby="obs-heading">
      <h1 id="obs-heading" className="sr-only">Observability Command Center</h1>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="section-label text-jade mb-2">Platform Telemetry</p>
          <h2 className="text-3xl font-black tracking-tighter text-white">Observability Command Center</h2>
          <p className="text-sm text-slate-400 mt-1">
            8 services monitored · 4 worker nodes · 99.94% platform uptime
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-jade/20 bg-jade/5">
          <CheckCircle2 className="h-3.5 w-3.5 text-jade" aria-hidden="true" />
          <span className="text-xs font-bold text-jade">7/8 Services Healthy</span>
        </div>
      </div>

      {/* KPIs */}
      <SuspenseDashboardBoundary context="Observability KPIs" skeletonType="card" skeletonRows={4}>
        <KpiStrip tiles={OBS_KPIS as unknown as Parameters<typeof KpiStrip>[0]['tiles']} columns={4} />
      </SuspenseDashboardBoundary>

      {/* API latency + AI tokens */}
      <div className="mt-6 grid lg:grid-cols-2 gap-5">
        <AreaTrendChart
          data={API_LATENCY_TREND} xKey="time"
          series={[
            { key: 'p50', label: 'P50 (ms)', color: 'jade'  },
            { key: 'p95', label: 'P95 (ms)', color: 'gold'  },
            { key: 'p99', label: 'P99 (ms)', color: 'ember' },
          ]}
          title="API Latency Percentiles"
          subtitle="Last 24h · P50, P95, P99 (ms)"
          height={240}
        />
        <AreaTrendChart
          data={AI_TOKEN_TREND} xKey="day"
          series={[
            { key: 'input',  label: 'Input Tokens',  color: 'aqua'  },
            { key: 'output', label: 'Output Tokens', color: 'ember' },
          ]}
          title="AI Token Consumption"
          subtitle="Last 7 days · input vs output tokens"
          height={240}
        />
      </div>

      {/* Queue throughput */}
      <div className="mt-5">
        <BarTrendChart
          data={QUEUE_THROUGHPUT} xKey="queue"
          series={[
            { key: 'processed', label: 'Processed', color: 'jade'  },
            { key: 'failed',    label: 'Failed',    color: 'ember' },
            { key: 'delayed',   label: 'Delayed',   color: 'gold'  },
          ]}
          title="Queue Throughput (last hour)"
          subtitle="Processed vs failed vs delayed jobs by queue"
          height={220}
          stacked={false}
        />
      </div>

      {/* Service health + worker nodes + live feed */}
      <div className="mt-5 grid lg:grid-cols-3 gap-5">
        <ServiceHealthGrid />
        <WorkerNodePanel />
        <LiveQueueFeed enabled={wsEnabled} />
      </div>

      {/* System health footer */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-5 surface-raised border-subtle rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center"
        role="status"
        aria-label="System platform status"
      >
        <p className="section-label text-slate-600">Platform Status</p>
        {[
          { icon: Server,      label: 'API Gateway: 99.98% uptime', color: 'text-jade' },
          { icon: MemoryStick, label: 'Redis: 4.2GB / 8GB',         color: 'text-aqua' },
          { icon: Wifi,        label: 'WS Hub: 312 connections',     color: 'text-jade' },
          { icon: BrainCircuit,label: 'AI: 1 model degraded',        color: 'text-gold' },
          { icon: BarChart3,   label: 'Queues: 2,841 jobs/min',      color: 'text-jade' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <item.icon className={`h-3.5 w-3.5 ${item.color}`} aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-400">{item.label}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
