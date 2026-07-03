'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
 Shield, AlertTriangle, Eye, Lock, Globe,
 Smartphone, MonitorCheck, XCircle, CheckCircle2,
 ArrowUpRight, RefreshCw, Download, Filter,
 Activity, Fingerprint, MapPin,
} from 'lucide-react';
import {
 KpiStrip, AreaTrendChart, BarTrendChart,
 GlassCard, SuspenseDashboardBoundary,
} from '@/components/system';

/* ── DTO-shaped mock data ────────────────────────────────────────────────────── */ const SOC_KPIS = [
 { label: 'Threat Score', value: '12/100', trend: -18, icon: Shield, iconColor: 'text-jade' },
 { label: 'Suspicious Sessions',value: '3', trend: -40, icon: AlertTriangle,iconColor: 'text-gold' },
 { label: 'MFA Coverage', value: '94.2%', trend: 2.1, icon: Lock, iconColor: 'text-aqua' },
 { label: 'Geo Anomalies (24h)',value: '2', trend: 0, icon: Globe, iconColor: 'text-ember' },
];

const THREAT_TREND = [
 { day: 'Mon', threats: 14, blocked: 13, allowed: 1 },
 { day: 'Tue', threats: 8, blocked: 8, allowed: 0 },
 { day: 'Wed', threats: 21, blocked: 19, allowed: 2 },
 { day: 'Thu', threats: 11, blocked: 11, allowed: 0 },
 { day: 'Fri', threats: 18, blocked: 16, allowed: 2 },
 { day: 'Sat', threats: 6, blocked: 6, allowed: 0 },
 { day: 'Sun', threats: 4, blocked: 4, allowed: 0 },
];

const AUTH_PATTERN = [
 { hour: '00', success: 12, failed: 1 },
 { hour: '04', success: 8, failed: 0 },
 { hour: '08', success: 184, failed: 3 },
 { hour: '10', success: 312, failed: 5 },
 { hour: '12', success: 281, failed: 4 },
 { hour: '14', success: 294, failed: 2 },
 { hour: '16', success: 248, failed: 6 },
 { hour: '18', success: 142, failed: 2 },
 { hour: '20', success: 64, failed: 1 },
 { hour: '23', success: 28, failed: 0 },
];

type ThreatLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
const THREAT_STYLE: Record<ThreatLevel, { dot: string; badge: string }> = {
 critical: { dot: 'bg-ember', badge: 'bg-ember/15 text-ember border-ember/20' },
 high: { dot: 'bg-gold', badge: 'bg-gold/15 text-gold border-gold/20' },
 medium: { dot: 'bg-aqua', badge: 'bg-aqua/15 text-aqua border-aqua/20' },
 low: { dot: 'bg-jade', badge: 'bg-jade/15 text-jade border-jade/20' },
 info: { dot: 'bg-slate-600',badge: 'bg-slate-50 text-slate-500 border-white/8'},
};

const THREAT_FEED = [
 { id: 'T-1041', level: 'high' as ThreatLevel, title: 'Credential stuffing attempt', source: '185.220.101.x', location: 'TOR Exit Node', time: '3m ago', status: 'blocked' },
 { id: 'T-1040', level: 'medium' as ThreatLevel, title: 'Geo anomaly: login from DE', source: 'hr@company.com',location: 'Frankfurt, DE', time: '28m ago', status: 'flagged' },
 { id: 'T-1039', level: 'critical' as ThreatLevel, title: 'Privilege escalation attempt', source: 'intern account',location: 'Bengaluru, IN', time: '1h ago', status: 'blocked' },
 { id: 'T-1038', level: 'low' as ThreatLevel, title: 'MFA bypass attempt (SMS OTP)', source: 'sales@co.com', location: 'Mumbai, IN', time: '2h ago', status: 'allowed' },
 { id: 'T-1037', level: 'high' as ThreatLevel, title: 'Brute force — admin endpoint', source: '103.44.12.x', location: 'CN', time: '4h ago', status: 'blocked' },
];

