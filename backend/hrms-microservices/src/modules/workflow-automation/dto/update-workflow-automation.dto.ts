import { Type } from 'class-transformer';
import { IsIn, IsObject, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateWorkflowAutomationDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'paused', 'draft'])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  successRate?: number;

  @IsOptional()
  @Type(() => Object)
  @IsObject()
  workflowConfig?: Record<string, unknown>;
}
