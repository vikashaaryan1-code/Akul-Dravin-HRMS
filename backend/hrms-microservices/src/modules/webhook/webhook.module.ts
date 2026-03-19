import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { JobModule } from '../job/job.module';

@Module({
  imports: [JobModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
