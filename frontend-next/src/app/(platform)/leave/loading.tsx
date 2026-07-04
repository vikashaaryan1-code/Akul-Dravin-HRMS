import { Skeleton } from '@/components/ui/Skeleton';

export default function LeaveLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width="w-44" height="h-6" />
          <Skeleton width="w-60" height="h-4" />
        </div>
        <Skeleton width="w-32" height="h-9" rounded="xl" />
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-2">
            <Skeleton width="w-20" height="h-3" />
            <Skeleton width="w-12" height="h-8" />
            <Skeleton width="w-24" height="h-2.5" />
          </div>
        ))}
      </div>

      {/* Leave request form + list */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6 space-y-4">
          <Skeleton width="w-36" height="h-5" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton width="w-24" height="h-3" />
              <Skeleton width="w-full" height="h-10" rounded="xl" />
            </div>
          ))}
          <Skeleton width="w-full" height="h-10" rounded="xl" />
        </div>

        {/* Request list */}
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <Skeleton width="w-40" height="h-5" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-white/[0.04] last:border-0">
              <Skeleton width="w-9" height="h-9" rounded="full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton width="w-36" height="h-3" />
                <Skeleton width="w-48" height="h-3" />
              </div>
              <Skeleton width="w-20" height="h-5" rounded="xl" />
              <Skeleton width="w-16" height="h-7" rounded="lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
