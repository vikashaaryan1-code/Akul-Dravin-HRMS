import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimesheetsController } from './timesheets.controller';
import { TimesheetsService } from './timesheets.service';
import { ProjectEntity } from '../../database/entities/project.entity';
import { TimesheetEntryEntity } from '../../database/entities/timesheet-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectEntity, TimesheetEntryEntity])],
  controllers: [TimesheetsController],
  providers: [TimesheetsService],
  exports: [TimesheetsService],
})
export class TimesheetsModule {}
