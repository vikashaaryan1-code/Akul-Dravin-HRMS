import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { WorkflowAutomationService } from './workflow-automation.service';
import { CreateWorkflowAutomationDto } from './dto/create-workflow-automation.dto';
import { UpdateWorkflowAutomationDto } from './dto/update-workflow-automation.dto';
import { TriggerWorkflowDto } from './dto/trigger-workflow.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('automation')
export class WorkflowAutomationController {
  constructor(private readonly workflowAutomationService: WorkflowAutomationService) {}

  @Get('workflows')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  findAll() {
    return this.workflowAutomationService.findAll();
  }

  @Get('workflows/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  findOne(@Param('id') id: string) {
    return this.workflowAutomationService.findOne(id);
  }

  @Post('workflows')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  create(@Body() dto: CreateWorkflowAutomationDto) {
    return this.workflowAutomationService.create(dto);
  }

  @Patch('workflows/:id')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateWorkflowAutomationDto) {
    return this.workflowAutomationService.update(id, dto);
  }

  @Post('workflows/:id/trigger')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  trigger(@Param('id') id: string, @Body() dto: TriggerWorkflowDto) {
    return this.workflowAutomationService.triggerWorkflow(id, dto);
  }

  @Get('alerts')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  listAlerts() {
    return this.workflowAutomationService.listSystemAlerts();
  }
}
