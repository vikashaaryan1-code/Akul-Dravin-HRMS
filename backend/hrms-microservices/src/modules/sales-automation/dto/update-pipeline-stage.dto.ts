import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdatePipelineStageDto {
  @IsUUID()
  leadId!: string;

  @IsString()
  @IsIn(['new-lead', 'contacted', 'qualified', 'proposal-sent', 'negotiation', 'closed-won', 'closed-lost'])
  stage!: string;

  @IsOptional()
  @IsUUID()
  dealId?: string;
}
