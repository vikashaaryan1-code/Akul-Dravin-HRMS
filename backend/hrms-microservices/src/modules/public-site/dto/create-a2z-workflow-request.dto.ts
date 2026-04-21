import { Transform } from 'class-transformer';
import { IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

const toTrimmedString = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

export class CreateA2zWorkflowRequestDto {
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
  @IsString()
  @MaxLength(80)
  serviceBundle!: string;

  @Transform(toTrimmedString)
  @IsString()
  @MaxLength(80)
  deploymentModel!: string;

  @Transform(toTrimmedString)
  @IsString()
  @MaxLength(80)
  priority!: string;

  @Transform(toTrimmedString)
  @IsString()
  @MaxLength(80)
  timeline!: string;

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
  @MaxLength(120)
  regions?: string;

  @Transform(toTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(240)
  workflowGoal?: string;

  @Transform(toTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(1200)
  notes?: string;
}
