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

  // Maintain simulated or real metric state
  private activeEmployees = 12450;
  private anomalies = 0;

  afterInit(server: Server) {
    this.logger.log('CommandBridgeGateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    
    // Emit initial metrics
    client.emit('metrics-update', {
      activeEmployees: this.activeEmployees,
      anomaliesDetected: this.anomalies,
      systemLoad: 'Optimized',
      payrollStatus: 'Processing',
    });
    
    client.emit('system-log', 'WebSocket securely connected to AI Master Engine.');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Simulate live workforce intelligence updates every 5 seconds.
   * In a real implementation, this would subscribe to domain events (e.g. employee.hired, payroll.anomaly).
   */
  @Cron(CronExpression.EVERY_5_SECONDS)
  broadcastLiveMetrics() {
    // Simulate slight fluctuations in data
    this.activeEmployees += Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    
    // Randomly spawn or resolve an anomaly
    if (Math.random() > 0.8) {
      this.anomalies += Math.floor(Math.random() * 2);
    } else if (this.anomalies > 0 && Math.random() > 0.5) {
      this.anomalies -= 1;
    }

    const payload = {
      activeEmployees: this.activeEmployees,
      anomaliesDetected: this.anomalies,
      systemLoad: this.anomalies > 5 ? 'Warning: High Load' : 'Optimized',
      payrollStatus: 'Live Monitoring',
    };

    if (this.server) {
      this.server.emit('metrics-update', payload);
      
      // Random log generation
      if (Math.random() > 0.7) {
         const logs = [
           'AI Engine recalculating predictive attrition.',
           'Marketplace agents successfully matched 12 roles.',
           'Payroll anomaly scan completed automatically.',
           'System adjusting load balancer dynamically.'
         ];
         const randomLog = logs[Math.floor(Math.random() * logs.length)];
         this.server.emit('system-log', randomLog);
      }
    }
  }

  /**
   * API to be called by other internal services to push critical alerts
   */
  broadcastCriticalAlert(message: string) {
    this.anomalies += 1;
    if (this.server) {
      this.server.emit('system-log', `[CRITICAL] ${message}`);
    }
  }
}
