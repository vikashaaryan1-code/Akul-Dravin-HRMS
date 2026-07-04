/**
 * format.ts — Formatting utilities for Akul Dravin HRMS.
 *
 * Covers:
 *  - Indian Rupee formatting (₹ with lakh/crore compact notation)
 *  - Dates in DD Mon YYYY and relative "2 days ago" style
 *  - Percentages, numbers with Indian grouping (1,00,000)
 *  - File sizes, durations, phone numbers (Indian)
 */

// ── Currency (Indian Rupee) ────────────────────────────────────────────────────

/** Format as ₹1,23,456 using Indian number grouping */
export function formatInr(amount: number, decimals = 0): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/** Compact: ₹2.4Cr, ₹18.5L, ₹45K */
export function formatInrCompact(amount: number): string {
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(1)}Cr`;
  if (amount >= 1_00_000)    return `₹${(amount / 1_00_000).toFixed(1)}L`;
  if (amount >= 1_000)       return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount}`;
}

/** Monthly CTC → Annual LPA string: "12.5 LPA" */
export function ctcToLpa(monthlyCtc: number): string {
  const annual = monthlyCtc * 12;
  return `${(annual / 1_00_000).toFixed(1)} LPA`;
}

// ── Numbers ────────────────────────────────────────────────────────────────────

/** Format with Indian grouping: 2,47,000 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

/** Compact count: 1.2K, 4.5M */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

// ── Percentages ────────────────────────────────────────────────────────────────

/** "8.4%" — default 1 decimal */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Change delta: "+3.2%" or "-1.5%" with sign */
export function formatPercentDelta(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

// ── Dates ─────────────────────────────────────────────────────────────────────

/** "04 Jul 2026" */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** "04 Jul 2026, 04:32 PM" */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

/** "Jul 2026" — for payroll cycle headers */
export function formatMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/** Relative: "just now", "2h ago", "3 days ago", "12 Jul" */
export function formatRelative(date: Date | string): string {
  const d   = typeof date === 'string' ? new Date(date) : date;
  const now = Date.now();
  const diffMs  = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 30)   return 'just now';
  if (diffSec < 3600) return `${diffMin}m ago`;
  if (diffHr  < 24)   return `${diffHr}h ago`;
  if (diffDay < 7)    return `${diffDay}d ago`;
  if (diffDay < 365)  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return formatDate(d);
}

/** Date range: "1–31 Jul 2026" */
export function formatDateRange(from: Date | string, to: Date | string): string {
  const f = typeof from === 'string' ? new Date(from) : from;
  const t = typeof to   === 'string' ? new Date(to)   : to;
  const fromStr = f.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const toStr   = t.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fromStr}–${toStr}`;
}

// ── Duration ─────────────────────────────────────────────────────────────────

/** "2h 30m" from minutes */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** "3 years 2 months" from two dates */
export function formatTenure(from: Date | string, to?: Date | string): string {
  const start = typeof from === 'string' ? new Date(from) : from;
  const end   = to ? (typeof to === 'string' ? new Date(to) : to) : new Date();
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const years  = Math.floor(months / 12);
  const rem    = months % 12;
  if (years === 0) return rem === 1 ? '1 month' : `${rem} months`;
  if (rem   === 0) return years === 1 ? '1 year' : `${years} years`;
  return `${years}y ${rem}m`;
}

// ── File size ─────────────────────────────────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 ** 2)    return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)    return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

// ── Phone number (Indian) ─────────────────────────────────────────────────────

/** "+91 98765 43210" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

// ── Name ─────────────────────────────────────────────────────────────────────

/** "Priya Menon" → "PM" */
export function getInitials(name: string, maxChars = 2): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, maxChars);
}

/** Title case: "senior backend engineer" → "Senior Backend Engineer" */
export function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
