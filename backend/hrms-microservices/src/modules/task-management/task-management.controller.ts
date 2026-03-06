import { Controller, Get, UseGuards } from '@nestjs/common';
import { TaskManagementService } from './task-management.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TaskManagementController {
  constructor(private readonly taskManagementService: TaskManagementService) {}

  @Get()
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.TEAM_MANAGER,
    Role.TEAM_LEADER,
    Role.SALES_MANAGER,
    Role.EMPLOYEE,
  )
  tasks() {
    return this.taskManagementService.getTasks();
  }

  @Get('projects')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.TEAM_MANAGER,
    Role.TEAM_LEADER,
    Role.SALES_MANAGER,
    Role.EMPLOYEE,
    Role.GUEST,
  )
  projects() {
    return this.taskManagementService.getProjects();
  }
}
