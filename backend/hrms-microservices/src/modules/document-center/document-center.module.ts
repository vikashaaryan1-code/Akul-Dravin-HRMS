import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DocumentCenterController } from './document-center.controller';
import { DocumentCenterService } from './document-center.service';
import { DocumentEngineService } from './document-engine.service';
import { TemplateEngineService } from './template-engine.service';
import { DocumentGenerationService } from './document-generation.service';
import { AiEngineModule } from '../ai-engine/ai-engine.module';

/**
 * DocumentCenterModule
 *
 * Provides:
 *  - DocumentCenterService   (record management + audit log)
 *  - TemplateEngineService   (HTML template rendering for 18 document types)
 *  - DocumentEngineService   (PDF pipeline + QR + hash orchestration)
 *  - DocumentGenerationService (AI-driven document content generation)
 */
@Module({
  imports: [AiEngineModule],
  controllers: [DocumentCenterController],
  providers: [
    RolesGuard,
    DocumentCenterService,
    TemplateEngineService,
    DocumentEngineService,
    DocumentGenerationService,
  ],
  exports: [DocumentCenterService, DocumentEngineService, DocumentGenerationService],
})
export class DocumentCenterModule {}
