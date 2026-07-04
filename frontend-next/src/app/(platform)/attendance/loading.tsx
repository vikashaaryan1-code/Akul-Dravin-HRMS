import { Skeleton } from '@/components/ui/Skeleton';

export default function AttendanceLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width="w-40" height="h-6" />
          <Skeleton width="w-56" height="h-4" />
        </div>
        <div className="flex gap-3">
          <Skeleton width="w-32" height="h-9" rounded="xl" />
          <Skeleton width="w-28" height="h-9" rounded="xl" />
        </div>
      </div>

      {/* Calendar month header */}
      <div className="flex items-center justify-between">
        <Skeleton width="w-9" height="h-9" rounded="lg" />
        <Skeleton width="w-40" height="h-6" />
        <Skeleton width="w-9" height="h-9" rounded="lg" />
      </div>

      {/* Weekly stats bar */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-2">
            <Skeleton width="w-24" height="h-3" />
            <Skeleton width="w-16" height="h-7" />
          </div>
        ))}
      </div>

      {/* Attendance grid */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((_, i) => (
            <Skeleton key={i} width="w-full" height="h-4" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} width="w-full" height="h-10" rounded="lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
