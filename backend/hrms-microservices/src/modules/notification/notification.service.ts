import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../../database/entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
  ) {}

  findAll(): Promise<NotificationEntity[]> {
    return this.notificationRepository.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string): Promise<NotificationEntity | null> {
    return this.notificationRepository.findOne({ where: { id } });
  }

  create(payload: Partial<NotificationEntity>): Promise<NotificationEntity> {
    const entity = this.notificationRepository.create(payload);
    return this.notificationRepository.save(entity);
  }

  async update(id: string, payload: Partial<NotificationEntity>): Promise<NotificationEntity | null> {
    await this.notificationRepository.update(id, payload);
    return this.findOne(id);
  }
}
