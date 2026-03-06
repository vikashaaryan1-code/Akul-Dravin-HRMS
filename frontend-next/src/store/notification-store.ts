'use client';

import { create } from 'zustand';
import { initialNotifications } from '@/services/platform-data';
import type { NotificationItem } from '@/types/platform';

type NotificationState = {
  notifications: NotificationItem[];
  setNotifications: (items: NotificationItem[]) => void;
  addNotification: (item: NotificationItem) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: initialNotifications,
  setNotifications: (items) =>
    set(() => ({
      notifications: items.slice(0, 60),
    })),
  addNotification: (item) =>
    set((state) => {
      const existingIndex = state.notifications.findIndex((entry) => entry.id === item.id);

      if (existingIndex >= 0) {
        const next = [...state.notifications];
        next[existingIndex] = {
          ...next[existingIndex],
          ...item,
        };
        return { notifications: next };
      }

      return {
        notifications: [item, ...state.notifications].slice(0, 60),
      };
    }),
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((entry) =>
        entry.id === id ? { ...entry, read: true } : entry,
      ),
    })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((entry) => ({ ...entry, read: true })),
    })),
}));

export const selectUnreadCount = (state: NotificationState) =>
  state.notifications.filter((entry) => !entry.read).length;
