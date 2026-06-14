import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationPingEntity } from '../../database/entities/location-ping.entity';

@Injectable()
export class FieldTrackingService {
  private readonly logger = new Logger(FieldTrackingService.name);

  constructor(
    @InjectRepository(LocationPingEntity)
    private readonly pingRepo: Repository<LocationPingEntity>,
  ) {}

  /**
   * Records a live location ping from a field worker.
   * "Workday/Blue-Collar field tracking" feature.
   */
  async recordPing(employeeId: string, tenantId: string, lat: number, lng: number, deviceId: string) {
    const ping = this.pingRepo.create({
      employeeId,
      tenantId,
      employeeName: 'Field Employee',
      locationLabel: 'Field Location Ping',
      latitude: lat,
      longitude: lng,
      pingedAt: new Date(),
      pingDate: new Date().toISOString().split('T')[0],
      zoneType: 'field',
      status: 'field-visit',
    });

    await this.pingRepo.save(ping);
    
    // In a production system, this would also push to a Redis/Realtime map
    this.logger.debug(`Location ping recorded for employee=${employeeId} at [${lat}, ${lng}]`);

    return { success: true, pingId: ping.id };
  }

  /**
   * Retrieves the route history for a specific worker.
   */
  async getRouteHistory(employeeId: string, from: Date, to: Date) {
    return this.pingRepo.find({
      where: { employeeId, pingedAt: (from && to) ? (undefined as any) : undefined }, // Simplified for stub
      order: { pingedAt: 'ASC' },
    });
  }

  /**
   * Detects idle time or route deviations (AI Anomaly stub).
   */
  async detectDeviations(employeeId: string, date: string) {
    // Logic to compare actual pings vs assigned routes/tasks
    return {
      employeeId,
      date,
      deviations: [],
      status: 'ON_TRACK',
    };
  }
}
