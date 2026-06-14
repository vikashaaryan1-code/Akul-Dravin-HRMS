export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200/30 border-t-aqua dark:border-slate-700/40 dark:border-t-aqua" />
          <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-transparent border-r-ember opacity-50 [animation-delay:-0.3s]" />
        </div>
        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Loading module...</p>
      </div>
    </div>
  );
}
