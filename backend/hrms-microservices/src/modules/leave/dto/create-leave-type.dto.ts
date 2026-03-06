import { IsBoolean, IsNumberString, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateLeaveTypeDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsUUID()
  companyId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  leaveCode!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(140)
  leaveName!: string;

  @IsNumberString()
  daysPerYear!: string;

  @IsOptional()
  @IsNumberString()
  carryForwardLimit?: string;

  @IsOptional()
  @IsBoolean()
  encashable?: boolean;
}
