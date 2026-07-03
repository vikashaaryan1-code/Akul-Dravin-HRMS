import { Column, Entity, OneToMany } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'surveys' })
export class SurveyEntity extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 50, default: 'Draft' })
  status!: string;

  @Column({ type: 'int', default: 0 })
  totalExpected!: number;

  @Column({ type: 'timestamp', nullable: true })
  closesAt!: Date | null;
}
