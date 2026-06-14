import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HelpdeskController } from './helpdesk.controller';
import { HelpdeskService } from './helpdesk.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { HelpdeskTicketEntity } from '../../database/entities/helpdesk-ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HelpdeskTicketEntity])],
  controllers: [HelpdeskController],
  providers: [HelpdeskService, RolesGuard],
  exports: [HelpdeskService],
})
export class HelpdeskModule {}
