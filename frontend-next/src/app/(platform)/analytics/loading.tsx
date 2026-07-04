import { Skeleton } from '@/components/ui/Skeleton';

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width="w-40" height="h-6" />
          <Skeleton width="w-64" height="h-4" />
        </div>
        <div className="flex gap-3">
          <Skeleton width="w-36" height="h-9" rounded="xl" />
          <Skeleton width="w-28" height="h-9" rounded="xl" />
        </div>
      </div>

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton width="w-28" height="h-3" />
              <Skeleton width="w-14" height="h-5" rounded="xl" />
            </div>
            <Skeleton width="w-20" height="h-8" />
            <Skeleton width="w-full" height="h-1.5" rounded="full" />
          </div>
        ))}
      </div>

      {/* Main charts grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton width="w-44" height="h-5" />
              <Skeleton width="w-20" height="h-7" rounded="xl" />
            </div>
            <Skeleton width="w-full" height="h-48" rounded="xl" />
            <div className="flex gap-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-1.5">
                  <Skeleton width="w-2.5" height="h-2.5" rounded="full" />
                  <Skeleton width="w-16" height="h-3" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom wide chart */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton width="w-48" height="h-5" />
          <div className="flex gap-2">
            {['1M', '3M', '6M', '1Y'].map((_, i) => (
              <Skeleton key={i} width="w-10" height="h-7" rounded="lg" />
            ))}
          </div>
        </div>
        <Skeleton width="w-full" height="h-56" rounded="xl" />
      </div>
    </div>
  );
}
