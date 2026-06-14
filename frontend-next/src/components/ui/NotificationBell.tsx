'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, CheckCheck, X, AlertCircle, Info, CheckCircle2, Clock } from 'lucide-react';
import { platformApi } from '@/services/api/platform-api';

type NotifStatus = 'Unread' | 'Read';
type NotifType = string;

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  status: NotifStatus;
  createdAt: string;
}

function typeIcon(type: string) {
  if (type?.includes('error') || type?.includes('alert')) return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
  if (type?.includes('success')) return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  if (type?.includes('pending') || type?.includes('warn')) return <Clock className="h-3.5 w-3.5 text-amber-500" />;
  return <Info className="h-3.5 w-3.5 text-blue-500" />;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => n.status === 'Unread').length;

  const load = async () => {
    setLoading(true);
    try {
      const data = await platformApi.getNotifications();
      setNotifications((data as unknown as Notification[]).slice(0, 20));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, status: 'Read' as NotifStatus })));
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/notifications/me/mark-all-read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') ?? ''}` },
      });
    } catch {}
  };

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'Read' as NotifStatus } : n));
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('hrms_token') ?? ''}` },
      });
    } catch {}
  };

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        aria-label="Notifications"
        id="notification-bell"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-rise">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Notifications</p>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 text-xs font-semibold">{unreadCount}</span>
                )}
              </div>
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 transition">
                <CheckCheck className="h-3.5 w-3.5" />Mark all read
              </button>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
              {loading && (
                <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
              )}
              {!loading && notifications.length === 0 && (
                <div className="py-10 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">All caught up!</p>
                </div>
              )}
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`group flex items-start gap-3 px-4 py-3 transition cursor-pointer ${
                    notif.status === 'Unread'
                      ? 'bg-blue-50/60 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                  onClick={() => markRead(notif.id)}
                >
                  <span className="mt-0.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm shrink-0">{typeIcon(notif.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold truncate ${notif.status === 'Unread' ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>{notif.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    {notif.status === 'Unread' && <span className="h-2 w-2 rounded-full bg-blue-500 mt-1" />}
                    <button
                      onClick={e => { e.stopPropagation(); dismiss(notif.id); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-300 hover:text-slate-500 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-2.5 text-center">
              <button onClick={load} className="text-xs text-blue-600 hover:text-blue-700 transition">Refresh notifications</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
