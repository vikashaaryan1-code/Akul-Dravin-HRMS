import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardEmployeeDto {
  @ApiProperty({ description: 'Expected join date (ISO format)', example: '2026-08-01' })
  @IsNotEmpty()
  @IsDateString()
  expectedJoinDate!: string;

  @ApiPropertyOptional({ description: 'Duration of probation in days', example: 90 })
  @IsOptional()
  @IsNumber()
  probationDays?: number;

  @ApiPropertyOptional({ description: 'ID of the HR actor performing the action' })
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class StartProbationDto {
  @ApiProperty({ description: 'Actual join date (ISO format)', example: '2026-08-01' })
  @IsNotEmpty()
  @IsDateString()
  actualJoinDate!: string;

  @ApiPropertyOptional({ description: 'End date of the probation (ISO format)' })
  @IsOptional()
  @IsDateString()
  probationEndDate?: string;

  @ApiPropertyOptional({ description: 'Duration of probation in days', example: 90 })
  @IsOptional()
  @IsNumber()
  probationDays?: number;

  @ApiPropertyOptional({ description: 'ID of the HR actor performing the action' })
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class ConfirmEmployeeDto {
  @ApiProperty({ description: 'Confirmation effective date (ISO format)', example: '2026-11-01' })
  @IsNotEmpty()
  @IsDateString()
  confirmationDate!: string;

  @ApiPropertyOptional({ description: 'Revised monthly CTC upon confirmation', example: 6000 })
  @IsOptional()
  @IsNumber()
  revisedMonthlyCtc?: number;

  @ApiPropertyOptional({ description: 'Performance rating score', example: 'Outstanding' })
  @IsOptional()
  @IsString()
  performanceRating?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'ID of the HR actor performing the action' })
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class PromoteEmployeeDto {
  @ApiProperty({ description: 'New job designation', example: 'Senior Software Engineer' })
  @IsNotEmpty()
  @IsString()
  newDesignation!: string;

  @ApiProperty({ description: 'Promotion effective date (ISO format)', example: '2027-01-01' })
  @IsNotEmpty()
  @IsDateString()
  effectiveDate!: string;

  @ApiPropertyOptional({ description: 'Revised monthly CTC upon promotion', example: 7500 })
  @IsOptional()
  @IsNumber()
  revisedMonthlyCtc?: number;

  @ApiPropertyOptional({ description: 'New department ID if changed' })
  @IsOptional()
  @IsString()
  newDepartmentId?: string;

  @ApiPropertyOptional({ description: 'New manager ID if changed' })
  @IsOptional()
  @IsString()
  newManagerId?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'ID of the HR actor performing the action' })
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class TransferEmployeeDto {
  @ApiPropertyOptional({ description: 'New branch ID' })
  @IsOptional()
  @IsString()
  newBranchId?: string;

  @ApiPropertyOptional({ description: 'New department ID' })
  @IsOptional()
  @IsString()
  newDepartmentId?: string;

  @ApiPropertyOptional({ description: 'New manager ID' })
  @IsOptional()
  @IsString()
  newManagerId?: string;

  @ApiProperty({ description: 'Transfer effective date (ISO format)', example: '2027-02-01' })
  @IsNotEmpty()
  @IsDateString()
  effectiveDate!: string;

  @ApiPropertyOptional({ description: 'Reason for the transfer' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'ID of the HR actor performing the action' })
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class InitiateResignationDto {
  @ApiProperty({ description: 'Date the resignation was submitted (ISO format)', example: '2027-05-01' })
  @IsNotEmpty()
  @IsDateString()
  resignationDate!: string;

  @ApiProperty({ description: 'Expected last working day (ISO format)', example: '2027-06-30' })
  @IsNotEmpty()
  @IsDateString()
  lastWorkingDay!: string;

  @ApiPropertyOptional({ description: 'Notice period duration in days', example: 60 })
  @IsOptional()
  @IsNumber()
  noticePeriodDays?: number;

  @ApiPropertyOptional({ description: 'Reason for resignation' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'ID of the HR actor performing the action' })
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class ProcessExitDto {
  @ApiProperty({ description: 'Actual last working day (ISO format)', example: '2027-06-30' })
  @IsNotEmpty()
  @IsDateString()
  actualLastDay!: string;

  @ApiPropertyOptional({ description: 'Full and final settlement amount', example: 12000 })
  @IsOptional()
  @IsNumber()
  fullFinalAmount?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'ID of the HR actor performing the action' })
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class TerminateEmployeeDto {
  @ApiProperty({ description: 'Effective date of termination (ISO format)', example: '2026-10-15' })
  @IsNotEmpty()
  @IsDateString()
  effectiveDate!: string;

  @ApiProperty({ description: 'Reason for termination' })
  @IsNotEmpty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'Type of termination (e.g., Performance, Disciplinary)' })
  @IsOptional()
  @IsString()
  terminationType?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'ID of the HR actor performing the action' })
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class SuspendEmployeeDto {
  @ApiProperty({ description: 'Effective date of suspension (ISO format)' })
  @IsNotEmpty()
  @IsDateString()
  suspensionDate!: string;

  @ApiProperty({ description: 'Reason for suspension' })
  @IsNotEmpty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'Expected return date (ISO format)' })
  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string;

  @ApiPropertyOptional({ description: 'ID of the HR actor performing the action' })
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class ReinstateEmployeeDto {
  @ApiProperty({ description: 'Effective date of reinstatement (ISO format)' })
  @IsNotEmpty()
  @IsDateString()
  reinstateDate!: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'ID of the HR actor performing the action' })
  @IsOptional()
  @IsString()
  actorId?: string;
}

export class MarkAbscondedDto {
  @ApiProperty({ description: 'Date the absconding was reported (ISO format)' })
  @IsNotEmpty()
  @IsDateString()
  reportedDate!: string;

  @ApiPropertyOptional({ description: 'ID of the HR actor performing the action' })
  @IsOptional()
  @IsString()
  actorId?: string;
}
