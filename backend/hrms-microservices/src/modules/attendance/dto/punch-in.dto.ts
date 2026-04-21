import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class PunchInDto {
  @IsOptional()
  @IsString()
  geoLocation?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  source?: string;
}
