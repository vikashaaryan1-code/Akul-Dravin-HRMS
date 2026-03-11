import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Post()
  create(@Body() data: any) {
    return this.auditLogService.create(data);
  }

  @Get()
  findAll(@Query() filters: any) {
    return this.auditLogService.findAll(filters);
  }
}
