import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateSalesTargetDto {
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
  @IsIn(['monthly', 'quarterly', 'annual'])
  targetPeriod!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  periodKey!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  targetValue!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  achievedValue?: number;

  @IsOptional()
  @IsBoolean()
  isTeamTarget?: boolean;
}
