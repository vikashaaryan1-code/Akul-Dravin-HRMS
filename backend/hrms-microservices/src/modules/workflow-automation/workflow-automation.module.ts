import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AutomationWorkflowEntity } from '../../database/entities/automation-workflow.entity';
import { WorkflowAutomationController } from './workflow-automation.controller';
import { WorkflowAutomationService } from './workflow-automation.service';

@Module({
  imports: [TypeOrmModule.forFeature([AutomationWorkflowEntity])],
  controllers: [WorkflowAutomationController],
  providers: [WorkflowAutomationService, RolesGuard],
  exports: [WorkflowAutomationService],
})
export class WorkflowAutomationModule {}
