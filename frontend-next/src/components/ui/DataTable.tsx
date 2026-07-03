'use client';

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';

export type ColumnDef<T> = {
 key: keyof T | string;
 label: string;
 sortable?: boolean;
 width?: string;
 render?: (value: unknown, row: T) => React.ReactNode;
 className?: string;
};

type SortDir = 'asc' | 'desc';

type DataTableProps<T extends Record<string, unknown>> = {
 columns: ColumnDef<T>[];
 data: T[];
 loading?: boolean;
 emptyMessage?: string;
 emptyIcon?: React.ReactNode;
 pageSize?: number;
 searchPlaceholder?: string;
 searchKeys?: (keyof T)[];
 onRowClick?: (row: T) => void;
 actions?: React.ReactNode;
 title?: string;
 exportFileName?: string;
};

function SkeletonRow({ cols }: { cols: number }) {
 return (
 <tr className="border-t border-slate-100 ">
 {Array.from({ length: cols }).map((_, i) => (
 <td key={i} className="px-4 py-3">
 <div className="h-4 rounded-md bg-slate-200 animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
 </td>
 ))}
 </tr>
 );
}

export function DataTable<T extends Record<string, unknown>>({
 columns,
 data,
 loading = false,
 emptyMessage = 'No data found',
 emptyIcon,
 pageSize = 10,
 searchPlaceholder = 'Search...',
 searchKeys = [],
 onRowClick,
 actions,
 title,
 exportFileName,
}: DataTableProps<T>) {
 const [search, setSearch] = useState('');
 const [sortKey, setSortKey] = useState<string | null>(null);
 const [sortDir, setSortDir] = useState<SortDir>('asc');
 const [page, setPage] = useState(1);

 const filtered = useMemo(() => {
 if (!search.trim()) return data;
 const q = search.toLowerCase();
 return data.filter((row) =>
 (searchKeys.length > 0 ? searchKeys : (columns.map((c) => c.key) as (keyof T)[])).some((key) => {
 const val = row[key as string];
 return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
 }),
 );
 }, [data, search, searchKeys, columns]);

 const sorted = useMemo(() => {
 if (!sortKey) return filtered;
 return [...filtered].sort((a, b) => {
 const av = a[sortKey] ?? '';
 const bv = b[sortKey] ?? '';
 const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
 return sortDir === 'asc' ? cmp : -cmp;
 });
 }, [filtered, sortKey, sortDir]);

 const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
 const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

 const handleSort = (key: string) => {
 if (sortKey === key) {
 setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
 } else {
 setSortKey(key);
 setSortDir('asc');
 }
 setPage(1);
 };

 const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
 setSearch(e.target.value);
 setPage(1);
 };

 const exportCsv = () => {
 const headers = columns.map((c) => c.label).join(',');
 const rows = sorted.map((row) =>
 columns.map((c) => {
 const val = row[c.key as string];
 const str = val === null || val === undefined ? '' : String(val);
 return `"${str.replace(/"/g, '""')}"`;
 }).join(','),
 );
 const csv = [headers, ...rows].join('\n');
 const blob = new Blob([csv], { type: 'text/csv' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `${exportFileName ?? 'export'}-${new Date().toISOString().slice(0, 10)}.csv`;
 a.click();
 URL.revokeObjectURL(url);
 };

 return (
 <div className="flex flex-col gap-0 rounded-2xl border border-slate-200/80 bg-white shadow-panel overflow-hidden">
 {/* Header */}
 <div className="flex flex-col gap-3 px-5 pt-4 pb-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 ">
 <div className="flex items-center gap-3 flex-1">
 {title && <h3 className="text-sm font-semibold text-slate-800 shrink-0">{title}</h3>}
 <div className="relative flex-1 max-w-xs">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
 <input
 value={search}
 onChange={handleSearch}
 placeholder={searchPlaceholder}
 className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition"
 />
 </div>
 </div>
 <div className="flex items-center gap-2">
 {actions}
 {exportFileName && (
 <button
 onClick={exportCsv}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
 >
 <Download className="h-3.5 w-3.5" />
 CSV
 </button>
 )}
 </div>
 </div>

 {/* Table */}
 <div className="overflow-x-auto">
 <table className="min-w-full text-left text-sm">
 <thead className="bg-slate-50/90 ">
 <tr>
 {columns.map((col) => (
 <th
 key={String(col.key)}
 className={`px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-500 whitespace-nowrap ${col.sortable !== false ? 'cursor-pointer select-none hover:text-slate-700 transition-colors' : ''} ${col.className ?? ''}`}
 style={{ width: col.width }}
 onClick={() => col.sortable !== false && handleSort(String(col.key))}
 >
 <span className="flex items-center gap-1">
 {col.label}
 {col.sortable !== false && sortKey === String(col.key) ? (
 sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
 ) : null}
 </span>
 </th>
 ))}
 </tr>
 </thead>
 <tbody>
 {loading ? (
 Array.from({ length: pageSize }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
 ) : paginated.length === 0 ? (
 <tr>
 <td colSpan={columns.length} className="px-4 py-16 text-center">
 <div className="flex flex-col items-center gap-3 text-slate-500">
 {emptyIcon ?? <Search className="h-8 w-8 opacity-40" />}
 <p className="text-sm">{emptyMessage}</p>
 </div>
 </td>
 </tr>
 ) : (
 paginated.map((row, idx) => (
 <tr
 key={idx}
 onClick={() => onRowClick?.(row)}
 className={`border-t border-slate-100 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-slate-50 ' : ''}`}
 >
 {columns.map((col) => (
 <td key={String(col.key)} className={`px-4 py-3 text-slate-700 ${col.className ?? ''}`}>
 {col.render ? col.render(row[col.key as string], row) : String(row[col.key as string] ?? '—')}
 </td>
 ))}
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>

 {/* Pagination */}
 {!loading && sorted.length > pageSize && (
 <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50 ">
 <span className="text-xs text-slate-500">
 Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, sorted.length)} of {sorted.length}
 </span>
 <div className="flex items-center gap-1">
 <button
 disabled={page === 1}
 onClick={() => setPage((p) => p - 1)}
 className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-slate-200 transition"
 >
 <ChevronLeft className="h-4 w-4" />
 </button>
 {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
 const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
 if (p > totalPages) return null;
 return (
 <button
 key={p}
 onClick={() => setPage(p)}
 className={`w-7 h-7 rounded-lg text-xs font-medium transition ${page === p ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-600 '}`}
 >
 {p}
 </button>
 );
 })}
 <button
 disabled={page === totalPages}
 onClick={() => setPage((p) => p + 1)}
 className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-slate-200 transition"
 >
 <ChevronRight className="h-4 w-4" />
 </button>
 </div>
 </div>
 )}
 </div>
 );
}
