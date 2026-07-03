import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  tenantId?: string;
}

/**
 * NotificationGateway — real-time in-app notification push via Socket.IO
 *
 * Client connects with: socket.io({ auth: { token: '<jwt>' } })
 * Joins room: `tenant:{tenantId}` and `user:{userId}`
 * Events emitted to client: 'notification' | 'notification:badge'
 */
@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL ?? ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private readonly connectedUsers = new Map<string, Set<string>>(); // userId → socketIds

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(socket: AuthenticatedSocket) {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        socket.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<{ sub: string; tenantId: string }>(
        token,
        { secret: process.env.JWT_SECRET ?? 'change_this_for_production' },
      );

      socket.userId = payload.sub;
      socket.tenantId = payload.tenantId;

      // Join tenant + user rooms
      await socket.join(`tenant:${payload.tenantId}`);
      await socket.join(`user:${payload.sub}`);

      // Track connections
      if (!this.connectedUsers.has(payload.sub)) {
        this.connectedUsers.set(payload.sub, new Set());
      }
      this.connectedUsers.get(payload.sub)!.add(socket.id);

      this.logger.log(`WS_CONNECT user=${payload.sub} tenant=${payload.tenantId} socket=${socket.id}`);
    } catch {
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    if (socket.userId) {
      this.connectedUsers.get(socket.userId)?.delete(socket.id);
      this.logger.debug(`WS_DISCONNECT user=${socket.userId} socket=${socket.id}`);
    }
  }

  // ── Emit helpers (called from NotificationService) ─────────────────────────

  /** Push a notification to a specific user */
  pushToUser(userId: string, payload: Record<string, unknown>) {
    this.server.to(`user:${userId}`).emit('notification', payload);
  }

  /** Push a notification to all users in a tenant */
  pushToTenant(tenantId: string, payload: Record<string, unknown>) {
    this.server.to(`tenant:${tenantId}`).emit('notification', payload);
  }

  /** Update badge count for a user */
  updateBadge(userId: string, unreadCount: number) {
    this.server.to(`user:${userId}`).emit('notification:badge', { unreadCount });
  }

  /** Broadcast to all connected users (platform-wide) */
  broadcastAll(payload: Record<string, unknown>) {
    this.server.emit('notification', payload);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() socket: AuthenticatedSocket) {
    socket.emit('pong', { userId: socket.userId });
  }
}
