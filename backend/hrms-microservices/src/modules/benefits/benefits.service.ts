import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BenefitPlanEntity } from '../../database/entities/benefit-plan.entity';
import { BenefitEnrollmentEntity } from '../../database/entities/benefit-enrollment.entity';

@Injectable()
export class BenefitsService {
  constructor(
    @InjectRepository(BenefitPlanEntity)
    private readonly planRepo: Repository<BenefitPlanEntity>,
    @InjectRepository(BenefitEnrollmentEntity)
    private readonly enrollmentRepo: Repository<BenefitEnrollmentEntity>,
  ) {}

  async getActiveBenefits(tenantId: string) {
    return this.planRepo.find({
      where: { tenantId, status: 'Active' },
      order: { createdAt: 'DESC' },
    });
  }

  async getMyEnrollments(userId: string, tenantId: string) {
    return this.enrollmentRepo.find({
      where: { userId, tenantId },
      relations: ['benefitPlan'],
      order: { enrolledAt: 'DESC' },
    });
  }

  async enrollInBenefit(userId: string, tenantId: string, benefitId: string, coverageLevel: string) {
    const plan = await this.planRepo.findOne({
      where: { id: benefitId, tenantId, status: 'Active' },
    });

    if (!plan) {
      throw new NotFoundException('Benefit plan not found or inactive');
    }

    // Upsert logic for enrollment: user can only have one active enrollment per plan
    let enrollment = await this.enrollmentRepo.findOne({
      where: { userId, tenantId, benefitPlanId: plan.id },
    });

    if (!enrollment) {
      enrollment = this.enrollmentRepo.create({
        userId,
        tenantId,
        benefitPlanId: plan.id,
      });
    }

    enrollment.coverageLevel = coverageLevel;
    enrollment.status = 'Active';
    enrollment.enrolledAt = new Date();

    await this.enrollmentRepo.save(enrollment);

    return {
      success: true,
      message: `Successfully enrolled in ${plan.title} with ${coverageLevel} coverage`,
    };
  }
}
