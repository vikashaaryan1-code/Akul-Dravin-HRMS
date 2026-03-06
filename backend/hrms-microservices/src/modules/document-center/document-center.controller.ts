import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { DocumentCenterService } from './document-center.service';
import { GenerateDocumentDto } from './dto/generate-document.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentCenterController {
  constructor(private readonly documentCenterService: DocumentCenterService) {}

  @Get()
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.RECRUITER,
    Role.EMPLOYEE,
  )
  findAll() {
    return this.documentCenterService.findAll();
  }

  @Get(':id')
  @Roles(
    Role.ROOT_OWNER,
    Role.PLATFORM_ADMIN,
    Role.SUPER_ADMIN,
    Role.COMPANY_ADMIN,
    Role.HR_MANAGER,
    Role.RECRUITER,
    Role.EMPLOYEE,
  )
  findOne(@Param('id') id: string) {
    return this.documentCenterService.findOne(id);
  }

  @Post('generate')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER, Role.RECRUITER)
  generate(@Body() dto: GenerateDocumentDto) {
    return this.documentCenterService.generateDocument(dto);
  }

  @Post('certificates/generate')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  generateCertificate(@Body() dto: GenerateDocumentDto) {
    return this.documentCenterService.generateCertificate(dto);
  }

  @Patch(':id/status')
  @Roles(Role.ROOT_OWNER, Role.PLATFORM_ADMIN, Role.SUPER_ADMIN, Role.COMPANY_ADMIN, Role.HR_MANAGER)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDocumentStatusDto) {
    return this.documentCenterService.updateStatus(id, dto);
  }
}
