import { Injectable, Logger } from '@nestjs/common';
import { CareerGrowthEntity, CareerEventStatus } from '../../database/entities/career-growth.entity';
import { TenantContext } from '../../common/context/tenant-context';

@Injectable()
export class CareerGrowthService {
  private readonly logger = new Logger(CareerGrowthService.name);

  private get careerRepo() {
    return TenantContext.getRepository(CareerGrowthEntity);
  }

  async createEvent(payload: Partial<CareerGrowthEntity>): Promise<CareerGrowthEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const event = this.careerRepo.create({ ...payload, tenantId });
    return this.careerRepo.save(event);
  }

  async updateStatus(id: string, status: CareerEventStatus): Promise<void> {
    await this.careerRepo.update(id, { status });
  }

  async getEventsByEmployee(employeeId: string): Promise<CareerGrowthEntity[]> {
    return this.careerRepo.find({ where: { employeeId }, order: { createdAt: 'DESC' } });
  }

  /**
   * Counts the total number of in-flight promotion and lateral-move career events
   * in the current tenant scope. Used by the Control Center snapshot.
   */
  async aggregateActivePipelineCount(): Promise<number> {
    try {
      return await this.careerRepo.count({
        where: { status: CareerEventStatus.GATED },
      });
    } catch {
      this.logger.warn('aggregateActivePipelineCount: could not query career events');
      return 0;
    }
  }
}
