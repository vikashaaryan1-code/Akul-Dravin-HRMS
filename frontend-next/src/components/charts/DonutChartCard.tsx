'use client';

import { useEffect, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const palette = ['#0F8B8D', '#E85A2A', '#F2AA3B', '#394867', '#22c55e', '#f43f5e'];

type DonutPoint = {
  name: string;
  value: number;
};

type DonutChartCardProps = {
  title: string;
  data: DonutPoint[];
};

export function DonutChartCard({ title, data }: DonutChartCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="h-[280px] rounded-2xl border border-white/40 bg-white/70 p-4 shadow-panel backdrop-blur-md dark:border-white/10 dark:bg-slate-900/60">
      <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      <div className="h-[88%] min-h-[180px] w-full">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={56} outerRadius={90} paddingAngle={3}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={palette[index % palette.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        )}
      </div>
    </div>
  );
}

