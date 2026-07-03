import type { ReactNode } from 'react';

type PageTitleProps = {
 title: string;
 description: string;
 actions?: ReactNode;
};

export function PageTitle({ title, description, actions }: PageTitleProps) {
 return (
 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
 <div>
 <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
 <p className="mt-1 text-sm text-slate-600 ">{description}</p>
 </div>
 {actions}
 </div>
 );
}
