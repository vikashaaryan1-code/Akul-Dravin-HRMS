'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── GlassCard ────────────────────────────────────────────────────────────────
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: 'gold' | 'aqua' | 'ember' | 'jade' | 'none';
  as?: any;
}

const GLOW_MAP = {
  gold: 'hover:shadow-gold-sm',
  aqua: 'hover:shadow-aqua-sm',
  ember: 'hover:shadow-ember-sm',
  jade: 'hover:border-jade/20',
  none: '',
} as const;

/**
 * GlassCard — CyberGlass 2.0 surface primitive.
 * Replaces the old GlassCard in ui/ with richer token support.
 */
export function GlassCard({ children, className = '', hover = true, glow = 'none', as: Tag = 'div' }: GlassCardProps) {
  return (
    <Tag
      className={`surface-raised border-subtle rounded-2xl transition-all duration-250 ${
        hover ? 'hover:bg-white/8' : ''
      } ${GLOW_MAP[glow]} ${className}`}
    >
      {children}
    </Tag>
  );
}

// ── TrendBadge ───────────────────────────────────────────────────────────────
interface TrendBadgeProps {
  value: number; // e.g. 12.4 → +12.4%
  unit?: string;
  size?: 'sm' | 'md';
}

export function TrendBadge({ value, unit = '%', size = 'sm' }: TrendBadgeProps) {
  const positive = value > 0;
  const neutral = value === 0;
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const color = neutral ? 'text-slate-500' : positive ? 'text-jade' : 'text-ember';
  const Icon = neutral ? Minus : positive ? TrendingUp : TrendingDown;

  return (
    <span className={`inline-flex items-center gap-1 font-bold ${textSize} ${color}`} aria-label={`Trend: ${value > 0 ? '+' : ''}${value}${unit}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {value > 0 ? '+' : ''}{value}{unit}
    </span>
  );
}

// ── KpiTile ──────────────────────────────────────────────────────────────────
interface KpiTileProps {
  label: string;
  value: string | number;
  trend?: number;
  trendUnit?: string;
  icon?: any;
  iconColor?: string;
  detail?: string;
  glow?: GlassCardProps['glow'];
  className?: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

/**
 * KpiTile — reusable KPI metric card for all dashboards.
 * Supports icon, trend delta, detail label. Motion-safe.
 */
export function KpiTile({
  label, value, trend, trendUnit = '%', icon: Icon, iconColor = 'text-gold',
  detail, glow = 'none', className = '',
}: KpiTileProps) {
  const reduced = useReducedMotion();

  const inner = (
    <GlassCard glow={glow} className={`p-6 flex flex-col gap-4 ${className}`}>
      <div className="flex items-start justify-between">
        {Icon ? (
          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center">
            <Icon className={`h-5 w-5 ${iconColor}`} aria-hidden="true" />
          </div>
        ) : <div />}
        {trend !== undefined && <TrendBadge value={trend} unit={trendUnit} />}
      </div>
      <div>
        <p
          className="text-3xl font-black tracking-tighter text-white"
          aria-label={`${label}: ${value}`}
        >
          {value}
        </p>
        <p className="text-sm font-semibold text-slate-400 mt-1">{label}</p>
        {detail && <p className="text-xs text-slate-600 mt-0.5">{detail}</p>}
      </div>
    </GlassCard>
  );

  if (reduced) return inner;

  return (
    <motion.div variants={cardVariants} initial="hidden" whileInView="show" viewport={{ once: true }}>
      {inner}
    </motion.div>
  );
}

// ── KpiStrip ─────────────────────────────────────────────────────────────────
interface KpiStripProps {
  tiles: KpiTileProps[];
  columns?: 2 | 3 | 4 | 5;
}

const COL_MAP = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4', 5: 'sm:grid-cols-3 lg:grid-cols-5' };

export function KpiStrip({ tiles, columns = 4 }: KpiStripProps) {
  return (
    <div
      className={`grid grid-cols-1 ${COL_MAP[columns]} gap-4`}
      role="list"
      aria-label="KPI metrics"
    >
      {tiles.map((tile) => (
        <div key={tile.label} role="listitem">
          <KpiTile {...tile} />
        </div>
      ))}
    </div>
  );
}
