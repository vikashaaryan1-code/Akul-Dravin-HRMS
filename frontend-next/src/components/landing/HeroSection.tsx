import Link from 'next/link';

/* ── Live Metric Ticker ──────────────────────────────────────────────────────── */ const LIVE_METRICS = [
 { value: '99.99%', label: 'Platform Uptime' },
 { value: '200+', label: 'Workflow Automations' },
 { value: '9', label: 'BullMQ Queue Types' },
 { value: '<35ms', label: 'Avg API Response' },
];

/* ── Neural grid background ───────────────────────────────────────────────────── */ function GridMesh() {
 return (
 <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
 {/* Deep gradient base */}
 <div className="absolute inset-0 bg-gradient-to-br from-[#04101f] via-[#070d1a] to-[#0a0f1e]" />

 {/* Dot-grid overlay */}
 <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
 <defs>
 <pattern id="hero-dots" width="40" height="40" patternUnits="userSpaceOnUse">
 <circle cx="1" cy="1" r="1" fill="#60a5fa" />
 </pattern>
 </defs>
 <rect width="100%" height="100%" fill="url(#hero-dots)" />
 </svg>

 {/* Ambient glow blobs */}
 <div className="absolute top-[-15%] left-[-8%] w-[45%] h-[45%] rounded-full bg-blue-600/10 blur-[140px]" />
 <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-violet-600/10 blur-[120px]" />
 <div className="absolute top-[40%] left-[50%] w-[20%] h-[20%] rounded-full bg-sky-400/8 blur-[80px]" />
 </div>
 );
}

/* ── Platform Architecture Diagram (SVG) ────────────────────────────────────── */ function ArchDiagram() {
 const layers = [
 { label: 'Enterprise UX', desc: 'Next.js 14 · Command Palette · dnd-kit', color: '#3b82f6' },
 { label: 'Sovereign Kernel', desc: 'Deterministic Governance · Forensic Replay', color: '#ec4899' },
 { label: 'API Gateway', desc: 'NestJS · JWT · 2FA · Rate Limiting', color: '#8b5cf6' },
 { label: 'Workflow Engine', desc: 'BullMQ · 9 Queues · Event Triggers', color: '#06b6d4' },
 { label: 'AI Orchestration', desc: 'OpenAI → Anthropic · pgvector Memory', color: '#10b981' },
 { label: 'Data Infrastructure', desc: 'PostgreSQL · Redis · GIN FTS · OTel', color: '#f59e0b' },
 ];

 return (
 <div className="relative w-full max-w-xl mx-auto">
 {/* Outer glow frame */}
 <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-blue-500/20 via-violet-500/10 to-transparent" />
 <div className="relative rounded-3xl border border-navy/10 bg-[#04101f]/80 backdrop-blur-xl p-6 space-y-2 shadow-2xl">
 {/* Live badge */}
 <div className="flex items-center justify-between mb-4">
 <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Architecture Stack</span>
 <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest text-emerald-400">
 <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
 Live · v1.0.0
 </span>
 </div>

 {/* Layer cards */}
 {layers.map((layer, i) => (
 <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-navy/5 bg-white/[0.03] hover:bg-white/[0.06] transition group">
 <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: layer.color, boxShadow: `0 0 8px ${layer.color}80` }} />
 <div className="min-w-0 flex-1">
 <p className="text-xs font-semibold text-navy">{layer.label}</p>
 <p className="text-[10px] text-slate-500 truncate">{layer.desc}</p>
 </div>
 <div className="h-6 w-px bg-navy/10" />
 <span className="text-[9px] font-mono text-emerald-400 shrink-0">✓</span>
 </div>
 ))}

 {/* Bottom metrics row */}
 <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-navy/5">
 {LIVE_METRICS.map((m, i) => (
 <div key={i} className="text-center">
 <p className="text-sm font-bold text-navy">{m.value}</p>
 <p className="text-[8px] text-slate-500 leading-tight mt-0.5">{m.label}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

/* ── Main Hero Section ───────────────────────────────────────────────────────── */ const TRUST_BADGES = [
 'SOC 2 Ready', 'Forensic Replay', 'Sovereign Kernel', 'Kubernetes Ready', 'OpenTelemetry',
];

const CAPABILITY_TAGS = [
 { label: 'HRMS', color: 'text-blue-400 border-blue-400/20 bg-blue-400/5' },
 { label: 'ERP', color: 'text-violet-400 border-violet-400/20 bg-violet-400/5' },
 { label: 'CRM', color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' },
 { label: 'Workflow Engine', color: 'text-amber-400 border-amber-400/20 bg-slate-50mber-400/5' },
 { label: 'AI Memory', color: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5' },
 { label: 'Recruitment', color: 'text-rose-400 border-rose-400/20 bg-rose-400/5' },
];

export function HeroSection() {
 return (
 <section
 id="home"
 className="relative min-h-[95vh] flex items-center px-4 py-20 lg:px-8 overflow-hidden"
 >
 <GridMesh />

 <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center relative z-10 w-full">

 {/* ── Left: Copy ───────────────────────────────────────────────── */}
 <div className="space-y-8 animate-rise">

 {/* Eyebrow badge */}
 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-400/20 bg-blue-400/5 backdrop-blur-sm">
 <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-ping" />
 <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-400">
 Enterprise Platform · ~99% Production Ready
 </span>
 </div>

 {/* H1 */}
 <h1 className="text-balance text-5xl font-extrabold leading-[1.05] tracking-tighter text-navy sm:text-6xl lg:text-7xl">
 Sovereign
 <br />
 <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
 Coordination
 </span>
 <br />
 Kernel.
 </h1>

 {/* Sub-headline */}
 <p className="max-w-lg text-lg leading-relaxed text-slate-500 border-l-2 border-pink-500/30 pl-5">
 Akul Dravin is a deterministic coordination substrate for institutional-grade execution. Combining HRMS, ERP, and CRM with a sovereign governance kernel for forensic-grade auditability.
 </p>

 {/* Capability tags */}
 <div className="flex flex-wrap gap-2">
 {CAPABILITY_TAGS.map(t => (
 <span key={t.label} className={`px-3 py-1 text-[10px] font-semibold uppercase tracking-widest rounded-full border ${t.color}`}>
 {t.label}
 </span>
 ))}
 </div>

 {/* CTAs */}
 <div className="flex flex-wrap items-center gap-3 pt-2">
 <Link
 href="/login"
 className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-navy font-bold text-sm shadow-[0_0_30px_rgba(59,130,246,0.35)] hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all duration-300 active:scale-95"
 >
 Enter Platform
 </Link>
 <Link
 href="#contact"
 className="px-8 py-4 rounded-full border border-white/15 bg-navy/5 text-navy font-bold text-sm hover:bg-navy/10 hover:border-white/25 transition-all duration-300 backdrop-blur-sm"
 >
 Book Demo
 </Link>
 </div>

 {/* Trust badges */}
 <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-navy/5">
 {TRUST_BADGES.map(b => (
 <span key={b} className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
 <span className="h-1 w-1 rounded-full bg-emerald-400" />{b}
 </span>
 ))}
 </div>
 </div>

 {/* ── Right: Architecture Diagram ──────────────────────────────── */}
 <div className="animate-rise" style={{ animationDelay: '150ms' }}>
 <ArchDiagram />
 </div>
 </div>
 </section>
 );
}
