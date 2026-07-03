import { Injectable } from '@nestjs/common';
import { RecruitmentJobEntity } from '../../database/entities/recruitment-job.entity';
import { RecruitmentApplicationEntity } from '../../database/entities/recruitment-application.entity';
import { TenantContext } from '../../common/context/tenant-context';

@Injectable()
export class RecruitmentAtsService {
  private get jobRepo() {
    return TenantContext.getRepository(RecruitmentJobEntity);
  }

  private get applicationRepo() {
    return TenantContext.getRepository(RecruitmentApplicationEntity);
  }

  findAllJobs(): Promise<RecruitmentJobEntity[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    return this.jobRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  createJob(payload: Partial<RecruitmentJobEntity>): Promise<RecruitmentJobEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const entity = this.jobRepo.create({ ...payload, tenantId });
    return this.jobRepo.save(entity);
  }

  async updateJob(id: string, payload: Partial<RecruitmentJobEntity>): Promise<RecruitmentJobEntity | null> {
    const tenantId = TenantContext.getRequiredTenantId();
    await this.jobRepo.update({ id, tenantId }, payload);
    return this.jobRepo.findOne({ where: { id, tenantId } });
  }

  findAllApplications(): Promise<RecruitmentApplicationEntity[]> {
    const tenantId = TenantContext.getRequiredTenantId();
    return this.applicationRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' } });
  }

  createApplication(payload: Partial<RecruitmentApplicationEntity>): Promise<RecruitmentApplicationEntity> {
    const tenantId = TenantContext.getRequiredTenantId();
    const entity = this.applicationRepo.create({ ...payload, tenantId });
    return this.applicationRepo.save(entity);
  }

  async updateApplication(
    id: string,
    payload: Partial<RecruitmentApplicationEntity>,
  ): Promise<RecruitmentApplicationEntity | null> {
    const tenantId = TenantContext.getRequiredTenantId();
    await this.applicationRepo.update({ id, tenantId }, payload);
    return this.applicationRepo.findOne({ where: { id, tenantId } });
  }
}

