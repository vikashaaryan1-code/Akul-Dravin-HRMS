import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Meeting } from './meeting.entity';

@Injectable()
export class MeetingService {
  constructor(@InjectRepository(Meeting) private meetingRepository: Repository<Meeting>) {}

  async findAll(): Promise<Meeting[]> {
    return this.meetingRepository.find({ order: { startTime: 'DESC' } });
  }

  async findOne(id: string): Promise<Meeting | null> {
    return this.meetingRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Meeting>): Promise<Meeting> {
    return this.meetingRepository.save(this.meetingRepository.create(data));
  }

  async update(id: string, data: Partial<Meeting>): Promise<Meeting | null> {
    await this.meetingRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.meetingRepository.delete(id);
  }

  async getStats(): Promise<any> {
    // Optimized: Use conditional aggregation to get all stats in a single database query
    const stats = await this.meetingRepository
      .createQueryBuilder('meeting')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN meeting.status = 'scheduled' THEN 1 ELSE 0 END)", 'scheduled')
      .addSelect("SUM(CASE WHEN meeting.status = 'completed' THEN 1 ELSE 0 END)", 'completed')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      scheduled: parseInt(stats.scheduled, 10) || 0,
      completed: parseInt(stats.completed, 10) || 0,
    };
  }
}
