import Link from 'next/link';
import { AkulDravinLogo } from '../brand/AkulDravinLogo';
import { NAV_ITEMS } from './landing-data';

export function LandingNavbar() {
 return (
 <header className="fixed top-6 left-0 right-0 z-[60] px-4 lg:px-8">
 <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 bg-navy/80 backdrop-blur-xl rounded-full border border-white/10 shadow-glass animate-rise transition-all hover:border-white/20">
 <Link href="#home" className="group inline-flex items-center gap-3">
 <AkulDravinLogo width={36} height={36} showText={false} />
 <span className="text-sm font-black tracking-[0.3em] text-white sm:text-lg">AKUL DRAVIN <span className="text-aqua italic">∞</span></span>
 </Link>

 <nav className="hidden items-center gap-9 lg:flex">
 {NAV_ITEMS.map((item) => (
 <Link 
 key={item.label} 
 href={item.href} 
 className="relative text-[10px] font-bold uppercase tracking-widest text-slate-300 transition-all hover:text-white group"
 >
 {item.label}
 <span className="absolute -bottom-1 left-0 h-[1px] w-0 bg-aqua transition-all group-hover:w-full" />
 </Link>
 ))}
 </nav>

 <div className="hidden items-center gap-6 sm:flex">
 <Link
 href="/login"
 className="text-[10px] font-bold uppercase tracking-widest text-slate-300 transition hover:text-white"
 >
 Login
 </Link>
 <Link
 href="/signup"
 className="rounded-full bg-white px-8 py-3 text-[10px] font-bold uppercase tracking-widest text-navy shadow-[0_0_20px_rgba(255,255,255,0.3)] transition hover:scale-105 active:scale-95"
 >
 Launch System
 </Link>
 </div>

 <div className="lg:hidden">
 <button className="p-2 bg-white/10 rounded-lg">
 <span className="block h-0.5 w-4 bg-white mb-1" />
 <span className="block h-0.5 w-4 bg-white mb-1" />
 <span className="block h-0.5 w-4 bg-white" />
 </button>
 </div>
 </div>
 </header>
 );
}
