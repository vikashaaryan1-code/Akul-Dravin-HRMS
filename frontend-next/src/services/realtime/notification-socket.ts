'use client';

import { platformApi } from '@/services/api/platform-api';
import { buildRandomNotification } from '@/services/platform-data';
import type { NotificationItem, NotificationType } from '@/types/platform';

type MessageHandler = (notification: NotificationItem) => void;
type SnapshotHandler = (notifications: NotificationItem[]) => void;

type SocketPayload = {
 id?: string;
 title?: string;
 message?: string;
 type?: string;
 createdAt?: string;
 read?: boolean;
};

const toNotificationType = (value: string | undefined): NotificationType => {
 const normalized = (value ?? '').toLowerCase();

 if (normalized.includes('salary')) {
 return 'salary';
 }

 if (normalized.includes('target')) {
 return 'target';
 }

 if (normalized.includes('leave')) {
 return 'leave';
 }

 return 'system';
};

const toNotificationItem = (payload: SocketPayload): NotificationItem | null => {
 if (!payload.title || !payload.message) {
 return null;
 }

 return {
 id: payload.id ?? `NTF-${Date.now()}`,
 title: payload.title,
 message: payload.message,
 type: toNotificationType(payload.type),
 createdAt: payload.createdAt ?? new Date().toISOString(),
 read: payload.read ?? false,
 };
};

export class NotificationSocketClient {
 private socket: WebSocket | null = null;

 private mockTimer: ReturnType<typeof setInterval> | null = null;

 private pollTimer: ReturnType<typeof setInterval> | null = null;

 async connect(onMessage: MessageHandler, onSnapshot: SnapshotHandler) {
 await this.pullNotifications(onSnapshot);
 this.startPolling(onSnapshot);

 const socketUrl = process.env.NEXT_PUBLIC_NOTIFICATIONS_WS_URL;
 if (!socketUrl) {
 this.startMockFeed(onMessage);
 return;
 }

 this.socket = new WebSocket(socketUrl);
 this.socket.onmessage = (event) => {
 try {
 const payload = JSON.parse(event.data as string) as SocketPayload;
 const mapped = toNotificationItem(payload);
 if (mapped) {
 onMessage(mapped);
 }
 } catch {
 /* Keep stream alive on malformed data. */ }
 };

 this.socket.onerror = () => {
 this.startMockFeed(onMessage);
 };
 }

 disconnect() {
 if (this.socket) {
 this.socket.close();
 this.socket = null;
 }

 if (this.mockTimer) {
 clearInterval(this.mockTimer);
 this.mockTimer = null;
 }

 if (this.pollTimer) {
 clearInterval(this.pollTimer);
 this.pollTimer = null;
 }
 }

 private async pullNotifications(onSnapshot: SnapshotHandler) {
 try {
 const rows = await platformApi.getNotifications();
 const mapped = rows.map((item) => ({
 id: item.id,
 title: item.title,
 message: item.message,
 type: toNotificationType(item.type),
 createdAt: item.createdAt,
 read: item.status === 'sent',
 }));

 if (mapped.length > 0) {
 onSnapshot(mapped);
 }
 } catch {
 // Ignore API failures and continue with mocked feed if needed.
 }
 }

 private startPolling(onSnapshot: SnapshotHandler) {
 if (this.pollTimer) {
 return;
 }

 this.pollTimer = setInterval(() => {
 void this.pullNotifications(onSnapshot);
 }, 24000);
 }

 private startMockFeed(onMessage: MessageHandler) {
 if (this.mockTimer) {
 return;
 }

 this.mockTimer = setInterval(() => {
 onMessage(buildRandomNotification());
 }, 16000);
 }
}
