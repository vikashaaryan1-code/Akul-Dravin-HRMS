import { Transform } from 'class-transformer';
import { IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const toTrimmedString = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

export class CreatePublicInquiryDto {
  @Transform(toTrimmedString)
  @IsString()
  @MaxLength(80)
  fullName!: string;

  @Transform(toTrimmedString)
  @IsEmail()
  @MaxLength(120)
  workEmail!: string;

  @Transform(toTrimmedString)
  @IsString()
  @MaxLength(120)
  companyName!: string;

  @Transform(toTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    return Number(value);
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  teamSize?: number;

  @Transform(toTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  interestArea?: string;

  @Transform(toTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  message?: string;
}
