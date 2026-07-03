import { Column, Entity } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';

@Entity({ name: 'benefit_plans' })
export class BenefitPlanEntity extends TenantScopedEntity {
  @Column({ type: 'varchar', length: 120 })
  title!: string;

  @Column({ type: 'varchar', length: 120 })
  provider!: string;

  @Column({ type: 'varchar', length: 40, default: 'Active' })
  status!: string;

  @Column({ type: 'varchar', name: 'coverage_type', length: 80 })
  coverageType!: string;

  @Column({ type: 'varchar', name: 'monthly_premium', length: 60, nullable: true })
  monthlyPremium!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;
}
