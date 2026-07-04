import { Skeleton } from '@/components/ui/Skeleton';

export default function AiHubLoading() {
  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width="w-40" height="h-6" />
          <Skeleton width="w-64" height="h-4" />
        </div>
        <Skeleton width="w-28" height="h-8" rounded="xl" />
      </div>

      {/* Agent mode selector strip */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="w-32" height="h-10" rounded="xl" />
        ))}
      </div>

      {/* Conversation area */}
      <div className="flex-1 rounded-2xl border border-white/5 bg-white/[0.03] p-6 space-y-6 overflow-hidden">
        {/* Assistant bubble */}
        <div className="flex gap-3">
          <Skeleton width="w-9" height="h-9" rounded="full" />
          <div className="flex-1 space-y-2">
            <Skeleton width="w-full" height="h-4" />
            <Skeleton width="w-5/6" height="h-4" />
            <Skeleton width="w-3/4" height="h-4" />
          </div>
        </div>

        {/* User bubble */}
        <div className="flex gap-3 justify-end">
          <div className="max-w-sm w-full">
            <Skeleton width="w-full" height="h-10" rounded="xl" />
          </div>
          <Skeleton width="w-9" height="h-9" rounded="full" />
        </div>

        {/* Suggested prompts */}
        <div className="pt-4 space-y-2">
          <Skeleton width="w-32" height="h-3" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} width="w-48" height="h-8" rounded="xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Input box */}
      <div className="flex gap-3">
        <Skeleton width="w-full" height="h-12" rounded="xl" />
        <Skeleton width="w-12" height="h-12" rounded="xl" />
      </div>
    </div>
  );
}
