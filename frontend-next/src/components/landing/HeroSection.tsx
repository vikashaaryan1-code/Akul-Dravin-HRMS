import Image from 'next/image';
import Link from 'next/link';
import { DASHBOARD_BULLETS, PLATFORM_STATS } from './landing-data';

function NeuralMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950 via-ink-950/90 to-transparent z-0" />
      <svg 
        className="absolute top-0 left-0 w-full h-full opacity-[0.15] animate-pulse-slow active-heavy-layer" 
        viewBox="0 0 1000 1000" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="mesh-grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-hologram-blue" />
            <circle cx="0" cy="0" r="1.5" className="fill-hologram-violet" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mesh-grid)" />
      </svg>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-hologram-blue/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-hologram-violet/20 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
    </div>
  );
}

function GlassIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-2xl perspective-1000 preserve-3d">
      {/* 🏛️ Priority 1: Layout Container */}
      <div className="relative glass-panel rounded-[2.5rem] p-4 sm:p-6 transition-all duration-700 hover:rotate-y-6 hover:rotate-x-2 shadow-holo-lg overflow-hidden group preserve-3d">
        <div className="deterministic-noise absolute inset-0 z-0" />
        
        {/* 🏛️ Priority 2: Depth Layers */}
        <div className="relative h-72 sm:h-96 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/50 depth-1 group-hover:depth-2 transition-transform duration-500">
          <Image
            src="/images/landing/business-os.png"
            alt="OMNIX Deterministic OS"
            fill
            className="object-cover scale-105 group-hover:scale-110 transition-transform duration-1000"
            sizes="(max-width: 1024px) 100vw, 800px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
          
          {/* Holographic Verification Overlay */}
          <div className="absolute top-4 right-4 animate-hologram">
            <div className="glass-panel px-3 py-1 rounded-full border-hologram-blue/50">
              <span className="text-[8px] font-mono text-hologram-blue uppercase tracking-tighter">VFSP v1.2.1-REL :: VERIFIED</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 depth-2">
          <div className="glass-card rounded-2xl p-5 group/stat border-white/5 hover:border-hologram-blue/30 transition-colors">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Forensic Ledger</p>
            <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-white to-hologram-blue bg-clip-text text-transparent">99.98%</p>
            <div className="mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full w-[94%] rounded-full bg-gradient-to-r from-hologram-blue to-hologram-violet animate-pulse" />
            </div>
            <p className="mt-2 text-[9px] font-mono text-slate-500 uppercase tracking-tighter">Deterministic Trace Reduction :: ACTIVE</p>
          </div>

          <div className="glass-card rounded-2xl p-5 border-white/5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Neural Finality</p>
            <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-white to-hologram-violet bg-clip-text text-transparent">Sovereign</p>
            <p className="mt-3 text-[9px] text-slate-500 leading-relaxed uppercase tracking-widest font-mono">
              Oracle B Constraint <br/> Monotone Hash Locked
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 sm:col-span-2 border-white/5 hover:bg-white/10 transition-colors cursor-default">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Protocol Stacks</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['CES v1.2', 'EEC v1.2', 'ISC v1.2', 'VFSP REL'].map((item) => (
                <span
                  key={item}
                  className="glass-button px-3 py-1.5 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider border-white/5 hover:border-hologram-cyan/50"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section id="home" className="relative min-h-[95vh] flex items-center px-4 py-20 lg:px-8 bg-ink-950 overflow-hidden">
      <NeuralMesh />
      
      <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center relative z-10">
        <div className="space-y-10 animate-rise">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border-hologram-blue/20">
            <span className="flex h-2 w-2 rounded-full bg-hologram-blue animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-hologram-blue">
              OMNIX ∞ | ULTIMATE DETERMINISTIC OS
            </span>
          </div>

          <h1 className="text-balance text-6xl font-extrabold leading-[1.0] tracking-tighter text-white sm:text-7xl lg:text-8xl">
            AUTONOMOUS <br/>
            <span className="bg-gradient-to-r from-hologram-blue via-hologram-violet to-hologram-cyan bg-clip-text text-transparent animate-hologram">
              HR ELEGANCE
            </span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-slate-400 font-light border-l-2 border-hologram-blue/30 pl-6">
            Forge your enterprise identity in the world's first **Deterministic Workforce Engine**. A formally verified, 3D-first platform where every state is an immutable, forensic invariant.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="px-10 py-5 rounded-full bg-white text-ink-950 font-bold text-sm shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-105 transition-all duration-300 active:scale-95"
            >
              Initialize Sovereign OS
            </Link>
            <Link
              href="#contact"
              className="px-10 py-5 rounded-full glass-panel text-white font-bold text-sm hover:bg-white/10 transition-all duration-300 border-white/10 hover:border-hologram-blue/50"
            >
              Audit Protocols
            </Link>
          </div>

          <div className="flex items-center gap-8 pt-6 border-t border-white/5">
            {PLATFORM_STATS.slice(0, 3).map((stat) => (
              <div key={stat.label} className="group/stat">
                <p className="text-3xl font-bold text-white group-hover/stat:text-hologram-blue transition-colors">{stat.value}</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <GlassIllustration />
      </div>
    </section>
  );
}
