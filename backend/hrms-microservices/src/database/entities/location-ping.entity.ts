import { Column, Entity, Index } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

export type LocationZoneType = 'office' | 'field' | 'wfh' | 'remote' | 'transit';
export type LocationPingStatus = 'inside-geofence' | 'outside-geofence' | 'field-visit' | 'wfh-active' | 'transit';

@Entity({ name: 'location_pings' })
export class LocationPingEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId!: string;

  @Column({ name: 'employee_name', type: 'varchar', length: 150 })
  employeeName!: string;

  @Column({ name: 'location_label', type: 'varchar', length: 255 })
  locationLabel!: string;

  @Column({
    name: 'zone_type',
    type: 'varchar',
    length: 30,
    default: 'office',
  })
  zoneType!: LocationZoneType;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 50,
    default: 'inside-geofence',
  })
  status!: LocationPingStatus;

  /** Latitude — optional (may not be available for all location modes) */
  @Column({ name: 'latitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude!: number | null;

  /** Longitude */
  @Column({ name: 'longitude', type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude!: number | null;

  /** Device accuracy in metres */
  @Column({ name: 'accuracy_metres', type: 'int', nullable: true })
  accuracyMetres!: number | null;

  @Column({ name: 'pinged_at', type: 'timestamp with time zone', default: () => 'NOW()' })
  pingedAt!: Date;

  /** Date partition key — makes daily/weekly range queries fast */
  @Index()
  @Column({ name: 'ping_date', type: 'date' })
  pingDate!: string;
}
