import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(@InjectRepository(Notification) private notificationRepository: Repository<Notification>) {}

  async create(data: any) {
    const notification = this.notificationRepository.create(data);
    return this.notificationRepository.save(notification);
  }

  async findAll(userId: string) {
    return this.notificationRepository.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async markAsRead(id: string) {
    await this.notificationRepository.update(id, { read: true });
    return this.notificationRepository.findOne({ where: { id } });
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update({ userId, read: false }, { read: true });
    return { success: true };
  }
}