const SUSPICIOUS_SESSIONS = [
 { user: 'anon-8821', ip: '185.220.101.47', location: 'TOR', device: 'Unknown', risk: 94, lastSeen: '3m ago' },
 { user: 'hr.manager', ip: '82.141.0.12', location: 'Frankfurt, DE', device: 'Chrome/Linux', risk: 71, lastSeen: '28m ago' },
 { user: 'intern-2041', ip: '10.0.4.18', location: 'Bengaluru, IN', device: 'Mobile', risk: 62, lastSeen: '1h ago' },
];

const MFA_COMPLIANCE = [
 { group: 'Super Admins', total: 4, mfaOn: 4, pct: 100 },
 { group: 'HR Managers', total: 12, mfaOn: 11, pct: 91 },
 { group: 'Finance', total: 8, mfaOn: 8, pct: 100 },
 { group: 'Engineering', total: 81, mfaOn: 74, pct: 91 },
 { group: 'Sales', total: 62, mfaOn: 54, pct: 87 },
 { group: 'All Staff', total: 430,mfaOn: 405,pct: 94 },
];

/* ── Threat Feed Panel ───────────────────────────────────────────────────────── */ function ThreatFeed() {
 const STATUS_STYLE = {
 blocked: 'bg-jade/10 text-jade border-jade/15',
 flagged: 'bg-gold/10 text-gold border-gold/15',
 allowed: 'bg-ember/10 text-ember border-ember/15',
 };

 return (
 <GlassCard className="p-6 flex flex-col gap-4">
 <div className="flex items-center justify-between gap-3 flex-wrap">
 <div className="flex items-center gap-2">
 <Activity className="h-4 w-4 text-ember" aria-hidden="true" />
 <p className="text-sm font-black text-white">Live Threat Feed</p>
 </div>
 <div className="flex items-center gap-2">
 <button aria-label="Refresh threat feed" className="h-7 w-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
 <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 <button aria-label="Export threat feed" className="h-7 w-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
 <Download className="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 </div>
 </div>

 <div className="space-y-2" role="list" aria-label="Security threat feed">
 {THREAT_FEED.map((threat) => {
 const s = THREAT_STYLE[threat.level];
 return (
 <div key={threat.id} role="listitem" className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[0.04] hover:bg-white/[0.03] group transition-colors">
 <span className={`h-2 w-2 rounded-full shrink-0 mt-1.5 ${s.dot}`} aria-hidden="true" />
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2 flex-wrap">
 <p className="text-xs font-bold text-navy">{threat.title}</p>
 <div className="flex items-center gap-1.5 shrink-0">
 <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black capitalize ${s.badge}`}>
 {threat.level}
 </span>
 <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black capitalize ${STATUS_STYLE[threat.status as keyof typeof STATUS_STYLE]}`}>
 {threat.status}
 </span>
 </div>
 </div>
 <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
 <span>{threat.id}</span>
 <span>·</span>
 <span className="font-mono">{threat.source}</span>
 <span>·</span>
 <MapPin className="h-2.5 w-2.5 inline" aria-hidden="true" />
 <span>{threat.location}</span>
 <span>·</span>
 <span>{threat.time}</span>
 </div>
 </div>
 <button aria-label={`Investigate threat ${threat.id}`} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-white">
 <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
 </button>
 </div>
 );
 })}
 </div>
 </GlassCard>
 );
}

