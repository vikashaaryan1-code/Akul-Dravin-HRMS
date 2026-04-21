import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

const toTrimmedString = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') {
    return value;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

export class SubscribeNewsletterDto {
  @Transform(toTrimmedString)
  @IsEmail()
  @MaxLength(120)
  email!: string;

  @Transform(toTrimmedString)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  source?: string;
}
