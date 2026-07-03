'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
 ShieldCheck, Lock, Eye, AlertTriangle, CheckCircle2,
 FileSearch, Globe, Cpu, XCircle, Clock, ArrowUpRight,
 Download, RefreshCw, Activity,
} from 'lucide-react';
import {
 KpiStrip, AreaTrendChart, BarTrendChart, DonutChart,
 GlassCard, SuspenseDashboardBoundary,
} from '@/components/system';
import { useApiResource } from '@/hooks/useApiResource';
import { platformApi, GovernanceStatsApiRecord } from '@/services/api/platform-api';

type RiskSeverity = 'critical' | 'high' | 'medium' | 'low';
const RISK_STYLE: Record<RiskSeverity, { dot: string; badge: string }> = {
 critical: { dot: 'bg-ember', badge: 'bg-ember/15 text-ember border-ember/20' },
 high: { dot: 'bg-gold', badge: 'bg-gold/15 text-gold border-gold/20' },
 medium: { dot: 'bg-aqua', badge: 'bg-aqua/15 text-aqua border-aqua/20' },
 low: { dot: 'bg-slate-600',badge: 'bg-slate-50 text-slate-500 border-white/8' },
};

const AUDIT_SEVERITY_STYLE: Record<string, string> = {
 info: 'bg-aqua/10 text-aqua border-aqua/15',
 warning: 'bg-gold/10 text-gold border-gold/15',
 critical: 'bg-ember/10 text-ember border-ember/15',
};

