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
    return this.jobRepo.find({ order: { createdAt: 'DESC' } });
  }

  createJob(payload: Partial<RecruitmentJobEntity>): Promise<RecruitmentJobEntity> {
    const tenantId = payload.tenantId || TenantContext.getRequiredTenantId();
    const entity = this.jobRepo.create({ ...payload, tenantId });
    return this.jobRepo.save(entity);
  }

  async updateJob(id: string, payload: Partial<RecruitmentJobEntity>): Promise<RecruitmentJobEntity | null> {
    await this.jobRepo.update(id, payload);
    return this.jobRepo.findOne({ where: { id } });
  }

  findAllApplications(): Promise<RecruitmentApplicationEntity[]> {
    return this.applicationRepo.find({ order: { createdAt: 'DESC' } });
  }

  createApplication(payload: Partial<RecruitmentApplicationEntity>): Promise<RecruitmentApplicationEntity> {
    const tenantId = payload.tenantId || TenantContext.getRequiredTenantId();
    const entity = this.applicationRepo.create({ ...payload, tenantId });
    return this.applicationRepo.save(entity);
  }

  async updateApplication(
    id: string,
    payload: Partial<RecruitmentApplicationEntity>,
  ): Promise<RecruitmentApplicationEntity | null> {
    await this.applicationRepo.update(id, payload);
    return this.applicationRepo.findOne({ where: { id } });
  }
}