/* ── Suspicious Sessions Panel ───────────────────────────────────────────────── */ function SuspiciousSessions() {
 return (
 <GlassCard className="p-6 flex flex-col gap-4">
 <div className="flex items-center gap-2">
 <Eye className="h-4 w-4 text-gold" aria-hidden="true" />
 <p className="text-sm font-black text-white">Suspicious Sessions</p>
 <span className="ml-auto text-xs font-black text-ember">{SUSPICIOUS_SESSIONS.length} active</span>
 </div>
 <div className="space-y-3" role="list" aria-label="Suspicious active sessions">
 {SUSPICIOUS_SESSIONS.map((sess) => (
 <div key={sess.user} role="listitem" className="p-4 rounded-xl border border-gold/10 bg-gold/[0.03] space-y-3">
 <div className="flex items-start justify-between gap-2">
 <div>
 <p className="text-xs font-bold text-navy font-mono">{sess.user}</p>
 <p className="text-[10px] text-slate-600 mt-0.5">{sess.ip} · {sess.location} · {sess.device}</p>
 </div>
 <div className="text-right shrink-0">
 <p className={`text-sm font-black ${sess.risk >= 90 ? 'text-ember' : sess.risk >= 70 ? 'text-gold' : 'text-aqua'}`}>
 {sess.risk}
 </p>
 <p className="text-[9px] text-slate-700">risk score</p>
 </div>
 </div>
 <div className="h-1.5 rounded-full bg-white/5">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${sess.risk}%` }}
 transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
 className={`h-full rounded-full ${sess.risk >= 90 ? 'bg-ember' : sess.risk >= 70 ? 'bg-gold' : 'bg-aqua'}`}
 role="progressbar" aria-valuenow={sess.risk} aria-valuemin={0} aria-valuemax={100}
 />
 </div>
 <div className="flex gap-2">
 <button className="flex-1 text-[10px] font-black text-ember border border-ember/20 bg-ember/5 rounded-lg py-1.5 hover:bg-ember/10 transition-colors">
 Terminate Session
 </button>
 <button className="flex-1 text-[10px] font-black text-gold border border-gold/20 bg-gold/5 rounded-lg py-1.5 hover:bg-gold/10 transition-colors">
 Flag for Review
 </button>
 </div>
 </div>
 ))}
 </div>
 </GlassCard>
 );
}

/* ── MFA Compliance Panel ────────────────────────────────────────────────────── */ function MfaCompliancePanel() {
 return (
 <GlassCard className="p-6 flex flex-col gap-4">
 <div className="flex items-center gap-2">
 <Fingerprint className="h-4 w-4 text-aqua" aria-hidden="true" />
 <p className="text-sm font-black text-white">MFA Compliance</p>
 </div>
 <div className="space-y-3" role="list" aria-label="MFA compliance by group">
 {MFA_COMPLIANCE.map((group) => (
 <div key={group.group} role="listitem" className="space-y-1.5">
 <div className="flex items-center justify-between text-xs">
 <span className={`font-semibold ${group.group === 'All Staff' ? 'text-white font-black' : 'text-slate-500'}`}>
 {group.group}
 </span>
 <div className="flex items-center gap-2 text-[10px]">
 <span className="text-slate-600">{group.mfaOn}/{group.total}</span>
 <span className={`font-black ${group.pct === 100 ? 'text-jade' : group.pct >= 90 ? 'text-gold' : 'text-ember'}`}>
 {group.pct}%
 </span>
 </div>
 </div>
 <div className="h-1.5 rounded-full bg-white/5" aria-hidden="true">
 <motion.div
 initial={{ width: 0 }}
 whileInView={{ width: `${group.pct}%` }}
 viewport={{ once: true }}
 transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
 className={`h-full rounded-full ${group.pct === 100 ? 'bg-jade' : group.pct >= 90 ? 'bg-gold' : 'bg-ember'}`}
 />
 </div>
 </div>
 ))}
 </div>
 <div className="pt-3 border-t border-white/5">
 <p className="text-xs text-slate-600">
 <span className="font-black text-ember">25 accounts</span> without MFA — automated enforcement reminder scheduled for Monday
 </p>
 </div>
 </GlassCard>
 );
}

// ── SecurityOperationsCenter ──────────────────────────────────────────────────
/**
 * SecurityOperationsCenter — Phase 4 Priority 2
 * Zero Trust security operations: threat feed, suspicious session tracking,
 * auth pattern analysis, threat trend, MFA compliance by group.
 *
 * Data: DTO-shaped mock — Phase 4 wires to /api/security endpoints + WS threat stream.
 */
export function SecurityOperationsCenter() {
 return (
 <section aria-labelledby="soc-heading">
 <h1 id="soc-heading" className="sr-only">Security Operations Center</h1>

 {/* Header */}
 <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
 <div>
 <p className="section-label text-ember mb-2">Zero Trust Operations</p>
 <h2 className="text-3xl font-black tracking-tighter text-white">Security Operations Center</h2>
 <p className="text-sm text-slate-500 mt-1">
 Threat score: 12/100 · 3 suspicious sessions · MFA: 94.2% coverage
 </p>
 </div>
 <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-jade/20 bg-jade/5">
 <Shield className="h-3.5 w-3.5 text-jade" aria-hidden="true" />
 <span className="text-xs font-bold text-jade">Threat Level: Low</span>
 </div>
 </div>

 {/* KPIs */}
 <SuspenseDashboardBoundary context="SOC KPIs" skeletonType="card" skeletonRows={4}>
 <KpiStrip tiles={SOC_KPIS as unknown as Parameters<typeof KpiStrip>[0]['tiles']} columns={4} />
 </SuspenseDashboardBoundary>

 {/* Threat trend + auth pattern */}
 <div className="mt-6 grid lg:grid-cols-2 gap-5">
 <BarTrendChart
 data={THREAT_TREND} xKey="day"
 series={[
 { key: 'blocked', label: 'Blocked', color: 'jade' },
 { key: 'allowed', label: 'Allowed', color: 'ember' },
 ]}
 title="Threat Events (7 days)"
 subtitle="Blocked vs allowed threat events per day"
 height={240}
 />
 <AreaTrendChart
 data={AUTH_PATTERN} xKey="hour"
 series={[
 { key: 'success', label: 'Successful Auth', color: 'jade' },
 { key: 'failed', label: 'Failed Auth', color: 'ember' },
 ]}
 title="Auth Pattern (24h)"
 subtitle="Successful vs failed authentication events by hour"
 height={240}
 />
 </div>

 {/* Threat feed + suspicious sessions + MFA */}
 <div className="mt-5 grid lg:grid-cols-3 gap-5">
 <div className="lg:col-span-1">
 <SuspiciousSessions />
 </div>
 <div className="lg:col-span-1">
 <MfaCompliancePanel />
 </div>
 <div className="lg:col-span-1">
 <GlassCard className="p-6 flex flex-col gap-3">
 <div className="flex items-center gap-2">
 <MonitorCheck className="h-4 w-4 text-jade" aria-hidden="true" />
 <p className="text-sm font-black text-white">Device Trust</p>
 </div>
 {[
 { label: 'Managed devices', value: '89%', color: 'text-jade' },
 { label: 'Corporate MDM enrolled',value: '84%', color: 'text-jade' },
 { label: 'Unmanaged (BYOD)', value: '11%', color: 'text-gold' },
 { label: 'Jailbroken detected', value: '0', color: 'text-jade' },
 { label: 'Certificate valid', value: '100%',color: 'text-jade' },
 ].map((stat) => (
 <div key={stat.label} className="flex justify-between items-center text-xs border-b border-white/[0.03] pb-2">
 <span className="text-slate-500">{stat.label}</span>
 <span className={`font-black ${stat.color}`}>{stat.value}</span>
 </div>
 ))}
 <div className="pt-2">
 <p className="text-[10px] text-slate-600">Phase 4: wire to MDM provider API</p>
 </div>
 </GlassCard>
 </div>
 </div>

 {/* Full threat feed */}
 <div className="mt-5">
 <ThreatFeed />
 </div>
 </section>
 );
}
