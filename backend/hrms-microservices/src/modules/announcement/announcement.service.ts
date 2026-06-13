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
    // Optimized: Use conditional aggregation to get all stats in a single database query
    const stats = await this.announcementRepository
      .createQueryBuilder('announcement')
      .select('COUNT(*)', 'total')
      .addSelect("SUM(CASE WHEN announcement.status = 'published' THEN 1 ELSE 0 END)", 'published')
      .addSelect("SUM(CASE WHEN announcement.status = 'draft' THEN 1 ELSE 0 END)", 'draft')
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      published: parseInt(stats.published, 10) || 0,
      draft: parseInt(stats.draft, 10) || 0,
    };
  }
}
