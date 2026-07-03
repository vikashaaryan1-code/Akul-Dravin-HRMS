import type { ReactNode } from 'react';
import clsx from 'clsx';

type SectionHeadingProps = {
 badge?: string;
 eyebrow?: string;
 title: ReactNode;
 description: string;
 centered?: boolean;
 light?: boolean;
};

export function SectionHeading({
 badge,
 eyebrow,
 title,
 description,
 centered = true,
 light = true
}: SectionHeadingProps) {
 const label = badge ?? eyebrow ?? '';

 return (
 <div className={clsx('space-y-6', centered && 'mx-auto max-w-3xl text-center')}>
 <p className={clsx(
 "inline-flex rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]",
 light 
 ? "border border-ember/20 bg-white text-ember" 
 : "border border-navy/10 glass-panel text-indigo-400"
 )}>
 {label}
 </p>
 
 <h2 className={clsx(
 "text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl",
 light ? "text-ink" : "text-navy"
 )}>
 {title}
 </h2>
 
 <p className={clsx(
 "text-lg leading-relaxed font-light",
 light ? "text-slate-600" : "text-slate-500"
 )}>
 {description}
 </p>
 </div>
 );
}
