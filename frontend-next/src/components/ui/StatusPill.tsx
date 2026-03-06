import clsx from 'clsx';

type StatusPillProps = {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
};

const tones = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
  danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
};

export function StatusPill({ label, tone = 'default' }: StatusPillProps) {
  return (
    <span className={clsx('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>
      {label}
    </span>
  );
}
