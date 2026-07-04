import { Skeleton } from '@/components/ui/Skeleton';

export default function RecruitmentLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width="w-44" height="h-6" />
          <Skeleton width="w-64" height="h-4" />
        </div>
        <div className="flex gap-3">
          <Skeleton width="w-28" height="h-9" rounded="xl" />
          <Skeleton width="w-32" height="h-9" rounded="xl" />
        </div>
      </div>

      {/* Pipeline stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-2">
            <Skeleton width="w-24" height="h-3" />
            <Skeleton width="w-16" height="h-7" />
            <Skeleton width="w-20" height="h-2.5" />
          </div>
        ))}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {['Applied', 'Screening', 'Interview', 'Offer'].map((stage, col) => (
          <div key={col} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton width="w-24" height="h-4" />
              <Skeleton width="w-7" height="h-5" rounded="full" />
            </div>
            {Array.from({ length: col === 0 ? 4 : col === 1 ? 3 : col === 2 ? 2 : 1 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/5 bg-white/[0.05] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton width="w-7" height="h-7" rounded="full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton width="w-24" height="h-3" />
                    <Skeleton width="w-16" height="h-2.5" />
                  </div>
                </div>
                <Skeleton width="w-full" height="h-2" rounded="full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
