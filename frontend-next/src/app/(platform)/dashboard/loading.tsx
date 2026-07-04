import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width="w-48" height="h-7" />
          <Skeleton width="w-72" height="h-4" />
        </div>
        <div className="flex gap-3">
          <Skeleton width="w-24" height="h-9" rounded="xl" />
          <Skeleton width="w-32" height="h-9" rounded="xl" />
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton width="w-10" height="h-10" rounded="full" />
              <Skeleton width="w-16" height="h-5" rounded="xl" />
            </div>
            <Skeleton width="w-20" height="h-8" />
            <Skeleton width="w-32" height="h-3" />
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.03] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton width="w-40" height="h-5" />
            <Skeleton width="w-24" height="h-7" rounded="xl" />
          </div>
          <Skeleton width="w-full" height="h-56" rounded="xl" />
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 space-y-4">
          <Skeleton width="w-36" height="h-5" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton width="w-8" height="h-8" rounded="full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton width="w-3/4" height="h-3" />
                <Skeleton width="w-1/2" height="h-3" />
              </div>
              <Skeleton width="w-16" height="h-5" rounded="xl" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 space-y-4">
            <Skeleton width="w-36" height="h-5" />
            <Skeleton width="w-full" height="h-32" rounded="xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
