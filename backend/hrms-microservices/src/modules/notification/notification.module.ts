import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationProcessor } from './notification.processor';
import { NotificationGateway } from './notification.gateway';
import { EmailSenderService } from '../../common/email/email-sender.service';
import { NotificationEntity } from '../../database/entities/notification.entity';
import { QUEUE_NOTIFICATIONS } from '../../common/queues/queue-names';
import { AuthModule } from '../../auth/auth.module';

/**
 * NotificationModule — registers BullMQ queue, WebSocket gateway, email/SMS dispatch.
 * @Global allows injection of NotificationService across the platform without re-importing.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity]),
    BullModule.registerQueue({ name: QUEUE_NOTIFICATIONS }),
    AuthModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationProcessor,
    NotificationGateway,
    EmailSenderService,
  ],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
