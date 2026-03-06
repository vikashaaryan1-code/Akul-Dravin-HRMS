import { Column, Entity } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'ai_insights' })
export class AiInsightEntity extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 80 })
  module!: string;

  @Column({ name: 'insight_type', type: 'varchar', length: 80 })
  insightType!: string;

  @Column({ name: 'input_ref_id', type: 'uuid', nullable: true })
  inputRefId!: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  score!: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
  confidence!: string | null;

  @Column({ type: 'text' })
  recommendation!: string;

  @Column({ type: 'varchar', length: 40, default: 'generated' })
  status!: string;
}
