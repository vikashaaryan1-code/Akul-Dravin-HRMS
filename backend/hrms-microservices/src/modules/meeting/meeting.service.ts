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
    const total = await this.meetingRepository.count();
    const scheduled = await this.meetingRepository.count({ where: { status: 'scheduled' } });
    const completed = await this.meetingRepository.count({ where: { status: 'completed' } });
    return { total, scheduled, completed };
  }
}
