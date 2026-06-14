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
  ipAddress?: string;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  source?: string;
}
