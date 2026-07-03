import clsx from 'clsx';

type StatusPillProps = {
 label: string;
 tone?: 'default' | 'success' | 'warning' | 'danger';
};

const tones = {
 default: 'bg-slate-100 text-slate-700 ',
 success: 'bg-emerald-100 text-emerald-700 ',
 warning: 'bg-slate-50mber-100 text-amber-700 ',
 danger: 'bg-rose-100 text-rose-700 ',
};

export function StatusPill({ label, tone = 'default' }: StatusPillProps) {
 return (
 <span className={clsx('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>
 {label}
 </span>
 );
}
