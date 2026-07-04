import { Skeleton } from '@/components/ui/Skeleton';

export default function EmployeesLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width="w-36" height="h-6" />
          <Skeleton width="w-52" height="h-4" />
        </div>
        <div className="flex gap-3">
          <Skeleton width="w-24" height="h-9" rounded="xl" />
          <Skeleton width="w-32" height="h-9" rounded="xl" />
        </div>
      </div>

      {/* Filters + search */}
      <div className="flex items-center gap-3">
        <Skeleton width="w-64" height="h-10" rounded="xl" />
        <Skeleton width="w-32" height="h-10" rounded="xl" />
        <Skeleton width="w-32" height="h-10" rounded="xl" />
        <Skeleton width="w-28" height="h-10" rounded="xl" />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-6 gap-4 px-6 py-3 border-b border-white/5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} width="w-20" height="h-3" />
          ))}
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-white/[0.04] last:border-0 items-center">
            <div className="flex items-center gap-3">
              <Skeleton width="w-9" height="h-9" rounded="full" />
              <div className="space-y-1.5">
                <Skeleton width="w-24" height="h-3" />
                <Skeleton width="w-16" height="h-2" />
              </div>
            </div>
            <Skeleton width="w-24" height="h-3" />
            <Skeleton width="w-28" height="h-3" />
            <Skeleton width="w-16" height="h-5" rounded="xl" />
            <Skeleton width="w-20" height="h-3" />
            <Skeleton width="w-8" height="h-8" rounded="lg" className="ml-auto" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton width="w-32" height="h-4" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} width="w-9" height="h-9" rounded="lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
