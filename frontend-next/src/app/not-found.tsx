import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-panel dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">404</p>
        <h1 className="mt-2 text-3xl font-bold text-ink dark:text-slate-100">Page Not Found</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Requested route is unavailable. Continue from unified AKUL DRAVIN platform pages.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/" className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
            Home
          </Link>
          <Link href="/dashboard?role=platform-admin" className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            Dashboard
          </Link>
          <Link href="/login" className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}
