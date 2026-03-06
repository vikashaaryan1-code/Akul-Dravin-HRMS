import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateWorkflowAutomationDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  workflowCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  module!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  triggerType!: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'paused', 'draft'])
  status?: string;

  @IsOptional()
  @Type(() => Object)
  @IsObject()
  workflowConfig?: Record<string, unknown>;
}
