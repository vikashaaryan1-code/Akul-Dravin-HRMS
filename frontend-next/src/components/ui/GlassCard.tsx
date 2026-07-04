import type { PropsWithChildren } from 'react';
import clsx from 'clsx';

type GlassCardProps = PropsWithChildren<{
 className?: string;
}>;

export function GlassCard({ children, className }: GlassCardProps) {
 return (
  <div
  className={clsx(
  'rounded-2xl border border-white/5 bg-[#051124]/80 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-xl relative overflow-hidden',
  className,
  )}
  >
  {/* Subtle glow inside the card */}
  <div className="absolute inset-0 bg-gradient-to-br from-[#1E68E5]/5 to-transparent pointer-events-none" />
  <div className="relative z-10">
    {children}
  </div>
 </div>
 );
}
