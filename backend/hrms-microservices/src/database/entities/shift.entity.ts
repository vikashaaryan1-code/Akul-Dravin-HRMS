import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'shifts' })
export class ShiftEntity extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({ name: 'grace_period_minutes', type: 'integer', default: 15 })
  gracePeriodMinutes!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'allowed_ips', type: 'text', nullable: true })
  allowedIps?: string;

  @Column({ name: 'geo_fence_center_lat', type: 'double precision', nullable: true })
  geoFenceCenterLat?: number;

  @Column({ name: 'geo_fence_center_lng', type: 'double precision', nullable: true })
  geoFenceCenterLng?: number;

  @Column({ name: 'geo_fence_radius_meters', type: 'integer', nullable: true })
  geoFenceRadiusMeters?: number;
}
