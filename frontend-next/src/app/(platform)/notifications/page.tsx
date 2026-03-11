'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4200/api/v1';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const res = await fetch(`${API_BASE}/notifications?userId=current-user-id`);
    const data = await res.json();
    setNotifications(data);
  };

  const markAsRead = async (id: string) => {
    await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH' });
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'current-user-id' }),
    });
    fetchNotifications();
  };

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-ink">Notifications</h1>
          <p className="text-sm text-ink/60 mt-1">{unreadCount} unread</p>
        </div>
        <button onClick={markAllAsRead} className="px-4 py-2 bg-aqua text-white rounded-lg flex items-center gap-2">
          <CheckCheck className="w-4 h-4" />
          Mark All Read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.map((notif: any) => (
          <div key={notif.id} className={`bg-white/60 backdrop-blur-sm border border-white/20 rounded-xl p-4 ${!notif.read ? 'border-l-4 border-l-aqua' : ''}`}>
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${notif.type === 'success' ? 'bg-green-100' : notif.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                <Bell className={`w-5 h-5 ${notif.type === 'success' ? 'text-green-600' : notif.type === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-ink">{notif.title}</h3>
                <p className="text-sm text-ink/60 mt-1">{notif.message}</p>
                <p className="text-xs text-ink/40 mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
              </div>
              {!notif.read && (
                <button onClick={() => markAsRead(notif.id)} className="text-aqua hover:text-aqua/80">
                  <Check className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
