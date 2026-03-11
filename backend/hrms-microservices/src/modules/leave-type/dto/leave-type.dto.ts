import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID, MaxLength } from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @MaxLength(50)
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  companyId!: string;

  @IsNumber()
  daysPerYear!: number;

  @IsBoolean()
  carryForward!: boolean;

  @IsOptional()
  @IsNumber()
  maxCarryForward?: number;

  @IsBoolean()
  encashmentAllowed!: boolean;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateLeaveTypeDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  daysPerYear?: number;

  @IsOptional()
  @IsBoolean()
  carryForward?: boolean;

  @IsOptional()
  @IsNumber()
  maxCarryForward?: number;

  @IsOptional()
  @IsBoolean()
  encashmentAllowed?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @IsOptional()
  @IsString()
  status?: string;
}
