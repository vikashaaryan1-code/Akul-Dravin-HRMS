import type { ReactNode } from 'react';
import clsx from 'clsx';

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  description: string;
  centered?: boolean;
};

export function SectionHeading({ eyebrow, title, description, centered = true }: SectionHeadingProps) {
  return (
    <div className={clsx('space-y-4', centered && 'mx-auto max-w-3xl text-center')}>
      <p className="inline-flex rounded-full border border-ember/20 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ember">
        {eyebrow}
      </p>
      <h2 className="text-balance text-3xl font-bold leading-tight text-ink sm:text-4xl">{title}</h2>
      <p className="text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
    </div>
  );
}
