import { Skeleton } from '@/components/ui/Skeleton';

export default function PayrollLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width="w-40" height="h-6" />
          <Skeleton width="w-60" height="h-4" />
        </div>
        <div className="flex gap-3">
          <Skeleton width="w-28" height="h-9" rounded="xl" />
          <Skeleton width="w-36" height="h-9" rounded="xl" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 space-y-2">
            <Skeleton width="w-28" height="h-3" />
            <Skeleton width="w-32" height="h-7" />
            <Skeleton width="w-24" height="h-3" />
          </div>
        ))}
      </div>

      {/* Payroll table */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <Skeleton width="w-36" height="h-5" />
          <Skeleton width="w-24" height="h-8" rounded="xl" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-white/[0.04] last:border-0 items-center">
            <div className="flex items-center gap-3">
              <Skeleton width="w-8" height="h-8" rounded="full" />
              <Skeleton width="w-24" height="h-3" />
            </div>
            <Skeleton width="w-20" height="h-3" />
            <Skeleton width="w-24" height="h-3" />
            <Skeleton width="w-16" height="h-5" rounded="xl" />
            <Skeleton width="w-20" height="h-7" rounded="xl" className="ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
