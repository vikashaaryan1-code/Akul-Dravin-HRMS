import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateEmployeeServiceTicketDto {
  @IsOptional()
  @IsString()
  @IsIn(['open', 'in-progress', 'awaiting-employee', 'resolved', 'closed'])
  status?: string;

  @IsOptional()
  @IsString()
  @IsIn(['low', 'normal', 'high', 'critical'])
  priority?: string;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionNotes?: string;
}
