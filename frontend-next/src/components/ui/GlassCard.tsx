import type { PropsWithChildren } from 'react';
import clsx from 'clsx';

type GlassCardProps = PropsWithChildren<{
 className?: string;
}>;

export function GlassCard({ children, className }: GlassCardProps) {
 return (
 <div
 className={clsx(
 'rounded-2xl border border-white/40 bg-white/70 p-5 shadow-panel backdrop-blur-md ',
 className,
 )}
 >
 {children}
 </div>
 );
}
