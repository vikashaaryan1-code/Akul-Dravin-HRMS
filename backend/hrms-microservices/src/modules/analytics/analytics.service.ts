import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEventEntity } from '../../database/entities/analytics-event.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEventEntity)
    private readonly analyticsRepository: Repository<AnalyticsEventEntity>,
  ) {}

  findAllEvents(): Promise<AnalyticsEventEntity[]> {
    return this.analyticsRepository.find({ order: { createdAt: 'DESC' } });
  }

  createEvent(payload: Partial<AnalyticsEventEntity>): Promise<AnalyticsEventEntity> {
    const entity = this.analyticsRepository.create(payload);
    return this.analyticsRepository.save(entity);
  }

  async getDashboardSummary(): Promise<{ totalEvents: number; recentModules: string[] }> {
    const [events, totalEvents] = await this.analyticsRepository.findAndCount({
      take: 10,
      order: { createdAt: 'DESC' },
    });

    return {
      totalEvents,
      recentModules: events.map((event) => event.module),
    };
  }
}
