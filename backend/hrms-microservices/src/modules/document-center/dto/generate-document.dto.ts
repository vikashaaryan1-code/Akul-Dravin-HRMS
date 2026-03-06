import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class GenerateDocumentDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  documentType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  documentName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  templateVersion?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @Type(() => Object)
  @IsObject()
  payload?: Record<string, unknown>;
}
