'use client';

import { useEffect } from 'react';
import { NotificationSocketClient } from '@/services/realtime/notification-socket';
import { useNotificationStore } from '@/store/notification-store';

export const useRealtimeNotifications = () => {
  const addNotification = useNotificationStore((state) => state.addNotification);
  const setNotifications = useNotificationStore((state) => state.setNotifications);

  useEffect(() => {
    const client = new NotificationSocketClient();
    void client.connect(addNotification, setNotifications);

    return () => client.disconnect();
  }, [addNotification, setNotifications]);
};
