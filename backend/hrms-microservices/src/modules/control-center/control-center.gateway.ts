import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { OnEvent } from '@nestjs/event-emitter';
import { WORKFORCE_EVENTS, PolicyDecisionEvent, PromotionEvent, TelephonyEvent } from '../../common/events/events.registry';

@WebSocketGateway({
  namespace: 'control-center',
  cors: {
    origin: '*',
  },
})
export class ControlCenterGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ControlCenterGateway.name);

  @WebSocketServer() server: Server;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Real-time Control Mesh: INITIALIZED');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client Connected to Control Plane: ${client.id}`);
    
    // Send immediate system status
    client.emit('system.status', {
      mesh: 'OPERATIONAL',
      gateway: 'HEALTHY',
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client Disconnected from Control Plane: ${client.id}`);
  }

  /**
   * 🧬 LIGTHNING-BRIDGE: Internal Event -> WebSocket Broadcast
   * This bridges the high-stakes backend events to the Control Center UI instantly.
   */
  @OnEvent(WORKFORCE_EVENTS.POLICY_DECISION)
  handlePolicyDecision(event: PolicyDecisionEvent) {
    this.logger.debug(`[WS BROADCAST] Policy Decision: ${event.traceId}`);
    this.server.emit('workforce.policy.decision', event);
  }

  @OnEvent(WORKFORCE_EVENTS.PROMOTION)
  handlePromotion(event: PromotionEvent) {
    this.logger.debug(`[WS BROADCAST] Promotion Event: ${event.traceId}`);
    this.server.emit('workforce.promotion.evolution', event);
  }

  @OnEvent(WORKFORCE_EVENTS.TELEPHONY)
  handleTelephony(event: TelephonyEvent) {
    this.logger.debug(`[WS BROADCAST] Telephony Interaction: ${event.callId}`);
    this.server.emit('workforce.comm.interaction', event);
  }
}
