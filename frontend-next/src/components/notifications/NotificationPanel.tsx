'use client';

import { BellRing } from 'lucide-react';
import { useNotificationStore } from '@/store/notification-store';
import { useUIStore } from '@/store/ui-store';
import { formatDateTime } from '@/utils/formatters';

const toneMap = {
  salary: 'border-l-emerald-500',
  target: 'border-l-amber-500',
  leave: 'border-l-sky-500',
  system: 'border-l-rose-500',
};

export function NotificationPanel() {
  const notifications = useNotificationStore((state) => state.notifications);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const isOpen = useUIStore((state) => state.notificationPanelOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute right-0 top-14 z-50 w-[min(420px,92vw)] rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-2xl backdrop-blur-lg dark:border-slate-700/80 dark:bg-slate-900/95">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          <BellRing size={16} />
          Realtime Notifications
        </p>
        <button
          type="button"
          onClick={markAllRead}
          className="text-xs font-semibold text-aqua transition hover:opacity-80"
        >
          Mark all read
        </button>
      </div>

      <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className={`rounded-xl border border-slate-200/80 border-l-4 bg-white p-3 dark:border-slate-700 dark:bg-slate-800 ${toneMap[notification.type]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{notification.title}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{notification.message}</p>
                <p className="mt-2 text-[11px] text-slate-500">{formatDateTime(notification.createdAt)}</p>
              </div>
              {!notification.read ? (
                <button
                  type="button"
                  onClick={() => markRead(notification.id)}
                  className="text-[11px] font-semibold text-ember"
                >
                  Mark read
                </button>
              ) : (
                <span className="text-[11px] text-slate-400">Read</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
