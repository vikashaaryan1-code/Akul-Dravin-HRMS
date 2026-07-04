import { Skeleton } from '@/components/ui/Skeleton';

export default function PerformanceLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width="w-52" height="h-6" />
          <Skeleton width="w-64" height="h-4" />
        </div>
        <div className="flex gap-3">
          <Skeleton width="w-28" height="h-9" rounded="xl" />
          <Skeleton width="w-36" height="h-9" rounded="xl" />
        </div>
      </div>

      {/* Cycle overview */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 space-y-3">
            <Skeleton width="w-24" height="h-3" />
            <Skeleton width="w-16" height="h-8" />
            <Skeleton width="w-full" height="h-2" rounded="full" />
          </div>
        ))}
      </div>

      {/* Radar + table split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.03] p-6 space-y-4">
          <Skeleton width="w-36" height="h-5" />
          <Skeleton width="w-full" height="h-52" rounded="xl" />
        </div>
        <div className="lg:col-span-3 rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <Skeleton width="w-44" height="h-5" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04] last:border-0">
              <Skeleton width="w-9" height="h-9" rounded="full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton width="w-32" height="h-3" />
                <Skeleton width="w-24" height="h-2.5" />
              </div>
              <Skeleton width="w-24" height="h-2" rounded="full" className="flex-1 max-w-[120px]" />
              <Skeleton width="w-12" height="h-5" rounded="xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
