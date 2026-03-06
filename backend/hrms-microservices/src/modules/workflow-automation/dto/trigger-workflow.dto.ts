import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class TriggerWorkflowDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  triggerReason?: string;

  @IsOptional()
  @Type(() => Object)
  @IsObject()
  payload?: Record<string, unknown>;
}
