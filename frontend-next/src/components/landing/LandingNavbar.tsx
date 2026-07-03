import Link from 'next/link';
import { NAV_ITEMS } from './landing-data';

export function LandingNavbar() {
 return (
 <header className="fixed top-6 left-0 right-0 z-[60] px-4 lg:px-8">
 <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 glass-panel rounded-full border-navy/10 shadow-holo-sm animate-rise transition-all hover:border-hologram-blue/20">
 <Link href="#home" className="group inline-flex items-center gap-3">
 <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-ink-950 border border-navy/10 group-hover:border-hologram-blue/50 transition-colors">
 <span className="absolute inset-0 bg-gradient-to-br from-hologram-blue via-hologram-violet to-hologram-cyan animate-pulse-slow" />
 <span className="absolute inset-x-0 bottom-0 h-[2px] bg-white opacity-50" />
 </div>
 <span className="text-sm font-black tracking-[0.3em] text-navy sm:text-lg">AKUL DRAVIN <span className="text-hologram-blue italic">∞</span></span>
 </Link>

 <nav className="hidden items-center gap-9 lg:flex">
 {NAV_ITEMS.map((item) => (
 <Link 
 key={item.label} 
 href={item.href} 
 className="relative text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-all hover:text-navy group"
 >
 {item.label}
 <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-hologram-blue transition-all group-hover:w-full" />
 </Link>
 ))}
 </nav>

 <div className="hidden items-center gap-6 sm:flex">
 <Link
 href="/login"
 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 transition hover:text-navy"
 >
 Login
 </Link>
 <Link
 href="/signup"
 className="rounded-full bg-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-ink-950 shadow-[0_0_20px_rgba(255,255,255,0.3)] transition hover:scale-105 active:scale-95"
 >
 Launch System
 </Link>
 </div>

 <div className="lg:hidden">
 <button className="p-2 glass-button rounded-lg">
 <span className="block h-0.5 w-4 bg-white mb-1" />
 <span className="block h-0.5 w-4 bg-white mb-1" />
 <span className="block h-0.5 w-4 bg-white" />
 </button>
 </div>
 </div>
 </header>
 );
}
