import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { DocumentCenterController } from './document-center.controller';
import { DocumentCenterService } from './document-center.service';
import { DocumentEngineService } from './document-engine.service';
import { TemplateEngineService } from './template-engine.service';

/**
 * DocumentCenterModule
 *
 * Provides:
 *  - DocumentCenterService   (record management + audit log)
 *  - TemplateEngineService   (HTML template rendering for 18 document types)
 *  - DocumentEngineService   (PDF pipeline + QR + hash orchestration)
 */
@Module({
  controllers: [DocumentCenterController],
  providers: [
    RolesGuard,
    DocumentCenterService,
    TemplateEngineService,
    DocumentEngineService,
  ],
  exports: [DocumentCenterService, DocumentEngineService],
})
export class DocumentCenterModule {}
