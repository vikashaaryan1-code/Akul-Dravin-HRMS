import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class UpdateLeadDto {
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  score?: number;

  @IsOptional()
  @IsString()
  @IsIn(['new-lead', 'contacted', 'qualified', 'proposal-sent', 'negotiation', 'closed-won', 'closed-lost'])
  pipelineStage?: string;

  @IsOptional()
  @IsString()
  @IsIn(['open', 'nurturing', 'converted', 'lost'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'paused', 'completed'])
  nurturingStatus?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
