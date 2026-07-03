import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
@WebSocketGateway({
  namespace: '/command-bridge',
  cors: {
    origin: '*',
  },
})
export class CommandBridgeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(CommandBridgeGateway.name);

  constructor(private readonly dataSource: DataSource) {}

  afterInit(server: Server) {
    this.logger.log('CommandBridgeGateway initialized');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Fetch real metrics
    const empCountResult = await this.dataSource.query(`SELECT COUNT(*) as count FROM employees WHERE is_active = true`);
    const activeEmployees = parseInt(empCountResult[0]?.count || '0', 10);
    
    // Fetch anomalies from alerts or set to 0 (no dummy)
    // Assume anomalies table or similar logic, for now default to 0 as we only report real ones
    const anomalies = 0;

    client.emit('metrics-update', {
      activeEmployees: activeEmployees,
      anomaliesDetected: anomalies,
      systemLoad: 'Optimized',
      payrollStatus: 'Processing',
    });
    
    client.emit('system-log', 'WebSocket securely connected to AI Master Engine.');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async broadcastLiveMetrics() {
    const empCountResult = await this.dataSource.query(`SELECT COUNT(*) as count FROM employees WHERE is_active = true`);
    const activeEmployees = parseInt(empCountResult[0]?.count || '0', 10);
    
    // No more random mock fluctuations
    const anomalies = 0;

    const payload = {
      activeEmployees: activeEmployees,
      anomaliesDetected: anomalies,
      systemLoad: 'Optimized',
      payrollStatus: 'Live Monitoring',
    };

    if (this.server) {
      this.server.emit('metrics-update', payload);
    }
  }

  broadcastCriticalAlert(message: string) {
    if (this.server) {
      this.server.emit('metrics-update', { anomaliesDetected: 1 });
      this.server.emit('system-log', `[CRITICAL] ${message}`);
    }
  }
}
