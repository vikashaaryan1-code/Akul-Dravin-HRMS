import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { TenantContext } from '../../common/context/tenant-context';
import { DocumentCenterService } from './document-center.service';
import { GenerateDocumentDto } from './dto/generate-document.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';
import { DocumentEngineService } from './document-engine.service';
import {
  DocumentGenerationService,
  DocumentType as AiDocumentType,
  TemplateStyle,
} from './document-generation.service';
import { RenderDocumentDto } from './dto/render-document.dto';

// ── AI Document Generation DTO ────────────────────────────────────────────────
class AiGenerateDocumentDto {
  @ApiProperty({ enum: ['offer_letter', 'appointment_letter', 'promotion_letter', 'transfer_letter', 'experience_letter', 'internship_certificate', 'warning_letter', 'termination_letter'], description: 'Document type to generate' })
  @IsString()
  type: AiDocumentType;

  @ApiProperty({ description: 'Contextual data for the document (employee name, joining date, designation, etc.)' })
  @IsObject()
  data: Record<string, unknown>;

  @ApiPropertyOptional({ enum: ['corporate', 'modern', 'classic'], description: 'Visual style/template for the document' })
  @IsOptional()
  @IsString()
  style?: TemplateStyle;

  @ApiPropertyOptional({ enum: ['formal', 'friendly', 'institutional'], default: 'formal' })
  @IsOptional()
  @IsString()
  tone?: 'formal' | 'friendly' | 'institutional';
}

// ── Controller ────────────────────────────────────────────────────────────────
@ApiTags('Document Center')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentCenterController {
  constructor(
    private readonly documentCenterService:   DocumentCenterService,
    private readonly documentEngineService:   DocumentEngineService,
    private readonly documentGenerationService: DocumentGenerationService,
  ) {}

  @Get()
  @Roles(
    Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER, Role.EMPLOYEE,
  )
  @ApiOperation({ summary: 'List all documents for the tenant' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Documents listed successfully' })
  findAll() {
    return this.documentCenterService.findAll();
  }

  @Get(':id')
  @Roles(
    Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER, Role.EMPLOYEE,
  )
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document returned successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Document not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.documentCenterService.findOne(id);
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  @ApiOperation({ summary: 'Generate a new HR document (offer letter, appointment letter, etc.)' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Document generated successfully' })
  generate(@Body() dto: GenerateDocumentDto) {
    return this.documentCenterService.generateDocument(dto);
  }

  @Post('certificates/generate')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Generate an experience/internship/bonafide certificate' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Certificate generated successfully' })
  generateCertificate(@Body() dto: GenerateDocumentDto) {
    return this.documentCenterService.generateCertificate(dto);
  }

  @Patch(':id/status')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Update document status (draft, sent, signed, revoked)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document status updated' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDocumentStatusDto) {
    return this.documentCenterService.updateStatus(id, dto);
  }

  @Post('render')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Render a document to PDF/HTML from template data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document rendered successfully. Returns base64 PDF or HTML.' })
  async renderDocument(@Body() dto: RenderDocumentDto) {
    return this.documentEngineService.render(dto);
  }

  @Post('ai-generate')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  @ApiOperation({ summary: 'Generate an AI-powered HR document using natural language data' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'AI-generated document returned successfully' })
  async aiGenerate(@Body() dto: AiGenerateDocumentDto) {
    // tenantId is resolved from the request context — NOT passed from the client
    const tenantId = TenantContext.getRequiredTenantId();
    return this.documentGenerationService.generateHRDocument(
      tenantId,
      dto.type,
      dto.data,
      dto.style,
      dto.tone,
    );
  }
}
