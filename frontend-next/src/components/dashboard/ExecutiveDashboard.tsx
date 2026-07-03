'use client';

import React, { useState } from 'react';
import { 
 BrainCircuit, 
 TrendingUp, 
 AlertTriangle, 
 Target, 
 Zap, 
 BarChart3, 
 ChevronRight,
 ShieldCheck,
 Microscope
} from 'lucide-react';
import { ThreeDGlassCard } from '../ui/ThreeDGlassCard';

export function ExecutiveDashboard() {
 const [activeTab, setActiveTab] = useState<'strategy' | 'risks' | 'simulation'>('strategy');

 return (
 <div className="min-h-screen bg-[#020811] text-slate-100 p-6 lg:p-10 selection:bg-slate-50mber/30">
 {/* Animated background glow */}
 <div className="fixed inset-0 pointer-events-none overflow-hidden">
 <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] bg-slate-50mber/10 blur-[150px] rounded-full animate-pulse" />
 <div className="absolute bottom-[10%] right-[20%] w-[40%] h-[40%] bg-aqua/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />
 </div>

 <header className="relative mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
 <div>
 <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-4">
 <div className="p-3 bg-gradient-to-br from-ember to-amber rounded-2xl shadow-xl shadow-amber/20">
 <BrainCircuit className="h-8 w-8 text-white" />
 </div>
 AI Executive Brain <span className="text-sm font-normal text-slate-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/10 uppercase tracking-[0.2em] ml-2 backdrop-blur-xl">CEO Mode</span>
 </h1>
 <p className="mt-4 text-slate-500 max-w-2xl text-lg leading-relaxed">
 Autonomous organizational intelligence orchestrating strategy, risk mitigation, and hyperscale simulations.
 </p>
 </div>
 <div className="flex gap-4">
 <button className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all text-sm font-semibold backdrop-blur-xl group">
 <Zap className="h-4 w-4 text-aqua group-hover:scale-125 transition" /> Run Intelligence Scan
 </button>
 <button className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-ember to-amber rounded-2xl hover:opacity-90 hover:scale-105 transition-all text-sm font-bold text-navy shadow-2xl shadow-amber/20">
 Execute Q3 Strategy
 </button>
 </div>
 </header>

 <nav className="relative flex gap-2 bg-white/5 p-1.5 rounded-[1.5rem] border border-white/10 mb-12 w-fit backdrop-blur-2xl">
 {[
 { id: 'strategy', label: 'Strategy Engine', icon: Target },
 { id: 'risks', label: 'Risk Heatmap', icon: AlertTriangle },
 { id: 'simulation', label: 'Digital Twin', icon: Microscope },
 ].map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl text-sm font-bold tracking-wide transition-all ${
 activeTab === tab.id 
 ? 'bg-white/10 text-white shadow-xl border border-white/10' 
 : 'text-slate-500 hover:text-slate-600 hover:bg-white/5'
 }`}
 >
 <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-amber' : ''}`} />
 {tab.label}
 </button>
 ))}
 </nav>

 <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-10">
 <div className="lg:col-span-2 space-y-10">
 <ThreeDGlassCard className="p-10 group overflow-hidden" intensity={10}>
 <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700">
 <BrainCircuit className="h-48 w-48" />
 </div>
 
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-8">
 <span className="px-5 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold uppercase tracking-[0.2em] backdrop-blur-md">
 Active Optimization Cycle
 </span>
 <span className="text-slate-500 text-sm font-medium">Synced: 12m ago</span>
 </div>
 
 <h2 className="text-3xl font-bold text-navy mb-8 tracking-tight">Autonomous Growth Matrix <span className="text-amber">V4.2</span></h2>
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
 {[
 { label: 'Revenue Forecast', value: '+24.8%', color: 'text-aqua' },
 { label: 'Efficiency Index', value: '94.2%', color: 'text-emerald-400' },
 { label: 'Trust Coefficient', value: '0.985', color: 'text-amber' },
 ].map((stat) => (
 <div key={stat.label} className="glass-3d-panel p-6">
 <p className="text-xs text-slate-500 uppercase font-bold tracking-[0.15em] mb-2">{stat.label}</p>
 <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
 </div>
 ))}
 </div>

 <div className="space-y-6">
 <div className="p-8 glass-3d-panel group/item">
 <h3 className="font-bold text-navy mb-3 flex items-center gap-3 text-lg">
 <TrendingUp className="h-5 w-5 text-aqua" /> Workforce Expansion Strategy
 </h3>
 <p className="text-slate-500 text-base leading-relaxed">
 AI recommends increasing headcount in <span className="text-white font-semibold">Engineering (Cloud Native)</span> by 12% to meet projected H2 demand. 
 Shift focus from lateral hiring to <span className="text-white font-semibold">Internal Talent Mobility</span> to reduce acquisition costs by 18.4%.
 </p>
 </div>
 
 <div className="p-8 glass-3d-panel group/item">
 <h3 className="font-bold text-navy mb-3 flex items-center gap-3 text-lg">
 <Zap className="h-5 w-5 text-amber" /> Cost Optimization Path
 </h3>
 <p className="text-slate-500 text-base leading-relaxed">
 Detected redundancy in <span className="text-white font-semibold">Procurement Workflows</span>. 
 Implementing Autonomous Agent #82 (ProcureBot) will save approximately $14,200/mo in overhead.
 </p>
 </div>
 </div>

 <button className="mt-10 flex items-center gap-3 text-amber font-bold text-sm hover:gap-5 transition-all group">
 Download Full Sovereign Report <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition" />
 </button>
 </div>
 </ThreeDGlassCard>

 <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <ThreeDGlassCard className="p-8" intensity={5}>
 <h3 className="font-bold text-navy mb-6 flex items-center gap-3 text-lg">
 <Microscope className="h-6 w-6 text-aqua" /> Attrition Simulation
 </h3>
 <div className="h-32 bg-black/40 rounded-2xl mb-6 flex items-end p-5 gap-3 border border-white/5">
 {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
 <div key={i} className="flex-1 bg-aqua/20 rounded-t-md relative group/bar">
 <div className="absolute bottom-0 w-full bg-aqua group-hover/bar:bg-slate-50mber transition-all duration-500 rounded-t-md" style={{ height: `${h}%` }} />
 </div>
 ))}
 </div>
 <p className="text-sm text-slate-500 leading-relaxed">
 Predicting 12% attrition in <span className="text-white font-medium">Marketing</span> if workload trend persists.
 </p>
 </ThreeDGlassCard>

 <ThreeDGlassCard className="p-8" intensity={5}>
 <h3 className="font-bold text-navy mb-6 flex items-center gap-3 text-lg">
 <BarChart3 className="h-6 w-6 text-emerald-400" /> Revenue Digital Twin
 </h3>
 <div className="h-32 bg-black/40 rounded-2xl mb-6 flex items-center justify-center border border-white/5">
 <div className="relative">
 <div className="absolute inset-0 bg-emerald-400/20 blur-xl animate-pulse" />
 <span className="relative text-emerald-400 font-mono text-xl font-bold tracking-widest">SIMULATION ACTIVE</span>
 </div>
 </div>
 <p className="text-sm text-slate-500 leading-relaxed">
 Scaling Sales team by 5x predicts a <span className="text-white font-medium">3.2x Revenue Multiple</span> in 18 months.
 </p>
 </ThreeDGlassCard>
 </section>
 </div>

 <div className="space-y-10">
 <ThreeDGlassCard className="p-8 shadow-3xl" intensity={8}>
 <h3 className="text-xl font-bold text-navy mb-8 flex items-center gap-3">
 <ShieldCheck className="h-6 w-6 text-emerald-400" /> Security Posture
 </h3>
 
 <div className="space-y-5">
 <div className="flex items-center justify-between p-5 glass-3d-panel">
 <div>
 <p className="text-sm font-bold text-navy mb-1">Trust Invariant Score</p>
 <p className="text-xs text-slate-500 tracking-wide">Org-wide average</p>
 </div>
 <div className="text-3xl font-black text-emerald-400">0.99</div>
 </div>
 
 <div className="flex items-center justify-between p-5 glass-3d-panel">
 <div>
 <p className="text-sm font-bold text-navy mb-1">Active Anomalies</p>
 <p className="text-xs text-slate-500 tracking-wide">Behavioral drift detected</p>
 </div>
 <div className="text-3xl font-black text-amber">02</div>
 </div>
 </div>

 <div className="mt-10">
 <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-6 border-b border-white/10 pb-2">Forensic Audit Log</p>
 <div className="space-y-4">
 {[
 { time: '12:44', msg: 'Geo-Drift: Admin Session #42', status: 'LOCKED' },
 { time: '10:12', msg: 'Bulk Export: Payroll Batch #9', status: 'VERIFIED' },
 { time: '09:05', msg: 'New IP: Executive Strategy Access', status: 'CHALLENGED' },
 ].map((log, i) => (
 <div key={i} className="flex items-center justify-between text-xs p-4 glass-3d-panel transition group/log">
 <span className="text-slate-500 font-mono group-hover/log:text-slate-600 transition">{log.time}</span>
 <span className="text-slate-600 font-medium">{log.msg}</span>
 <span className={`font-bold tracking-widest ${log.status === 'LOCKED' ? 'text-amber' : log.status === 'VERIFIED' ? 'text-emerald-400' : 'text-aqua'}`}>{log.status}</span>
 </div>
 ))}
 </div>
 </div>
 </ThreeDGlassCard>

 <ThreeDGlassCard className="p-8" intensity={5}>
 <h3 className="text-xl font-bold text-navy mb-8 tracking-tight">Global Compliance</h3>
 <div className="grid grid-cols-2 gap-5">
 {[
 { label: 'INDIA', status: 'OK', color: 'text-emerald-400' },
 { label: 'UAE', status: 'OK', color: 'text-emerald-400' },
 { label: 'USA', status: 'OK', color: 'text-emerald-400' },
 { label: 'EU', status: 'DRIFT', color: 'text-amber' },
 ].map((region) => (
 <div key={region.label} className="p-5 glass-3d-panel text-center group/region transition">
 <p className="text-xs text-slate-500 font-black tracking-[0.2em] mb-2">{region.label}</p>
 <p className={`text-2xl font-black ${region.color}`}>{region.status}</p>
 </div>
 ))}
 </div>
 <button className="mt-8 w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-navy hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all backdrop-blur-xl">
 Resolve EU Compliance Drift
 </button>
 </ThreeDGlassCard>
 </div>
 </div>
 </div>
 );
}
