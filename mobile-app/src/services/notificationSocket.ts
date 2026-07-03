import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api'; 

const getSocketUrl = () => {
  try {
    const url = new URL(API_BASE_URL);
    return `${url.protocol}//${url.host}/notifications`;
  } catch {
    return Platform.OS === 'android' ? 'http://10.0.2.2:4001/notifications' : 'http://localhost:4001/notifications';
  }
};

export type NotificationPayload = {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
};

class NotificationSocketClient {
  private socket: Socket | null = null;
  private listeners: Set<(notification: NotificationPayload) => void> = new Set();

  async connect() {
    if (this.socket) return; 

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return;

      const socketUrl = getSocketUrl();
      
      this.socket = io(socketUrl, {
        transports: ['websocket'],
        auth: { token },
      });

      this.socket.on('connect', () => {
        console.log('Mobile Socket connected to Notifications gateway');
      });

      this.socket.on('notification', (payload: NotificationPayload) => {
        console.log('Mobile received notification:', payload);
        this.listeners.forEach(listener => listener(payload));
      });

      this.socket.on('disconnect', () => {
        console.log('Mobile Socket disconnected');
      });
      
    } catch (e) {
      console.error('Failed to connect mobile socket', e);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  addListener(listener: (notification: NotificationPayload) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const notificationSocket = new NotificationSocketClient();
