'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendPoint } from '@/types/platform';

type TrendAreaChartProps = {
  title: string;
  data: TrendPoint[];
  color?: string;
};

export function TrendAreaChart({ title, data, color = '#0F8B8D' }: TrendAreaChartProps) {
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
            <AreaChart data={data}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke={color} fill="url(#trendFill)" strokeWidth={2.2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        )}
      </div>
    </div>
  );
}

