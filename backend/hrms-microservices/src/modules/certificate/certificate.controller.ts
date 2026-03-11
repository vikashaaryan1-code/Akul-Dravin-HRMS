import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CertificateService } from './certificate.service';
import { Certificate } from './certificate.entity';

@Controller('certificates')
export class CertificateController {
  constructor(private readonly service: CertificateService) {}
  @Get() findAll(): Promise<Certificate[]> { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string): Promise<Certificate> { return this.service.findOne(id); }
  @Post() create(@Body() data: Partial<Certificate>): Promise<Certificate> { return this.service.create(data); }
  @Patch(':id') update(@Param('id') id: string, @Body() data: Partial<Certificate>): Promise<Certificate> { return this.service.update(id, data); }
  @Delete(':id') remove(@Param('id') id: string): Promise<void> { return this.service.remove(id); }
}
