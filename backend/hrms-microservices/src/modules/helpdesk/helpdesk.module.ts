import { Module } from '@nestjs/common';
import { HelpdeskController } from './helpdesk.controller';
import { HelpdeskService } from './helpdesk.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [HelpdeskController],
  providers: [HelpdeskService, RolesGuard],
  exports: [HelpdeskService],
})
export class HelpdeskModule {}
