import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LocationPingEntity,
  LocationZoneType,
  LocationPingStatus,
} from '../../database/entities/location-ping.entity';

interface RecordPingDto {
  employeeId: string;
  employeeName: string;
  locationLabel: string;
  zoneType?: LocationZoneType;
  status?: LocationPingStatus;
  latitude?: number;
  longitude?: number;
  accuracyMetres?: number;
  tenantId?: string;
}

@Injectable()
export class LocationTrackingService {
  private readonly logger = new Logger(LocationTrackingService.name);

  constructor(
    @InjectRepository(LocationPingEntity)
    private readonly pingRepo: Repository<LocationPingEntity>,
  ) {}

  // ── Latest ping per employee (current snapshot) ─────────────────────────────
  async current(tenantId?: string): Promise<LocationPingEntity[]> {
    /**
     * Returns the most recent ping for each employee.
     * Uses a subquery to select max(pinged_at) per employee_id.
     */
    const qb = this.pingRepo
      .createQueryBuilder('lp')
      .where((qb2) => {
        const sub = qb2
          .subQuery()
          .select('MAX(lp2.pinged_at)')
          .from(LocationPingEntity, 'lp2')
          .where('lp2.employee_id = lp.employee_id');

        if (tenantId) {
          sub.andWhere('lp2.tenant_id = :tenantId', { tenantId });
        }
        return `lp.pinged_at = ${sub.getQuery()}`;
      })
      .orderBy('lp.pingedAt', 'DESC');

    if (tenantId) {
      qb.andWhere('lp.tenantId = :tenantId', { tenantId });
    }

    return qb.getMany();
  }

  // ── History distribution (zone type breakdown) ──────────────────────────────
  async historyDistribution(
    tenantId?: string,
    days = 7,
  ): Promise<{ name: string; value: number }[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const qb = this.pingRepo
      .createQueryBuilder('lp')
      .select('lp.zone_type', 'name')
      .addSelect('COUNT(*)', 'count')
      .where('lp.pingedAt >= :since', { since });

    if (tenantId) {
      qb.andWhere('lp.tenantId = :tenantId', { tenantId });
    }

    const rows = await qb.groupBy('lp.zone_type').getRawMany<{ name: string; count: string }>();

    const total = rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0) || 1;
    return rows.map((r) => ({
      name:  r.name.charAt(0).toUpperCase() + r.name.slice(1).replace('-', ' '),
      value: Math.round((parseInt(r.count, 10) / total) * 100),
    }));
  }

  // ── Ping history for a single employee ──────────────────────────────────────
  findByEmployee(employeeId: string, limit = 50): Promise<LocationPingEntity[]> {
    return this.pingRepo.find({
      where: { employeeId },
      order: { pingedAt: 'DESC' },
      take: limit,
    });
  }

  // ── Record a new location ping ───────────────────────────────────────────────
  async record(dto: RecordPingDto): Promise<LocationPingEntity> {
    const today = new Date().toISOString().slice(0, 10);
    const entity = this.pingRepo.create({
      employeeId:    dto.employeeId,
      employeeName:  dto.employeeName,
      locationLabel: dto.locationLabel,
      zoneType:      dto.zoneType ?? 'office',
      status:        dto.status ?? 'inside-geofence',
      latitude:      dto.latitude ?? null,
      longitude:     dto.longitude ?? null,
      accuracyMetres: dto.accuracyMetres ?? null,
      pingedAt:      new Date(),
      pingDate:      today,
      tenantId:      dto.tenantId!,
    });

    const saved = await this.pingRepo.save(entity);
    this.logger.debug(
      `LOCATION_PING employee=${dto.employeeId} zone=${dto.zoneType} status=${dto.status}`,
    );
    return saved;
  }
}
