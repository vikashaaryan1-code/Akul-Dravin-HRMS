import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateCustomerAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  accountName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  address?: string;

  @IsOptional()
  @IsUUID()
  ownerEmployeeId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive', 'prospect', 'churn-risk'])
  accountStatus?: string;
}
