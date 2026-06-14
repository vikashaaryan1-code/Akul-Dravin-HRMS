import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DocumentCenterModule } from '../document-center/document-center.module';
import { WorkflowAutomationController } from './workflow-automation.controller';
import { WorkflowAutomationService } from './workflow-automation.service';
import { WorkflowExecutorService } from '../automation/workflow-executor.service';
import { BullModule } from '@nestjs/bullmq';
import { QUEUE_AUTOMATION } from '../../common/queues/queue-names';
import { AiEngineModule } from '../ai-engine/ai-engine.module';

@Module({
  imports: [
    DocumentCenterModule,
    AiEngineModule,
    BullModule.registerQueue({ name: QUEUE_AUTOMATION }),
  ],
  controllers: [WorkflowAutomationController],
  providers: [WorkflowAutomationService, WorkflowExecutorService, RolesGuard],
  exports: [WorkflowAutomationService, WorkflowExecutorService],
})
export class WorkflowAutomationModule {}
