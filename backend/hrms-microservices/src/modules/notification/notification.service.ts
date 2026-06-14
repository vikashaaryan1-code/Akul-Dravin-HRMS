import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Repository } from 'typeorm';
import { Queue } from 'bullmq';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { QUEUE_NOTIFICATIONS } from '../../common/queues/queue-names';
import { NotificationJobData } from './notification.processor';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    @InjectQueue(QUEUE_NOTIFICATIONS)
    private readonly notifQueue: Queue,
    @Optional()
    private readonly gateway?: NotificationGateway,
  ) {}

  findAll(tenantId?: string): Promise<NotificationEntity[]> {
    const where = tenantId ? { tenantId } : {};
    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  findByUser(userId: string, tenantId?: string): Promise<NotificationEntity[]> {
    return this.notificationRepository.find({
      where: tenantId ? { userId, tenantId } : { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
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

  async markRead(id: string, userId: string): Promise<{ success: boolean }> {
    await this.notificationRepository.update(id, { status: 'Read' });
    const unread = await this.getUnreadCount(userId);
    this.gateway?.updateBadge(userId, unread);
    return { success: true };
  }

  async markAllRead(userId: string, tenantId?: string): Promise<{ success: boolean; count: number }> {
    const where: any = { userId, status: 'Unread' };
    if (tenantId) where.tenantId = tenantId;
    const result = await this.notificationRepository.update(where, { status: 'Read' });
    this.gateway?.updateBadge(userId, 0);
    return { success: true, count: result.affected ?? 0 };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({ where: { userId, status: 'Unread' } });
  }

  async createAndPush(payload: Partial<NotificationEntity>): Promise<NotificationEntity> {
    const entity = await this.create(payload);
    if (entity.userId) {
      this.gateway?.pushToUser(entity.userId, {
        id: entity.id, type: entity.type, title: entity.title, message: entity.message, createdAt: entity.createdAt,
      });
    } else if (entity.tenantId) {
      this.gateway?.pushToTenant(entity.tenantId, {
        id: entity.id, type: entity.type, title: entity.title, message: entity.message, createdAt: entity.createdAt,
      });
    }
    return entity;
  }

  async enqueue(
    notificationId: string,
    channel: NotificationJobData['channel'],
    payload: NotificationJobData['payload'],
    tenantId: string,
  ): Promise<{ jobId: string }> {
    const job = await this.notifQueue.add(
      'dispatch',
      { notificationId, channel, payload, tenantId },
      {
        attempts: 3,
        backoff:  { type: 'exponential', delay: 2_000 },
        removeOnComplete: { count: 200 },
        removeOnFail:     { count: 100 },
      },
    );
    return { jobId: job.id as string };
  }
}

