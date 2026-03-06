import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class UpdateSalesDealDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  dealName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  dealValue?: number;

  @IsOptional()
  @IsString()
  @IsIn(['new-lead', 'contacted', 'qualified', 'proposal-sent', 'negotiation', 'closed-won', 'closed-lost'])
  stage?: string;

  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @IsOptional()
  @IsUUID()
  salesRepresentativeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  probability?: number;

  @IsOptional()
  @IsString()
  @IsIn(['open', 'closed-won', 'closed-lost'])
  status?: string;
}
