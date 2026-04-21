import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DocumentCenterModule } from '../document-center/document-center.module';
import { WorkflowAutomationController } from './workflow-automation.controller';
import { WorkflowAutomationService } from './workflow-automation.service';

@Module({
  imports: [DocumentCenterModule],
  controllers: [WorkflowAutomationController],
  providers: [WorkflowAutomationService, RolesGuard],
  exports: [WorkflowAutomationService],
})
export class WorkflowAutomationModule {}
