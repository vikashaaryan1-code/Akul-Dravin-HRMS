import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ProjectEntity } from '../../database/entities/project.entity';
import { TimesheetEntryEntity } from '../../database/entities/timesheet-entry.entity';

@Injectable()
export class TimesheetsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(TimesheetEntryEntity)
    private readonly timesheetRepo: Repository<TimesheetEntryEntity>,
  ) {}

  async getProjects(tenantId: string) {
    return this.projectRepo.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async getMyTimesheets(userId: string, tenantId: string, startDate: string, endDate: string) {
    return this.timesheetRepo.find({
      where: {
        userId,
        tenantId,
        date: Between(startDate, endDate)
      },
      relations: ['project'],
      order: { date: 'ASC' }
    });
  }

  async saveMyTimesheets(userId: string, tenantId: string, entries: { projectId: string; date: string; hours: number; status?: string }[]) {
    // Process upserts in a loop (or transaction in real prod, loop is fine here)
    const savedEntries = [];
    for (const dto of entries) {
      if (dto.hours < 0) continue; // Skip invalid

      let entry = await this.timesheetRepo.findOne({
        where: { userId, tenantId, projectId: dto.projectId, date: dto.date }
      });

      if (!entry) {
        if (dto.hours === 0) continue; // Don't create zero hour entries unnecessarily
        entry = this.timesheetRepo.create({
          userId,
          tenantId,
          projectId: dto.projectId,
          date: dto.date,
        });
      }

      entry.hours = dto.hours;
      if (dto.status) entry.status = dto.status;

      await this.timesheetRepo.save(entry);
      savedEntries.push(entry);
    }
    
    return { success: true, count: savedEntries.length };
  }
}
