import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentRecordEntity } from '../../database/entities/document-record.entity';
import { GenerateDocumentDto } from './dto/generate-document.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';

@Injectable()
export class DocumentCenterService {
  private readonly logger = new Logger(DocumentCenterService.name);

  constructor(
    @InjectRepository(DocumentRecordEntity)
    private readonly documentRepository: Repository<DocumentRecordEntity>,
  ) {}

  findAll(): Promise<DocumentRecordEntity[]> {
    return this.documentRepository.find({ order: { createdAt: 'DESC' } });
  }

  findOne(id: string): Promise<DocumentRecordEntity | null> {
    return this.documentRepository.findOne({ where: { id } });
  }

  async generateDocument(dto: GenerateDocumentDto): Promise<DocumentRecordEntity> {
    const entity = this.documentRepository.create({
      tenantId: dto.tenantId ?? null,
      companyId: dto.companyId ?? null,
      employeeId: dto.employeeId ?? null,
      documentType: dto.documentType,
      documentName: dto.documentName,
      templateVersion: dto.templateVersion ?? 'v1',
      status: 'generated',
      fileUrl: this.buildFileUrl(dto.documentType, dto.documentName),
      documentPayload: dto.payload ?? {},
      generatedAt: new Date(),
    });

    this.logger.log(`Generated document type=${dto.documentType} name=${dto.documentName}`);
    return this.documentRepository.save(entity);
  }

  async generateCertificate(dto: GenerateDocumentDto): Promise<DocumentRecordEntity> {
    const certificateDto: GenerateDocumentDto = {
      ...dto,
      documentType: 'certificate',
    };

    const result = await this.generateDocument(certificateDto);
    this.logger.log(`Certificate generated id=${result.id}`);
    return result;
  }

  async updateStatus(id: string, dto: UpdateDocumentStatusDto): Promise<DocumentRecordEntity> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException(`Document not found for id=${id}`);
    }

    const merged = this.documentRepository.merge(existing, {
      status: dto.status ?? existing.status,
      fileUrl: dto.fileUrl ?? existing.fileUrl,
      generatedAt: existing.generatedAt ?? new Date(),
    });

    const updated = await this.documentRepository.save(merged);
    this.logger.log(`Updated document status id=${id} status=${updated.status}`);
    return updated;
  }

  private buildFileUrl(type: string, name: string): string {
    const safeName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return `/generated-documents/${type}/${safeName}-${Date.now()}.pdf`;
  }
}
