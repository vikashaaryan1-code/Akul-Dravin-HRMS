'use client';

import { useEffect, useState } from 'react';
import {
 Bar,
 BarChart,
 CartesianGrid,
 Legend,
 ResponsiveContainer,
 Tooltip,
 XAxis,
 YAxis,
} from 'recharts';

type DistributionPoint = {
 name: string;
 present?: number;
 absent?: number;
 leave?: number;
 value?: number;
};

type StackedBarChartProps = {
 title: string;
 data: DistributionPoint[];
 mode?: 'attendance' | 'single';
};

export function StackedBarChart({ title, data, mode = 'attendance' }: StackedBarChartProps) {
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
 setMounted(true);
 }, []);

 return (
 <div className="h-[280px] rounded-2xl border border-white/40 bg-white/70 p-4 shadow-panel backdrop-blur-md ">
 <p className="mb-3 text-sm font-semibold text-slate-700 ">{title}</p>
 <div className="h-[88%] min-h-[180px] w-full">
 {mounted ? (
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={data}>
 <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
 <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
 <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
 <Tooltip />
 <Legend />
 {mode === 'attendance' ? (
 <>
 <Bar dataKey="present" stackId="a" fill="#0F8B8D" radius={[6, 6, 0, 0]} />
 <Bar dataKey="absent" stackId="a" fill="#E85A2A" radius={[6, 6, 0, 0]} />
 <Bar dataKey="leave" stackId="a" fill="#F2AA3B" radius={[6, 6, 0, 0]} />
 </>
 ) : (
 <Bar dataKey="value" fill="#0F8B8D" radius={[6, 6, 0, 0]} />
 )}
 </BarChart>
 </ResponsiveContainer>
 ) : (
 <div className="h-full w-full animate-pulse rounded-xl bg-slate-100 " />
 )}
 </div>
 </div>
 );
}

