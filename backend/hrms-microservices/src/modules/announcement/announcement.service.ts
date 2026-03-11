import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Announcement } from './announcement.entity';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
  ) {}

  async findAll(): Promise<Announcement[]> {
    return this.announcementRepository.find({ order: { publishDate: 'DESC' } });
  }

  async findOne(id: string): Promise<Announcement> {
    return this.announcementRepository.findOne({ where: { id } });
  }

  async create(data: Partial<Announcement>): Promise<Announcement> {
    const announcement = this.announcementRepository.create(data);
    return this.announcementRepository.save(announcement);
  }

  async update(id: string, data: Partial<Announcement>): Promise<Announcement> {
    await this.announcementRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.announcementRepository.delete(id);
  }

  async getStats(): Promise<any> {
    const total = await this.announcementRepository.count();
    const published = await this.announcementRepository.count({ where: { status: 'published' } });
    const draft = await this.announcementRepository.count({ where: { status: 'draft' } });
    return { total, published, draft };
  }
}
