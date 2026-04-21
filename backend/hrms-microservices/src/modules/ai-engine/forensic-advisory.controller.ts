import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ForensicAdvisoryService } from './forensic-advisory.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-engine/forensic')
export class ForensicAdvisoryController {
  constructor(private readonly forensicService: ForensicAdvisoryService) {}

  @Get('summary')
  @Roles(Role.ROOT_OWNER, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  async getForensicSummary(@Query('asOfDate') asOfDate?: string) {
    const snapshotAt = asOfDate ? new Date(asOfDate) : new Date();
    
    const [hardAnomalies, warnings] = await Promise.all([
        this.forensicService.detectHardAnomalies(snapshotAt),
        this.forensicService.detectWarnings(snapshotAt)
    ]);

    return {
        snapshotAt,
        insights: [...hardAnomalies, ...warnings],
        totalAnomalyCount: hardAnomalies.length,
        totalWarningCount: warnings.length
    };
  }

  @Get('payroll-variance/:batchId')
  @Roles(Role.ROOT_OWNER, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  async getPayrollVariance(
    @Param('batchId') batchId: string, 
    @Query('asOfDate') asOfDate?: string
  ) {
    const snapshotAt = asOfDate ? new Date(asOfDate) : new Date();
    return this.forensicService.detectPayrollVariance(batchId, snapshotAt);
  }
}