/* ── Risk Items Panel ────────────────────────────────────────────────────────── */ function RiskPanel({ risks }: { risks: GovernanceStatsApiRecord['riskItems'] }) {
 return (
 <GlassCard className="p-6 flex flex-col gap-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <AlertTriangle className="h-4 w-4 text-gold" aria-hidden="true" />
 <p className="text-sm font-black text-white">Open Risk Items</p>
 </div>
 <span className="text-xs font-black text-gold">{risks.length} open</span>
 </div>
 <div className="space-y-3" role="list" aria-label="Open risk items">
 {risks.map((risk) => {
 const s = RISK_STYLE[risk.severity as RiskSeverity] || RISK_STYLE.medium;
 return (
 <div key={risk.id} role="listitem" className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.04] hover:bg-white/[0.03] transition-colors group">
 <span className={`h-2 w-2 rounded-full shrink-0 mt-1 ${s.dot}`} aria-hidden="true" />
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <p className="text-xs font-bold text-navy leading-snug">{risk.title}</p>
 <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black capitalize ${s.badge}`}>
 {risk.severity}
 </span>
 </div>
 <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-600">
 <span>{risk.id}</span>
 <span>·</span>
 <span>Owner: {risk.owner}</span>
 <span>·</span>
 <span>{risk.detected}</span>
 </div>
 </div>
 <button aria-label={`View risk ${risk.id}`} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-white">
 <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 </div>
 );
 })}
 </div>
 <div className="pt-2 border-t border-white/5 flex justify-end">
 <button className="text-xs font-bold text-gold hover:underline">
 View Full Risk Register →
 </button>
 </div>
 </GlassCard>
 );
}

/* ── Framework Coverage Panel ────────────────────────────────────────────────── */ function FrameworkPanel({ frameworks }: { frameworks: GovernanceStatsApiRecord['frameworks'] }) {
 return (
 <GlassCard className="p-6 flex flex-col gap-4">
 <div className="flex items-center gap-2">
 <Globe className="h-4 w-4 text-jade" aria-hidden="true" />
 <p className="text-sm font-black text-white">Compliance Frameworks</p>
 </div>
 <div className="space-y-2" role="list" aria-label="Compliance frameworks">
 {frameworks.map((fw) => (
 <div key={fw.name} role="listitem" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
 <span className={`h-2 w-2 rounded-full shrink-0 ${fw.dot}`} aria-hidden="true" />
 <p className="flex-1 text-xs font-bold text-navy">{fw.name}</p>
 <p className={`text-xs font-semibold ${fw.color}`}>{fw.status}</p>
 {fw.expiry !== 'N/A' && (
 <p className="text-[10px] text-slate-600">Expires {fw.expiry}</p>
 )}
 </div>
 ))}
 </div>
 </GlassCard>
 );
}

/* ── Audit Log Panel ─────────────────────────────────────────────────────────── */ function AuditLogPanel({ logs }: { logs: GovernanceStatsApiRecord['auditLog'] }) {
 return (
 <GlassCard className="p-6 flex flex-col gap-4">
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <div className="flex items-center gap-2">
 <FileSearch className="h-4 w-4 text-aqua" aria-hidden="true" />
 <p className="text-sm font-black text-white">Forensic Audit Log</p>
 </div>
 <div className="flex items-center gap-2">
 <button aria-label="Refresh audit log" className="h-7 w-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
 <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 <button aria-label="Export audit log" className="h-7 w-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
 <Download className="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 </div>
 </div>
 <SuspenseDashboardBoundary context="AuditLog" skeletonType="table" skeletonRows={6}>
 <div className="overflow-x-auto -mx-6 px-6">
 <table className="w-full text-xs" aria-label="Forensic audit log">
 <thead>
 <tr className="border-b border-white/5">
 {['ID', 'Actor', 'Action', 'Module', 'Severity', 'Time'].map((h) => (
 <th key={h} className="text-left text-[10px] font-black text-slate-600 uppercase tracking-wide pb-3 pr-4">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {logs.map((log) => (
 <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
 <td className="py-2.5 pr-4 font-mono text-slate-600">{log.id}</td>
 <td className="py-2.5 pr-4 text-slate-600 max-w-[120px] truncate">{log.actor}</td>
 <td className="py-2.5 pr-4 font-bold text-navy">{log.action}</td>
 <td className="py-2.5 pr-4 text-slate-500">{log.module}</td>
 <td className="py-2.5 pr-4">
 <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black ${AUDIT_SEVERITY_STYLE[log.severity] || AUDIT_SEVERITY_STYLE.info}`}>
 {log.severity}
 </span>
 </td>
 <td className="py-2.5 text-slate-600">{log.time}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </SuspenseDashboardBoundary>
 </GlassCard>
 );
}

/* ── Compliance Coverage Gauges ──────────────────────────────────────────────── */ function ComplianceCoverage({ coverage }: { coverage: GovernanceStatsApiRecord['complianceCoverage'] }) {
 return (
 <GlassCard className="p-6 flex flex-col gap-4">
 <div className="flex items-center gap-2">
 <Cpu className="h-4 w-4 text-ember" aria-hidden="true" />
 <p className="text-sm font-black text-white">Framework Coverage</p>
 </div>
 <div className="grid grid-cols-2 gap-4">
 {coverage.map((fw) => (
 <div key={fw.name} className="flex flex-col items-center gap-2">
 <div className="relative h-20 w-20">
 <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
 <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
 <motion.circle
 cx="18" cy="18" r="14" fill="none"
 stroke={fw.color === 'jade' ? '#10B981' : fw.color === 'aqua' ? '#0F8B8D' : fw.color === 'gold' ? '#F2AA3B' : '#E85A2A'}
 strokeWidth="3" strokeLinecap="round"
 strokeDasharray={`${(fw.value / 100) * 87.96} 87.96`}
 initial={{ strokeDasharray: '0 87.96' }}
 whileInView={{ strokeDasharray: `${(fw.value / 100) * 87.96} 87.96` }}
 viewport={{ once: true }}
 transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
 />
 </svg>
 <div className="absolute inset-0 flex items-center justify-center">
 <span className="text-sm font-black text-white">{fw.value}%</span>
 </div>
 </div>
 <p className="text-[10px] font-bold text-slate-500 text-center">{fw.name}</p>
 </div>
 ))}
 </div>
 </GlassCard>
 );
}

// ── GovernanceDashboard ───────────────────────────────────────────────────────
/**
 * GovernanceDashboard — Phase 8
 * Zero Trust security posture: compliance score trend, auth event analysis,
 * framework coverage gauges, open risk register, forensic audit log.
 *
 * Data: Fetched via platformApi.getGovernanceStats()
 */
export function GovernanceDashboard() {
 const { data, loading, error } = useApiResource<GovernanceStatsApiRecord>({
 loader: async () => platformApi.getGovernanceStats(),
 fallback: null as any,
 });

 if (loading || !data) {
 return (
 <section aria-labelledby="governance-heading">
 <h1 id="governance-heading" className="sr-only">Governance & Security Center</h1>
 <div className="animate-pulse space-y-6">
 <div className="h-20 bg-slate-50/40 rounded-xl"></div>
 <div className="h-64 bg-slate-50/40 rounded-xl"></div>
 </div>
 </section>
 );
 }

 const GOV_KPIS = [
 { label: 'Compliance Score', value: `${data.kpis.complianceScore}/100`, trend: 2.1, icon: ShieldCheck, iconColor: 'text-jade' },
 { label: 'Open Risk Items', value: `${data.kpis.openRiskItems}`, trend: -40, icon: AlertTriangle, iconColor: 'text-gold' },
 { label: 'Failed Auth (24h)', value: `${data.kpis.failedAuth24h}`, trend: -25, icon: Lock, iconColor: 'text-aqua' },
 { label: 'Audit Events (24h)', value: `${data.kpis.auditEvents24h.toLocaleString()}`, trend: 3.4, icon: FileSearch, iconColor: 'text-ember' },
 ];

 return (
 <section aria-labelledby="governance-heading">
 <h1 id="governance-heading" className="sr-only">Governance & Security Center</h1>

 {/* Header */}
 <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
 <div>
 <p className="section-label text-jade mb-2">Zero Trust Governance</p>
 <h2 className="text-3xl font-black tracking-tighter text-white">Security Command Center</h2>
 <p className="text-sm text-slate-500 mt-1">
 Compliance score: {data.kpis.complianceScore}/100 · {data.kpis.openRiskItems} open risks
 </p>
 </div>
 <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-jade/20 bg-jade/5">
 <Activity className="h-3.5 w-3.5 text-jade animate-pulse" aria-hidden="true" />
 <span className="text-xs font-bold text-jade">All Systems Secure</span>
 </div>
 </div>

 {/* KPIs */}
 <SuspenseDashboardBoundary context="Governance KPIs" skeletonType="card" skeletonRows={4}>
 <KpiStrip tiles={GOV_KPIS as unknown as Parameters<typeof KpiStrip>[0]['tiles']} columns={4} />
 </SuspenseDashboardBoundary>

 {/* Posture trend + auth events */}
 <div className="mt-6 grid lg:grid-cols-2 gap-5">
 <AreaTrendChart
 data={data.postureTrend} xKey="month"
 series={[
 { key: 'score', label: 'Posture Score', color: 'jade' },
 { key: 'violations', label: 'Violations', color: 'ember' },
 ]}
 title="Compliance Posture Trend"
 subtitle="Last 6 months · score vs violations"
 height={240}
 />
 <BarTrendChart
 data={data.authEvents} xKey="week"
 series={[
 { key: 'success', label: 'Successful Auth', color: 'jade' },
 { key: 'mfa', label: 'MFA Verified', color: 'aqua' },
 { key: 'failed', label: 'Failed Auth', color: 'ember' },
 ]}
 title="Authentication Events"
 subtitle="Last 6 weeks · success, MFA, failed"
 height={240}
 stacked={false}
 />
 </div>

 {/* Coverage gauges + risk panel + framework panel */}
 <div className="mt-5 grid lg:grid-cols-3 gap-5">
 <ComplianceCoverage coverage={data.complianceCoverage} />
 <RiskPanel risks={data.riskItems} />
 <FrameworkPanel frameworks={data.frameworks} />
 </div>

 {/* Audit log */}
 <div className="mt-5">
 <AuditLogPanel logs={data.auditLog} />
 </div>

 {/* Zero Trust status footer */}
 <motion.div
 initial={{ opacity: 0, y: 12 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 className="mt-5 surface-raised border-subtle rounded-2xl px-6 py-4 flex flex-wrap gap-6 items-center"
 role="status"
 aria-label="Security posture status"
 >
 <p className="section-label text-slate-600">Zero Trust Status</p>
 {[
 { icon: Lock, label: 'Encryption: AES-256 at rest', color: 'text-jade' },
 { icon: Eye, label: 'Audit: All events logged', color: 'text-aqua' },
 { icon: ShieldCheck, label: 'MFA: 94% coverage', color: 'text-jade' },
 { icon: Globe, label: 'Data residency: Compliant', color: 'text-jade' },
 { icon: XCircle, label: '0 data breaches (all-time)', color: 'text-jade' },
 ].map((item) => (
 <div key={item.label} className="flex items-center gap-1.5">
 <item.icon className={`h-3.5 w-3.5 ${item.color}`} aria-hidden="true" />
 <span className="text-xs font-semibold text-slate-500">{item.label}</span>
 </div>
 ))}
 </motion.div>
 </section>
 );
}
