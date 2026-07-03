import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantScopedEntity } from './tenant-scoped.entity';
import { BenefitPlanEntity } from './benefit-plan.entity';

@Entity({ name: 'benefit_enrollments' })
export class BenefitEnrollmentEntity extends TenantScopedEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'benefit_plan_id', type: 'uuid' })
  benefitPlanId!: string;

  @ManyToOne(() => BenefitPlanEntity)
  @JoinColumn({ name: 'benefit_plan_id' })
  benefitPlan!: BenefitPlanEntity;

  @Column({ name: 'coverage_level', type: 'varchar', length: 80 })
  coverageLevel!: string;

  @Column({ name: 'enrolled_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  enrolledAt!: Date;

  @Column({ type: 'varchar', length: 40, default: 'Active' })
  status!: string;
}
